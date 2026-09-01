from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Count
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import ActivityLog
from apps.core.permissions import AdminOnly, BACKOFFICE_ROLES, can_access_backoffice
from apps.core.throttling import AuthRateThrottle, LoginRateThrottle, RegisterRateThrottle

from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    PRIVILEGED_ROLES,
    role_to_internal,
    ROLE_TO_API,
)

User = get_user_model()


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


def _set_refresh_cookie(response, refresh_token: str):
    """Pose le refresh token en cookie HttpOnly (jamais dans le corps JSON,
    jamais en localStorage cote SPA — voir settings.REFRESH_COOKIE_*)."""
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=settings.REFRESH_COOKIE_MAX_AGE,
        path=settings.REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
    )
    return response


def _clear_refresh_cookie(response):
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
    )
    return response


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        ActivityLog.objects.create(user=user, action='create', target_model='User', target_id=user.pk, details='Public registration')
        tokens = _tokens_for_user(user)
        response = Response(
            {'access': tokens['access'], 'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        return _set_refresh_cookie(response, tokens['refresh'])


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle, AuthRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if not user:
            return Response({'detail': 'Identifiants invalides.'}, status=status.HTTP_401_UNAUTHORIZED)
        ActivityLog.objects.create(user=user, action='login', target_model='User', target_id=user.pk)
        tokens = _tokens_for_user(user)
        response = Response({'access': tokens['access'], 'user': UserSerializer(user).data})
        return _set_refresh_cookie(response, tokens['refresh'])


class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not refresh_token:
            return Response({'detail': 'Token refresh requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Avec ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION, SimpleJWT
            # emet un nouveau refresh et blackliste l'ancien a chaque appel.
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)
            response = Response({'access': new_access})
            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False):
                new_refresh = str(refresh)
                _set_refresh_cookie(response, new_refresh)
            return response
        except TokenError:
            response = Response({'detail': 'Token invalide ou révoqué.'}, status=status.HTTP_401_UNAUTHORIZED)
            return _clear_refresh_cookie(response)


class LogoutView(APIView):
    """Logout : revoque le refresh token (blacklist) et efface le cookie.
    L'access token, de courte duree (JWT_ACCESS_LIFETIME_MINUTES), expire
    naturellement — SimpleJWT ne blackliste que le refresh. Journalise
    l'action."""

    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                # Un token deja blackliste / invalide : on considere le logout OK.
                pass
        if request.user.is_authenticated:
            ActivityLog.objects.create(user=request.user, action='logout', target_model='User', target_id=request.user.pk)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        return _clear_refresh_cookie(response)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class RoleMetadataView(APIView):
    """Liste read-only des roles avec comptage reel (gestion des roles #34).

    La modification des permissions d'un role n'est PAS structurellement
    prevue (la matrice vive dans le code, partagee par le backend ET le
    frontend) : cette vue expose donc uniquement des donnees reelles
    (roles, labels, comptes, acces back-office) sans aucun bouton fantome.
    """

    permission_classes = [AdminOnly]

    def get(self, request):
        from django.contrib.auth import get_user_model

        UserModel = get_user_model()
        counts = dict(
            UserModel.objects.all()
            .values_list('role')
            .annotate(c=Count('id'))
            .values_list('role', 'c')
        )
        roles = []
        for code, label in UserModel.Role.choices:
            roles.append({
                'code': ROLE_TO_API.get(code, code.lower()),
                'internal': code,
                'label': label,
                'count': counts.get(code, 0),
                'can_access_backoffice': code in BACKOFFICE_ROLES,
                'is_privileged': code in PRIVILEGED_ROLES,
            })
        return Response({'roles': roles})


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [AdminOnly]

    # --- Regles RBAC serveur (gestion des comptes, section 33/34) ---
    # Un CUSTOMER n'accede jamais a /users/ (AdminOnly). Un ADMIN peut gerer
    # les comptes non-privilegies ; la gestion des comptes ADMIN/SUPER_ADMIN,
    # la creation de comptes privilegies et toutes les actions sur son propre
    # compte sont reservees au Super Admin / interdites.

    def _is_super_admin(self, user) -> bool:
        return bool(
            getattr(user, 'role', None) == 'SUPER_ADMIN'
            or getattr(user, 'is_superuser', False)
        )

    def _target_blocked(self, target) -> tuple:
        """Retourne (bloque: bool, detail: str) pour la modification/suppression."""
        acting = self.request.user
        if not acting or not acting.is_authenticated:
            return True, 'Authentification requise.'
        if target.pk == acting.pk:
            return True, 'Vous ne pouvez pas modifier votre propre compte via cette interface.'
        if getattr(target, 'role', None) in PRIVILEGED_ROLES and not self._is_super_admin(acting):
            return True, 'Seul un Super Admin peut gérer un compte Admin/Super Admin.'
        return False, ''

    def _another_active_super_admin(self, target) -> bool:
        return User.objects.filter(
            role=User.Role.SUPER_ADMIN, is_active=True,
        ).exclude(pk=target.pk).exists()

    def create(self, request, *args, **kwargs):
        role_internal = role_to_internal(request.data.get('role'))
        if role_internal in PRIVILEGED_ROLES and not self._is_super_admin(request.user):
            raise PermissionDenied('Seul un Super Admin peut créer un compte Admin/Super Admin.')
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        target = self.get_object()
        blocked, detail = self._target_blocked(target)
        if blocked:
            raise PermissionDenied(detail)

        # Un Admin (non Super) ne peut pas attribuer un role privilegie.
        if not self._is_super_admin(request.user):
            role_raw = request.data.get('role')
            if role_raw:
                role_internal = role_to_internal(role_raw)
                if role_internal in PRIVILEGED_ROLES:
                    raise PermissionDenied('Un Admin ne peut pas attribuer un rôle Admin/Super Admin.')

        # Protection du dernier Super Admin actif (self-demotion / lockout).
        if getattr(target, 'role', None) == User.Role.SUPER_ADMIN:
            role_raw = request.data.get('role')
            active_raw = request.data.get('is_active')
            removing_role = role_raw is not None and role_to_internal(role_raw) != 'SUPER_ADMIN'
            deactivating = active_raw is not None and str(active_raw).strip().lower() in {'false', '0', 'no'}
            if (removing_role or deactivating) and not self._another_active_super_admin(target):
                raise PermissionDenied('Impossible de rétrograder ou désactiver le dernier Super Admin actif.')

        old_role = target.role
        old_is_active = target.is_active
        response = super().update(request, *args, **kwargs)
        # Rafraichit target depuis DB pour audit/notif
        target.refresh_from_db()
        if old_role != target.role:
            ActivityLog.objects.create(
                user=request.user,
                action='update',
                target_model='User',
                target_id=target.pk,
                details=f'Role modifie: {old_role} -> {target.role}',
            )
            # Notifications (FULL-STACK critique)
            try:
                from apps.core.models import Notification
                Notification.objects.create(
                    user=target,
                    channel=Notification.Channel.SYSTEM,
                    message=f'Votre rôle Back Office a été modifié: {old_role} → {target.role}',
                    type='info',
                    link='/admin',
                )
                # Notif SuperAdmin acteur aussi (confirmation)
                Notification.objects.create(
                    user=request.user,
                    channel=Notification.Channel.SYSTEM,
                    message=f'Rôle modifié: {target.username} {old_role} → {target.role}',
                    type='success',
                    link=f'/admin/utilisateurs',
                )
            except Exception:
                pass
        if old_is_active != target.is_active:
            ActivityLog.objects.create(
                user=request.user,
                action='update',
                target_model='User',
                target_id=target.pk,
                details=f'Statut modifie: is_active {old_is_active} -> {target.is_active}',
            )
        return response

    @staticmethod
    def _notify_role_change(actor, target, old_role: str, new_role: str):
        try:
            from apps.core.models import Notification
            Notification.objects.create(
                user=target,
                channel=Notification.Channel.SYSTEM,
                message=f'Votre rôle Back Office a été modifié: {old_role} → {new_role}',
                type='info',
                link='/admin',
            )
            Notification.objects.create(
                user=actor,
                channel=Notification.Channel.SYSTEM,
                message=f'Rôle modifié: {target.username} {old_role} → {new_role}',
                type='success',
                link='/admin/utilisateurs',
            )
        except Exception:
            pass

    # Endpoint dédié FULL-STACK : PATCH /api/v1/users/{id}/role/  {role: "admin"}
    # Spec : payload {role: "COMMERCIAL"} — backend vérifie SEUL SUPER_ADMIN (403 sinon)
    # Utilise le système existant (pas de doublon). Persistance DB réelle + audit + notifs.
    @action(detail=True, methods=['patch', 'put'], url_path='role', permission_classes=[AdminOnly])
    def role(self, request, pk=None):
        # SEUL SUPER_ADMIN
        if not self._is_super_admin(request.user):
            raise PermissionDenied('Seul un Super Admin peut modifier les rôles.')
        target = self.get_object()
        # Protections SuperAdmin
        if target.pk == request.user.pk:
            raise PermissionDenied('Vous ne pouvez pas modifier votre propre rôle.')
        new_role_raw = request.data.get('role')
        if not new_role_raw:
            return Response({'detail': 'Champ role requis.'}, status=status.HTTP_400_BAD_REQUEST)
        new_role = role_to_internal(new_role_raw)
        if new_role is None:
            return Response({'detail': f'Role invalide: {new_role_raw}'}, status=status.HTTP_400_BAD_REQUEST)
        # Dernier SuperAdmin
        if getattr(target, 'role', None) == User.Role.SUPER_ADMIN and new_role != User.Role.SUPER_ADMIN:
            if not self._another_active_super_admin(target):
                raise PermissionDenied('Impossible de rétrograder le dernier Super Admin actif.')
        old_role = target.role
        if old_role == new_role:
            return Response(UserSerializer(target, context={'request': request}).data)
        target.role = new_role
        target.save(update_fields=['role'])
        ActivityLog.objects.create(
            user=request.user,
            action='update',
            target_model='User',
            target_id=target.pk,
            details=f'Role modifie via /role: {old_role} -> {new_role}',
        )
        self._notify_role_change(request.user, target, old_role, new_role)
        return Response(UserSerializer(target, context={'request': request}).data)

    def destroy(self, request, *args, **kwargs):
        target = self.get_object()
        blocked, detail = self._target_blocked(target)
        if blocked:
            raise PermissionDenied(detail)
        if getattr(target, 'role', None) == User.Role.SUPER_ADMIN and not self._another_active_super_admin(target):
            raise PermissionDenied('Impossible de supprimer le dernier Super Admin actif.')
        return super().destroy(request, *args, **kwargs)
