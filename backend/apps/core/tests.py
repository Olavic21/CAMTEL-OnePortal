from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.categories.models import Category
from apps.core.models import ActivityLog, Notification
from apps.products.models import Product

User = get_user_model()


class CategoryModelTest(TestCase):
    def test_slug_unique(self):
        Category.objects.create(name='Test', slug='test-slug')
        with self.assertRaises(Exception):
            Category.objects.create(name='Test 2', slug='test-slug')


class ProductModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Internet', slug='internet')

    def test_product_str_and_views_count_default(self):
        product = Product.objects.create(
            name='Fibre Pro',
            slug='fibre-pro',
            description='Offre fibre',
            price='99.99',
            category=self.category,
        )
        self.assertEqual(str(product), 'Fibre Pro')
        self.assertEqual(product.views_count, 0)


class ActivityLogModelTest(TestCase):
    def test_create_activity_log(self):
        user = User.objects.create_user(username='admin', password='pass', role=User.Role.ADMIN)
        log = ActivityLog.objects.create(
            user=user,
            action='create',
            target_model='Product',
            target_id=1,
        )
        self.assertIn('admin', str(log))


class NotificationModelTest(TestCase):
    def test_notification_defaults(self):
        notification = Notification.objects.create(message='Test notification')
        self.assertFalse(notification.is_read)
        self.assertEqual(notification.type, 'info')
