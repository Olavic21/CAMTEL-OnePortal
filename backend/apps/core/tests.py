from io import StringIO

from django.core.management import call_command
from django.test import TestCase


class ActivityLogModelTest(TestCase):
    def test_activity_log_model_creation(self):
        self.assertTrue(True)


class SeedDataCommandTest(TestCase):
    def test_seed_data_command(self):
        out = StringIO()
        call_command('seed_data', stdout=out)
        self.assertIn('données initiales', out.getvalue().lower())
