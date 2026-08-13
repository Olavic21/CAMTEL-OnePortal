from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
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
                    ('VIEWER', 'Viewer'),
                ],
                default='VIEWER',
                max_length=50,
            ),
        ),
    ]
