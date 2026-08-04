from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.categories.models import Category
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
        response = self.client.get('/api/categories/')
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
        response = self.client.post('/api/products/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(Product.objects.first().name, 'Routeur Pro')
