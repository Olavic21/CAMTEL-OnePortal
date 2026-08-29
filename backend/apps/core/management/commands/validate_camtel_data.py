"""Validation de la qualite des donnees catalogue CAMTEL (cahier des charges #45).

Détecte :
  * produits sans service                                   -> ERROR
  * produits sans slug                                      -> ERROR
  * OFFICIAL sans source_url/source_name/last_verified_at   -> ERROR
  * prix incoherents (FIXED sans prix, price=0 sentinelle)   -> ERROR
  * doublons de slug / de nom                                -> ERROR / WARNING
  * donnees HISTORICAL sans historical_since                 -> WARNING
  * MOCK/DEMO publies comme offres reelles                   -> WARNING
  * categories hors familles officielles                     -> WARNING
  * segments invalides / manquants                           -> ERROR / WARNING
  * services et segments officiels non semes                 -> ERROR

Sortie : PASS / FAIL + exit code CI :
    0 = PASS (aucun ERROR ; --fail-on-warning pour durcir)
    1 = FAIL (pipeline CI en echec)

Usage :
    python manage.py validate_camtel_data
    python manage.py validate_camtel_data --fail-on-warning
    python manage.py validate_camtel_data --format json
"""
import datetime
import json
import sys

from django.core.management.base import BaseCommand

from apps.products.models import Product, Segment, Service

OFFICIAL_CATEGORY_SLUGS = {
    'mobile-blue', 'fixed-fiber', 'transport-carrier', 'data-center-hosting',
}


class Command(BaseCommand):
    help = 'Valide la qualite du catalogue CAMTEL (PASS/FAIL, exit code CI).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fail-on-warning', action='store_true',
            help='Exit code 1 si le moindre WARNING est emis (CI stricte).',
        )
        parser.add_argument(
            '--format', choices=['text', 'json'], default='text',
            help='Sortie lisible (text) ou exploitable (json).',
        )

    def _add(self, findings, level, code, message):
        findings.append({'level': level, 'code': code, 'message': message})

    def _check(self, findings):
        products = Product.objects.all().select_related('category', 'service')

        # 1. Produits sans service.
        for p in products.filter(service__isnull=True):
            self._add(findings, 'ERROR', 'PRODUCT_WITHOUT_SERVICE',
                      f'Produit "{p.slug}" sans service (offer_type={p.offer_type}, '
                      f'category={p.category.slug})')

        # 2. OFFICIAL sans source complete.
        for p in products.filter(data_origin=Product.DataOrigin.OFFICIAL):
            if not p.source_url:
                self._add(findings, 'ERROR', 'OFFICIAL_WITHOUT_SOURCE_URL',
                          f'Produit OFFICIAL "{p.slug}" sans source_url')
            if not p.source_name:
                self._add(findings, 'ERROR', 'OFFICIAL_WITHOUT_SOURCE_NAME',
                          f'Produit OFFICIAL "{p.slug}" sans source_name')
            if not p.last_verified_at:
                self._add(findings, 'ERROR', 'OFFICIAL_WITHOUT_VERIFICATION_DATE',
                          f'Produit OFFICIAL "{p.slug}" sans last_verified_at')

        # 3. Prix incoherents.
        for p in products.filter(pricing_type=Product.PricingType.FIXED, price__isnull=True):
            self._add(findings, 'ERROR', 'FIXED_PRICE_WITHOUT_PRICE',
                      f'Produit "{p.slug}": pricing_type=FIXED sans prix')
        for p in products.filter(price=0):
            self._add(findings, 'ERROR', 'PRICE_ZERO_SENTINEL',
                      f'Produit "{p.slug}": price=0 interdit '
                      '(prix inconnu -> price NULL + pricing_type=QUOTE)')
        for p in products.filter(price__isnull=True).exclude(
            pricing_type__in=[Product.PricingType.QUOTE, Product.PricingType.FREE,
                              Product.PricingType.INSTALLATION,
                              Product.PricingType.USAGE_BASED],
        ):
            self._add(findings, 'WARNING', 'PRICE_UNKNOWN_WITHOUT_QUOTE',
                      f'Produit "{p.slug}": prix NULL mais pricing_type='
                      f'{p.pricing_type} (attendu QUOTE)')

        # 4. Doublons slug / nom.
        for slug in products.values_list('slug', flat=True):
            if products.filter(slug=slug).count() > 1:
                self._add(findings, 'ERROR', 'DUPLICATE_SLUG',
                          f'Slug duplique: "{slug}"')
        for name in products.values_list('name', flat=True):
            if products.filter(name=name).count() > 1:
                self._add(findings, 'WARNING', 'DUPLICATE_NAME',
                          f'Nom duplique: "{name}"')

        # 5. Historique / mock / demo exposes comme actuels.
        for p in products.filter(data_origin=Product.DataOrigin.HISTORICAL,
                                 historical_since__isnull=True):
            self._add(findings, 'WARNING', 'HISTORICAL_WITHOUT_SINCE',
                      f'Produit HISTORICAL "{p.slug}" sans historical_since')
        for origin in (Product.DataOrigin.MOCK, Product.DataOrigin.DEMO):
            for p in products.filter(data_origin=origin, is_published=True):
                self._add(findings, 'WARNING', f'{origin}_PUBLISHED',
                          f'Produit {origin} "{p.slug}" publie — jamais presenter '
                          'une donnee demo/mock comme reelle')

        # 6. Categories hors familles officielles.
        for p in products.exclude(category__slug__in=OFFICIAL_CATEGORY_SLUGS):
            self._add(findings, 'WARNING', 'UNOFFICIAL_CATEGORY',
                      f'Produit "{p.slug}" hors famille officielle '
                      f'(category="{p.category.slug}")')

        # 7. Segments invalides / manquants.
        valid_codes = {c[0] for c in Product.Segment.choices}
        for p in products:
            if p.segment and p.segment not in valid_codes:
                self._add(findings, 'ERROR', 'INVALID_SEGMENT',
                          f'Produit "{p.slug}": segment invalide "{p.segment}"')
            if not p.segment and not p.segments.exists():
                self._add(findings, 'WARNING', 'PRODUCT_WITHOUT_SEGMENT',
                          f'Produit "{p.slug}" sans segment (ni principal ni M2M)')

        # 8. Referentiels services/segments semees.
        expected_services = {'fixes', 'mobiles', 'transport', 'data-center'}
        for slug in sorted(expected_services - set(
                Service.objects.values_list('slug', flat=True))):
            self._add(findings, 'ERROR', 'MISSING_SERVICE',
                      f'Service officiel manquant: "{slug}"')
        expected_segments = {'particulier', 'professionnel', 'entreprise', 'administration'}
        for slug in sorted(expected_segments - set(
                Segment.objects.values_list('slug', flat=True))):
            self._add(findings, 'ERROR', 'MISSING_SEGMENT',
                      f'Segment officiel manquant: "{slug}"')

    def handle(self, *args, **options):
        findings = []
        self._check(findings)

        errors = [f for f in findings if f['level'] == 'ERROR']
        warnings = [f for f in findings if f['level'] == 'WARNING']

        if options.get('format') == 'json':
            self.stdout.write(json.dumps({
                'status': 'PASS' if not errors else 'FAIL',
                'errors': errors,
                'warnings': warnings,
                'generated_at': datetime.datetime.now().isoformat(),
            }, indent=2))
        else:
            self.stdout.write(self.style.MIGRATE_HEADING('=== VALIDATION CATALOGUE CAMTEL ==='))
            for f in findings:
                style = self.style.ERROR if f['level'] == 'ERROR' else self.style.WARNING
                self.stdout.write(style(f"[{f['level']}] {f['code']}: {f['message']}"))
            self.stdout.write('')
            self.stdout.write(f'ERREURS  : {len(errors)}')
            self.stdout.write(f'WARNING  : {len(warnings)}')
            if not errors and not warnings:
                self.stdout.write(self.style.SUCCESS('PASS — donnees catalogue coherentes.'))
            elif not errors:
                self.stdout.write(self.style.WARNING('PASS (avec avertissements).'))
            else:
                self.stdout.write(self.style.ERROR('FAIL — erreurs critiques detectees.'))

        exit_code = 0
        if errors:
            exit_code = 1
        elif warnings and options.get('fail_on_warning'):
            exit_code = 1
        if exit_code:
            sys.exit(exit_code)

