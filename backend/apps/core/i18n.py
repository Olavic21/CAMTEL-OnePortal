"""Utilitaires d'internationalisation API (Accept-Language)."""

SUPPORTED_LANGUAGES = ('fr', 'en')
DEFAULT_LANGUAGE = 'fr'


def parse_accept_language(header: str | None) -> str:
    """Extrait la langue préférée depuis l'en-tête Accept-Language."""
    if not header:
        return DEFAULT_LANGUAGE
    for part in header.split(','):
        token = part.strip().split(';')[0].lower()
        if token.startswith('fr'):
            return 'fr'
        if token.startswith('en'):
            return 'en'
    return DEFAULT_LANGUAGE


def get_request_language(request) -> str:
    """Retourne la langue active pour la requête courante."""
    if request is None:
        return DEFAULT_LANGUAGE
    lang = getattr(request, 'language', None)
    if lang in SUPPORTED_LANGUAGES:
        return lang
    return parse_accept_language(request.META.get('HTTP_ACCEPT_LANGUAGE'))


def localized_value(instance, field: str, lang: str) -> str:
    """Retourne la valeur localisée d'un champ (fallback FR si EN absent)."""
    if lang == 'en':
        en_value = getattr(instance, f'{field}_en', '') or ''
        if en_value.strip():
            return en_value
    return getattr(instance, field, '') or ''
