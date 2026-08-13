from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
        ADMIN = 'ADMIN', 'Admin'
        PRODUCT_MANAGER = 'PRODUCT_MANAGER', 'Product Manager'
        EDITOR = 'EDITOR', 'Editor'
        VIEWER = 'VIEWER', 'Viewer'

    role = models.CharField(max_length=50, choices=Role.choices, default=Role.VIEWER)
