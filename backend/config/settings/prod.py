from .base import *  # noqa: F403

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')  # noqa: F405

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
