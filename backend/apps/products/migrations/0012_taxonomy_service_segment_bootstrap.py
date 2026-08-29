"""Taxonomie V4 : bootstrap des Services et Segments + mapping des produits.

Cree les 4 verticales officielles (fixes, mobiles, transport, data-center) et
les 4 segments (particulier, professionnel, entreprise, administration), puis:

  1. Assigne Product.service par category_slug (prioritaire) puis par
     fallback offer_type. Les cas ambigus restent sans service et sont
     remontes par `validate_camtel_data` (REQUIRES_BUSINESS_VALIDATION).
  2. Alimente Product.segments (M2M) depuis Product.segment (principal) et,
     a defaut, depuis le segment de la categorie (grand_public -> PARTICULIER).

Reversible : le reverse retire les assignations puis supprime les entites
semees (aucune donnee produit n'est detruite).
"""
from django.db import migrations

SERVICES = [
    {'slug': 'fixes', 'code': 'FIXED', 'name': 'Fixes', 'name_en': 'Fixed',
     'description': "Téléphonie fixe, lignes, fibre et solutions associées.",
     'description_en': 'Fixed telephony, lines, fiber and related solutions.',
     'display_order': 1},
    {'slug': 'mobiles', 'code': 'MOBILE', 'name': 'Mobiles', 'name_en': 'Mobile',
     'description': "Réseau mobile blue, forfaits et services mobiles.",
     'description_en': 'blue mobile network, plans and mobile services.',
     'display_order': 2},
    {'slug': 'transport', 'code': 'TRANSPORT', 'name': 'Transport', 'name_en': 'Transport',
     'description': "Transport de données, liaisons, IP/MPLS et interconnexion (Carrier).",
     'description_en': 'Data transport, links, IP/MPLS and interconnection (Carrier).',
     'display_order': 3},
    {'slug': 'data-center', 'code': 'DATA_CENTER', 'name': 'Data Center', 'name_en': 'Data Center',
     'description': "Hébergement, VPS, Bare Metal, colocation, backup et services cloud.",
     'description_en': 'Hosting, VPS, bare metal, colocation, backup and cloud services.',
     'display_order': 4},
]

SEGMENTS = [
    {'slug': 'particulier', 'code': 'PARTICULIER', 'name': 'Particulier',
     'name_en': 'Individual', 'display_order': 1},
    {'slug': 'professionnel', 'code': 'PROFESSIONNEL', 'name': 'Professionnel',
     'name_en': 'Professional', 'display_order': 2},
    {'slug': 'entreprise', 'code': 'ENTREPRISE', 'name': 'Entreprise',
     'name_en': 'Enterprise', 'display_order': 3},
    {'slug': 'administration', 'code': 'ADMINISTRATION', 'name': 'Administration',
     'name_en': 'Administration', 'display_order': 4},
]

# Mapping category_slug -> service slug (source de verite principale).
CATEGORY_TO_SERVICE = {
    'mobile-blue': 'mobiles',
    'fixed-fiber': 'fixes',
    'transport-carrier': 'transport',
    'data-center-hosting': 'data-center',
    # Categories legacy demo (seed_data) — mapping documente dans
    # docs/BACKEND_TAXONOMY_MIGRATION.md (REQUIRES_BUSINESS_VALIDATION).
    'internet': 'fixes',
    'telecom': 'fixes',
    'cloud': 'data-center',
}

# Fallback par nature d'offre. DATA (liaisons dediees) -> transport ;
# EQUIPMENT/BUSINESS_SOLUTION/OTHER restent non assignes (ambigus).
OFFER_TYPE_TO_SERVICE = {
    'MOBILE': 'mobiles',
    'FIBER': 'fixes',
    'INTERNET': 'fixes',
    'VOICE': 'fixes',
    'CLOUD': 'data-center',
    'HOSTING': 'data-center',
    'VPN': 'data-center',
    'DATA': 'transport',
}

# CharField legacy -> code Segment.
LEGACY_SEGMENT_TO_CODE = {
    'PARTICULIER': 'PARTICULIER',
    'PROFESSIONNEL': 'PROFESSIONNEL',
    'ENTREPRISE': 'ENTREPRISE',
    'ADMINISTRATION': 'ADMINISTRATION',
}

# Category.segment legacy -> code Segment.
CATEGORY_SEGMENT_TO_CODE = {
    'grand_public': 'PARTICULIER',
    'entreprise': 'ENTREPRISE',
}


def seed_and_map(apps, schema_editor):
    Service = apps.get_model('products', 'Service')
    Segment = apps.get_model('products', 'Segment')
    Product = apps.get_model('products', 'Product')

    services = {}
    for data in SERVICES:
        service, _ = Service.objects.get_or_create(slug=data['slug'], defaults=dict(data))
        services[data['slug']] = service

    segments = {}
    for data in SEGMENTS:
        segment, _ = Segment.objects.get_or_create(slug=data['slug'], defaults=dict(data))
        segments[data['code']] = segment

    # --- Assignation service -------------------------------------------------
    for product in Product.objects.all().select_related('category'):
        if product.service_id:
            continue
        service = None
        category_slug = getattr(product.category, 'slug', '') or ''
        if category_slug in CATEGORY_TO_SERVICE:
            service = services[CATEGORY_TO_SERVICE[category_slug]]
        elif product.offer_type in OFFER_TYPE_TO_SERVICE:
            service = services[OFFER_TYPE_TO_SERVICE[product.offer_type]]
        if service is not None:
            product.service = service
            product.save(update_fields=['service'])

    # --- Alimentation segments M2M -------------------------------------------
    for product in Product.objects.all().select_related('category'):
        codes = []
        legacy = LEGACY_SEGMENT_TO_CODE.get(product.segment)
        if legacy:
            codes.append(legacy)
        else:
            category_segment = getattr(product.category, 'segment', '') or ''
            mapped = CATEGORY_SEGMENT_TO_CODE.get(category_segment)
            if mapped:
                codes.append(mapped)
        for code in codes:
            if not product.segments.filter(code=code).exists():
                product.segments.add(segments[code])


def unmap_and_clear(apps, schema_editor):
    Service = apps.get_model('products', 'Service')
    Segment = apps.get_model('products', 'Segment')
    Product = apps.get_model('products', 'Product')

    Product.segments.through.objects.all().delete()
    Product.objects.update(service=None)
    Service.objects.filter(slug__in=[s['slug'] for s in SERVICES]).delete()
    Segment.objects.filter(slug__in=[s['slug'] for s in SEGMENTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0011_segment_sourceverificationlog_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_and_map, unmap_and_clear),
    ]
