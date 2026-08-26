"""
Signal handlers for subscription workflow.

Tracks status transitions and sends notifications automatically.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.conf import settings as django_settings

try:
    from .tasks import send_subscription_email_task
except Exception:  # pragma: no cover - defensive import if tasks missing
    send_subscription_email_task = None

from .models import SubscriptionRequest, SubscriptionStatusHistory


@receiver(post_save, sender=SubscriptionStatusHistory)
def notify_subscription_status_change(sender, instance, created, **kwargs):
    """Send multipart (text + HTML) email notification on status change."""
    if not created:
        return

    subscription = instance.subscription
    user = getattr(subscription, 'user', None)
    if not user or not getattr(user, 'email', None):
        return

    status_templates = {
        SubscriptionRequest.Status.APPROVED: {
            'subject': 'Votre demande de souscription a été approuvée',
            'txt_template': 'emails/subscription_approved.txt',
            'html_template': 'emails/subscription_approved.html',
        },
        SubscriptionRequest.Status.ACTIVATED: {
            'subject': 'Votre souscription est activée',
            'txt_template': 'emails/subscription_activated.txt',
            'html_template': 'emails/subscription_activated.html',
        },
        SubscriptionRequest.Status.REJECTED: {
            'subject': 'Votre demande de souscription a été rejetée',
            'txt_template': 'emails/subscription_rejected.txt',
            'html_template': 'emails/subscription_rejected.html',
        },
        SubscriptionRequest.Status.ADDITIONAL_INFO_REQUIRED: {
            'subject': 'Informations complémentaires requises',
            'txt_template': 'emails/subscription_info_required.txt',
            'html_template': 'emails/subscription_info_required.html',
        },
    }

    template_info = status_templates.get(instance.new_status)
    if not template_info:
        return

    try:
        context = {
            'user': user,
            'subscription': subscription,
            'request_number': getattr(subscription, 'request_number', ''),
            'product_name': getattr(subscription.product, 'name', ''),
            'status': instance.new_status,
            'reason': instance.reason or '',
            'comment': instance.comment or '',
            'site_url': getattr(settings, 'SITE_URL', ''),
        }

        subject = template_info['subject']
        to_email = [user.email]

        text_content = render_to_string(template_info['txt_template'], context)
        html_content = render_to_string(template_info['html_template'], context)

        # Prefer asynchronous send via Celery when available and enabled.
        if send_subscription_email_task and getattr(django_settings, 'USE_CELERY', False):
            try:
                send_subscription_email_task.delay(subject, text_content, html_content, to_email, settings.DEFAULT_FROM_EMAIL)
                return
            except Exception:
                # Fall through to synchronous send on failure
                pass

        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, to_email)
        if html_content:
            msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=True)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception("Failed to send subscription status email")
