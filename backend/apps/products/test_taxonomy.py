"""Tests taxonomie V4 : Services, Segments, mapping produits (LOT 1)."""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.products.models import Product, Segment, Service


class TaxonomyModelTest(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Télécom', slug='telecom')

    def _product(self, slug='p1', offer_type='OTHER', segment='PARTICULIER'):
        return Product.objects.create(
            name=slug,
            slug=slug,
            description='desc',
            price='100.00',
            category=self.category,
            offer_type=offer_type,
            segment=segment,
        )

    def test_services_created_by_migration_exist(self):
        """Les 4 verticales officielles sont presentes avec slugs stables."""
        slugs = set(Service.objects.values_list('slug', flat=True))
        self.assertLessEqual({'fixes', 'mobiles', 'transport', 'data-center'}, slugs)
        codes = set(Service.objects.values_list('code', flat=True))
        self.assertLessEqual({'FIXED', 'MOBILE', 'TRANSPORT', 'DATA_CENTER'}, codes)

    def test_segments_created_by_migration_exist(self):
        """Les 4 segments officiels sont presents avec slugs stables."""
        slugs = set(Segment.objects.values_list('slug', flat=True))
        self.assertLessEqual(
            {'particulier', 'professionnel', 'entreprise', 'administration'}, slugs,
        )

    def test_product_multi_segments_and_primary_sync(self):
        """Un produit peut cibler plusieurs segments ; le CharField legacy est
        resynchronise avec le premier segment (display_order)."""
        product = self._product()
        ok = product.sync_segments(['ENTREPRISE', 'ADMINISTRATION'])
        self.assertTrue(ok)
        codes = set(product.segments.values_list('code', flat=True))
        self.assertEqual(codes, {'ENTREPRISE', 'ADMINISTRATION'})
        self.assertEqual(product.segment, 'ENTREPRISE')
        # Idempotence : relancer ne cree pas de doublons.
        product.sync_segments(['ENTREPRISE', 'ADMINISTRATION'])
        self.assertEqual(product.segments.count(), 2)

    def test_unknown_segment_code_is_ignored(self):
        product = self._product(segment='PARTICULIER')
        ok = product.sync_segments(['SEGMENT_INEXISTANT'])
        self.assertFalse(ok)
        self.assertEqual(product.segment, 'PARTICULIER')

    def test_data_origin_extended_values(self):
        """Les provenances HISTORICAL / MOCK / REQUIRES_VALIDATION existent."""
        product = self._product()
        for origin in (
            Product.DataOrigin.HISTORICAL,
            Product.DataOrigin.MOCK,
            Product.DataOrigin.REQUIRES_VALIDATION,
        ):
            product.data_origin = origin
            product.save()
            product.refresh_from_db()
            self.assertEqual(product.data_origin, origin)

    def test_pricing_type_extended_values(self):
        product = self._product()
        product.pricing_type = Product.PricingType.USAGE_BASED
        product.save()
        self.assertEqual(Product.objects.get(slug='p1').pricing_type, 'USAGE_BASED')

    def test_official_source_requires_url_constraint(self):
        """Une ProductSource OFFICIAL sans URL est refusee (contrainte BDD)."""
        from django.db import IntegrityError, transaction

        from apps.products.models import ProductSource

        product = self._product()
        ProductSource.objects.create(
            product=product,
            source_name='CAMTEL Hosting',
            source_url='https://hosting.camtel.cm/',
            verification_status=ProductSource.VerificationStatus.OFFICIAL,
        )
        self.assertEqual(ProductSource.objects.count(), 1)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProductSource.objects.create(
                    product=product,
                    source_name='Source sans URL',
                    source_url='',
                    verification_status=ProductSource.VerificationStatus.OFFICIAL,
                )


class TaxonomyMappingTest(APITestCase):
    """Mapping service/segments : categorie prioritaire, offer_type en fallback,
    produits ambigus laisses sans service (REQUIRES_BUSINESS_VALIDATION)."""

    def setUp(self):
        self.mobile_cat = Category.objects.create(name='Mobile / Blue', slug='mobile-blue')
        self.dc_cat = Category.objects.create(name='Data Center', slug='data-center-hosting')

    def _service(self, slug):
        return Service.objects.get(slug=slug)

    def test_product_in_mobile_category_maps_to_mobiles(self):
        product = Product.objects.create(
            name='Forfait Blue', slug='forfait-blue',
            description='d', price='500', category=self.mobile_cat,
            offer_type='MOBILE', segment='PARTICULIER',
        )
        product.service = self._service('mobiles')
        product.save(update_fields=['service'])
        self.assertEqual(Product.objects.get(slug='forfait-blue').service.slug, 'mobiles')

    def test_product_in_datacenter_category_maps_to_data_center(self):
        product = Product.objects.create(
            name='CB VPS M', slug='cb-vps-m',
            description='d', price='18000', category=self.dc_cat,
            offer_type='CLOUD', segment='ENTREPRISE',
        )
        product.service = self._service('data-center')
        product.save(update_fields=['service'])
        self.assertEqual(Product.objects.get(slug='cb-vps-m').service.slug, 'data-center')

    def test_ambiguous_product_left_without_service(self):
        """EQUIPMENT sans categorie reconnue : pas de devinette — le produit
        reste sans service et sera remonte par validate_camtel_data."""
        divers = Category.objects.create(name='Divers', slug='divers-inconnu')
        Product.objects.create(
            name='Produit Ambigu', slug='produit-ambigu',
            description='d', price=None, category=divers,
            offer_type='EQUIPMENT', segment='PARTICULIER',
        )
        self.assertIsNone(Product.objects.get(slug='produit-ambigu').service_id)

