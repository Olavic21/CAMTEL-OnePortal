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
