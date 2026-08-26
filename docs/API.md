# API.md — Documentation API CAMTEL OnePortal

Prefixe : `/api/v1/`. Schéma OpenAPI : `/api/schema/` · Swagger : `/api/docs/`.

## Authentification
- `POST /auth/login/` → `{access, refresh, user}` (throttle `5/min`)
- `POST /auth/register/` → crée un compte `VIEWER`, retourne tokens (throttle `3/hour`)
- `POST /auth/refresh/` → `{access}` (throttle `20/min`)
- `POST /auth/logout/` → blackliste le refresh (révocable), 204
- `GET /auth/me/` → utilisateur courant
- Tous les endpoints protégés : `Authorization: Bearer <access>`
- i18n : en-tête `Accept-Language: fr|en`

## Catalogue / Offres (`/products/`)
| Méthode | Path | Description |
|---|---|---|
| GET | `/products/` | Liste paginée, filtres : `search`, `category`, `segment` (catégorie), `offer_type`, `product_type`, `availability`, `min_price`, `max_price`, `ordering` (liste blanche) |
| POST | `/products/` | Création (Editor+) — `category_id` requis |
| GET | `/products/compare/?ids=1,2,3` | Comparateur |
| GET/PUT/PATCH/DELETE | `/products/<slug>/` | Détail / maj / suppression (destruction Admin) |
| POST | `/products/<slug>/publish/` | Publication (Admin) |
| GET | `/products/<slug>/stats/` | Incrémente `views_count` |
| POST | `/products/<slug>/faqs/` | Ajout FAQ produit |
| GET/POST | `/products/<id>/images/` | Galerie / upload |

Champs offre supplémentaire : `product_type`, `offer_type`, `segment`, `billing_period`, `activation_fee`, `installation_fee`, `contract_duration`, `technology`, `availability`, `eligibility`, `features`, `benefits`, `terms`, `currency`, `manage_stock`.

## Souscription (`/subscriptions/`)
| Méthode | Path | Rôle | Description |
|---|---|---|---|
| POST | `/subscriptions/` | Public/anon | Crée une demande → `request_number`, historique initial, notification |
| GET | `/subscriptions/` | Admin | Liste admin |
| GET/PUT/PATCH/DELETE | `/subscriptions/<id>/` | Admin | Détail / mise à jour / suppression |
| POST | `/subscriptions/<id>/change-status/` | Admin | Transition de statut + historique + notification client (`{status, reason?, comment?}`) |
| GET | `/subscriptions/my-subscriptions/` | Client (auth) | Ses demandes |
| GET | `/subscriptions/my-dashboard/` | Client (auth) | KPIs `{total, in_progress, completed, rejected}` |

Statuts : `PENDING, UNDER_REVIEW, ADDITIONAL_INFO_REQUIRED, APPROVED, SCHEDULED, ACTIVATED, REJECTED, CANCELLED`.

## Autres modules
- `GET /categories/` · `POST /categories/` (Editor) · `GET/PUT/PATCH/DELETE /categories/<slug>/`
- `GET /news/`, `POST /news/` (Editor), détail par slug ; `GET /promotions/`, `POST /promotions/` (Editor), `GET /promotions/active/`
- `GET/POST /media/` (Editor) ; `GET/POST /contacts/` (contact public : throttle `5/hour`), marquage lu admin
- `GET /activity-logs/` (Admin) ; `GET/POST /notifications/`, `POST /notifications/<id>/mark-read/`, `POST /notifications/mark-all-read/`
- `GET /dashboard/summary/` (Editor+) ; `GET /search/autocomplete/?q=...` (public, throttle `120/min`) ; `POST /chatbot/ask/` (public, throttle `30/min`) ; `GET /health/` (public)

## API partenaire (`/api/v1/partner/`)
Auth : en-tête `X-API-Key` + scope. Rate limit : `THROTTLE_PARTNER_RATE` (défaut `1000/hour`).
`GET /partner/products/` (scope `products:read`), `GET /partner/categories/` (`categories:read`), `GET /partner/news/` (`news:read`).

## Gestion des erreurs
Code d'erreur HTTP standard DRF + réponses simples pour les cas métier (ex. 400 sur statut invalide, 401 auth échouée, 403 permission refusée). Aucune stack trace exposée (DEBUG=False en prod).

## Exemples
```bash
# Connexion
curl -X POST /api/v1/auth/login/ -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"..."}'

# Créer une souscription (anonyme)
curl -X POST /api/v1/subscriptions/ -H 'Content-Type: application/json' \
  -d '{"product":3,"full_name":"Jean","email":"j@x.cm","phone":"+237600000000"}'

# Transition admin
curl -X POST /api/v1/subscriptions/12/change-status/ -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' -d '{"status":"APPROVED","comment":"Eligible"}'

# Filtres offres
curl -G /api/v1/products/ --data-urlencode 'offer_type=FIBER' --data-urlencode 'max_price=200'
```