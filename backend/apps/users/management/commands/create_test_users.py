from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = 'Create test admin and visitor users (idempotent)'

    def handle(self, *args, **options):
        admin_username = 'admin_test'
        admin_email = 'admin_test@example.com'
        admin_password = 'AdminPass123!'

        visitor_username = 'visitor_test'
        visitor_email = 'visitor_test@example.com'
        visitor_password = 'VisitorPass123!'

        admin, created = User.objects.get_or_create(
            username=admin_username,
            defaults={
                'email': admin_email,
                'role': User.Role.ADMIN,
                'is_staff': True,
            },
        )
        if created:
            admin.set_password(admin_password)
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'Created admin: {admin_username} / {admin_password}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin {admin_username} already exists'))

        visitor, created = User.objects.get_or_create(
            username=visitor_username,
            defaults={
                'email': visitor_email,
                'role': User.Role.VIEWER,
                'is_staff': False,
            },
        )
        if created:
            visitor.set_password(visitor_password)
            visitor.save()
            self.stdout.write(self.style.SUCCESS(f'Created visitor: {visitor_username} / {visitor_password}'))
        else:
            self.stdout.write(self.style.WARNING(f'Visitor {visitor_username} already exists'))

        self.stdout.write(self.style.NOTICE('Done. Use these credentials for local testing.'))
