from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle


class ContactRateThrottle(AnonRateThrottle):
    scope = 'contact'


class LoginRateThrottle(ScopedRateThrottle):
    scope = 'login'


class RegisterRateThrottle(ScopedRateThrottle):
    scope = 'register'


class AuthRateThrottle(ScopedRateThrottle):
    scope = 'auth'


class ChatbotRateThrottle(ScopedRateThrottle):
    scope = 'chatbot'


class SearchRateThrottle(ScopedRateThrottle):
    scope = 'search'


class PartnerRateThrottle(ScopedRateThrottle):
    """Limite l'API partenaire par cle API (plutot que par utilisateur Django)."""

    scope = 'partner'

    def get_cache_key(self, request, view):
        partner_key = getattr(request, 'auth', None)
        ident = getattr(partner_key, 'pk', None) or getattr(partner_key, 'key_prefix', 'partner')
        return self.cache_format % {'scope': self.scope, 'ident': ident}
