from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.categories.models import Category
from apps.contacts.models import ContactMessage
from apps.news.models import News
from apps.products.models import Product, ProductFAQ
from apps.promotions.models import Promotion

from .models import ActivityLog

AUDITED_MODELS = (Category, Product, ProductFAQ, News, Promotion, ContactMessage)


def _current_user():
    from .middleware import get_current_user
    return get_current_user()


def _log_action(instance, action, details=''):
    ActivityLog.objects.create(
        user=_current_user(),
        action=action,
        target_model=instance.__class__.__name__,
        target_id=instance.pk,
        details=details,
    )


@receiver(post_save)
def log_model_save(sender, instance, created, **kwargs):
    if sender not in AUDITED_MODELS:
        return
    action = 'create' if created else 'update'
    _log_action(instance, action)


@receiver(post_delete)
def log_model_delete(sender, instance, **kwargs):
    if sender not in AUDITED_MODELS:
        return
    _log_action(instance, 'delete')
