import io

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User


def _valid_png_bytes():
    """Genere un vrai PNG 1x1 avec Pillow (verifie le contenu binaire reel)."""
    from PIL import Image

    buffer = io.BytesIO()
    Image.new('RGB', (1, 1), (255, 0, 0)).save(buffer, format='PNG')
    return buffer.getvalue()


class MediaFilePermissionTest(APITestCase):
    """Acces a la bibliotheque media : lecture/upload reservees au staff,
    suppression reservee a l'Admin. Contenu valide par signature binaire."""

    def setUp(self):
        self.viewer = User.objects.create_user(
            username='viewer', password='TestPassword123!', role=User.Role.VIEWER
        )
        self.editor = User.objects.create_user(
            username='editor', password='TestPassword123!', role=User.Role.EDITOR
        )
        self.admin = User.objects.create_user(
            username='admin-media', password='TestPassword123!', role=User.Role.ADMIN
        )

    def _image_file(self):
        return SimpleUploadedFile('photo.png', _valid_png_bytes(), content_type='image/png')

    def test_anonymous_cannot_list(self):
        response = self.client.get('/api/media/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_cannot_upload(self):
        response = self.client.post('/api/media/', {'file': self._image_file()})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_viewer_cannot_upload(self):
        self.client.force_authenticate(self.viewer)
        response = self.client.post('/api/media/', {'file': self._image_file()})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_editor_can_upload_image_and_list(self):
        self.client.force_authenticate(self.editor)
        response = self.client.post('/api/media/', {'file': self._image_file()})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['file_type'], 'image')
        self.assertEqual(response.data['uploaded_by'], self.editor.pk)

        listing = self.client.get('/api/media/')
        self.assertEqual(listing.status_code, status.HTTP_200_OK)

    def test_fake_image_rejected(self):
        # Un fichier .png qui n'est pas une vraie image doit etre refuse.
        self.client.force_authenticate(self.editor)
        fake = SimpleUploadedFile('faux.png', b'pas une image', content_type='image/png')
        response = self.client.post('/api/media/', {'file': fake})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_editor_cannot_delete(self):
        self.client.force_authenticate(self.editor)
        created = self.client.post('/api/media/', {'file': self._image_file()})
        media_id = created.data['id']
        response = self.client.delete(f'/api/media/{media_id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_delete(self):
        self.client.force_authenticate(self.editor)
        created = self.client.post('/api/media/', {'file': self._image_file()})
        media_id = created.data['id']
        self.client.force_authenticate(self.admin)
        response = self.client.delete(f'/api/media/{media_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)