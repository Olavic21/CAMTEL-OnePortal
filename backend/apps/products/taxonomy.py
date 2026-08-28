"""Taxonomie officielle OnePortal (source unique de verite).

Utilise par import_camtel_catalog, seed_camtel_data, validate_camtel_data et
les migrations de donnees. La migration products.0012 embarque sa propre copie
(les migrations doivent etre auto-suffisantes) — les deux listes doivent
rester synchrones.
"""
from apps.products.models import Product, Segment, Service

# Ordre d'affichage officiel des verticales.
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

CATEGORY_TO_SERVICE = {
    'mobile-blue': 'mobiles',
    'fixed-fiber': 'fixes',
    'transport-carrier': 'transport',
    'data-center-hosting': 'data-center',
    # Categories legacy demo — REQUIRES_BUSINESS_VALIDATION (voir docs).
    'internet': 'fixes',
    'telecom': 'fixes',
    'cloud': 'data-center',
}

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

LEGACY_SEGMENT_TO_CODE = {
    'PARTICULIER': 'PARTICULIER',
    'PROFESSIONNEL': 'PROFESSIONNEL',
    'ENTREPRISE': 'ENTREPRISE',
    'ADMINISTRATION': 'ADMINISTRATION',
}

CATEGORY_SEGMENT_TO_CODE = {
    'grand_public': 'PARTICULIER',
    'entreprise': 'ENTREPRISE',
}


def ensure_services_and_segments():
    """Seed idempotent des services et segments officiels."""
    for data in SERVICES:
        Service.objects.update_or_create(slug=data['slug'], defaults=dict(data))
    for data in SEGMENTS:
        Segment.objects.update_or_create(slug=data['slug'], defaults=dict(data))


def resolve_service_slug(category_slug='', offer_type=''):
    """Retourne le slug de service pour un produit, ou None si ambigu."""
    if category_slug and category_slug in CATEGORY_TO_SERVICE:
        return CATEGORY_TO_SERVICE[category_slug]
    return OFFER_TYPE_TO_SERVICE.get((offer_type or '').upper())


def apply_service_and_segments(product):
    """Assigne service + segments M2M d'un produit d'apres sa categorie et
    son offer_type. Ne devine jamais pour un cas ambigu (retourne False)."""
    category = product.category
    category_slug = getattr(category, 'slug', '') or ''
    service_slug = resolve_service_slug(category_slug, product.offer_type)
    service = None
    if service_slug:
        service = Service.objects.filter(slug=service_slug).first()
        if service is not None and product.service_id != service.pk:
            product.service = service
            if product.pk:
                product.save(update_fields=['service', 'updated_at'])

    codes = []
    legacy = LEGACY_SEGMENT_TO_CODE.get(product.segment)
    if legacy:
        codes.append(legacy)
    else:
        mapped = CATEGORY_SEGMENT_TO_CODE.get(getattr(category, 'segment', '') or '')
        if mapped:
            codes.append(mapped)
    if codes:
        product.sync_segments(codes)
    return service is not None
