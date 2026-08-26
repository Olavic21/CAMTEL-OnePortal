from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class LogoutRevocationTest(APITestCase):
    """PHASE 1 : le logout doit revoquer le refresh token (blacklist).
    PHASE Securite : le refresh token n'est plus jamais dans le corps JSON ;
    il circule uniquement via un cookie HttpOnly pose par le backend, que le
    test client Django suit automatiquement comme un vrai navigateur."""

    def test_logout_blacklists_refresh(self):
        from django.conf import settings

        User.objects.create_user(
            username='admin', password='TestPassword123!', role=User.Role.ADMIN
        )
        login = self.client.post('/api/v1/auth/login/', {
            'username': 'admin', 'password': 'TestPassword123!',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertNotIn('refresh', login.data)  # jamais dans le corps
        self.assertIn(settings.REFRESH_COOKIE_NAME, login.cookies)
        access = login.data['access']

        # Le refresh fonctionne avant logout (cookie envoye automatiquement)
        ok = self.client.post('/api/v1/auth/refresh/', {}, format='json')
        self.assertEqual(ok.status_code, status.HTTP_200_OK)

        logout = self.client.post('/api/v1/auth/logout/', {}, format='json',
                                  HTTP_AUTHORIZATION=f'Bearer {access}')
        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT)
        # Le cookie est efface (valeur videe) apres logout
        self.assertEqual(logout.cookies[settings.REFRESH_COOKIE_NAME].value, '')

        # Apres logout, le refresh est blackliste -> le refresh echoue.
        denied = self.client.post('/api/v1/auth/refresh/', {}, format='json')
        self.assertEqual(denied.status_code, status.HTTP_400_BAD_REQUEST)
        # NB: l'access token reste valide jusqu'a expiration (courte duree) ;
        # SimpleJWT ne blackliste pas les access tokens.
        me = self.client.get('/api/v1/auth/me/', HTTP_AUTHORIZATION=f'Bearer {access}')
        self.assertEqual(me.status_code, status.HTTP_200_OK)


class UserModelTest(TestCase):
    def test_role_default_viewer(self):
        u = User.objects.create_user(username='u1', password='TestPassword123!')
        self.assertEqual(u.role, User.Role.VIEWER)

    def test_staff_role(self):
        u = User.objects.create_user(
            username='u2', password='TestPassword123!', role=User.Role.SUPER_ADMIN, is_staff=True
        )
        self.assertEqual(u.role, User.Role.SUPER_ADMIN)
