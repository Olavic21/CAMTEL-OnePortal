from django.test import TestCase
from rest_framework.test import APIClient

from apps.partners.models import PartnerAPIKey


class PartnerAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.partner_key, self.raw_key = PartnerAPIKey.generate(
            name='Test Partner',
            scopes=[
                PartnerAPIKey.SCOPE_PRODUCTS_READ,
                PartnerAPIKey.SCOPE_CATEGORIES_READ,
            ],
        )

    def test_products_requires_api_key(self):
        response = self.client.get('/api/v1/partner/products/')
        self.assertIn(response.status_code, (401, 403))

    def test_products_with_valid_key(self):
        response = self.client.get(
            '/api/v1/partner/products/',
            HTTP_X_API_KEY=self.raw_key,
        )
        self.assertEqual(response.status_code, 200)

    def test_scope_denied_for_news(self):
        response = self.client.get(
            '/api/v1/partner/news/',
            HTTP_X_API_KEY=self.raw_key,
        )
        self.assertEqual(response.status_code, 403)


from django.test import override_settings
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.news.models import News
from apps.products.models import Product


@override_settings(REST_FRAMEWORK={
    'DEFAULT_AUTHENTICATION_CLASSES': (),
    'DEFAULT_PERMISSION_CLASSES': (),
})
class PartnerV2APITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name='Internet', slug='partner-internet')
        cls.product = Product.objects.create(
            name='Fibre Partenaire',
            slug='fibre-partenaire',
            description='Offre fibre pour partenaires',
            price='100.00',
            category=cls.category,
            is_published=True,
            is_active=True,
        )
        cls.news = News.objects.create(
            title='Nouvelle fibre partenaire',
            title_en='',
            content='CAMTEL lance une offre fibre.',
            slug='news-partenaire',
            is_published=True,
        )

    def _key_headers(self, scopes):
        key, raw = PartnerAPIKey.generate(name='Test partner', scopes=scopes)
        return {'HTTP_X_API_KEY': raw}

    def test_products_requires_api_key(self):
        response = self.client.get('/api/v2/partner/products/')
        self.assertIn(response.status_code, (401, 403))

    def test_products_with_valid_key(self):
        headers = self._key_headers([PartnerAPIKey.SCOPE_PRODUCTS_READ])
        response = self.client.get('/api/v2/partner/products/', **headers)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_news_scope_enforced(self):
        headers = self._key_headers([PartnerAPIKey.SCOPE_PRODUCTS_READ])
        response = self.client.get('/api/v2/partner/news/', **headers)
        self.assertEqual(response.status_code, 403)

    def test_categories_with_scope(self):
        headers = self._key_headers([PartnerAPIKey.SCOPE_CATEGORIES_READ])
        response = self.client.get('/api/v2/partner/categories/', **headers)
        self.assertEqual(response.status_code, 200)

    def test_product_detail_by_slug(self):
        headers = self._key_headers([PartnerAPIKey.SCOPE_PRODUCTS_READ])
        response = self.client.get('/api/v2/partner/products/fibre-partenaire/', **headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Fibre Partenaire')

    def test_cross_search_returns_products_categories_and_news(self):
        headers = self._key_headers([PartnerAPIKey.SCOPE_PRODUCTS_READ])
        response = self.client.get('/api/v2/partner/search/?q=fibre', **headers)
        self.assertEqual(response.status_code, 200)
        self.assertIn('products', response.data)
        self.assertEqual(response.data['query'], 'fibre')
        self.assertGreaterEqual(len(response.data['products']), 1)
