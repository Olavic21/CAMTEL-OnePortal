# Guide de démarrage backend CAMTEL OnePortal

## 1. Prérequis

- Python 3.12+
- Git
- SQLite (dev) ou PostgreSQL 16+ (staging/prod)
- Postman/Insomnia (optionnel)

## 2. Installation

```powershell
cd CAMTEL-OnePortal
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

## 3. Endpoints principaux

| URL | Description |
|---|---|
| `http://127.0.0.1:8000/api/v1/` | API v1 |
| `http://127.0.0.1:8000/api/docs/` | Swagger UI |
| `http://127.0.0.1:8000/api/v1/health/` | Healthcheck (DB + storage) |
| `http://127.0.0.1:8000/api/v1/auth/login/` | Connexion JWT |

## 4. Authentification JWT

```bash
POST /api/v1/auth/login/
{"username": "admin", "password": "admin123"}
```

Utiliser le token `access` dans `Authorization: Bearer <token>`.

## 5. Internationalisation API

Champs traduits sur Product, Category, News. L'API retourne la langue selon :

```http
Accept-Language: fr
Accept-Language: en
```

Champs stockés : `name`/`name_en`, `description`/`description_en`, etc.

## 6. Comparateur d'offres

```bash
GET /api/v1/products/compare/?ids=1,2,3
```

Retourne jusqu'à 3 produits normalisés (prix, catégorie, FAQ, features).

## 7. API partenaire

Voir [partner-api.md](partner-api.md).

```bash
python manage.py create_partner_key --name "Demo"
```

## 8. PostgreSQL

Variables d'environnement :

```env
DB_NAME=camtel
DB_USER=camtel
DB_PASSWORD=camtel
DB_HOST=localhost
DB_PORT=5432
```

Après migration de données SQLite → PostgreSQL :

```bash
python manage.py reset_pg_sequences
```

Index full-text GIN créés automatiquement sur PostgreSQL (migration `0003_postgres_fulltext_indexes`).

## 9. Structure backend

```text
backend/
├── apps/
│   ├── categories/   # Catégories (FR/EN)
│   ├── products/     # Produits, images, FAQ, comparateur
│   ├── news/         # Actualités (FR/EN)
│   ├── partners/     # Clés API partenaires
│   ├── core/         # Health, chatbot, i18n, activity logs
│   └── ...
├── config/settings/
│   ├── base.py       # Config commune + logs JSON
│   ├── dev.py        # Développement
│   └── prod.py       # Production (HTTPS, S3)
└── manage.py
```

## 10. Tests

```bash
# SQLite (défaut)
python manage.py test --verbosity 2

# PostgreSQL
DB_HOST=localhost DB_NAME=camtel DB_USER=camtel DB_PASSWORD=camtel python manage.py test
```

## 11. Logs structurés

```env
LOG_FORMAT=json
LOG_LEVEL=INFO
```

Format JSON activé par défaut en production (`config.settings.prod`).

## 12. Stockage médias S3 (production)

```env
USE_S3_STORAGE=True
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=camtel-media
AWS_S3_ENDPOINT_URL=https://s3.example.com  # MinIO compatible
```
