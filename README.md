
# CAMTEL-OnePortal

# CAMTEL OnePortal â€” Guide de dÃ©marrage complet

Plateforme full-stack Django/DRF + React/TypeScript pour la gestion des produits, actualitÃ©s, promotions et espace client CAMTEL.

## Stack

| Couche | Technologies |
|---|---|
| Backend | Python 3.12, Django 6, DRF, JWT, PostgreSQL/SQLite |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Query |
| DevOps | Docker, Nginx, GitHub Actions, PostgreSQL 16 |

## Structure

```text
CAMTEL-OnePortal/
â”œâ”€â”€ backend/                 # API Django/DRF
â”‚   â”œâ”€â”€ apps/                # categories, products, news, partners, core...
â”‚   â””â”€â”€ config/settings/     # base.py, dev.py, prod.py
â”œâ”€â”€ frontend/camtel/frontend # SPA React
â”œâ”€â”€ nginx/                   # Reverse proxy
â”œâ”€â”€ scripts/                 # setup.ps1, backup.sh, restore.sh
â”œâ”€â”€ docs/                    # Documentation
â”œâ”€â”€ docker-compose.yml       # Dev complet (PostgreSQL + backend + frontend + nginx)
â””â”€â”€ docker-compose.staging.yml
```

---

## Setup en une commande (Windows)

Le script `scripts/setup.ps1` automatise toute la prÃ©paration (idempotent â€” relancer ne casse rien) :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1            # complet (avec comptes demo)
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1 -SkipDemo  # sans seed demo
```

Il effectue, dans l'ordre : venv + dÃ©pendances backend â†’ migrations â† catalogue CAMTEL
(`seed_camtel_data` + `validate_camtel_data` + `attach_official_images`) â† comptes demo
(`seed_data`, dev uniquement) â† dÃ©pendances frontend (`npm install`).
L'installation manuelle ci-dessous reste 100 % Ã©quivalente.

---

## Option A â€” Lancement local (sans Docker)

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

Comptes crÃ©Ã©s par `seed_data` (donnÃ©es DEMO, **uniquement en dÃ©veloppement **) :
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

## Option B â€” Lancement Docker (recommandÃ©)

PrÃ©requis : Docker Desktop

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

## Option C â€” Environnement staging

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

## FonctionnalitÃ©s clÃ©s

- **Authentification JWT** : `/api/v1/auth/login/` (access court + refresh rÃ©vocable au logout via `token_blacklist`)
- **Internationalisation API** : en-tÃªte `Accept-Language: fr|en`
- **Comparateur d'offres** : `GET /api/v1/products/compare/?ids=1,2,3`
- **Catalogue filtrable et triable** : `GET /api/v1/products/?search=&category=<slug>&segment=<grand_public|entreprise>&offer_type=<INTERNET|FIBER|...>&product_type=<SERVICE_OFFER|PHYSICAL_PRODUCT>&availability=<ALL|REGION|ADDRESS_CHECK>&min_price=&max_price=&ordering=<price|-price|...>`
- **Offers/Produits mÃ©tier (PHASE 2)** : champs `product_type`, `offer_type` (type tÃ©lÃ©com), `segment` (PARTICULIER/PROFESSIONNEL/ENTREPRISE/ADMINISTRATION), `billing_period`, `activation_fee`, `installation_fee`, `contract_duration`, `technology`, `availability`, `eligibility`, `features`, `benefits`, `terms`, `currency`. Le `stock` n'a de sens (`manage_stock`) que pour les `PHYSICAL_PRODUCT`.
- **Workflow de souscription (PHASE 3)** : statuts `PENDING â†’ UNDER_REVIEW â†’ ADDITIONAL_INFO_REQUIRED â†’ APPROVED â†’ SCHEDULED â†’ ACTIVATED` (+ `REJECTED`/`CANCELLED`), numÃ©ro de demande humain `SUB-2026-000001`, historique tracÃ© `SubscriptionStatusHistory`, transitions `POST /api/v1/subscriptions/<id>/change-status/`, espace client `GET /api/v1/subscriptions/my-subscriptions/` et `GET /api/v1/subscriptions/my-dashboard/`.
- **RBAC fin cÃ´tÃ© serveur** : la publication/suppression d'un produit est rÃ©servÃ©e aux Admin/Super Admin (Editeurs/Gestionnaires : crÃ©ation et modification uniquement)
- **Gestion des mÃ©dias sÃ©curisÃ©e** : formats autorisÃ©s et taille max 10 Mo validÃ©s cÃ´tÃ© API
- **API partenaire** : en-tÃªte `X-API-Key` + throttling dÃ©diÃ© par clÃ© (voir [docs/partner-api.md](docs/partner-api.md))
- **Chatbot** : `POST /api/v1/chatbot/ask/` (voir [docs/oneportal-ai.md](docs/oneportal-ai.md))
- **Healthcheck avancÃ©** : `GET /api/v1/health/`

## SÃ©curitÃ© (PHASE 1)

- `SECRET_KEY` **obligatoire** en production : l'application refuse de dÃ©marrer si elle est absente ou placeholder (`config.settings.prod`).
- **Logout rÃ©vocable** : le refresh token est blacklistÃ© (revocation) ; durÃ©e de l'access issu de `JWT_ACCESS_LIFETIME_MINUTES` (dÃ©faut 30 min).
- **Rate limiting** : login `5/min`, register `3/hour`, refresh/auth `20/min`, chatbot `30/min`, search `120/min`, contact `5/hour`, partenaire `1000/hour` (via env `THROTTLE_*`).
- **Seed demo jamais automatique hors-dev** : la commande `seed_data` refuse de s'exÃ©cuter si `DEBUG=False`, sauf `SEED_DEMO_DATA=true` ou `--force` explicite. Docker compose ne lance le seed que si `SEED_DEMO_DATA=true`.
- **Aucun secret dans le dÃ©pÃ´t** : `.env.example` ne contient que des placeholders ; les valeurs rÃ©elles passent par environnement. Les compositions `docker-compose.staging.yml` exigent `SECRET_KEY`/`DB_PASSWORD` (`${VAR:?}`).

---

## Documentation

| Document | Contenu |
|---|---|
| [docs/backend-setup.md](docs/backend-setup.md) | Configuration backend dÃ©taillÃ©e |
| [docs/frontend-setup.md](docs/frontend-setup.md) | Configuration frontend |
| [docs/devops.md](docs/devops.md) | Docker, CI/CD, backup, monitoring |
| [docs/partner-api.md](docs/partner-api.md) | API partenaire (clÃ©s, scopes, rate limit) |
| [docs/oneportal-ai.md](docs/oneportal-ai.md) | Assistant OnePortal AI (chatbot, LLM, paramÃ¨tres) |
| [docs/disaster-recovery.md](docs/disaster-recovery.md) | Plan RTO/RPO |
| [docs/roadmap.md](docs/roadmap.md) | Roadmap technique |

---

## Variables d'environnement

Copier `.env.example` vers `.env` et adapter les valeurs.

Variables clÃ©s (dÃ©tail complet dans [backend-setup.md](docs/backend-setup.md)) :

| Variable | RÃ´le | DÃ©faut |
|---|---|---|
| `SECRET_KEY` | ClÃ© Django â€” **obligatoire en production** (refus de dÃ©marrer) | `DEV ONLY` |
| `DJANGO_SETTINGS_MODULE` | `config.settings.dev` ou `config.settings.prod` | `config.settings.dev` |
| `SEED_DEMO_DATA` | Active le seed demo (jamais auto hors-dev) | `True` (dev) / `False` (prod) |
| `JWT_ACCESS_LIFETIME_MINUTES` | DurÃ©e de vie du token access | `30` |
| `JWT_REFRESH_LIFETIME_DAYS` | DurÃ©e de vie du refresh (rÃ©vocable au logout) | `7` |
| `THROTTLE_*` | Rate limiting (login, register, chatbot, search, partner...) | selon endpoint |
| `DB_*` | Connexion PostgreSQL (SQLite si `DB_HOST` vide) | â€” |

---

## Commandes utiles

```powershell
# CrÃ©er une clÃ© API partenaire
python manage.py create_partner_key --name "Mon partenaire"

# Seed demo (dev) â€” hors dev, exiger SEED_DEMO_DATA=true ou --force
python manage.py seed_data

# RÃ©initialiser sÃ©quences PostgreSQL aprÃ¨s migration
python manage.py reset_pg_sequences

# Sauvegarde (Linux/macOS ou Git Bash)
./scripts/backup.sh
```


---

## Chargement du catalogue officiel

Les donnees CAMTEL (services, segments, produits, sources) sont versionnees dans `data/camtel_catalog/`. Pour charger le catalogue complet :

```powershell
cd backend
python manage.py seed_camtel_data
```

Cette commande est **idempotente** : elle peut etre relancee sans creer de doublons. Elle charge dans l'ordre :
1. Services (Fixes, Mobiles, Transport, Data Center)
2. Segments (Particulier, Professionnel, Entreprise, Administration)
3. Produits avec specifications et tarification
4. Sources de donnees
5. Images officielles (`python manage.py attach_official_images`)

Pour valider les donnees chargees :

```powershell
python manage.py validate_camtel_data
```

### Import depuis un nouveau PDF officiel

Quand un nouveau catalogue PDF CAMTEL est fourni (produits + images), le pipeline complet est :

```powershell
# 1. Extraire le TEXTE (page par page) et les IMAGES embarquees du PDF
python scripts/extract_official_pdf.py chemin/vers/catalogue.pdf

# 2. Construire le snapshot data/camtel_catalog/<date>/ (offers.json, services.json,
#    sources.json...) a partir du texte extrait, puis le valider
python manage.py seed_camtel_data --snapshot <date>
python manage.py validate_camtel_data

# 3. Rattacher les images extraites (backend/media/products/pdf-import/) aux produits
python manage.py attach_official_images
```

Options utiles : `--images-only` (images sans texte), `--min-size 64` (taille minimale
en px pour garder une image — les icones/puces sont ecartees). Le script convertit les
formats non web (DIB...) en JPEG et ecrit un rapport `[OK] Texte` / `[OK] Images`.

> Regle #52 : aucune donnee commerciale n'est inventee — seules les valeurs lues dans
> le PDF alimentent le snapshot ; les champs manquants restent `REQUIRES_VALIDATION`.

---

## Creation d'un Superadmin

```powershell
cd backend
python manage.py createsuperuser
```

Ou via le seed demo (dev uniquement) : le compte `superadmin` / `CamtelAdmin2026!` est cree automatiquement par `seed_data`.

---



## Branding / Logo

Le logo est **centralise en une seule source** (`frontend/camtel/frontend/public/logo-new.png`) et alimente automatiquement :

- Header du portail public
- Sidebar + header du Back Office
- Pages de connexion / inscription
- Favicon (icone d onglet)

Pour **remplacer le logo** (nouvelle version officielle) :

```powershell
# 1. Copier le nouveau logo dans public/ (remplace logo-new.png)
Copy-Item chemin/vers/nouveau-logo.png frontend/camtel/frontend/public/logo-new.png -Force

# 2. Regenerer le favicon 64x64 depuis le nouveau logo
python scripts/make_favicon.py

# 3. Le query string ?v= dans Logo.tsx force le navigateur a recharger :
#    il suffit d incrementer la valeur (ex: ?v=20260830a2) dans
#    frontend/camtel/frontend/src/shared/components/Logo.tsx
```

L`ancien logo est conserve dans `frontend/camtel/frontend/public/legacy-logos/` (logo-icon.svg, logo-full.svg, logo-full-dark.svg, favicon.svg) au cas ou. Le logo officiel est genere en PNG 1254x1254 avec fond blanc et s affiche dans une pastille blanche arrondie, lisible aussi bien sur fond clair (portail) que sur fond sombre (Back Office, pages auth).

> Regle #26/#27 du cahier des charges : source unique, remplaçable sans toucher au code metier, stable a chaque rafraichissement.

## Troubleshooting

| Probleme | Solution |
|---|---|
| `Database connection failed` | Verifier `DB_HOST`/`DB_PORT` ou que SQLite est accessible |
| `CORS error` en frontend | Verifier `CORS_ALLOWED_ORIGINS` dans `.env` (inclure `http://localhost:5173`) |
| `Missing environment variables` | Copier `.env.example` vers `.env` et remplir les valeurs |
| `Migration errors` | `python manage.py migrate --run-syncdb` puis relancer |
| `Catalogue vide` | Lancer `python manage.py seed_camtel_data` |
| `Frontend API URL` | Verifier `VITE_API_URL` dans `frontend/camtel/frontend/.env` |
| `401 Unauthorized` | Rafraichir la page (token expire) ou se reconnecter |
| `Port already in use` | Changer `PORT` ou arreter le processus sur le port 8000/5173 |

---

## RBAC - Roles et permissions

| Role | Acces Back Office | Permissions principales |
|---|---|---|
| `super_admin` | OUI | Toutes (gestion utilisateurs, roles, catalogue, analytics, admin) |
| `admin` | OUI | Gestion utilisateurs (non-privilegies), catalogue, souscriptions, analytics |
| `product_manager` | OUI | Catalogue, produits, services, promotions |
| `editor` | OUI | Actualites, medias, redactionnel |
| `customer` | NON | Portail client uniquement |
| Anonymous | NON | Portail public uniquement |

Voir [docs/RBAC.md](docs/RBAC.md) pour la matrice complete.

---

## Switch Portail / Back Office

Tout utilisateur autorise au Back Office (super_admin, admin, product_manager, editor) dispose d'un bouton de bascule **Portail <-> Back Office** visible :

- Dans le header du Back Office (`/admin`)
- Dans la sidebar (desktop) et sous le contenu (mobile)
- Dans le header du portail public

La bascule **conserve la session** : aucune reconnexion n'est requise. Un client (`customer`) ne voit jamais ce bouton, et le backend protege chaque endpoint de toute facon (403).
