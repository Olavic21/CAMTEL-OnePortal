import os  # noqa: F401

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')  # noqa: F405

# SECRET_KEY est OBLIGATOIRE en production. L'application refuse de demarrer si
# elle est absente ou egale au placeholder de developpement. Aucun secret ne
# doit etre code en dur.
_SECRET_KEY = os.environ.get('SECRET_KEY', '')  # noqa: F405
_PLACEHOLDERS = {'', 'change-me-in-production', 'django-insecure-dev-only-insecure-key-not-for-production'}
if _SECRET_KEY in _PLACEHOLDERS:
    raise ImproperlyConfigured(
        'SECRET_KEY est obligatoire en production. Fournissez une valeur forte '
        'via la variable d\'environnement SECRET_KEY (ex: generateur en ligne de commande).'
    )
SECRET_KEY = _SECRET_KEY  # noqa: F405

# Seed demo : en production la valeur par defaut est FALSE (jamais auto). La
# commande seed_data refuse alors de s'executer sans option --force.
SEED_DEMO_DATA = os.environ.get('SEED_DEMO_DATA', 'False').lower() in {'1', 'true', 'yes', 'on'}  # noqa: F405

SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True').lower() in {'1', 'true', 'yes', 'on'}  # noqa: F405
SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000'))  # noqa: F405
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

LOG_FORMAT = os.environ.get('LOG_FORMAT', 'json')  # noqa: F405

# CORS : en production, jamais d'origine sauvage (*). La liste blanche est
# fournie via CORS_ALLOWED_ORIGINS (ex: https://portal.camtel.cm).
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
    if origin.strip()
]  # noqa: F405

# Stockage objet S3-compatible (MinIO, AWS S3, etc.)
USE_S3_STORAGE = os.environ.get('USE_S3_STORAGE', 'False').lower() in {'1', 'true', 'yes', 'on'}  # noqa: F405

if USE_S3_STORAGE:
    INSTALLED_APPS += ['storages']  # noqa: F405
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')  # noqa: F405
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')  # noqa: F405
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', 'camtel-media')  # noqa: F405
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')  # noqa: F405
    AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL', '')  # noqa: F405
    AWS_S3_CUSTOM_DOMAIN = os.environ.get('AWS_S3_CUSTOM_DOMAIN', '')  # noqa: F405
    AWS_DEFAULT_ACL = 'public-read'
    AWS_QUERYSTRING_AUTH = False

    # Email / SMTP production configuration
    # If EMAIL_PROVIDER is set to 'smtp' in the environment, configure Django's
    # SMTP backend from environment variables. Otherwise keep the backend provided
    # by base settings (console/file) or use the explicit EMAIL_BACKEND env var.
    EMAIL_PROVIDER = os.environ.get('EMAIL_PROVIDER', 'smtp')  # noqa: F405
    if EMAIL_PROVIDER == 'smtp':
        DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'no-reply@oneportal.local')  # noqa: F405
        EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
        EMAIL_HOST = os.environ.get('EMAIL_HOST', 'localhost')  # noqa: F405
        EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '25'))  # noqa: F405
        EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')  # noqa: F405
        EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')  # noqa: F405
        EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'False').lower() in {'1', 'true', 'yes', 'on'}  # noqa: F405
        EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'False').lower() in {'1', 'true', 'yes', 'on'}  # noqa: F405
        # Allow overriding backend explicitly if needed
        EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', EMAIL_BACKEND)  # noqa: F405
    else:
        # Keep current behaviour or allow explicit override
        DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'no-reply@oneportal.local')  # noqa: F405
        EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')  # noqa: F405

        # Celery production settings: enable with USE_CELERY=True and provide a broker
        USE_CELERY = os.environ.get('USE_CELERY', 'False').lower() in {'1', 'true', 'yes', 'on'}  # noqa: F405
        if USE_CELERY:
            CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')  # noqa: F405
            CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', CELERY_BROKER_URL)  # noqa: F405
            # In production this should normally be False; configured here only for
            # flexibility in special environments or CI where eager execution is desired.
            CELERY_TASK_ALWAYS_EAGER = os.environ.get('CELERY_TASK_ALWAYS_EAGER', 'False').lower() in {'1', 'true', 'yes', 'on'}  # noqa: F405

