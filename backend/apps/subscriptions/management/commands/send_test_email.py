from django.core.management.base import BaseCommand
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from types import SimpleNamespace


class Command(BaseCommand):
    help = 'Send a test subscription email using current EMAIL_BACKEND (can be SMTP or console).'

    def add_arguments(self, parser):
        parser.add_argument('--to', help='Recipient email address', required=False)
        parser.add_argument('--subject', help='Email subject', default='OnePortal test email')

    def handle(self, *args, **options):
        to = options.get('to') or settings.DEFAULT_FROM_EMAIL
        subject = options.get('subject')

        context = {
            'site_name': 'CAMTEL OnePortal',
            'support_email': settings.DEFAULT_FROM_EMAIL,
            # Provide a minimal `user` object so templates referencing `user` work
            'user': SimpleNamespace(username='testuser', first_name='Test', last_name='User', email=to),
            # Provide a minimal `subscription` object for templates that reference it
            'subscription': SimpleNamespace(request_number='TEST-0001', product_name='Test Product'),
        }

        text_content = render_to_string('emails/subscription_approved.txt', context)
        html_content = render_to_string('emails/subscription_approved.html', context)

        msg = EmailMultiAlternatives(subject=subject, body=text_content, from_email=settings.DEFAULT_FROM_EMAIL, to=[to])
        if html_content:
            msg.attach_alternative(html_content, 'text/html')

        sent = msg.send()
        self.stdout.write(self.style.SUCCESS(f'Sent {sent} message(s) to {to} using backend {settings.EMAIL_BACKEND}'))
