# CAMTEL-OnePortal

Plateforme full-stack **Django / Django REST Framework + React / TypeScript** pour le portail produits et services CAMTEL : catalogue FIXES / MOBILES / TRANSPORT / DATA CENTER, comparateur, assistance, espace client, back-office et paiements Orange Money / MTN Mobile Money.

> Stack : Python 3.12, Django 6, DRF 3.17, SimpleJWT, PostgreSQL 16 / SQLite, React 18, TypeScript 5, Vite 8, Tailwind 3, React Query 5, Framer Motion, i18next, Docker / Nginx.

---

## 1. Architecture

```
CAMTEL-OnePortal/
├── backend/
│   ├── apps/
│   │   ├── categories/      # Catégories catalogue
│   │   ├── products/        # Service, Segment, Product, ProductImage, ProductFAQ, ProductSource
│   │   ├── news/            # Actualités
│   │   ├── promotions/      # Promotions
│   │   ├── media/           # Médiathèque
│   │   ├── contacts/        # Messages contact
│   │   ├── subscriptions/   # Demandes de souscription (workflow)
│   │   ├── partners/        # API partenaire (X-API-Key)
│   │   ├── users/           # User custom + RBAC
│   │   └── core/            # Payment, Notification, SupportTicket, Analytics, ActivityLog, providers
│   ├── config/
│   │   └── settings/        # base.py / dev.py / prod.py
│   ├── manage.py
│   └── media/               # Uploads (products/, news/)
├── frontend/camtel/frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout/      # PublicHeader, PublicLayout, AdminLayout, AdminSidebar
│   │   │   ├── pages/       # HomePage, AboutPage, AssistancePage
│   │   │   └── router.tsx   # Routes publiques + back-office (lazy + RequireAuth)
│   │   ├── features/        # products, services, payments, subscriptions, tickets, etc.
│   │   └── shared/          # components, config/services, config/agencies, lib/axios, lib/i18n
│   ├── public/
│   │   ├── logo-new.png     # Source unique logo (pastille blanche)
│   │   └── favicon.png
│   └── vite.config.ts
├── nginx/
├── scripts/                 # setup.ps1, backup.sh, make_favicon.py, extract_official_pdf.py
├── data/camtel_catalog/     # Snapshots catalogue officiel versionnés
├── docker-compose.yml
├── docker-compose.staging.yml
└── .env.example
```

**Flux** : `Browser (Vite) → Nginx → Django API (/api/v1/) → PostgreSQL` ; JWT access (mémoire) + refresh HttpOnly (`/api/v1/auth/`). Catalogue source de vérité = backend (jamais de données commerciales hardcodées frontend).

---

## 2. Prérequis

- **Sans Docker** : Python 3.12+, Node 18+, PostgreSQL 16 (optionnel, SQLite par défaut), Git
- **Avec Docker** : Docker Desktop 4+
- **Optionnel** : `pip install google-generativeai` / `openai` / `ollama` pour chatbot LLM, `reportlab` pour export PDF

---

## 3. Installation

### 3.1 One-command (Windows, idempotent)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1            # complet avec seed demo
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1 -SkipDemo  # sans demo
```

Effectue : venv + `pip install -r requirements.txt` → `migrate` → `seed_camtel_data` + `validate_camtel_data` + `attach_official_images` → `seed_data` (dev) → `npm install`.

### 3.2 Manuelle — voir §5, §6, §12

---

## 4. Variables d'environnement

Copier `.env.example` → `.env` (jamais commité). En production `SECRET_KEY` **50+ chars** obligatoire (`prod.py` refuse placeholder).

### 4.1 Django / Base

| Variable | Rôle | Défaut |
|---|---|---|
| `SECRET_KEY` | Clé Django (prod obligatoire) | `django-insecure-dev-only...` |
| `DJANGO_SETTINGS_MODULE` | `config.settings.dev` / `config.settings.prod` | `config.settings.dev` |
| `DEBUG` | `True`/`False` | `True` |
| `ALLOWED_HOSTS` | CSV FQDN | `localhost,127.0.0.1` |
| `LANGUAGE_CODE` | `fr` | `fr` |
| `TIME_ZONE` |  | `UTC` |
| `SEED_DEMO_DATA` | Seed demo hors-dev (`--force` sinon) | `True` dev / `False` prod |

### 4.2 Base de données

| Variable | Rôle | Défaut |
|---|---|---|
| `DB_NAME` | Nom DB ou chemin SQLite | `backend/db.sqlite3` |
| `DB_USER` | PG user |  |
| `DB_PASSWORD` | PG password |  |
| `DB_HOST` | vide → SQLite, sinon PostgreSQL |  |
| `DB_PORT` |  | `5432` |

### 4.3 API / Frontend

| Variable | Rôle | Défaut |
|---|---|---|
| `VITE_API_BASE_URL` | URL API frontend | `/api/v1` |
| `VITE_DEMO_MODE` | `true` désactive API | `false` |
| `CORS_ALLOWED_ORIGINS` | CSV origins |  |
| `CORS_ALLOW_ALL_ORIGINS` | dev only | `True` |

### 4.4 JWT / Cookies

| Variable | Rôle | Défaut |
|---|---|---|
| `JWT_ACCESS_LIFETIME_MINUTES` | Access | `30` |
| `JWT_REFRESH_LIFETIME_DAYS` | Refresh | `7` |
| `REFRESH_COOKIE_NAME` |  | `camtel_refresh` |
| `REFRESH_COOKIE_SECURE` | `True` en prod | `False` |
| `REFRESH_COOKIE_SAMESITE` | `Lax` / `Strict` / `None` | `Lax` |
| `REFRESH_COOKIE_PATH` |  | `/api/v1/auth/` |

### 4.5 Throttling / Media

| Variable | Rôle | Défaut |
|---|---|---|
| `THROTTLE_ANON_RATE` |  | `60/min` |
| `THROTTLE_USER_RATE` |  | `600/min` |
| `THROTTLE_PARTNER_RATE` |  | `1000/hour` |
| `MEDIA_URL` / `MEDIA_ROOT` |  | `/media/` / `backend/media` |
| `USE_S3_STORAGE`, `AWS_*` | S3 | `False` |

### 4.6 Chatbot / LLM

| Variable | Rôle | Défaut |
|---|---|---|
| `CHATBOT_ENABLED` |  | `True` |
| `CHATBOT_PROVIDER` | `none`/`mock`/`gemini`/`openai`/`ollama` | `none` |
| `CHATBOT_MODEL` |  |  |
| `CHATBOT_TEMPERATURE` |  | `0.3` |
| `CHATBOT_MAX_TOKENS` |  | `512` |
| `CHATBOT_TIMEOUT_SECONDS` | Hard timeout | `20` |
| `GOOGLE_API_KEY` | Gemini |  |
| `OPENAI_API_KEY` | OpenAI |  |
| `OLLAMA_BASE_URL` |  | `http://localhost:11434` |

### 4.7 Paiements — Orange Money / MTN MoMo (backend uniquement, jamais frontend)

| Variable | Rôle | Défaut |
|---|---|---|
| `PAYMENT_PROVIDER` | `mock` (dev) / `orange` / `mtn` | `mock` |
| `PAYMENT_TIMEOUT_SECONDS` |  | `15` |
| `ORANGE_MONEY_CLIENT_ID` | OAuth client ID |  |
| `ORANGE_MONEY_CLIENT_SECRET` | OAuth secret |  |
| `ORANGE_MONEY_BASE_URL` | `https://api.orange.com` (sandbox) | `https://api.orange.com` |
| `ORANGE_MONEY_MERCHANT_KEY` | Merchant key |  |
| `ORANGE_MONEY_RETURN_URL` | Retour user |  |
| `ORANGE_MONEY_CANCEL_URL` | Annulation |  |
| `ORANGE_MONEY_NOTIF_URL` | Webhook `https://domaine/api/v1/payments/webhook/orange/` |  |
| `MTN_MOMO_SUBSCRIPTION_KEY` | Ocp-Apim-Subscription-Key |  |
| `MTN_MOMO_API_USER` | API user |  |
| `MTN_MOMO_API_KEY` | API key |  |
| `MTN_MOMO_BASE_URL` | `https://sandbox.momodeveloper.mtn.com` | `https://sandbox.momodeveloper.mtn.com` |
| `MTN_MOMO_TARGET_ENVIRONMENT` | `sandbox` / `production` | `sandbox` |
| `MTN_MOMO_CALLBACK_URL` | `https://domaine/api/v1/payments/webhook/mtn/` |  |

> **Règle** : secrets uniquement en env backend, jamais exposés via `VITE_*`.

### 4.8 Email / Autres

| Variable | Rôle | Défaut |
|---|---|---|
| `EMAIL_PROVIDER` | `console` / `django` | `console` |
| `EMAIL_BACKEND` |  | `console.EmailBackend` |
| `DEFAULT_FROM_EMAIL` |  | `no-reply@oneportal.local` |
| `DATA_FRESHNESS_DAYS` | OFFICIAL stale | `30` |
| `CAMTEL_FIBER_ELIGIBILITY_URL` | API fibre |  |

Voir `config/settings/base.py` pour la liste exhaustive.

---

## 5. Backend

```powershell
cd backend
python -m venv .venv; .\.venv\Scripts\Activate.ps1  # ou source .venv/bin/activate
pip install -r ../requirements.txt
python manage.py migrate
python manage.py runserver  # http://127.0.0.1:8000/api/v1/  + /api/docs/
```

Swagger : `http://127.0.0.1:8000/api/docs/` (drf-spectacular). Health : `/api/v1/health/`, `/health/live/`, `/health/ready/`.

---

## 6. Frontend

```powershell
cd frontend/camtel/frontend
npm install
npm run dev      # http://localhost:5173 (proxy /api → :8000, /media → :8000)
npm run build    # tsc -b && vite build → dist/
npm run preview
```

Vite `vite.config.ts` : `alias @ → src/`, proxy `/api` et `/media` vers Django en dev. Code-splitting : chaque page en chunk lazy (`App/router.tsx`).

---

## 7. Base de données

- **Dev** : `DB_HOST` vide → SQLite `backend/db.sqlite3` (zéro config)
- **Prod** : renseigner `DB_NAME/USER/PASSWORD/HOST/PORT` → PostgreSQL (GinIndex `search_vector` actif)

```powershell
# PostgreSQL
$env:DB_NAME="camtel"; $env:DB_USER="camtel"; $env:DB_PASSWORD="camtel"; $env:DB_HOST="localhost"
python manage.py migrate
python manage.py reset_pg_sequences  # après import legacy si besoin
```

---

## 8. Import catalogue

Snapshot versionné `data/camtel_catalog/<date>/` (`services.json`, `segments.json`, `offers.json`, `sources.json`).

```powershell
cd backend
python manage.py seed_camtel_data                 # snapshot le plus récent
python manage.py seed_camtel_data --snapshot 2026-05-15
```

Idempotent (upsert sur `slug`/`code`). Ordre : Services (FIXES/MOBILES/TRANSPORT/DATA_CENTER) → Segments → Products (avec `specs`, `pricing_type`, `subscription_method`, `source_*`) → Sources.

---

## 9. Import images

Images officielles **jamais hotlinkées** : téléchargées localement `backend/media/products/`.

```powershell
python manage.py attach_official_images              # rattache media/products/pdf-import/ aux produits
python manage.py attach_official_images --dry-run
```

Pour un nouveau PDF officiel :

```powershell
python scripts/extract_official_pdf.py chemin/vers/catalogue.pdf  # → extrait texte + images
python manage.py seed_camtel_data --snapshot <date>
python manage.py attach_official_images --min-size 64
```

---

## 10. Seed des données CAMTEL

Comptes démo (**dev uniquement**, `is_demo=True`) :

```powershell
python manage.py seed_data              # superadmin/CamtelAdmin2026!  admin/admin123  editor/editor123
python manage.py seed_data --force      # hors DEBUG
```

`seed_camtel_data` (catalogue) est indépendant de `seed_data` (users). `scripts/setup.ps1` lance les deux.

---

## 11. Validation des données

```powershell
python manage.py validate_camtel_data
```

Vérifie : chaque `Product` a `service` (taxo V4), `OFFICIAL` a `source_url` + `last_verified_at`, `price` NULL si `QUOTE` (jamais 0), `historical_since` si `HISTORICAL`, images présentes. Sortie `ERROR`/`WARNING` avec comptages.

Qualité catalogue API : `GET /api/v1/products/data-quality/` et `GET /api/v1/catalog/quality/` (admin).

---

## 12. Lancement développement

```powershell
# Terminal 1 — backend
cd backend; python manage.py migrate; python manage.py seed_camtel_data; python manage.py seed_data; python manage.py runserver

# Terminal 2 — frontend
cd frontend/camtel/frontend; npm install; npm run dev
```

URLs : Frontend `http://localhost:5173`, API `http://127.0.0.1:8000/api/v1/`, Admin `http://localhost:5173/admin` (login `superadmin`).

Docker :

```powershell
docker compose up --build          # :8080 (Nginx) + :8000 + postgres
docker compose -f docker-compose.staging.yml up --build  # :8081, config.prod, DEBUG=False, logs JSON
```

---

## 13. Paiement Mock

```powershell
PAYMENT_PROVIDER=mock python manage.py runserver
```

- Frontend : Choix **Orange Money** / **MTN MoMo** (UI) → `POST /api/v1/payments/initiate/` (`product_id` + `Idempotency-Key`) → backend calcule `Product.price` (jamais frontend), crée `Payment PENDING` (`reference` PAY-YYYYMMDD-XXXX, `transaction_id` PAY-...), retourne `payment_url: mock://payments/...` + `simulation` flag.
- Poll `GET /api/v1/payments/<reference>/status/` → reste `PENDING` en mock (frontend simule succès après 5 polls pour démo).
- Aucune clé réelle requise, aucun encaissement.

---

## 14. Orange Money Sandbox

1. Créer app sur [developer.orange.com](https://developer.orange.com) → récupérer `CLIENT_ID`/`CLIENT_SECRET`, créer `MERCHANT_KEY`.
2. `.env` :

```
PAYMENT_PROVIDER=orange
ORANGE_MONEY_CLIENT_ID=xxx
ORANGE_MONEY_CLIENT_SECRET=xxx
ORANGE_MONEY_BASE_URL=https://api.orange.com
ORANGE_MONEY_MERCHANT_KEY=xxx
ORANGE_MONEY_RETURN_URL=https://votre-domaine/retour
ORANGE_MONEY_CANCEL_URL=https://votre-domaine/annulation
ORANGE_MONEY_NOTIF_URL=https://votre-domaine/api/v1/payments/webhook/orange/
PAYMENT_TIMEOUT_SECONDS=15
```

3. Flow : `POST /oauth/v3/token` → `POST /orange-money-webpay/cm/v1/webpayment` (`merchant_key`, `order_id=reference`, `amount`, `currency`, `return/cancel/notif_url`) → `pay_token`/`payment_url`.
4. Tester avec numéro sandbox Orange.

---

## 15. MTN MoMo Sandbox

1. [momodeveloper.mtn.com](https://momodeveloper.mtn.com) → `SUBSCRIPTION_KEY`, créer `API_USER`/`API_KEY` (sandbox).
2. `.env` :

```
PAYMENT_PROVIDER=mtn
MTN_MOMO_SUBSCRIPTION_KEY=xxx
MTN_MOMO_API_USER=xxx
MTN_MOMO_API_KEY=xxx
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_MOMO_TARGET_ENVIRONMENT=sandbox
MTN_MOMO_CALLBACK_URL=https://votre-domaine/api/v1/payments/webhook/mtn/
```

3. Flow : `POST /collection/token/` (Basic `API_USER:API_KEY`) → `POST /collection/v1_0/requesttopay` (`X-Reference-Id: uuid`, `amount`, `currency`, `externalId=reference`, `payer: {partyIdType: MSISDN, partyId}`) → `202`.
4. Statut : `GET /collection/v1_0/requesttopay/{id}` → `SUCCESSFUL`/`FAILED`/`PENDING` (mappé `COMPLETED`/`FAILED`).

---

## 16. Passage production

- `DEBUG=False`, `SECRET_KEY` 50+ chars, `ALLOWED_HOSTS=votre-domaine`, `DB_HOST` → PostgreSQL, `SECURE_SSL_REDIRECT=True`, `HSTS_SECONDS=31536000`, `REFRESH_COOKIE_SECURE=True`, `SESSION_COOKIE_SECURE=True`.
- `PAYMENT_PROVIDER=orange` ou `mtn` + vraies creds, `ORANGE_MONEY_BASE_URL` / `MTN_MOMO_BASE_URL` prod, `MTN_MOMO_TARGET_ENVIRONMENT=production`.
- `EMAIL_BACKEND=smtp` + `EMAIL_HOST/PORT/USER/PASSWORD`, `DEFAULT_FROM_EMAIL`.
- `SEED_DEMO_DATA` non défini (ou `False`).
- `python manage.py collectstatic --noinput && python manage.py migrate && python manage.py check --deploy && pip audit`

---

## 17. Webhooks

- **Orange** : `POST https://domaine/api/v1/payments/webhook/orange/` body `{reference/order_id, transaction_id/pay_token, status}` → map `SUCCESS→COMPLETED`, idempotent (ne met à jour que si `PENDING`), notif `get_or_create`.
- **MTN** : `POST https://domaine/api/v1/payments/webhook/mtn/` body `{reference/externalId, transaction_id/referenceId, status}` (`SUCCESSFUL`→`COMPLETED`).
- **Générique** : `POST /api/v1/payments/webhook/` (AllowAny, vérif signature à surcharger `verify_webhook`).
- **Vérif manuelle** : `GET /api/v1/payments/<reference>/status/` (IsAuthenticated, owner only, interroge provider, maj DB + notifs admin si `COMPLETED`).
- Configurer `ORANGE_MONEY_NOTIF_URL` / `MTN_MOMO_CALLBACK_URL` vers ces endpoints en HTTPS.

---

## 18. RBAC

| Rôle | Back-office | Permissions principales |
|---|---|---|
| `super_admin` | Oui | Tout (users, rôles, catalogue, analytics, admin) |
| `admin` | Oui | Users non-privilégiés, catalogue, souscriptions, tickets, analytics |
| `product_manager` | Oui | Catalogue, produits, services, offres, sources, qualité |
| `editor` | Oui | Actualités, promotions, médias |
| `customer` | Non | Portail client (`/mon-compte`) |
| Anonyme | Non | Portail public |

Matrice code : `apps.core.permissions` + `features/auth/permissions.ts`. `publish`/`destroy` produit réservés `IsAdminUser`. Switch `Portail ↔ Back-office` (`PortalBackofficeSwitch`) visible si `user.can_access_backoffice`, backend reste source de vérité (403 sinon). Doc : `docs/RBAC.md`.

---

## 19. Tests

```powershell
# Backend SQLite (par défaut)
cd backend; python manage.py test --verbosity 2

# Backend PostgreSQL
$env:DB_NAME="camtel"; $env:DB_USER="camtel"; $env:DB_PASSWORD="camtel"; $env:DB_HOST="localhost"; python manage.py migrate; python manage.py test --verbosity 2

# Frontend
cd frontend/camtel/frontend; npm run test -- --run; npm run lint; npm run build; npx tsc -p tsconfig.json --noEmit
```

Checks : `python manage.py check`, `python manage.py check --deploy` (prod). E2E : `npm run test:e2e` (Playwright, `playwright.config.ts`).

---

## 20. Troubleshooting

| Problème | Solution |
|---|---|
| `Database connection failed` | Vérifier `DB_HOST`/`PORT` ou SQLite `backend/db.sqlite3` writable |
| `CORS error` | `CORS_ALLOWED_ORIGINS=http://localhost:5173` dans `.env` |
| `Missing environment variables` | Copier `.env.example` → `.env` |
| `Migration errors` | `python manage.py migrate --run-syncdb` |
| `Catalogue vide` | `python manage.py seed_camtel_data` |
| `VITE_API_BASE_URL` 404 | `VITE_API_BASE_URL=/api/v1` (proxy Vite → :8000) |
| `401 Unauthorized` | Refresh token expiré → se reconnecter (`/admin/login`) |
| `Port already in use` | Changer `PORT` ou `docker compose down` |
| `Images cassées` | Vérifier `MEDIA_URL=/media/` + proxy Vite `/media → :8000` + `python manage.py attach_official_images` |
| `Paiement 400 Prix sur demande` | Produit `pricing_type=QUOTE` → CTA `Devis` normal (pas `Payer`) |
| `Payment provider non configuré` | Vérifier `PAYMENT_PROVIDER` ∈ `mock,orange,mtn` et creds correspondantes |

---

## Branding / Logo

Source unique `frontend/camtel/frontend/public/logo-new.png` (PNG 1254×1254 fond blanc, pastille `rounded-xl bg-white p-1 ring-1`) :

- Header portail + Back-office (`Logo.tsx:20` `BRAND_LOGO_SRC='/logo-new.png?v=20260830a1'`)
- Favicon `/favicon.png` (`index.html:5`), `document.title` `CAMTEL-OnePortal` (public) / `CAMTEL-Back Office` (admin)

Remplacer :

```powershell
Copy-Item nouveau-logo.png frontend/camtel/frontend/public/logo-new.png -Force
python scripts/make_favicon.py
# incrémenter ?v= dans src/shared/components/Logo.tsx
```

Legacy dans `public/legacy-logos/`.

---

## Documentation

| Document | Contenu |
|---|---|
| `docs/backend-setup.md` | Backend détaillé |
| `docs/frontend-setup.md` | Frontend |
| `docs/devops.md` | Docker, CI/CD, backup |
| `docs/partner-api.md` | API partenaire `X-API-Key` |
| `docs/oneportal-ai.md` | Chatbot LLM |
| `docs/RBAC.md` | Matrice RBAC |
| `docs/disaster-recovery.md` | RTO/RPO |
| `docs/roadmap.md` | Roadmap |

---

## Licence

Propriétaire CAMTEL. Usage interne.
