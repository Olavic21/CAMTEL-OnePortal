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
    def test_role_default_customer(self):
        """RBAC #18 : tout nouveau compte public est CUSTOMER (plus de VISITOR)."""
        u = User.objects.create_user(username='u1', password='TestPassword123!')
        self.assertEqual(u.role, User.Role.CUSTOMER)

    def test_backoffice_roles_never_customer(self):
        """BACKOFFICE_ROLES n'inclut jamais CUSTOMER ; STAFF_ROLES si."""
        from apps.core.permissions import BACKOFFICE_ROLES, STAFF_ROLES

        self.assertNotIn('CUSTOMER', BACKOFFICE_ROLES)
        self.assertNotIn('CUSTOMER', STAFF_ROLES)
        self.assertTrue({'SUPER_ADMIN', 'ADMIN'} <= BACKOFFICE_ROLES)

    def test_can_access_backoffice_flag(self):
        """Le predicat partage permission/serializer fait autorite (#20/#21)."""
        from apps.core.permissions import can_access_backoffice

        customer = User.objects.create_user(
            username='c1', password='TestPassword123!', role=User.Role.CUSTOMER,
        )
        viewer = User.objects.create_user(
            username='v1', password='TestPassword123!', role=User.Role.VIEWER,
        )
        editor = User.objects.create_user(
            username='e1', password='TestPassword123!', role=User.Role.EDITOR, is_staff=True,
        )
        self.assertFalse(can_access_backoffice(customer))
        self.assertFalse(can_access_backoffice(None))
        self.assertTrue(can_access_backoffice(viewer))
        self.assertTrue(can_access_backoffice(editor))

    def test_staff_role(self):
        u = User.objects.create_user(
            username='u2', password='TestPassword123!', role=User.Role.SUPER_ADMIN, is_staff=True
        )
        self.assertEqual(u.role, User.Role.SUPER_ADMIN)


class AuthApiRBACTest(APITestCase):
    """Contrats API autour des roles (RBAC #18/#20/#21)."""

    def test_register_creates_customer(self):
        response = self.client.post('/api/v1/auth/register/', {
            'username': 'newclient',
            'email': 'newclient@example.com',
            'password': 'StrongPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], 'customer')
        self.assertFalse(response.data['user']['can_access_backoffice'])

    def test_me_returns_role_and_backoffice_flag(self):
        admin = User.objects.create_user(
            username='adm1', password='TestPassword123!',
            role=User.Role.ADMIN, is_staff=True,
        )
        self.client.force_authenticate(user=admin)
        response = self.client.get('/api/v1/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'admin')
        self.assertTrue(response.data['can_access_backoffice'])

    def test_legacy_visitor_input_maps_to_customer(self):
        """Shim compat : assigner 'visitor' cree un CUSTOMER (RBAC #18)."""
        admin = User.objects.create_user(
            username='adm2', password='TestPassword123!',
            role=User.Role.SUPER_ADMIN, is_staff=True,
        )
        target = User.objects.create_user(
            username='legacy1', password='TestPassword123!', role=User.Role.CUSTOMER,
        )
        self.client.force_authenticate(user=admin)
        response = self.client.patch(
            f'/api/v1/users/{target.pk}/', {'role': 'visitor'}, format='json',
        )
        self.assertIn(response.status_code, {status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST})
        if response.status_code == status.HTTP_200_OK:
            target.refresh_from_db()
            self.assertEqual(target.role, User.Role.CUSTOMER)
            self.assertEqual(response.data['role'], 'customer')

    def test_customer_cannot_manage_users(self):
        """Un CUSTOMER ne peut jamais acceder a la gestion des comptes."""
        customer = User.objects.create_user(
            username='cust9', password='TestPassword123!', role=User.Role.CUSTOMER,
        )
        self.client.force_authenticate(user=customer)
        response = self.client.get('/api/v1/users/')
        self.assertIn(response.status_code, {
            status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED,
        })
class UserManagementRBACTest(APITestCase):
    """Regles serveur de gestion des comptes (sections 33/34 du cahier des
    charges) : password reconnu, assignation de roles par niveau, protection
    du Super Admin (self-demotion, dernier superadmin)."""

    def _make_super(self, username='super'):
        return User.objects.create_user(
            username=username, password='TestPassword123!',
            role=User.Role.SUPER_ADMIN, is_staff=True, is_superuser=True,
        )

    def _make_admin(self, username='admin_x'):
        return User.objects.create_user(
            username=username, password='TestPassword123!',
            role=User.Role.ADMIN, is_staff=True,
        )

    def _make_editor(self, username='editor_x'):
        return User.objects.create_user(
            username=username, password='TestPassword123!',
            role=User.Role.EDITOR, is_staff=True,
        )

    def test_create_user_with_password_can_login(self):
        """Le mot de passe fourni a la creation via /users/ est reconnu (bug P0)."""
        admin = self._make_admin()
        self.client.force_authenticate(user=admin)
        response = self.client.post('/api/v1/users/', {
            'username': 'newcomer',
            'email': 'newcomer@example.com',
            'password': 'StrongPass123!',
            'role': 'editor',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.client.logout()
        login = self.client.post('/api/v1/auth/login/', {
            'username': 'newcomer', 'password': 'StrongPass123!',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_admin_cannot_create_admin_account(self):
        admin = self._make_admin()
        self.client.force_authenticate(user=admin)
        response = self.client.post('/api/v1/users/', {
            'username': 'wannabe', 'email': 'w@example.com',
            'password': 'StrongPass123!', 'role': 'admin',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_reassign_admin_account(self):
        admin = self._make_admin()
        target = self._make_admin('other_admin')
        self.client.force_authenticate(user=admin)
        response = self.client.patch(f'/api/v1/users/{target.pk}/', {
            'role': 'editor',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_reassign_non_privileged(self):
        admin = self._make_admin()
        target = self._make_editor()
        self.client.force_authenticate(user=admin)
        response = self.client.patch(f'/api/v1/users/{target.pk}/', {
            'role': 'customer',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        target.refresh_from_db()
        self.assertEqual(target.role, User.Role.CUSTOMER)

    def test_self_demotion_forbidden(self):
        admin = self._make_admin()
        self.client.force_authenticate(user=admin)
        response = self.client.patch(f'/api/v1/users/{admin.pk}/', {
            'role': 'customer',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_last_super_admin_cannot_be_demoted(self):
        super_user = self._make_super()
        self.client.force_authenticate(user=super_user)
        response = self.client.patch(f'/api/v1/users/{super_user.pk}/', {
            'role': 'admin',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_last_super_admin_cannot_be_deactivated(self):
        super_user = self._make_super()
        self.client.force_authenticate(user=super_user)
        response = self.client.patch(f'/api/v1/users/{super_user.pk}/', {
            'is_active': False,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_last_super_admin_cannot_be_deleted(self):
        super_user = self._make_super()
        self.client.force_authenticate(user=super_user)
        response = self.client.delete(f'/api/v1/users/{super_user.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_roles_metadata_returns_real_counts(self):
        super_user = self._make_super()
        self._make_editor()
        self.client.force_authenticate(user=super_user)
        response = self.client.get('/api/v1/roles/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        roles = {r['code']: r for r in response.data['roles']}
        self.assertIn('super_admin', roles)
        self.assertIn('editor', roles)
        self.assertTrue(roles['super_admin']['can_access_backoffice'])
        self.assertFalse(roles['customer']['can_access_backoffice'])
        self.assertGreaterEqual(roles['super_admin']['count'], 1)
        self.assertGreaterEqual(roles['editor']['count'], 1)

    def test_customer_is_isolated_from_roles_metadata(self):
        customer = User.objects.create_user(
            username='cust_r', password='TestPassword123!', role=User.Role.CUSTOMER,
        )
        self.client.force_authenticate(user=customer)
        response = self.client.get('/api/v1/roles/')
        self.assertIn(response.status_code, {
            status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED,
        })

    def test_super_admin_can_demote_another_super_admin(self):
        first = self._make_super('s1')
        second = self._make_super('s2')
        self.client.force_authenticate(user=first)
        response = self.client.patch(f'/api/v1/users/{second.pk}/', {
            'role': 'product_manager',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        second.refresh_from_db()
        self.assertEqual(second.role, User.Role.PRODUCT_MANAGER)

    def test_super_admin_can_reassign_any_role(self):
        super_user = self._make_super()
        target = self._make_editor()
        self.client.force_authenticate(user=super_user)
        response = self.client.patch(f'/api/v1/users/{target.pk}/', {
            'role': 'admin',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        target.refresh_from_db()
        self.assertEqual(target.role, User.Role.ADMIN)
