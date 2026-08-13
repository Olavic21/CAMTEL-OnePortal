from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.core.models import ActivityLog
from apps.products.models import Product
from apps.users.models import User


class ProductAPITest(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Télécom', slug='telecom')
        self.user = User.objects.create_user(
            username='editor',
            email='editor@example.com',
            password='TestPassword123!',
            role=User.Role.EDITOR,
        )
        self.client.force_authenticate(user=self.user)

    def test_category_list_endpoint(self):
        response = self.client.get('/api/v1/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_product_create_endpoint(self):
        payload = {
            'name': 'Routeur Pro',
            'slug': 'routeur-pro',
            'description': 'Routeur fiable pour les sites distants',
            'price': '245.50',
            'category': self.category.id,
            'stock': 10,
            'is_active': True,
        }
        response = self.client.post('/api/v1/products/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(Product.objects.first().name, 'Routeur Pro')
        self.assertTrue(ActivityLog.objects.filter(target_model='Product', action='create').exists())

    def test_product_detail_by_slug(self):
        Product.objects.create(
            name='Routeur Pro',
            slug='routeur-pro',
            description='Desc',
            price='100.00',
            category=self.category,
        )
        response = self.client.get('/api/v1/products/routeur-pro/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'routeur-pro')

    def test_editor_cannot_publish_product(self):
        # PBAC serveur : la publication est reservee aux Admin / Super Admin.
        # NB: le modele definit is_published avec default=True ; on cree donc
        # explicitement un brouillon pour verifier que le 403 ne le modifie pas.
        Product.objects.create(
            name='Routeur Pro',
            slug='routeur-pro',
            description='Desc',
            price='100.00',
            category=self.category,
            is_published=False,
        )
        response = self.client.post('/api/v1/products/routeur-pro/publish/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Product.objects.get(slug='routeur-pro').is_published)

    def test_editor_cannot_delete_product(self):
        Product.objects.create(
            name='Routeur Pro',
            slug='routeur-pro',
            description='Desc',
            price='100.00',
            category=self.category,
        )
        response = self.client.delete('/api/v1/products/routeur-pro/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Product.objects.count(), 1)

    def test_admin_can_publish_product(self):
        admin = User.objects.create_user(
            username='admin',
            password='TestPassword123!',
            role=User.Role.ADMIN,
        )
        self.client.force_authenticate(user=admin)
        Product.objects.create(
            name='Routeur Pro',
            slug='routeur-pro',
            description='Desc',
            price='100.00',
            category=self.category,
        )
        response = self.client.post('/api/v1/products/routeur-pro/publish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Product.objects.get(slug='routeur-pro').is_published)

    def _make_categories(self):
        entre = Category.objects.create(name='Entreprise', slug='entreprise', segment=Category.Segment.ENTREPRISE)
        pub = Category.objects.create(name='Internet', slug='internet', segment=Category.Segment.GRAND_PUBLIC)
        return entre, pub

    def test_search_catalogue_via_search_param(self):
        Product.objects.create(
            name='Abonnement Fibre Premium',
            slug='fibre-premium',
            description='Fibre optique',
            price='100.00',
            category=self.category,
        )
        response = self.client.get('/api/v1/products/', {'search': 'fibre premium'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [p['slug'] for p in response.data['results']]
        self.assertIn('fibre-premium', slugs)

    def test_filter_catalogue_by_category_slug(self):
        Product.objects.create(
            name='Routeur Pro',
            slug='routeur-pro',
            description='Desc',
            price='100.00',
            category=self.category,
        )
        other = Category.objects.create(name='Autre', slug='autre')
        Product.objects.create(
            name='Autre Produit',
            slug='autre-produit',
            description='Desc',
            price='50.00',
            category=other,
        )
        response = self.client.get('/api/v1/products/', {'category': self.category.slug})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [p['slug'] for p in response.data['results']]
        self.assertIn('routeur-pro', slugs)
        self.assertNotIn('autre-produit', slugs)

    def test_filter_catalogue_by_segment(self):
        entre, pub = self._make_categories()
        Product.objects.create(name='Pro Entreprise', slug='pro-ent', price='100.00', category=entre)
        Product.objects.create(name='Offre Internet', slug='offre-internet', price='100.00', category=pub)
        response = self.client.get('/api/v1/products/', {'segment': 'entreprise'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [p['slug'] for p in response.data['results']]
        self.assertIn('pro-ent', slugs)
        self.assertNotIn('offre-internet', slugs)

    def test_order_catalogue_by_price(self):
        Product.objects.create(name='Cher', slug='cher', price='300.00', category=self.category)
        Product.objects.create(name='Pas Cher', slug='pas-cher', price='50.00', category=self.category)
        response = self.client.get('/api/v1/products/', {'ordering': 'price'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [p['slug'] for p in response.data['results']]
        self.assertEqual(slugs[0], 'pas-cher')
        self.assertEqual(slugs[1], 'cher')


class AuthAPITest(APITestCase):
    def test_login_and_me(self):
        User.objects.create_user(
            username='admin',
            password='TestPassword123!',
            role=User.Role.ADMIN,
        )
        login = self.client.post('/api/v1/auth/login/', {
            'username': 'admin',
            'password': 'TestPassword123!',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        token = login.data['access']
        me = self.client.get('/api/v1/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data['username'], 'admin')
