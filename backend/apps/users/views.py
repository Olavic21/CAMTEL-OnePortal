from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import ActivityLog
from apps.core.permissions import AdminOnly
from apps.core.throttling import AuthRateThrottle, LoginRateThrottle, RegisterRateThrottle

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer

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


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [AdminOnly]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_role = instance.role
        response = super().update(request, *args, **kwargs)
        if old_role != instance.role:
            ActivityLog.objects.create(
                user=request.user,
                action='update',
                target_model='User',
                target_id=instance.pk,
                details=f'Role modifie: {old_role} -> {instance.role}',
            )
        return response
