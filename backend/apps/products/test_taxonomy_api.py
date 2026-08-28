"""Tests API catalogue taxonomie (LOT 4) : services, segments, filtre, search."""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.products.models import Product, Segment, Service


class TaxonomyApiTest(APITestCase):
    def setUp(self):
        # Referentiels (get_or_create : deja semes par la migration 0012).
        self.svc = Service.objects.get_or_create(
            slug='data-center', defaults={'code': 'DATA_CENTER', 'name': 'Data Center'},
        )[0]
        self.svc_mobile = Service.objects.get_or_create(
            slug='mobiles', defaults={'code': 'MOBILE', 'name': 'Mobiles'},
        )[0]
        self.seg_ent = Segment.objects.get_or_create(
            slug='entreprise', defaults={'code': 'ENTREPRISE', 'name': 'Entreprise'},
        )[0]
        self.seg_part = Segment.objects.get_or_create(
            slug='particulier', defaults={'code': 'PARTICULIER', 'name': 'Particulier'},
        )[0]
        self.dc_cat = Category.objects.get_or_create(
            slug='data-center-hosting', defaults={'name': 'Data Center / Hosting'},
        )[0]
        self.mobile_cat = Category.objects.get_or_create(
            slug='mobile-blue', defaults={'name': 'Mobile / Blue'},
        )[0]

    def _product(self, slug, name, service, category, segment='ENTREPRISE'):
        p = Product.objects.create(
            name=name, slug=slug, description='desc', price='100',
            category=category, service=service, segment=segment,
            is_published=True, is_active=True, data_origin=Product.DataOrigin.DEMO,
        )
        p.segments.add(Segment.objects.get(code=segment))
        return p

    def test_services_list_endpoint(self):
        self._product('cb-vps-m', 'CB VPS M', self.svc, self.dc_cat)
        response = self.client.get('/api/v1/services/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = {r['slug'] for r in response.data['results']}
        self.assertIn('data-center', slugs)
        self.assertIn('fixes', slugs)  # seme par la migration

    def test_service_detail_by_slug(self):
        response = self.client.get('/api/v1/services/data-center/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'DATA_CENTER')

    def test_segments_list_endpoint(self):
        response = self.client.get('/api/v1/segments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = {r['slug'] for r in response.data['results']}
        self.assertLessEqual(
            {'particulier', 'professionnel', 'entreprise', 'administration'}, slugs,
        )

    def test_products_filter_by_service(self):
        self._product('cb-vps-m', 'CB VPS M', self.svc, self.dc_cat)
        self._product('forfait-blue', 'Forfait Blue', self.svc_mobile, self.mobile_cat, 'PARTICULIER')
        response = self.client.get('/api/v1/products/', {'service': 'data-center'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = {r['slug'] for r in response.data['results']}
        self.assertIn('cb-vps-m', slugs)
        self.assertNotIn('forfait-blue', slugs)

    def test_products_filter_by_segment_code(self):
        self._product('cb-vps-m', 'CB VPS M', self.svc, self.dc_cat, 'ENTREPRISE')
        self._product('forfait-blue', 'Forfait Blue', self.svc_mobile, self.mobile_cat, 'PARTICULIER')
        response = self.client.get('/api/v1/products/', {'segment': 'ENTREPRISE'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = {r['slug'] for r in response.data['results']}
        self.assertIn('cb-vps-m', slugs)
        self.assertNotIn('forfait-blue', slugs)

    def test_product_serializer_exposes_service_and_segments_and_sources(self):
        self._product('cb-vps-m', 'CB VPS M', self.svc, self.dc_cat)
        response = self.client.get('/api/v1/products/cb-vps-m/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['service']['slug'], 'data-center')
        seg_codes = {s['code'] for s in response.data['segments']}
        self.assertIn('ENTREPRISE', seg_codes)
        self.assertIn('sources', response.data)  # champ additionnel, non cassant

    def test_create_product_with_segments_codes(self):
        from apps.users.models import User

        editor = User.objects.create_user(
            username='editor4', password='TestPassword123!', role=User.Role.EDITOR,
        )
        self.client.force_authenticate(user=editor)
        response = self.client.post('/api/v1/products/', {
            'name': 'VPS Pro', 'slug': 'vps-pro', 'description': 'd',
            'price': '150', 'category_id': self.dc_cat.id,
            'segments_codes': ['ENTREPRISE', 'ADMINISTRATION'],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        p = Product.objects.get(slug='vps-pro')
        codes = set(p.segments.values_list('code', flat=True))
        self.assertEqual(codes, {'ENTREPRISE', 'ADMINISTRATION'})


class GlobalSearchApiTest(APITestCase):
    def setUp(self):
        self.svc = Service.objects.get_or_create(
            slug='data-center', defaults={'code': 'DATA_CENTER', 'name': 'Data Center'},
        )[0]
        self.dc_cat = Category.objects.get_or_create(
            slug='data-center-hosting', defaults={'name': 'Data Center / Hosting'},
        )[0]
        self.product = Product.objects.create(
            name='CB VPS M', slug='cb-vps-m', description='Serveur virtuel 8 Go RAM',
            price='18000', category=self.dc_cat, service=self.svc,
            segment='ENTREPRISE', is_published=True, is_active=True,
            data_origin=Product.DataOrigin.DEMO,
        )
        self.product.segments.add(Segment.objects.get(code='ENTREPRISE'))

    def test_global_search_returns_service_and_product(self):
        response = self.client.get('/api/v1/search/', {'q': 'vps'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        types = {r['type'] for r in response.data['results']}
        self.assertIn('product', types)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_global_search_empty_query_returns_catalog(self):
        response = self.client.get('/api/v1/search/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product_results = [r for r in response.data['results'] if r['type'] == 'product']
        self.assertTrue(any(r['slug'] == 'cb-vps-m' for r in product_results))

    def test_global_search_pagination(self):
        for i in range(25):
            Product.objects.create(
                name=f'VPS {i}', slug=f'vps-{i}', description='Serveur virtuel',
                price='100', category=self.dc_cat, service=self.svc,
                segment='ENTREPRISE', is_published=True, is_active=True,
                data_origin=Product.DataOrigin.DEMO,
            )
        response = self.client.get('/api/v1/search/', {'q': 'vps'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data['results']), response.data['page_size'])
        self.assertIsNotNone(response.data['next'])