"""
Comparaison de deux snapshots catalogue CAMTEL (Phase 7).

Genere un diff officiel entre deux repertoires data/camtel_catalog/<date>/
sur la base des fichiers offers.json (hors ligne, sans DB, idempotent).

Statuts par offre :
  - NEW       : presente dans --to uniquement
  - REMOVED   : presente dans --from uniquement
  - UPDATED   : au moins un champ suivi differe (detail champ: avant -> apres)
  - UNCHANGED : identique sur tous les champs suivis

Usage :
    python manage.py catalog_diff --from 2026-08-25 --to 2026-09-01
    python manage.py catalog_diff --from data/camtel_catalog/2026-08-25 \\
        --to data/camtel_catalog/2026-09-01 --format json
"""
import json
import os

from django.core.management.base import BaseCommand, CommandError

# Champs scalaires surveilles pour le diff metier.
TRACKED_FIELDS = (
    'name', 'brand', 'category_slug', 'service_type', 'offer_type',
    'segment', 'pricing_type', 'price', 'yearly_price', 'currency',
    'billing_period', 'subscription_method', 'source_url', 'source_name',
)

FIELD_LABELS = {
    'price': 'PRICE',
    'yearly_price': 'YEARLY PRICE',
    'billing_period': 'BILLING PERIOD',
}


class Command(BaseCommand):
    help = 'Compare deux snapshots du catalogue CAMTEL (NEW/UPDATED/REMOVED/UNCHANGED).'

    def add_arguments(self, parser):
        parser.add_argument('--from', dest='from_dir', required=True,
                            help='Snapshot source (date YYYY-MM-DD ou chemin).')
        parser.add_argument('--to', dest='to_dir', required=True,
                            help='Snapshot cible (date YYYY-MM-DD ou chemin).')
        parser.add_argument(
            '--format', choices=['table', 'json'], default='table',
            help='table (lecture humaine) ou json (integration outils).',
        )
        parser.add_argument(
            '--show-unchanged', action='store_true',
            help='Lister egalement les offres UNCHANGED.',
        )

    # ------------------------------------------------------------------ utils
    def _resolve_snapshot(self, value):
        """Accepte une date (YYYY-MM-DD), un chemin relatif ou absolu."""
        if os.path.isdir(value):
            return value
        from django.conf import settings as dj_settings

        candidates = [os.path.join(os.getcwd(), 'data', 'camtel_catalog')]
        base_dir = getattr(dj_settings, 'BASE_DIR', None)
        if base_dir is not None:
            base_dir = str(base_dir)
            candidates.append(os.path.join(base_dir, '..', 'data', 'camtel_catalog'))
            candidates.append(os.path.join(base_dir, 'data', 'camtel_catalog'))
        for base in candidates:
            candidate = os.path.normpath(os.path.join(base, value))
            if os.path.isdir(candidate):
                return candidate
        raise CommandError(f'Snapshot introuvable : {value}')

    @staticmethod
    def _load_offers(directory):
        path = os.path.join(directory, 'offers.json')
        if not os.path.isfile(path):
            raise CommandError(f'offers.json introuvable dans {directory}')
        with open(path, encoding='utf-8-sig') as fh:
            payload = json.load(fh)
        by_slug = {}
        for offer in payload.get('offers', []):
            slug = offer.get('slug')
            if slug:
                by_slug[slug] = offer
        return by_slug

    @staticmethod
    def _field_diffs(old, new):
        """Differences champ par champ (scalaire + specs deep-diff)."""
        diffs = []
        for field in TRACKED_FIELDS:
            old_value, new_value = old.get(field), new.get(field)
            if str(old_value) != str(new_value):
                label = FIELD_LABELS.get(field, field.upper())
                diffs.append((label, old_value, new_value))
        old_specs = old.get('specs') or {}
        new_specs = new.get('specs') or {}
        for key in sorted(set(old_specs) | set(new_specs)):
            if str(old_specs.get(key)) != str(new_specs.get(key)):
                diffs.append((f'SPECS {key}', old_specs.get(key), new_specs.get(key)))
        return diffs

    # ------------------------------------------------------------------ main
    def handle(self, *args, **options):
        from_dir = self._resolve_snapshot(options['from_dir'])
        to_dir = self._resolve_snapshot(options['to_dir'])

        old_offers = self._load_offers(from_dir)
        new_offers = self._load_offers(to_dir)

        report = {'NEW': [], 'UPDATED': [], 'REMOVED': [], 'UNCHANGED': []}
        for slug in sorted(set(old_offers) | set(new_offers)):
            in_old, in_new = slug in old_offers, slug in new_offers
            if in_old and not in_new:
                report['REMOVED'].append({'slug': slug, 'name': old_offers[slug].get('name')})
            elif in_new and not in_old:
                report['NEW'].append({'slug': slug, 'name': new_offers[slug].get('name')})
            else:
                diffs = self._field_diffs(old_offers[slug], new_offers[slug])
                entry = {
                    'slug': slug,
                    'name': new_offers[slug].get('name'),
                    'changes': [
                        {
                            'field': label,
                            'old': '' if old_value is None else str(old_value),
                            'new': '' if new_value is None else str(new_value),
                        }
                        for label, old_value, new_value in diffs
                    ],
                }
                key = 'UPDATED' if diffs else 'UNCHANGED'
                report[key].append(entry)

        summary = {k: len(v) for k, v in report.items()}
        if options['format'] == 'json':
            self.stdout.write(json.dumps({
                'from': from_dir,
                'to': to_dir,
                'summary': summary,
                'diffs': {k: report[k] for k in ('NEW', 'UPDATED', 'REMOVED')},
                'unchanged_slugs': [e['slug'] for e in report['UNCHANGED']],
            }, ensure_ascii=False, indent=2))
            return

        # --- Rendu table (mission : exemple "Blue One M / PRICE: / 3000 -> 3500") ---
        self.stdout.write(self.style.MIGRATE_HEADING(
            f"=== CATALOG DIFF : {os.path.basename(from_dir)} -> {os.path.basename(to_dir)} ==="
        ))
        for status_key in ('NEW', 'UPDATED', 'REMOVED'):
            entries = report[status_key]
            self.stdout.write('')
            color = (
                self.style.SUCCESS if status_key == 'NEW'
                else self.style.WARNING if status_key == 'UPDATED'
                else self.style.ERROR
            )
            self.stdout.write(color(f'{status_key} ({len(entries)})'))
            for entry in entries:
                self.stdout.write(f"  {entry['slug']}")
                for change in entry.get('changes', []):
                    self.stdout.write(f"    {change['field']}:")
                    self.stdout.write(f"      {change['old']} -> {change['new']}")

        if options['show_unchanged']:
            self.stdout.write('')
            self.stdout.write(f"UNCHANGED ({len(report['UNCHANGED'])})")
            for entry in report['UNCHANGED']:
                self.stdout.write(f"  {entry['slug']}")

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            'Diff termine. '
            f"N={summary['NEW']} U={summary['UPDATED']} "
            f"R={summary['REMOVED']} S={summary['UNCHANGED']}"
        ))
