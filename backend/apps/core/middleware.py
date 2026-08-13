import threading

from django.utils.deprecation import MiddlewareMixin

from .i18n import parse_accept_language

_thread_locals = threading.local()


def get_current_user():
    return getattr(_thread_locals, 'user', None)


class LanguageMiddleware(MiddlewareMixin):
    """Attache la langue détectée à la requête (Accept-Language)."""

    def process_request(self, request):
        request.language = parse_accept_language(request.META.get('HTTP_ACCEPT_LANGUAGE'))


class ActivityLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            _thread_locals.user = request.user
        else:
            _thread_locals.user = None
        try:
            return self.get_response(request)
        finally:
            _thread_locals.user = None
