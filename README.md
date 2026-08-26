<<<<<<< HEAD
# CAMTEL-OnePortal
=======
# CAMTEL OnePortal — Guide de démarrage complet

Plateforme full-stack Django/DRF + React/TypeScript pour la gestion des produits, actualités, promotions et espace client CAMTEL.

## Stack

| Couche | Technologies |
|---|---|
| Backend | Python 3.12, Django 6, DRF, JWT, PostgreSQL/SQLite |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Query |
| DevOps | Docker, Nginx, GitHub Actions, PostgreSQL 16 |

## Structure

```text
CAMTEL-OnePortal/
├── backend/                 # API Django/DRF
│   ├── apps/                # categories, products, news, partners, core...
│   └── config/settings/     # base.py, dev.py, prod.py
├── frontend/camtel/frontend # SPA React
├── nginx/                   # Reverse proxy
├── scripts/                 # backup.sh, restore.sh
├── docs/                    # Documentation
├── docker-compose.yml       # Dev complet (PostgreSQL + backend + frontend + nginx)
└── docker-compose.staging.yml
```

---

## Option A — Lancement local (sans Docker)

### 1. Backend

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

Comptes créés par `seed_data` (données DEMO, **uniquement en développement **) :
- **superadmin** / CamtelAdmin2026!
- **admin** / admin123
- **editor** / editor123

API : http://127.0.0.1:8000/api/v1/  
Swagger : http://127.0.0.1:8000/api/docs/

### 2. Frontend

```powershell
cd frontend\camtel\frontend
npm install
npm run dev
```

Interface : http://localhost:5173

Le proxy Vite redirige `/api` vers le backend Django.

---

## Option B — Lancement Docker (recommandé)

Prérequis : Docker Desktop

```powershell
cd CAMTEL-OnePortal
docker compose up --build
```

Services :
| Service | URL |
|---|---|
| Application (Nginx) | http://localhost:8080 |
| API directe | http://localhost:8000/api/v1/ |
| PostgreSQL | localhost:5432 (camtel/camtel) |

---

## Option C — Environnement staging

```powershell
docker compose -f docker-compose.staging.yml up --build
```

Port : http://localhost:8081  
Settings : `config.settings.prod`, logs JSON, DEBUG=False.

---

## Tests

### Backend (SQLite)

```powershell
cd backend
python manage.py test --verbosity 2
```

### Backend (PostgreSQL)

```powershell
$env:DB_NAME="camtel"; $env:DB_USER="camtel"; $env:DB_PASSWORD="camtel"; $env:DB_HOST="localhost"; $env:DB_PORT="5432"
python manage.py migrate
python manage.py test --verbosity 2
```

### Frontend

```powershell
cd frontend\camtel\frontend
npm run test -- --run
npm run build
```

---

## Fonctionnalités clés

- **Authentification JWT** : `/api/v1/auth/login/` (access court + refresh révocable au logout via `token_blacklist`)
- **Internationalisation API** : en-tête `Accept-Language: fr|en`
- **Comparateur d'offres** : `GET /api/v1/products/compare/?ids=1,2,3`
- **Catalogue filtrable et triable** : `GET /api/v1/products/?search=&category=<slug>&segment=<grand_public|entreprise>&offer_type=<INTERNET|FIBER|...>&product_type=<SERVICE_OFFER|PHYSICAL_PRODUCT>&availability=<ALL|REGION|ADDRESS_CHECK>&min_price=&max_price=&ordering=<price|-price|...>`
- **Offers/Produits métier (PHASE 2)** : champs `product_type`, `offer_type` (type télécom), `segment` (PARTICULIER/PROFESSIONNEL/ENTREPRISE/ADMINISTRATION), `billing_period`, `activation_fee`, `installation_fee`, `contract_duration`, `technology`, `availability`, `eligibility`, `features`, `benefits`, `terms`, `currency`. Le `stock` n'a de sens (`manage_stock`) que pour les `PHYSICAL_PRODUCT`.
- **Workflow de souscription (PHASE 3)** : statuts `PENDING → UNDER_REVIEW → ADDITIONAL_INFO_REQUIRED → APPROVED → SCHEDULED → ACTIVATED` (+ `REJECTED`/`CANCELLED`), numéro de demande humain `SUB-2026-000001`, historique tracé `SubscriptionStatusHistory`, transitions `POST /api/v1/subscriptions/<id>/change-status/`, espace client `GET /api/v1/subscriptions/my-subscriptions/` et `GET /api/v1/subscriptions/my-dashboard/`.
- **RBAC fin côté serveur** : la publication/suppression d'un produit est réservée aux Admin/Super Admin (Editeurs/Gestionnaires : création et modification uniquement)
- **Gestion des médias sécurisée** : formats autorisés et taille max 10 Mo validés côté API
- **API partenaire** : en-tête `X-API-Key` + throttling dédié par clé (voir [docs/partner-api.md](docs/partner-api.md))
- **Chatbot** : `POST /api/v1/chatbot/ask/` (voir [docs/oneportal-ai.md](docs/oneportal-ai.md))
- **Healthcheck avancé** : `GET /api/v1/health/`

## Sécurité (PHASE 1)

- `SECRET_KEY` **obligatoire** en production : l'application refuse de démarrer si elle est absente ou placeholder (`config.settings.prod`).
- **Logout révocable** : le refresh token est blacklisté (revocation) ; durée de l'access issu de `JWT_ACCESS_LIFETIME_MINUTES` (défaut 30 min).
- **Rate limiting** : login `5/min`, register `3/hour`, refresh/auth `20/min`, chatbot `30/min`, search `120/min`, contact `5/hour`, partenaire `1000/hour` (via env `THROTTLE_*`).
- **Seed demo jamais automatique hors-dev** : la commande `seed_data` refuse de s'exécuter si `DEBUG=False`, sauf `SEED_DEMO_DATA=true` ou `--force` explicite. Docker compose ne lance le seed que si `SEED_DEMO_DATA=true`.
- **Aucun secret dans le dépôt** : `.env.example` ne contient que des placeholders ; les valeurs réelles passent par environnement. Les compositions `docker-compose.staging.yml` exigent `SECRET_KEY`/`DB_PASSWORD` (`${VAR:?}`).

---

## Documentation

| Document | Contenu |
|---|---|
| [docs/backend-setup.md](docs/backend-setup.md) | Configuration backend détaillée |
| [docs/frontend-setup.md](docs/frontend-setup.md) | Configuration frontend |
| [docs/devops.md](docs/devops.md) | Docker, CI/CD, backup, monitoring |
| [docs/partner-api.md](docs/partner-api.md) | API partenaire (clés, scopes, rate limit) |
| [docs/oneportal-ai.md](docs/oneportal-ai.md) | Assistant OnePortal AI (chatbot, LLM, paramètres) |
| [docs/disaster-recovery.md](docs/disaster-recovery.md) | Plan RTO/RPO |
| [docs/roadmap.md](docs/roadmap.md) | Roadmap technique |

---

## Variables d'environnement

Copier `.env.example` vers `.env` et adapter les valeurs.

Variables clés (détail complet dans [backend-setup.md](docs/backend-setup.md)) :

| Variable | Rôle | Défaut |
|---|---|---|
| `SECRET_KEY` | Clé Django — **obligatoire en production** (refus de démarrer) | `DEV ONLY` |
| `DJANGO_SETTINGS_MODULE` | `config.settings.dev` ou `config.settings.prod` | `config.settings.dev` |
| `SEED_DEMO_DATA` | Active le seed demo (jamais auto hors-dev) | `True` (dev) / `False` (prod) |
| `JWT_ACCESS_LIFETIME_MINUTES` | Durée de vie du token access | `30` |
| `JWT_REFRESH_LIFETIME_DAYS` | Durée de vie du refresh (révocable au logout) | `7` |
| `THROTTLE_*` | Rate limiting (login, register, chatbot, search, partner...) | selon endpoint |
| `DB_*` | Connexion PostgreSQL (SQLite si `DB_HOST` vide) | — |

---

## Commandes utiles

```powershell
# Créer une clé API partenaire
python manage.py create_partner_key --name "Mon partenaire"

# Seed demo (dev) — hors dev, exiger SEED_DEMO_DATA=true ou --force
python manage.py seed_data

# Réinitialiser séquences PostgreSQL après migration
python manage.py reset_pg_sequences

# Sauvegarde (Linux/macOS ou Git Bash)
./scripts/backup.sh
```
>>>>>>> CAMTEL-OnePortal2/main
