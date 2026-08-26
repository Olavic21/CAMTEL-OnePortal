from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

from .models import Category


class CategoryPermissionTest(APITestCase):
    """PHASE Securite : tests de permission exhaustifs (lecture publique,
    ecriture reservee au staff — voir apps.core.permissions.ReadPublicWriteAdminOrEditor).
    Cette app n'avait auparavant AUCUN test."""

    def setUp(self):
        self.category = Category.objects.create(name='Internet', slug='internet')
        self.viewer = User.objects.create_user(username='viewer', password='TestPassword123!', role=User.Role.VIEWER)
        self.editor = User.objects.create_user(username='editor', password='TestPassword123!', role=User.Role.EDITOR)
        self.admin = User.objects.create_user(username='admin-cat', password='TestPassword123!', role=User.Role.ADMIN)

    def test_anonymous_can_list_and_read(self):
        response = self.client.get('/api/v1/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        detail = self.client.get(f'/api/v1/categories/{self.category.slug}/')
        self.assertEqual(detail.status_code, status.HTTP_200_OK)

    def test_anonymous_cannot_create(self):
        response = self.client.post('/api/v1/categories/', {'name': 'Mobile', 'slug': 'mobile'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_viewer_cannot_create(self):
        self.client.force_authenticate(self.viewer)
        response = self.client.post('/api/v1/categories/', {'name': 'Mobile', 'slug': 'mobile'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_editor_can_create(self):
        self.client.force_authenticate(self.editor)
        response = self.client.post('/api/v1/categories/', {'name': 'Mobile', 'slug': 'mobile'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_can_delete(self):
        self.client.force_authenticate(self.admin)
        response = self.client.delete(f'/api/v1/categories/{self.category.slug}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_viewer_cannot_delete(self):
        self.client.force_authenticate(self.viewer)
        response = self.client.delete(f'/api/v1/categories/{self.category.slug}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Category.objects.filter(pk=self.category.pk).exists())
