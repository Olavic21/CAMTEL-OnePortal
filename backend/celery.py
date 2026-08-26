import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

app = Celery('camtel')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

try:
	# task_always_eager allows running tasks synchronously for local testing
	from django.conf import settings as _dj_settings
	app.conf.task_always_eager = getattr(_dj_settings, 'CELERY_TASK_ALWAYS_EAGER', False)
except Exception:
	pass

__all__ = ('app',)
