"""Tests commandes catalogue : import, validation, seed (LOT 2)."""
import datetime
import json
import os
import tempfile

from django.core.management import CommandError, call_command
from django.test import TestCase

from apps.categories.models import Category
from apps.products.models import (
    Product,
    ProductSource,
    Segment,
    Service,
)

OFFER = {
    'slug': 'blue-one-m',
    'name': 'Blue One M',
    'brand': 'BLUE',
    'category_slug': 'mobile-blue',
    'offer_type': 'MOBILE',
    'segment': 'PARTICULIER',
    'pricing_type': 'FIXED',
    'price': 3000,
    'currency': 'XAF',
    'source_url': 'https://blue.camtel.cm/',
    'source_name': 'Blue by CAMTEL',
}


def _write_snapshot(root, name, offers, sources=True):
    """Ecrit un snapshot minimal (offers + sources) pour les tests."""
    snapshot = os.path.join(root, name)
    os.makedirs(snapshot, exist_ok=True)
    with open(os.path.join(snapshot, 'offers.json'), 'w', encoding='utf-8') as fh:
        json.dump({'offers': offers}, fh, ensure_ascii=False)
    with open(os.path.join(snapshot, 'sources.json'), 'w', encoding='utf-8') as fh:
        json.dump({'snapshot_date': name}, fh, ensure_ascii=False)
    return snapshot


class ImportCamtelCatalogTest(TestCase):
    def setUp(self):
        self.tmp_root = tempfile.mkdtemp()
        self.snapshot = _write_snapshot(self.tmp_root, '2026-09-01', [OFFER])

    def test_import_twice_creates_no_duplicates(self):
        """Test critique #9 : importer deux fois ne cree pas de doublons."""
        call_command('import_camtel_catalog', '--dir', self.snapshot, verbosity=0)
        call_command('import_camtel_catalog', '--dir', self.snapshot, verbosity=0)
        self.assertEqual(Product.objects.filter(slug='blue-one-m').count(), 1)

    def test_import_assigns_service_segments_and_source(self):
        call_command('import_camtel_catalog', '--dir', self.snapshot, verbosity=0)
        product = Product.objects.get(slug='blue-one-m')
        self.assertIsNotNone(product.service)
        self.assertEqual(product.service.slug, 'mobiles')
        self.assertEqual(
            set(product.segments.values_list('code', flat=True)), {'PARTICULIER'},
        )
        source = product.sources.filter(is_primary=True).first()
        self.assertIsNotNone(source)
        self.assertEqual(source.verification_status, ProductSource.VerificationStatus.OFFICIAL)
        self.assertEqual(source.last_verified_at, datetime.date(2026, 9, 1))

    def test_dry_run_writes_nothing(self):
        """--dry-run valide sans modifier la base."""
        call_command('import_camtel_catalog', '--dir', self.snapshot, '--dry-run', verbosity=0)
        self.assertEqual(Product.objects.count(), 0)
        self.assertEqual(ProductSource.objects.count(), 0)

    def test_update_only_creates_nothing_new(self):
        call_command('import_camtel_catalog', '--dir', self.snapshot, verbosity=0)
        other = {**OFFER, 'slug': 'offre-nouvelle', 'name': 'Offre Nouvelle'}
        snapshot2 = _write_snapshot(self.tmp_root, '2026-09-03', [OFFER, other])
        call_command('import_camtel_catalog', '--dir', snapshot2, '--update', verbosity=0)
        self.assertFalse(Product.objects.filter(slug='offre-nouvelle').exists())
        self.assertTrue(Product.objects.filter(slug='blue-one-m').exists())

    def test_source_filter_limits_entries(self):
        other = {
            **OFFER, 'slug': 'hosting-vps', 'name': 'Hosting VPS',
            'category_slug': 'data-center-hosting', 'offer_type': 'CLOUD',
            'segment': 'ENTREPRISE', 'source_name': 'CAMTEL Hosting official website',
            'source_url': 'https://hosting.camtel.cm/',
        }
        snapshot = _write_snapshot(self.tmp_root, '2026-09-04', [OFFER, other])
        call_command(
            'import_camtel_catalog', '--dir', snapshot,
            '--source', 'hosting.camtel.cm', verbosity=0,
        )
        self.assertTrue(Product.objects.filter(slug='hosting-vps').exists())
        self.assertFalse(Product.objects.filter(slug='blue-one-m').exists())

    def test_official_without_source_is_skipped_and_strict_fails(self):
        """Test critique #10 : une offre OFFICIAL sans source est rejetee,
        et --strict echoue avec exit code non nul."""
        bad_offer = {k: v for k, v in OFFER.items() if k != 'source_url'}
        bad_offer['slug'] = 'sans-source'
        bad_offer['name'] = 'Sans Source'
        snapshot = _write_snapshot(self.tmp_root, '2026-09-02', [bad_offer])

        # Sans --strict : l'entree est ignoree (skipped), le reste passe.
        call_command('import_camtel_catalog', '--dir', snapshot, verbosity=0)
        self.assertFalse(Product.objects.filter(slug='sans-source').exists())

        # Avec --strict : CommandError (exit code != 0 pour la CI).
        with self.assertRaises(CommandError):
            call_command('import_camtel_catalog', '--dir', snapshot, '--strict', verbosity=0)


class ValidateCamtelDataTest(TestCase):
    def setUp(self):
        # Referentiels deja semes par la migration 0012 : get_or_create
        # (idempotent) — pas de conflit d'unicite.
        for data in [
            {'slug': 'fixes', 'code': 'FIXED', 'name': 'Fixes'},
            {'slug': 'mobiles', 'code': 'MOBILE', 'name': 'Mobiles'},
            {'slug': 'transport', 'code': 'TRANSPORT', 'name': 'Transport'},
            {'slug': 'data-center', 'code': 'DATA_CENTER', 'name': 'Data Center'},
        ]:
            Service.objects.get_or_create(slug=data['slug'], defaults=data)
        for slug, code in [
            ('particulier', 'PARTICULIER'), ('professionnel', 'PROFESSIONNEL'),
            ('entreprise', 'ENTREPRISE'), ('administration', 'ADMINISTRATION'),
        ]:
            Segment.objects.get_or_create(
                slug=slug, defaults={'code': code, 'name': code},
            )

    def _product(self, slug='p-ok', **kwargs):
        defaults = dict(
            name='Produit OK', slug=slug, description='d', price='100',
            category=Category.objects.get_or_create(
                slug='mobile-blue', defaults={'name': 'Mobile / Blue'},
            )[0],
            data_origin=Product.DataOrigin.DEMO, is_published=False,
            source_url='https://blue.camtel.cm/', source_name='Blue by CAMTEL',
            last_verified_at=datetime.date(2026, 9, 1),
            offer_type='MOBILE', segment='PARTICULIER',
        )
        defaults.update(kwargs)
        return Product.objects.create(**defaults)

    def _run_validate(self):
        """Lance la validation et retourne (report, exit_code).

        La commande utilise sys.exit() pour la CI : SystemExit est capture ici.
        """
        from io import StringIO

        out = StringIO()
        try:
            call_command('validate_camtel_data', '--format', 'json', stdout=out)
            exit_code = 0
        except SystemExit as exc:  # command failing -> exit code 1
            exit_code = exc.code or 1
        return json.loads(out.getvalue()), exit_code

    def test_valid_catalog_passes(self):
        self._product()
        report, exit_code = self._run_validate()
        self.assertEqual(report['status'], 'PASS')
        self.assertEqual(report['errors'], [])
        self.assertEqual(exit_code, 0)

    def test_product_without_service_is_error(self):
        self._product(slug='sans-service', offer_type='EQUIPMENT')
        product = Product.objects.get(slug='sans-service')
        product.service = None
        product.category = Category.objects.create(name='Divers', slug='divers-inconnu-x')
        product.save()
        report, exit_code = self._run_validate()
        codes = [e['code'] for e in report['errors']]
        self.assertIn('PRODUCT_WITHOUT_SERVICE', codes)
        self.assertEqual(report['status'], 'FAIL')
        self.assertEqual(exit_code, 1)

    def test_official_without_source_is_error(self):
        self._product(
            slug='official-sans-source',
            data_origin=Product.DataOrigin.OFFICIAL,
            source_url='', source_name='', last_verified_at=None,
        )
        report, exit_code = self._run_validate()
        codes = [e['code'] for e in report['errors']]
        self.assertIn('OFFICIAL_WITHOUT_SOURCE_URL', codes)
        self.assertIn('OFFICIAL_WITHOUT_SOURCE_NAME', codes)
        self.assertIn('OFFICIAL_WITHOUT_VERIFICATION_DATE', codes)
        self.assertEqual(exit_code, 1)

    def test_price_zero_sentinel_is_error(self):
        self._product(slug='prix-zero', price='0.00')
        report, exit_code = self._run_validate()
        codes = [e['code'] for e in report['errors']]
        self.assertIn('PRICE_ZERO_SENTINEL', codes)
        self.assertEqual(exit_code, 1)

    def test_missing_official_service_is_error(self):
        Service.objects.get(slug='transport').delete()
        report, exit_code = self._run_validate()
        codes = [e['code'] for e in report['errors']]
        self.assertIn('MISSING_SERVICE', codes)
        self.assertEqual(exit_code, 1)


class SeedCamtelDataTest(TestCase):
    def test_seed_is_idempotent(self):
        tmp_root = tempfile.mkdtemp()
        snapshot = _write_snapshot(tmp_root, '2026-09-05', [OFFER])
        call_command('seed_camtel_data', '--snapshot', snapshot, verbosity=0)
        call_command('seed_camtel_data', '--snapshot', snapshot, verbosity=0)
        self.assertEqual(Service.objects.count(), 4)
        self.assertEqual(Segment.objects.count(), 4)
        self.assertEqual(Product.objects.filter(slug='blue-one-m').count(), 1)
        self.assertIsNotNone(Product.objects.get(slug='blue-one-m').service)



