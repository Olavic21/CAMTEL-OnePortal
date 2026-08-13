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

Comptes créés par `seed_data` :
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

- **Authentification JWT** : `/api/v1/auth/login/`
- **Internationalisation API** : en-tête `Accept-Language: fr|en`
- **Comparateur d'offres** : `GET /api/v1/products/compare/?ids=1,2,3`
- **API partenaire** : en-tête `X-API-Key` (voir [docs/partner-api.md](docs/partner-api.md))
- **Chatbot** : `POST /api/v1/chatbot/ask/` (voir [docs/oneportal-ai.md](docs/oneportal-ai.md))
- **Healthcheck avancé** : `GET /api/v1/health/`

---

## Documentation

| Document | Contenu |
|---|---|
| [docs/backend-setup.md](docs/backend-setup.md) | Configuration backend détaillée |
| [docs/frontend-setup.md](docs/frontend-setup.md) | Configuration frontend |
| [docs/devops.md](docs/devops.md) | Docker, CI/CD, backup, monitoring |
| [docs/partner-api.md](docs/partner-api.md) | API partenaire (clés, scopes) |
| [docs/oneportal-ai.md](docs/oneportal-ai.md) | Assistant OnePortal AI (chatbot, LLM, paramètres) |
| [docs/disaster-recovery.md](docs/disaster-recovery.md) | Plan RTO/RPO |
| [docs/roadmap.md](docs/roadmap.md) | Roadmap technique |

---

## Variables d'environnement

Copier `.env.example` vers `.env` et adapter les valeurs.

---

## Commandes utiles

```powershell
# Créer une clé API partenaire
python manage.py create_partner_key --name "Mon partenaire"

# Réinitialiser séquences PostgreSQL après migration
python manage.py reset_pg_sequences

# Sauvegarde (Linux/macOS ou Git Bash)
./scripts/backup.sh
```
