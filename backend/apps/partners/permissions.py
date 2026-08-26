from rest_framework import permissions

from .models import PartnerAPIKey


class IsPartnerAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        return isinstance(getattr(request, 'auth', None), PartnerAPIKey)


class PartnerScopePermission(permissions.BasePermission):
    required_scope = PartnerAPIKey.SCOPE_PRODUCTS_READ

    def has_permission(self, request, view):
        partner_key = request.auth
        if not isinstance(partner_key, PartnerAPIKey):
            return False
        scope = getattr(view, 'required_scope', self.required_scope)
        return partner_key.has_scope(scope)
