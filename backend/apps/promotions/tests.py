from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

from .models import Promotion


class PromotionPermissionTest(APITestCase):
    """PHASE Securite : tests de permission exhaustifs. Cette app n'avait
    auparavant AUCUN test."""

    def setUp(self):
        self.promo = Promotion.objects.create(title='Rentree', slug='rentree', discount_percent=10)
        self.viewer = User.objects.create_user(username='viewer-promo', password='TestPassword123!', role=User.Role.VIEWER)
        self.editor = User.objects.create_user(username='editor-promo', password='TestPassword123!', role=User.Role.EDITOR)
        self.admin = User.objects.create_user(username='admin-promo', password='TestPassword123!', role=User.Role.ADMIN)

    def test_anonymous_can_list_and_read(self):
        response = self.client.get('/api/v1/promotions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        detail = self.client.get(f'/api/v1/promotions/{self.promo.pk}/')
        self.assertEqual(detail.status_code, status.HTTP_200_OK)

    def test_anonymous_can_list_active(self):
        response = self.client.get('/api/v1/promotions/active/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_anonymous_cannot_create(self):
        response = self.client.post('/api/v1/promotions/', {'title': 'X', 'slug': 'x', 'discount_percent': 5})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_viewer_cannot_create(self):
        self.client.force_authenticate(self.viewer)
        response = self.client.post('/api/v1/promotions/', {'title': 'X', 'slug': 'x', 'discount_percent': 5})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_editor_can_create(self):
        self.client.force_authenticate(self.editor)
        response = self.client.post('/api/v1/promotions/', {'title': 'X', 'slug': 'x', 'discount_percent': 5})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_can_delete(self):
        self.client.force_authenticate(self.admin)
        response = self.client.delete(f'/api/v1/promotions/{self.promo.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
