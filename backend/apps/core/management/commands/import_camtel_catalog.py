"""
Import du catalogue commercial officiel CAMTEL dans OnePortal.

Source de verite : snapshots JSON versionnes sous data/camtel_catalog/<date>/
(offres.json, services.json, promotions.json, sources.json), construits
depuis les sites officiels CAMTEL uniquement.

Pipeline : fetch (lecture snapshot) -> validate -> normalize -> upsert -> report.
Idempotent : relancer la commande ne cree pas de doublons (upsert par slug).

Usage :
    python manage.py import_camtel_catalog
    python manage.py import_camtel_catalog --dir data/camtel_catalog/2026-08-25
    python manage.py import_camtel_catalog --snapshot 2026-08-25 --verbose
    python manage.py import_camtel_catalog --dry-run
    python manage.py import_camtel_catalog --dry-run --strict
    python manage.py import_camtel_catalog --source "hosting.camtel.cm" --update
"""
import datetime
import json
import os
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from apps.categories.models import Category
from apps.products.models import Product, ProductFAQ
from apps.promotions.models import Promotion

# Familles officielles CAMTEL (mission #8).
OFFICIAL_CATEGORIES = [
    {
        'slug': 'mobile-blue',
        'name': 'Mobile / Blue',
        'name_en': 'Mobile / Blue',
        'segment': Category.Segment.GRAND_PUBLIC,
        'description': 'Reseau mobile blue et services associes.',
        'description_en': 'blue mobile network and related services.',
    },
    {
        'slug': 'fixed-fiber',
        'name': 'Fixe / Fibre',
        'name_en': 'Fixed / Fiber',
        'segment': Category.Segment.GRAND_PUBLIC,
        'description': 'Internet fixe et fibre optique (Landline, Fiber Connect).',
        'description_en': 'Fixed and fiber optic internet (Landline, Fiber Connect).',
    },
    {
        'slug': 'transport-carrier',
        'name': 'Transport / Carrier',
        'name_en': 'Transport / Carrier',
        'segment': Category.Segment.ENTREPRISE,
        'description': 'Services wholesale et connectivite CAMTEL Carrier.',
        'description_en': 'Wholesale and connectivity services by CAMTEL Carrier.',
    },
]
OFFICIAL_CATEGORIES.append({
    'slug': 'data-center-hosting',
    'name': 'Data Center / Hosting',
    'name_en': 'Data Center / Hosting',
    'segment': Category.Segment.ENTREPRISE,
    'description': 'Hebergement, VPS, Bare Metal, colocation et domaines.',
    'description_en': 'Hosting, VPS, bare metal, colocation and domains.',
})

REQUIRED_FIELDS = ('slug', 'name', 'brand', 'category_slug')
KNOWN_BRANDS = {choice[0] for choice in Product.Brand.choices}


class Command(BaseCommand):
    help = 'Importe le catalogue commercial officiel CAMTEL (idempotent, tracable).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dir', default=None,
            help='Repertoire snapshot (defaut: dernier dossier date de data/camtel_catalog).'
        )
        parser.add_argument(
            '--snapshot', default=None,
            help='Alias de --dir : date YYYY-MM-DD ou chemin du snapshot.'
        )
        parser.add_argument('--dry-run', action='store_true', help='Valide sans ecrire en base.')
        parser.add_argument(
            '--strict', action='store_true',
            help='Echoue (exit code 1) si le moindre WARNING/skip est emis.'
        )
        parser.add_argument(
            '--source', default=None,
            help="Filtre les entrees sur une source (nom ou URL contient la valeur)."
        )
        parser.add_argument(
            '--update', action='store_true',
            help='Met a jour uniquement les produits deja presents (aucune creation).'
        )
        parser.add_argument(
            '--verbose', action='store_true',
            help='Liste chaque offre creee/mise a jour.'
        )

    # ------------------------------------------------------------------ utils
    def _snapshot_dir(self, explicit=None):
        from django.conf import settings as dj_settings

        base_dir = getattr(dj_settings, 'BASE_DIR', None)
        candidates = [os.path.join(os.getcwd(), 'data', 'camtel_catalog')]
        if base_dir is not None:
            base_dir = str(base_dir)
            candidates.append(os.path.join(base_dir, '..', 'data', 'camtel_catalog'))
            candidates.append(os.path.join(base_dir, 'data', 'camtel_catalog'))
        base = next((c for c in candidates if os.path.isdir(c)), None)
        if base is None:
            raise CommandError(
                f'Repertoire snapshots introuvable (essaie: {", ".join(candidates)})'
            )
        if explicit:
            path = explicit if os.path.isabs(explicit) else os.path.join(base, explicit)
            if not os.path.isdir(path):
                raise CommandError(f'Snapshot introuvable: {path}')
            return path
        dated = sorted(d for d in os.listdir(base) if d[:2].isdigit())
        if not dated:
            raise CommandError('Aucun snapshot date trouve sous data/camtel_catalog/.')
        return os.path.join(base, dated[-1])

    def _load(self, directory, filename):
        path = os.path.join(directory, filename)
        if not os.path.isfile(path):
            return []
        with open(path, encoding='utf-8') as fh:
            data = json.load(fh)
        if isinstance(data, dict):
            for key in ('offers', 'services', 'promotions'):
                if key in data:
                    return data[key]
            return []
        return data

    # ------------------------------------------------------------------ validate
    def _validate(self, entry, kind):
        """Validation stricte avant insertion (#25) — jamais de correction inventee."""
        warnings = []
        for field in REQUIRED_FIELDS:
            if not entry.get(field):
                return None, [f'{kind}: champ requis manquant "{field}"']
        brand = entry.get('brand') or 'CAMTEL'
        if brand not in KNOWN_BRANDS:
            return None, [f'{entry["slug"]}: marque inconnue "{brand}"']
        
        # Règle PHASE 6 : data_origin=OFFICIAL exige source_url, source_name
        data_origin = entry.get('data_origin', 'OFFICIAL')
        if data_origin == 'OFFICIAL':
            source_url = entry.get('source_url') or ''
            source_name = entry.get('source_name') or ''
            if not source_url:
                return None, [f'{entry["slug"]}: data_origin=OFFICIAL exige source_url']
            if not source_name:
                return None, [f'{entry["slug"]}: data_origin=OFFICIAL exige source_name']
            if not source_url.startswith(('http://', 'https://')):
                return None, [f'{entry["slug"]}: source_url invalide pour OFFICIAL (doit commencer par http:// ou https://)']
        
        price = entry.get('price')
        if price is not None:
            try:
                price = Decimal(str(price))
                if price < 0:
                    warnings.append(f'{entry["slug"]}: prix negatif refuse -> null')
                    price = None
            except InvalidOperation:
                warnings.append(f'{entry["slug"]}: prix invalide "{price}" -> null')
                price = None
        pricing_type = entry.get('pricing_type') or (
            'FIXED' if price is not None else 'QUOTE'
        )
        if pricing_type == 'FIXED' and price is None:
            warnings.append(
                f'{entry["slug"]}: pricing_type=FIXED sans prix -> bascule QUOTE (Prix sur demande)'
            )
            pricing_type = 'QUOTE'
        source_url = entry.get('source_url') or ''
        if source_url and not source_url.startswith(('http://', 'https://')):
            warnings.append(f'{entry["slug"]}: URL source invalide -> vide')
            source_url = ''
        if not source_url and data_origin != 'OFFICIAL':
            warnings.append(f'{entry["slug"]}: ATTENTION aucune source officielle renseignee')
        slug = slugify(entry['slug'])
        if not slug:
            return None, [f'{kind}: slug invalide pour "{entry.get("name")}"']
        normalized = {
            'slug': slug,
            'name': entry['name'],
            'name_en': entry.get('name_en', ''),
            'brand': brand,
            'category_slug': entry['category_slug'],
            'subcategory': entry.get('subcategory', ''),
            'service_type': entry.get('service_type', 'OFFER'),
            'offer_type': entry.get('offer_type', 'OTHER'),
            'segment': entry.get('segment', 'PARTICULIER'),
            'status': entry.get('status', Product.Status.VALID),
            'pricing_type': pricing_type,
            'price': price,
            'yearly_price': (
                Decimal(str(entry['yearly_price']))
                if entry.get('yearly_price') is not None else None
            ),
            'currency': entry.get('currency') or 'XAF',
            'billing_period': entry.get('billing_period', Product.BillingPeriod.MONTHLY),
            'technology': entry.get('technology', Product.Technology.OTHER),
            'availability': entry.get('availability', Product.Availability.ALL),
            'speed': entry.get('speed', ''),
            'coverage': entry.get('coverage_fr') or entry.get('coverage', ''),
            'subscription_method': entry.get('subscription_method', ''),
            'terms': entry.get('terms_fr') or entry.get('terms', ''),
            'description': entry.get('description_fr') or entry.get('description', ''),
            'description_en': entry.get('description_en', ''),
            'features': entry.get('features_addons') or entry.get('features') or [],
            'specs': entry.get('specs') or {},
            'source_url': source_url,
            'source_name': entry.get('source_name', ''),
            'eligibility_note': entry.get('features_note_fr', ''),
            'data_origin': data_origin,
        }
        return normalized, warnings

    # ------------------------------------------------------------------ import
    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        strict = options.get('strict', False)
        source_filter = (options.get('source') or '').strip()
        update_only = options.get('update', False)
        verbose = options.get('verbose', False)
        # --snapshot est un alias de --dir (date YYYY-MM-DD ou chemin).
        directory = self._snapshot_dir(options.get('dir') or options.get('snapshot'))
        self.stdout.write(f'Snapshot: {directory}')

        with open(os.path.join(directory, 'sources.json'), encoding='utf-8') as fh:
            sources = json.load(fh)
        snapshot_date = sources.get('snapshot_date') or datetime.date.today().isoformat()
        checked_at = datetime.date.fromisoformat(snapshot_date)

        # 0. Taxonomie officielle — services + segments (idempotent).
        from apps.products.taxonomy import ensure_services_and_segments

        if not dry_run:
            ensure_services_and_segments()

        # 1. Categories officielles (#8) — upsert idempotent
        categories = {}
        for cat in OFFICIAL_CATEGORIES:
            if dry_run:
                categories[cat['slug']] = None
                continue
            obj, _ = Category.objects.update_or_create(
                slug=cat['slug'],
                defaults={
                    'name': cat['name'],
                    'name_en': cat['name_en'],
                    'segment': cat['segment'],
                    'description': cat['description'],
                    'description_en': cat['description_en'],
                    'is_active': True,
                },
            )
            categories[cat['slug']] = obj
        self.stdout.write(f'Categories officielles: {len(categories)}')

        report = {'created': 0, 'updated': 0, 'warnings': [], 'skipped': []}
        entries = [
            *self._load(directory, 'offers.json'),
            *self._load(directory, 'services.json'),
        ]
        if source_filter:
            needle = source_filter.lower()
            entries = [
                e for e in entries
                if needle in (e.get('source_name') or '').lower()
                or needle in (e.get('source_url') or '').lower()
            ]
            self.stdout.write(f'Filtre source "{source_filter}": {len(entries)} entrees')

        # 2. Validation + normalisation (#25)
        validated = []
        for entry in entries:
            norm, warnings = self._validate(entry, 'offre/service')
            if norm is None:
                report['skipped'].extend(warnings)
                continue
            report['warnings'].extend(warnings)
            validated.append(norm)

        # 3. Upsert idempotent par slug (#24 : pas de doublon au re-run).
        # Transaction : toute erreur critique annule l'import complet
        # (rollback) — la base n'est jamais laissee dans un etat partiel.
        from django.db import transaction

        from apps.products.taxonomy import apply_service_and_segments

        def _upsert():
            for norm in validated:
                category = None if dry_run else categories[norm['category_slug']]
                values = dict(
                    name=norm['name'],
                    name_en=norm['name_en'],
                    description=norm['description'],
                    description_en=norm['description_en'],
                    short_description=norm['description'][:500],
                    short_description_en=(norm['description_en'] or norm['description'])[:500],
                    brand=norm['brand'],
                    subcategory=norm['subcategory'],
                    service_type=norm['service_type'],
                    offer_type=norm['offer_type'],
                    segment=norm['segment'],
                    status=norm['status'],
                    pricing_type=norm['pricing_type'],
                    price=norm['price'],
                    yearly_price=norm['yearly_price'],
                    currency=norm['currency'],
                    billing_period=norm['billing_period'],
                    technology=norm['technology'],
                    availability=norm['availability'],
                    speed=norm['speed'],
                    coverage=norm['coverage'],
                    subscription_method=norm['subscription_method'] or '',
                    terms=norm['terms'],
                    features=norm['features'],
                    specs=norm['specs'],
                    eligibility=norm['eligibility_note'],
                    source_url=norm['source_url'],
                    source_name=norm['source_name'],
                    source_checked_at=checked_at if norm['source_url'] else None,
                    last_verified_at=checked_at if norm['source_url'] else None,
                    data_origin=norm.get('data_origin', Product.DataOrigin.OFFICIAL),
                    product_type=Product.ProductType.SERVICE_OFFER,
                    is_active=True,
                    is_published=True,
                )
                existing = None if dry_run else Product.objects.filter(slug=norm['slug']).first()
                if existing is None and not dry_run:
                    if update_only:
                        continue
                    product = Product.objects.create(category=category, slug=norm['slug'], **values)
                    apply_service_and_segments(product)
                    self._upsert_product_source(product, norm, checked_at)
                    report['created'] += 1
                    if verbose:
                        self.stdout.write(f'  + {norm["slug"]}')
                elif existing is not None:
                    for field, value in values.items():
                        setattr(existing, field, value)
                    existing.category = category
                    existing.save()
                    apply_service_and_segments(existing)
                    self._upsert_product_source(existing, norm, checked_at)
                    report['updated'] += 1
                    if verbose:
                        self.stdout.write(f'  ~ {norm["slug"]}')
                else:
                    if not update_only:
                        report['created'] += 1

        if dry_run:
            _upsert()
        else:
            with transaction.atomic():
                _upsert()

        self._import_promotions(directory, checked_at, dry_run, report)
        self._import_faqs(directory, dry_run, report)
        self._print_report(report, validated, dry_run)

        if strict and (report['warnings'] or report['skipped']):
            raise CommandError(
                f'Import STRICT : {len(report["warnings"])} warning(s), '
                f'{len(report["skipped"])} entree(s) ignoree(s).'
            )

    def _upsert_product_source(self, product, norm, checked_at):
        """Cree/rafraichit la ProductSource structuree du produit (#12).

        Idempotent : la source primaire d'un produit est reutilisee (pas de
        doublon au re-run). Le statut de verification suit la provenance.
        """
        from apps.products.models import ProductSource

        source_url = norm.get('source_url') or ''
        data_origin = norm.get('data_origin', Product.DataOrigin.OFFICIAL)
        status_map = {
            Product.DataOrigin.OFFICIAL: ProductSource.VerificationStatus.OFFICIAL,
            Product.DataOrigin.MANUAL: ProductSource.VerificationStatus.MANUAL,
            Product.DataOrigin.HISTORICAL: ProductSource.VerificationStatus.HISTORICAL,
            Product.DataOrigin.DEMO: ProductSource.VerificationStatus.DEMO,
            Product.DataOrigin.MOCK: ProductSource.VerificationStatus.MOCK,
            Product.DataOrigin.REQUIRES_VALIDATION: (
                ProductSource.VerificationStatus.REQUIRES_VALIDATION
            ),
        }
        verification_status = status_map.get(
            data_origin, ProductSource.VerificationStatus.REQUIRES_VALIDATION,
        )
        if not source_url and verification_status == ProductSource.VerificationStatus.OFFICIAL:
            # Garde-fou : jamais un OFFICIAL sans URL (la validation amont
            # filtre deja ce cas ; ceinture + bretelles).
            verification_status = ProductSource.VerificationStatus.REQUIRES_VALIDATION
        source, created = ProductSource.objects.get_or_create(
            product=product,
            source_name=norm.get('source_name') or 'Source inconnue',
            is_primary=True,
            defaults={
                'source_url': source_url,
                'source_type': ProductSource.SourceType.SNAPSHOT,
                'verification_status': verification_status,
                'last_verified_at': checked_at if source_url else None,
                'notes': f'Import snapshot {checked_at.isoformat()}',
            },
        )
        if not created:
            updated = False
            if source.source_url != source_url:
                source.source_url = source_url
                updated = True
            if source.verification_status != verification_status:
                source.verification_status = verification_status
                updated = True
            if source_url and source.last_verified_at != checked_at:
                source.last_verified_at = checked_at
                updated = True
            if updated:
                source.save()

    def _import_promotions(self, directory, checked_at, dry_run, report):
        """Promotions separees des offres permanentes (#18)."""
        promos = self._load(directory, 'promotions.json')
        for promo in promos:
            norm_p, warnings_p = self._validate(promo, 'promotion')
            report['warnings'].extend(warnings_p)
            if norm_p and not dry_run:
                Promotion.objects.update_or_create(
                    slug=norm_p['slug'],
                    defaults={
                        'title': norm_p['name'],
                        'status': promo.get('status', Promotion.Status.VALID),
                        'conditions': promo.get('conditions', ''),
                        'source_url': norm_p['source_url'],
                        'source_name': norm_p['source_name'],
                        'last_verified_at': checked_at if norm_p['source_url'] else None,
                    },
                )

    def _import_faqs(self, directory, dry_run, report):
        """FAQ officielles adossees aux offres — alimentent chatbot/RAG (#31/#32).

        Les reponses sont exclusivement construites a partir des memes sources
        officielles que le catalogue ; le slug doit correspondre a une offre
        importee, sinon un WARNING est emis et la FAQ est ignoree.
        """
        from apps.products.models import Product as ProductModel

        faq_path = os.path.join(directory, 'faqs.json')
        if not os.path.isfile(faq_path):
            return
        with open(faq_path, encoding='utf-8') as fh:
            payload = json.load(fh)
        for item in payload.get('faqs', []):
            product = (
                None if dry_run
                else ProductModel.objects.filter(slug=item.get('product_slug', '')).first()
            )
            if product is None and not dry_run:
                report['warnings'].append(
                    f"faq: offre cible introuvable '{item.get('product_slug')}' -> ignoree"
                )
                continue
            question = item.get('question_fr') or ''
            answer = item.get('answer_fr') or ''
            if not question or not answer:
                report['warnings'].append('faq: question/reponse manquante -> ignoree')
                continue
            if dry_run:
                report['created'] += 1
                continue
            ProductFAQ.objects.update_or_create(
                product=product,
                question=question[:255],
                defaults={
                    'answer': (
                        f"{answer}\n\nSource : {item.get('source_name', product.source_name)} "
                        f"({product.source_url}) — verifie le {product.last_verified_at}."
                    ),
                },
            )
            report['created'] += 1

    def _print_report(self, report, validated, dry_run):
        self.stdout.write('')
        self.stdout.write(self.style.MIGRATE_HEADING('=== RAPPORT IMPORT CATALOGUE ==='))
        self.stdout.write(f'Entrees validees : {len(validated)}')
        self.stdout.write(f'Creees           : {report["created"]}')
        self.stdout.write(f'Mises a jour     : {report["updated"]}')
        self.stdout.write(f'Ignorees         : {len(report["skipped"])}')
        for warning in report['warnings']:
            self.stdout.write(self.style.WARNING(f'WARNING: {warning}'))
        for skipped in report['skipped']:
            self.stdout.write(self.style.ERROR(f'SKIPPED: {skipped}'))
        if not dry_run:
            official = Product.objects.filter(data_origin=Product.DataOrigin.OFFICIAL)
            self.stdout.write('')
            self.stdout.write(f'Offres OFFICIAL en base : {official.count()}')
            self.stdout.write(f'Avec prix               : {official.filter(price__isnull=False).count()}')
            self.stdout.write(f'Prix sur demande        : {official.filter(pricing_type="QUOTE").count()}')
            self.stdout.write(
                f'REQUIRES_VERIFICATION   : '
                f'{official.filter(status=Product.Status.REQUIRES_VERIFICATION).count()}'
            )
        self.stdout.write(self.style.SUCCESS('Import termine.'))
