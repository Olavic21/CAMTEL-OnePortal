from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

from .models import ContactMessage


class ContactMessagePermissionTest(APITestCase):
    """PHASE Securite : tests de permission exhaustifs. Cette app n'avait
    auparavant AUCUN test. Particularite : la creation est publique (formulaire
    de contact), mais la consultation/gestion est reservee au staff — un
    visiteur ne doit jamais pouvoir lire les messages des autres."""

    def setUp(self):
        self.message = ContactMessage.objects.create(
            full_name='Jean Client', email='jean@example.cm', subject='Question', message='Bonjour...'
        )
        self.viewer = User.objects.create_user(username='viewer-contact', password='TestPassword123!', role=User.Role.VIEWER)
        self.editor = User.objects.create_user(username='editor-contact', password='TestPassword123!', role=User.Role.EDITOR)

    def test_anonymous_can_submit_contact_form(self):
        payload = {
            'full_name': 'Marie Visiteuse', 'email': 'marie@example.cm',
            'subject': 'Info', 'message': 'Details ?',
        }
        response = self.client.post('/api/v1/contact/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_anonymous_cannot_list_messages(self):
        response = self.client.get('/api/v1/contact/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_viewer_cannot_list_messages(self):
        # VIEWER n'est pas dans STAFF_ROLES pour IsAdminOrEditor.
        self.client.force_authenticate(self.viewer)
        response = self.client.get('/api/v1/contact/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_editor_can_list_and_markread(self):
        self.client.force_authenticate(self.editor)
        response = self.client.get('/api/v1/contact/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        marked = self.client.post(f'/api/v1/contact/{self.message.pk}/markread/')
        self.assertEqual(marked.status_code, status.HTTP_200_OK)
        self.message.refresh_from_db()
        self.assertTrue(self.message.is_read)

    def test_anonymous_cannot_markread(self):
        response = self.client.post(f'/api/v1/contact/{self.message.pk}/markread/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
