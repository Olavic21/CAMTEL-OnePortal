"""RBAC #18 : CUSTOMER devient le role minimum authentifie.

Ajoute le choix CUSTOMER et convertit les comptes VIEWER (ancien "visiteur
inscrit") en CUSTOMER. Le "visiteur anonyme" n'est pas un utilisateur RBAC.
Reversible : le reverse ne peut pas restituer la difference entre un VIEWER
d'origine et un CUSTOMER converti — il remet les CUSTOMER en VIEWER, ce qui
est sans effet fonctionnel (aucun des deux n'a acces au back-office).
"""
from django.db import migrations, models


def viewer_to_customer(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.filter(role='VIEWER').update(role='CUSTOMER')


def customer_to_viewer(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.filter(role='CUSTOMER').update(role='VIEWER')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('SUPER_ADMIN', 'Super Admin'),
                    ('ADMIN', 'Admin'),
                    ('PRODUCT_MANAGER', 'Product Manager'),
                    ('EDITOR', 'Editor'),
                    ('VIEWER', 'Viewer (deprecated)'),
                    ('CUSTOMER', 'Customer'),
                ],
                default='CUSTOMER',
                max_length=50,
            ),
        ),
        migrations.RunPython(viewer_to_customer, customer_to_viewer),
    ]
