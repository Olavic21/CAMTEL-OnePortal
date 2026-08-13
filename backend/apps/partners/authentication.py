from rest_framework import authentication, exceptions

from .models import PartnerAPIKey


class PartnerAPIKeyAuthentication(authentication.BaseAuthentication):
    """Authentification par clé API partenaire (en-tête X-API-Key)."""

    class PartnerUser:
        is_authenticated = True
        is_anonymous = False

    def authenticate(self, request):
        raw_key = request.META.get('HTTP_X_API_KEY')
        if not raw_key:
            return None
        key_hash = PartnerAPIKey.hash_key(raw_key)
        try:
            partner_key = PartnerAPIKey.objects.get(key_hash=key_hash)
        except PartnerAPIKey.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed('Clé API invalide.') from exc
        if not partner_key.is_valid():
            raise exceptions.AuthenticationFailed('Clé API expirée ou désactivée.')
        partner_key.touch()
        return (self.PartnerUser(), partner_key)
