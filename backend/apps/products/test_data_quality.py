"""Tests qualite des donnees commerciales (mission OnePortal #36).

Verifie :
  - pas d'offres dupliquees ;
  - prix valides (jamais negatif, jamais 0 pour un prix inconnu) ;
  - categories valides ;
  - source officielle requise pour toute donnee OFFICIAL ;
  - URL de source valide ;
  - last_verified_at requis ;
  - une promotion expiree n'apparait jamais comme active ;
  - un prix inconnu n'est jamais affiche comme 0 (Prix sur demande).
"""
import datetime
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.categories.models import Category
from apps.products.models import Product
from apps.promotions.models import Promotion


class DataQualityTest(TestCase):
    def _category(self, slug='data-center-hosting'):
        return Category.objects.get_or_create(
            slug=slug, defaults={'name': 'Data Center / Hosting'},
        )[0]

    def _official_product(self, **overrides):
        defaults = dict(
            name='CB VPS XS',
            slug='cb-vps-xs',
            brand=Product.Brand.HOSTING,
            category=self._category(),
            price='12000.00',
            currency='XAF',
            pricing_type=Product.PricingType.FIXED,
            status=Product.Status.VALID,
            data_origin=Product.DataOrigin.OFFICIAL,
            source_name='CAMTEL Hosting official website',
            source_url='https://hosting.camtel.cm/',
            source_checked_at=datetime.date(2026, 8, 25),
            last_verified_at=datetime.date(2026, 8, 25),
        )
        defaults.update(overrides)
        return Product.objects.create(**defaults)

    # --- doublons -----------------------------------------------------------
    def test_no_duplicate_offers(self):
        self._official_product()
        slugs = list(Product.objects.values_list('slug', flat=True))
        self.assertEqual(len(slugs), len(set(slugs)))
        # unicite au niveau base : recreer le meme slug doit echouer
        with self.assertRaises(Exception):
            self._official_product()

    # --- prix ---------------------------------------------------------------
    def test_valid_prices_are_positive(self):
        for product in [
            self._official_product(),
            self._official_product(slug='cb-vps-m', price=Decimal('24000.00')),
        ]:
            self.assertGreater(Decimal(product.price), Decimal('0'))

    def test_unknown_price_is_null_not_zero(self):
        product = self._official_product(
            slug='carrier-iplc',
            name='IPLC',
            brand=Product.Brand.CARRIER,
            price=None,
            pricing_type=Product.PricingType.QUOTE,
        )
        self.assertIsNone(product.price)
        self.assertNotEqual(product.price, 0)
        self.assertTrue(product.price_on_request)

    def test_price_on_request_when_no_price_even_if_fixed_declared(self):
        product = self._official_product(
            slug='camtel-domain-name',
            name='Domain Name',
            price=None,
            pricing_type=Product.PricingType.FIXED,
        )
        # Regle #29 : sans prix publie -> affichage "Prix sur demande"
        self.assertTrue(product.price_on_request)

    # --- categories ---------------------------------------------------------
    def test_valid_categories(self):
        allowed_slugs = {
            'mobile-blue', 'fixed-fiber', 'transport-carrier', 'data-center-hosting',
            'telecom', 'internet', 'cloud',  # categories historiques seed/demo
        }
        product = self._official_product()
        self.assertIn(product.category.slug, allowed_slugs)

    # --- tracabilite --------------------------------------------------------
    def test_official_source_required(self):
        product = self._official_product()
        self.assertTrue(product.source_url)
        self.assertTrue(product.source_name)

    def test_official_source_url_must_be_http(self):
        product = self._official_product()
        self.assertTrue(product.source_url.startswith(('http://', 'https://')))

    def test_last_verified_at_required_for_official(self):
        product = self._official_product()
        self.assertIsNotNone(product.last_verified_at)

    def test_stale_detection_after_freshness_window(self):
        old_date = datetime.date.today() - datetime.timedelta(days=60)
        stale = self._official_product(slug='old-offer', last_verified_at=old_date)
        fresh = self._official_product(
            slug='new-offer',
            last_verified_at=datetime.date.today(),
        )
        self.assertTrue(stale.is_stale)
        self.assertFalse(fresh.is_stale)

    # --- promotions ---------------------------------------------------------
    def test_expired_promotion_never_active(self):
        promo = Promotion.objects.create(
            title='Promo passee',
            slug='promo-passee',
            is_active=True,
            starts_at=timezone.now() - datetime.timedelta(days=10),
            ends_at=timezone.now() - datetime.timedelta(days=1),
        )
        self.assertFalse(promo.is_currently_active)

        expired_status = Promotion.objects.create(
            title='Promo statut expire',
            slug='promo-statut-expire',
            is_active=True,
            status=Promotion.Status.EXPIRED,
        )
        self.assertFalse(expired_status.is_currently_active)

    def test_upcoming_promotion_not_active_yet(self):
        promo = Promotion.objects.create(
            title='Promo future',
            slug='promo-future',
            is_active=True,
            starts_at=timezone.now() + datetime.timedelta(days=5),
        )
        self.assertFalse(promo.is_currently_active)

    def test_valid_promotion_is_active(self):
        promo = Promotion.objects.create(
            title='Promo courante',
            slug='promo-courante',
            is_active=True,
            starts_at=timezone.now() - datetime.timedelta(days=1),
            ends_at=timezone.now() + datetime.timedelta(days=30),
            source_url='https://hosting.camtel.cm/',
            source_name='CAMTEL Hosting official website',
            last_verified_at=datetime.date(2026, 8, 25),
        )
        self.assertTrue(promo.is_currently_active)

    # --- CTA (#30) ----------------------------------------------------------
    def test_cta_type_by_offer_kind(self):
        fiber = self._official_product(
            slug='landline-fiber-home', offer_type=Product.OfferType.FIBER,
            price=None, pricing_type=Product.PricingType.QUOTE,
        )
        quote_offer = self._official_product(
            slug='carrier-dia', brand=Product.Brand.CARRIER,
            price=None, pricing_type=Product.PricingType.QUOTE,
        )
        subscribable = self._official_product(
            slug='cb-vps-s', subscription_method=Product.SubscriptionMethod.ONLINE,
        )
        self.assertEqual(fiber.cta_type, 'eligibility')
        self.assertEqual(quote_offer.cta_type, 'quote')
        self.assertEqual(subscribable.cta_type, 'subscribe')