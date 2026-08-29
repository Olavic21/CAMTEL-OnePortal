from rest_framework.permissions import SAFE_METHODS, BasePermission

# Roles back-office : acces complet a l'interface d'administration.
STAFF_ROLES = {'SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'EDITOR'}
ADMIN_ROLES = {'SUPER_ADMIN', 'ADMIN'}
# ACCESS_BACKOFFICE (#20) : roles autorises a entrer dans le back-office.
# Inclut VIEWER (lecture seule legacy) mais JAMAIS CUSTOMER : un client
# ne doit jamais acceder au back-office, meme en manipulant l'URL.
BACKOFFICE_ROLES = STAFF_ROLES | {'VIEWER'}


def can_access_backoffice(user) -> bool:
    """Predicat partage par la permission DRF et le serializer `me` (#21).

    Le frontend peut masquer le bouton back-office, mais c'est le backend
    qui fait autorite sur chaque endpoint sensible.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    return bool(
        getattr(user, 'is_staff', False)
        or getattr(user, 'role', None) in BACKOFFICE_ROLES
    )


class AccessBackoffice(BasePermission):
    """Permission explicite ACCESS_BACKOFFICE (#20/#21).

    Un CUSTOMER authentifie est refuse (403) meme s'il connait l'URL du
    back-office ; un anonyme est refuse (401/403 selon l'authentification).
    """

    def has_permission(self, request, view):
        return can_access_backoffice(request.user)


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or getattr(request.user, 'role', None) in ADMIN_ROLES)
        )


class IsEditorUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'EDITOR')


class IsViewerUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'VIEWER')


class IsAdminOrEditor(BasePermission):
    def has_permission(self, request, view):
        # Convention projet : un membre du backoffice est soit is_staff,
        # soit porteur d'un role STAFF_ROLES explicite.
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or getattr(request.user, 'role', None) in STAFF_ROLES
            )
        )


class ReadPublicWriteAdminOrEditor(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        role = getattr(request.user, 'role', None)
        return bool(request.user and request.user.is_authenticated and role in STAFF_ROLES)


class AdminOnly(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or getattr(request.user, 'role', None) in ADMIN_ROLES)
        )
