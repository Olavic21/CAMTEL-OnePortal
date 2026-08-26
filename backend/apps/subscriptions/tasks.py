try:
    from celery import shared_task  # type: ignore
except Exception:  # Celery not installed — provide a sync fallback decorator
    def shared_task(func=None, **_kwargs):
        if func is None:
            def _wrap(f):
                return f
            return _wrap
        return func

from django.core.mail import EmailMultiAlternatives


@shared_task
def send_subscription_email_task(subject: str, text_content: str, html_content: str, to_emails, from_email: str):
    """Send a multipart email. If Celery is not available this runs synchronously."""
    try:
        msg = EmailMultiAlternatives(subject, text_content, from_email, to_emails)
        if html_content:
            msg.attach_alternative(html_content, 'text/html')
        msg.send(fail_silently=True)
    except Exception:
        # Swallow exceptions — email sending should not break main flow
        import logging
        logging.getLogger(__name__).exception('Subscription email send failed')
