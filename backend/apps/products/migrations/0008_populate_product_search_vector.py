from django.db import migrations


def populate_search_vector(apps, schema_editor):
    """Peuplement le tsvector existant (idempotent). No-op sous SQLite (tests)."""
    if schema_editor.connection.vendor != 'postgresql':
        return
    from django.contrib.postgres.search import SearchVector

    Product = apps.get_model('products', 'Product')
    Product.objects.update(
        search_vector=SearchVector('name', 'description', 'short_description', 'terms')
    )


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0007_product_search_vector_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_search_vector, migrations.RunPython.noop),
    ]
