from django.core.management.base import BaseCommand

from apps.partners.models import PartnerAPIKey


class Command(BaseCommand):
    help = 'Crée une clé API partenaire (scopes limités).'

    def add_arguments(self, parser):
        parser.add_argument('--name', default='Partenaire démo')
        parser.add_argument(
            '--scopes',
            default='products:read,categories:read,news:read',
            help='Scopes séparés par des virgules',
        )

    def handle(self, *args, **options):
        scopes = [s.strip() for s in options['scopes'].split(',') if s.strip()]
        partner_key, raw_key = PartnerAPIKey.generate(name=options['name'], scopes=scopes)
        self.stdout.write(self.style.SUCCESS(f'Clé créée pour {partner_key.name}'))
        self.stdout.write(f'X-API-Key: {raw_key}')
        self.stdout.write('Conservez cette clé : elle ne sera plus affichée.')
