from rest_framework.permissions import SAFE_METHODS, BasePermission

STAFF_ROLES = {'SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'EDITOR'}
ADMIN_ROLES = {'SUPER_ADMIN', 'ADMIN'}


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, 'role', None)
        return bool(request.user and request.user.is_authenticated and role in ADMIN_ROLES)


class IsEditorUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'EDITOR')


class IsViewerUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'VIEWER')


class IsAdminOrEditor(BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, 'role', None)
        return bool(request.user and request.user.is_authenticated and role in STAFF_ROLES)


class ReadPublicWriteAdminOrEditor(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        role = getattr(request.user, 'role', None)
        return bool(request.user and request.user.is_authenticated and role in STAFF_ROLES)


class AdminOnly(BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, 'role', None)
        return bool(request.user and request.user.is_authenticated and role in ADMIN_ROLES)
