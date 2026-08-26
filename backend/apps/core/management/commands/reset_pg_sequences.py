from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection


class Command(BaseCommand):
    help = 'Réinitialise les séquences PostgreSQL après migration de données.'

    def handle(self, *args, **options):
        if connection.vendor != 'postgresql':
            self.stdout.write(self.style.WARNING('Cette commande ne s\'applique qu\'à PostgreSQL.'))
            return
        from django.apps import apps
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                table = model._meta.db_table
                pk = model._meta.pk.column
                with connection.cursor() as cursor:
                    cursor.execute(
                        f"SELECT setval(pg_get_serial_sequence(%s, %s), COALESCE((SELECT MAX({pk}) FROM {table}), 1), true);",
                        [table, pk],
                    )
        self.stdout.write(self.style.SUCCESS('Séquences PostgreSQL réinitialisées.'))
