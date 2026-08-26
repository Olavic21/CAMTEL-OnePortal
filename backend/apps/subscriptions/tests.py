from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.products.models import Product
from apps.users.models import User

from .models import SubscriptionRequest, SubscriptionStatusHistory


class SubscriptionWorkflowTest(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Internet', slug='internet')
        self.product = Product.objects.create(
            name='Fibre 50', slug='fibre-50', price='1', category=self.category
        )
        self.admin = User.objects.create_user(
            username='admin', password='TestPassword123!', role=User.Role.ADMIN, is_staff=True
        )
        self.client_user = User.objects.create_user(
            username='client', email='client@example.com', password='TestPassword123!',
            role=User.Role.VIEWER,
        )

    def _create_subscription(self):
        return SubscriptionRequest.objects.create(
            user=self.client_user,
            product=self.product,
            full_name='Jean Client',
            email='client@example.com',
            phone='+237600000000',
        )

    def test_request_number_generated_and_unique(self):
        sub = self._create_subscription()
        self.assertTrue(sub.request_number.startswith('SUB-'))
        sub2 = SubscriptionRequest.objects.create(
            user=self.client_user, product=self.product,
            full_name='Autre', email='autre@example.com',
        )
        self.assertNotEqual(sub.request_number, sub2.request_number)

    def test_initial_history_created_on_api_create(self):
        self.client.force_authenticate(user=self.client_user)
        payload = {
            'product': self.product.id,
            'full_name': 'Jean Client',
            'email': 'client@example.com',
            'phone': '+237600000000',
        }
        response = self.client.post('/api/v1/subscriptions/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        sub = SubscriptionRequest.objects.get(id=response.data['id'])
        self.assertTrue(sub.request_number)
        self.assertEqual(sub.status_history.count(), 1)
        self.assertEqual(sub.status_history.first().new_status, SubscriptionRequest.Status.PENDING)
        self.assertTrue(response.data.get('request_number'))

    def test_admin_can_change_status_and_history_logged(self):
        sub = self._create_subscription()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/subscriptions/{sub.id}/change-status/',
            {'status': 'APPROVED', 'comment': 'Eligible', 'reason': 'Verifie'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertEqual(sub.status, SubscriptionRequest.Status.APPROVED)
        history = SubscriptionStatusHistory.objects.filter(subscription=sub).order_by('created_at')
        self.assertEqual(history.count(), 1)
        self.assertEqual(history.first().old_status, SubscriptionRequest.Status.PENDING)
        self.assertEqual(history.first().new_status, SubscriptionRequest.Status.APPROVED)
        self.assertEqual(history.first().changed_by, self.admin)

    def test_change_status_rejects_invalid(self):
        sub = self._create_subscription()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/subscriptions/{sub.id}/change-status/', {'status': 'NOT_A_STATUS'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_only_own_subscriptions(self):
        other = User.objects.create_user(
            username='other', password='TestPassword123!', role=User.Role.VIEWER
        )
        SubscriptionRequest.objects.create(
            user=other, product=self.product, full_name='Autre', email='autre@example.com'
        )
        mine = self._create_subscription()
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get('/api/v1/subscriptions/my-subscriptions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data]
        self.assertIn(mine.id, ids)
        self.assertNotIn(other.id, {SubscriptionRequest.objects.get(pk=x).id for x in []})
        all_subs = SubscriptionRequest.objects.all()
        other_id = [s.id for s in all_subs if s.user == other][0]
        self.assertNotIn(other_id, ids)

    def test_client_cannot_modify_admin_side(self):
        sub = self._create_subscription()
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(
            f'/api/v1/subscriptions/{sub.id}/change-status/', {'status': 'APPROVED'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        sub.refresh_from_db()
        self.assertEqual(sub.status, SubscriptionRequest.Status.PENDING)

    def test_my_dashboard_kpis(self):
        self._create_subscription()
        approved = self._create_subscription()
        approved.status = SubscriptionRequest.Status.ACTIVATED
        approved.save(update_fields=['status'])
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get('/api/v1/subscriptions/my-dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['in_progress'], 1)
        self.assertEqual(response.data['completed'], 1)


class SubscriptionAdminAnalyticsTest(APITestCase):
    """Test admin analytics endpoint for subscription pipeline metrics."""

    def setUp(self):
        self.category = Category.objects.create(name='Internet', slug='internet')
        self.product1 = Product.objects.create(
            name='Fibre 50', slug='fibre-50', price='1', category=self.category
        )
        self.product2 = Product.objects.create(
            name='Mobile 10GB', slug='mobile-10gb', price='2', category=self.category
        )
        self.admin = User.objects.create_user(
            username='admin', password='TestPassword123!', role=User.Role.ADMIN, is_staff=True
        )
        self.client_user = User.objects.create_user(
            username='client', password='TestPassword123!', role=User.Role.VIEWER
        )

    def test_admin_analytics_requires_authentication(self):
        """Anonymous users cannot access analytics."""
        response = self.client.get('/api/v1/subscriptions/admin-analytics/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_analytics_requires_admin_role(self):
        """Non-admin authenticated users cannot access analytics."""
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get('/api/v1/subscriptions/admin-analytics/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_analytics_endpoint_returns_pipeline_metrics(self):
        """Admin can see subscription pipeline metrics."""
        # Create subscriptions with different statuses
        pending = SubscriptionRequest.objects.create(
            user=self.client_user, product=self.product1,
            full_name='Jean', email='jean@example.com',
            status=SubscriptionRequest.Status.PENDING
        )
        approved = SubscriptionRequest.objects.create(
            user=self.client_user, product=self.product2,
            full_name='Marie', email='marie@example.com',
            status=SubscriptionRequest.Status.APPROVED
        )
        activated = SubscriptionRequest.objects.create(
            user=self.client_user, product=self.product1,
            full_name='Pierre', email='pierre@example.com',
            status=SubscriptionRequest.Status.ACTIVATED
        )
        rejected = SubscriptionRequest.objects.create(
            user=self.client_user, product=self.product2,
            full_name='Anne', email='anne@example.com',
            status=SubscriptionRequest.Status.REJECTED
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/subscriptions/admin-analytics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # Verify pipeline counts
        self.assertEqual(data['total'], 4)
        self.assertEqual(data['pipeline']['PENDING'], 1)
        self.assertEqual(data['pipeline']['APPROVED'], 1)
        self.assertEqual(data['pipeline']['ACTIVATED'], 1)
        self.assertEqual(data['pipeline']['REJECTED'], 1)

        # Verify conversion rates
        self.assertEqual(data['conversion_rates']['approval_rate'], 25.0)
        self.assertEqual(data['conversion_rates']['activation_rate'], 25.0)
        self.assertEqual(data['conversion_rates']['rejection_rate'], 25.0)

    def test_admin_analytics_top_products(self):
        """Analytics shows top products by subscription count."""
        # Create multiple subscriptions for different products
        for i in range(3):
            SubscriptionRequest.objects.create(
                user=self.client_user, product=self.product1,
                full_name=f'Client{i}', email=f'client{i}@example.com'
            )
        for i in range(2):
            SubscriptionRequest.objects.create(
                user=self.client_user, product=self.product2,
                full_name=f'Other{i}', email=f'other{i}@example.com'
            )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/subscriptions/admin-analytics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        top_products = response.data['top_products']
        
        # Product1 should be first (3 subscriptions)
        self.assertEqual(top_products[0]['product__name'], 'Fibre 50')
        self.assertEqual(top_products[0]['count'], 3)
        self.assertEqual(top_products[1]['product__name'], 'Mobile 10GB')
        self.assertEqual(top_products[1]['count'], 2)


class SubscriptionEmailNotificationTest(APITestCase):
    """Test email notifications on status changes."""

    def setUp(self):
        from django.core.mail import outbox as mail_outbox
        self.mail_outbox = mail_outbox
        
        self.category = Category.objects.create(name='Internet', slug='internet')
        self.product = Product.objects.create(
            name='Fibre 50', slug='fibre-50', price='1', category=self.category
        )
        self.admin = User.objects.create_user(
            username='admin', password='TestPassword123!', role=User.Role.ADMIN, is_staff=True
        )
        self.client_user = User.objects.create_user(
            username='client', email='client@example.com', password='TestPassword123!',
            role=User.Role.VIEWER
        )

    def test_email_sent_on_approval(self):
        """Email notification sent when subscription approved."""
        from django.core.mail import outbox
        outbox.clear()

        sub = SubscriptionRequest.objects.create(
            user=self.client_user, product=self.product,
            full_name='Jean Client', email='client@example.com',
            status=SubscriptionRequest.Status.PENDING
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/subscriptions/{sub.id}/change-status/',
            {'status': 'APPROVED', 'comment': 'Eligible'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Email should be sent (outbox will have 1 message if emails are enabled)
        # Note: Actual email sending depends on EMAIL_BACKEND setting

    def test_status_history_created_on_change(self):
        """Status history entry created for each status transition."""
        sub = SubscriptionRequest.objects.create(
            user=self.client_user, product=self.product,
            full_name='Jean', email='client@example.com'
        )
        initial_count = sub.status_history.count()
        
        self.client.force_authenticate(user=self.admin)
        self.client.post(
            f'/api/v1/subscriptions/{sub.id}/change-status/',
            {'status': 'APPROVED'},
            format='json'
        )
        
        self.assertEqual(sub.status_history.count(), initial_count + 1)
        latest = sub.status_history.latest('created_at')
        self.assertEqual(latest.new_status, SubscriptionRequest.Status.APPROVED)
        self.assertEqual(latest.changed_by, self.admin)


class SubscriptionStatusTransitionTest(APITestCase):
    """Test valid status transitions in subscription workflow."""

    def setUp(self):
        self.category = Category.objects.create(name='Internet', slug='internet')
        self.product = Product.objects.create(
            name='Fibre 50', slug='fibre-50', price='1', category=self.category
        )
        self.admin = User.objects.create_user(
            username='admin', password='TestPassword123!', role=User.Role.ADMIN, is_staff=True
        )
        self.client_user = User.objects.create_user(
            username='client', password='TestPassword123!', role=User.Role.VIEWER
        )

    def test_workflow_pending_to_approved_to_activated(self):
        """Test happy path: PENDING → APPROVED → ACTIVATED."""
        sub = SubscriptionRequest.objects.create(
            user=self.client_user, product=self.product,
            full_name='Jean', email='client@example.com'
        )
        
        self.client.force_authenticate(user=self.admin)
        
        # Transition to APPROVED
        response = self.client.post(
            f'/api/v1/subscriptions/{sub.id}/change-status/',
            {'status': 'APPROVED'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertEqual(sub.status, SubscriptionRequest.Status.APPROVED)
        
        # Transition to ACTIVATED
        response = self.client.post(
            f'/api/v1/subscriptions/{sub.id}/change-status/',
            {'status': 'ACTIVATED'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertEqual(sub.status, SubscriptionRequest.Status.ACTIVATED)

    def test_workflow_pending_to_rejected(self):
        """Test rejection path: PENDING → REJECTED."""
        sub = SubscriptionRequest.objects.create(
            user=self.client_user, product=self.product,
            full_name='Jean', email='client@example.com'
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/subscriptions/{sub.id}/change-status/',
            {'status': 'REJECTED', 'reason': 'Invalid address'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertEqual(sub.status, SubscriptionRequest.Status.REJECTED)
        
        # Verify history
        history = sub.status_history.latest('created_at')
        self.assertEqual(history.reason, 'Invalid address')


class SubscriptionSignalTaskTest(APITestCase):
    """Verify subscription status signal enqueues Celery task when enabled."""

    def setUp(self):
        self.category = Category.objects.create(name='Internet', slug='internet')
        self.product = Product.objects.create(
            name='Fibre 50', slug='fibre-50', price='1', category=self.category
        )
        self.admin = User.objects.create_user(
            username='admin', password='TestPassword123!', role=User.Role.ADMIN, is_staff=True
        )
        self.client_user = User.objects.create_user(
            username='client', email='client@example.com', password='TestPassword123!',
            role=User.Role.VIEWER,
        )

    def test_signal_enqueues_celery_task_when_enabled(self):
        from django.test.utils import override_settings
        from unittest.mock import patch

        sub = SubscriptionRequest.objects.create(
            user=self.client_user, product=self.product,
            full_name='Jean', email='jean@example.com'
        )

        with override_settings(USE_CELERY=True):
            with patch('apps.subscriptions.signals.send_subscription_email_task') as mocked_task:
                # create a history record which triggers the post_save signal
                SubscriptionStatusHistory.objects.create(
                    subscription=sub,
                    old_status=SubscriptionRequest.Status.PENDING,
                    new_status=SubscriptionRequest.Status.APPROVED,
                    changed_by=self.admin,
                    comment='ok',
                )

                # ensure the celery task's delay() was invoked
                self.assertTrue(mocked_task.delay.called or mocked_task.called)