from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

from .models import News


class NewsPermissionTest(APITestCase):
    """PHASE Securite : tests de permission exhaustifs. Cette app n'avait
    auparavant AUCUN test."""

    def setUp(self):
        self.article = News.objects.create(title='Lancement fibre', slug='lancement-fibre', content='...')
        self.viewer = User.objects.create_user(username='viewer-news', password='TestPassword123!', role=User.Role.VIEWER)
        self.editor = User.objects.create_user(username='editor-news', password='TestPassword123!', role=User.Role.EDITOR)
        self.admin = User.objects.create_user(username='admin-news', password='TestPassword123!', role=User.Role.ADMIN)

    def test_anonymous_can_list_and_read(self):
        response = self.client.get('/api/v1/news/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        detail = self.client.get(f'/api/v1/news/{self.article.slug}/')
        self.assertEqual(detail.status_code, status.HTTP_200_OK)

    def test_anonymous_cannot_create(self):
        response = self.client.post('/api/v1/news/', {'title': 'X', 'slug': 'x', 'content': '...'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_viewer_cannot_update(self):
        self.client.force_authenticate(self.viewer)
        response = self.client.patch(f'/api/v1/news/{self.article.slug}/', {'title': 'Modifie'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_editor_can_update(self):
        self.client.force_authenticate(self.editor)
        response = self.client.patch(f'/api/v1/news/{self.article.slug}/', {'title': 'Modifie'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_delete(self):
        self.client.force_authenticate(self.admin)
        response = self.client.delete(f'/api/v1/news/{self.article.slug}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_viewer_cannot_delete(self):
        self.client.force_authenticate(self.viewer)
        response = self.client.delete(f'/api/v1/news/{self.article.slug}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(News.objects.filter(pk=self.article.pk).exists())
