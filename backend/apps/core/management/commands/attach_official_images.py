"""
Association des assets officiels CAMTEL aux offres OnePortal (#20/#21).

Telecharge UNIQUEMENT les fichiers publies sur les domaines officiels CAMTEL
(hosting.camtel.cm, fiberconnect.camtel.cm...), les stocke localement dans
MEDIA_ROOT/products/ puis cree des ProductImage traces via original_source_url.

Idempotent : une image n'est ajoutee qu'une fois par couple (produit, source).
Aucune image externe (Google, banques d'images) n'est jamais utilisee.

Usage :
    python manage.py attach_official_images [--dry-run]
"""
import os
import tempfile

import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from apps.products.models import Product, ProductImage

# Assets officiels verifies le 2026-08-25 (domaines CAMTEL uniquement).
OFFICIAL_ASSETS = [
    {
        'url': 'https://hosting.camtel.cm/images/camtel-logo.jpg',
        'filename': 'camtel-logo.jpg',
        'alt_fr': 'Logo officiel CAMTEL',
        'alt_en': 'Official CAMTEL logo',
        'target_slugs': ['camtel-data-center', 'carrier-data-center', 'landline-fiber-home'],
    },
    {
        'url': 'https://hosting.camtel.cm/images/servers.jpg',
        'filename': 'official-servers.jpg',
        'alt_fr': 'Serveurs du datacenter CAMTEL (visuel officiel hosting.camtel.cm)',
        'alt_en': 'CAMTEL datacenter servers (official visual from hosting.camtel.cm)',
        'target_slugs': ['cb-bms-s', 'cb-bms-m', 'cb-bms-l',
                         'hosting-addon-vnic', 'hosting-addon-vps-backups',
                         'hosting-addon-data-backups'],
    },
    {
        'url': 'https://hosting.camtel.cm/images/Datacenter-1-fr.jpeg',
        'filename': 'official-datacenter-1.jpeg',
        'alt_fr': 'Datacenter Tier III CAMTEL (visuel officiel hosting.camtel.cm)',
        'alt_en': 'CAMTEL Tier III datacenter (official visual from hosting.camtel.cm)',
        'target_slugs': ['cb-rack-housing-xs', 'cb-rack-housing-s', 'cb-rack-housing-m',
                         'cb-rack-housing-l', 'cb-rack-housing-xl', 'cb-rack-housing-xxl'],
    },
    {
        'url': 'https://fiberconnect.camtel.cm/fiberconnect-logo.png',
        'filename': 'fiberconnect-logo.png',
        'alt_fr': 'Logo officiel Fiber Connect',
        'alt_en': 'Official Fiber Connect logo',
        'target_slugs': ['fiber-connect-service'],
    },
]


class Command(BaseCommand):
    help = 'Telecharge les assets officiels CAMTEL et les associe aux offres (trace, idempotent).'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        created, skipped, failed = 0, [], []
        downloaded = {}

        for asset in OFFICIAL_ASSETS:
            content = downloaded.get(asset['url'])
            if content is None and not dry_run:
                try:
                    response = requests.get(asset['url'], timeout=30,
                                            headers={'User-Agent': 'OnePortal/1.0'})
                    response.raise_for_status()
                    content = response.content
                    downloaded[asset['url']] = content
                except Exception as exc:  # noqa: BLE001 - asset optionnel
                    failed.append(f"{asset['url']} -> {exc.__class__.__name__}")
                    continue
            for slug in asset['target_slugs']:
                product = Product.objects.filter(slug=slug).first()
                if product is None:
                    skipped.append(f"{slug}: offre introuvable")
                    continue
                exists = ProductImage.objects.filter(
                    product=product,
                    original_source_url=asset['url'],
                ).exists()
                if exists or dry_run:
                    skipped.append(f"{slug}: deja associe" if not dry_run else f"{slug}: (dry-run)")
                    continue
                existing_count = product.images.count()
                image = ProductImage(
                    product=product,
                    alt_text=f"{asset['alt_fr']} | {asset['alt_en']}",
                    is_primary=existing_count == 0,
                    order=existing_count + 1,
                    original_source_url=asset['url'],
                )
                filename = os.path.basename(asset['filename'])
                image.image.save(filename, ContentFile(content or b''), save=True)
                created += 1

        self.stdout.write('')
        self.stdout.write(self.style.MIGRATE_HEADING('=== RAPPORT ASSETS OFFICIELS ==='))
        self.stdout.write(f'Images creees      : {created}')
        self.stdout.write(f'Deja en place/ign. : {len(skipped)}')
        self.stdout.write(f'Echecs telechrgt   : {len(failed)}')
        for line in failed:
            self.stdout.write(self.style.WARNING(f'FAILED: {line}'))
        self.stdout.write(self.style.SUCCESS('Termine.'))
