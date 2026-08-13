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
