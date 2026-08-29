from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = 'Create test admin and customer users (idempotent)'

    def handle(self, *args, **options):
        admin_username = 'admin_test'
        admin_email = 'admin_test@example.com'
        admin_password = 'AdminPass123!'

        customer_username = 'customer_test'
        customer_email = 'customer_test@example.com'
        customer_password = 'CustomerPass123!'

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

        customer, created = User.objects.get_or_create(
            username=customer_username,
            defaults={
                'email': customer_email,
                'role': User.Role.CUSTOMER,
                'is_staff': False,
            },
        )
        if created:
            customer.set_password(customer_password)
            customer.save()
            self.stdout.write(self.style.SUCCESS(f'Created customer: {customer_username} / {customer_password}'))
        else:
            self.stdout.write(self.style.WARNING(f'Customer {customer_username} already exists'))

        self.stdout.write(self.style.NOTICE('Done. Use these credentials for local testing.'))
