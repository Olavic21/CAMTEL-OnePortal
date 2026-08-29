"""Seed catalogue CAMTEL officiel (cahier des charges #42).

Cree de facon IDEMPOTENTE :
  * les 4 Services officiels (fixes, mobiles, transport, data-center) ;
  * les 4 Segments officiels (particulier, professionnel, entreprise,
    administration) ;
  * les categories officielles, les produits, specifications, sources et
    FAQ issues du dernier snapshot data/camtel_catalog/<date>/ via
    import_camtel_catalog.

Contrairement a seed_data (donnees DEMO dev-only), ce seed produit le
catalogue OFFICIAL verifiable — utilisable en staging/production apres
verification du snapshot.

Usage :
    python manage.py seed_camtel_data
    python manage.py seed_camtel_data --snapshot 2026-08-25 --verbose
    python manage.py seed_camtel_data --dry-run
"""
from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Seed idempotent du catalogue CAMTEL officiel (services, segments, produits, sources).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--snapshot', default=None,
            help='Snapshot a importer (date YYYY-MM-DD ou chemin ; defaut: le plus recent).',
        )
        parser.add_argument('--dry-run', action='store_true',
                            help='Valide le snapshot sans ecrire en base.')
        parser.add_argument('--verbose', action='store_true',
                            help='Liste les offres creees/mises a jour.')

    def handle(self, *args, **options):
        from apps.products.models import Segment, Service

        self.stdout.write('Seed catalogue CAMTEL officiel...')

        # 1. Referentiels taxonomie (idempotent).
        from apps.products.taxonomy import ensure_services_and_segments

        ensure_services_and_segments()
        self.stdout.write(self.style.SUCCESS(
            f'Services: {", ".join(Service.objects.values_list("slug", flat=True))}'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'Segments: {", ".join(Segment.objects.values_list("slug", flat=True))}'
        ))

        # 2. Catalogue officiel depuis le snapshot (import idempotent).
        argv = ['import_camtel_catalog']
        if options.get('snapshot'):
            argv.append(f'--snapshot={options["snapshot"]}')
        if options.get('dry_run'):
            argv.append('--dry-run')
        if options.get('verbose'):
            argv.append('--verbose')
        call_command(*argv)

        if not options.get('dry_run'):
            from apps.products.models import Product, ProductSource

            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('=== SEED TERMINE ==='))
            self.stdout.write(f'Produits en base      : {Product.objects.count()}')
            self.stdout.write(f'Offres OFFICIAL       : '
                              f'{Product.objects.filter(data_origin=Product.DataOrigin.OFFICIAL).count()}')
            self.stdout.write(f'Sources structurees   : {ProductSource.objects.count()}')
