from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        # Back-office (matrice RBAC — docs/RBAC_MATRIX.md).
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
        ADMIN = 'ADMIN', 'Admin'
        PRODUCT_MANAGER = 'PRODUCT_MANAGER', 'Product Manager'
        EDITOR = 'EDITOR', 'Editor'
        # VIEWER : role historique "visiteur inscrit". DEPRECIE — un compte
        # public est desormais CUSTOMER. Maintenu uniquement pour la
        # compatibilite des donnees legacy (migration 0003 convertit les
        # VIEWER existants en CUSTOMER).
        VIEWER = 'VIEWER', 'Viewer (deprecated)'
        # CUSTOMER : role minimum de tout utilisateur authentifie du portail
        # (cahier des charges #18). Le "visiteur anonyme" n'est PAS un
        # utilisateur RBAC : c'est un requete non authentifiee.
        CUSTOMER = 'CUSTOMER', 'Customer'

    role = models.CharField(max_length=50, choices=Role.choices, default=Role.CUSTOMER)
