from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'ADMIN')


class IsEditorUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'EDITOR')


class IsViewerUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'VIEWER')


class IsAdminOrEditor(BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, 'role', None)
        return bool(request.user and request.user.is_authenticated and role in {'ADMIN', 'EDITOR'})
