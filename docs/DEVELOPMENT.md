# DEVELOPMENT.md — Guide de développement

## Environnements
| Env | Settings | Base de données | Seed demo |
|---|---|---|---|
| Dev | `config.settings.dev` | SQLite (défaut) | Oui (`SEED_DEMO_DATA=True`) |
| Staging | `config.settings.prod` | PostgreSQL | Non (volontaire, `--force` ou `SEED_DEMO_DATA=true`) |
| Production | `config.settings.prod` | PostgreSQL | Jamais |

## Démarrage dev (Windows/PowerShell)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py import_camtel_catalog   # catalogue commercial OFFICIEL CAMTEL (idempotent)
python manage.py attach_official_images  # assets officiels -> media/products/ (traces)
python manage.py seed_data               # donnees DEMO fictives (dev uniquement, marquees data_origin=DEMO)
python manage.py runserver
# Frontend (autre terminal)
cd frontend\camtel\frontend
npm install
npm run dev
```

> **Source de vérité commerciale** : les offres réelles vivent dans
> `data/camtel_catalog/<date>/` et sont importées via `import_camtel_catalog`
> (voir `docs/CAMTEL_DATA_SOURCES.md`). Ne jamais saisir de prix/offre à la main
> sans source officielle référencée.

## Conventions
- **Backend** : PEP8, typage (`: type`), logique métier dans les services/actions de ViewSet, vues légères, querysets optimisés (`select_related`/`prefetch_related`).
- **Frontend** : TypeScript strict, composants réutilisables (`shared/`), hooks + API séparés, pas de logique métier massive dans les composants.
- Ajouter tout texte UI via i18n (pas de littéraux câblés), tout champ API via `*_en` + `Accept-Language`.

## Migrations
```powershell
python manage.py makemigrations <app>
python manage.py migrate
python manage.py makemigrations --check --dry-run   # aucune modif attendue
```

## Ajouter un endpoint
1. Créer/éditer le modèle + migration.
2. Sérialiseur (`rest_framework`).
3. Vue (`views.py`) avec permissions adaptées (`apps/core/permissions.py`).
4. Routage (`urls.py`).
5. Tester (`tests.py`) + documenter (`docs/API.md`).