# API CONTRACT FINAL — CAMTEL-OnePortal

Contrat d'API figé (Phase 62). Frontend et backend utilisent cette version comme référence.
Version : 1.0.0 — valide après intégration full-stack (Phase 1-5).

## Conventions

- Base URL : `/api/v1/`
- Auth : JWT (access token en header `Authorization: Bearer <token>`, refresh en cookie HttpOnly `refresh_token`)
- Pagination : `{ count, next, previous, results }` (PAGE_SIZE côté serveur)
- Erreurs : `{ detail: string }` ou `{ field: [messages] }` (400/422)
- Montants : **toujours string** côté API (ex. `"25000.00"`) — jamais de float
- Dates : ISO 8601 (`"2026-08-30T08:30:40Z"`)
- Null : champ absent ou `null` (jamais `0` pour "prix inconnu")

---

## Auth

### POST /api/v1/auth/login/
Request : `{ username, password }`
Response 200 : `{ access, refresh, user: { id, username, email, role, permissions, can_access_backoffice } }`

### POST /api/v1/auth/refresh/
Request : `{ refresh }` (ou cookie HttpOnly)
Response 200 : `{ access }`

### GET /api/v1/auth/me/
Auth : IsAuthenticated
Response 200 : `{ id, username, email, first_name, last_name, role, permissions, can_access_backoffice, date_joined }`

### POST /api/v1/auth/register/
Request : `{ username, email, password, first_name?, last_name? }`
Response 201 : `{ id, username, email, role }`

---

## Catalogue (public)

### GET /api/v1/services/
Auth : AllowAny
Response 200 : `{ count, results: [{ id, slug, code, name, name_en, description, description_en, status, display_order }] }`
Slugs stables : `fixes`, `mobiles`, `transport`, `data-center`
Codes : `FIXED`, `MOBILE`, `TRANSPORT`, `DATA_CENTER`

### GET /api/v1/services/{slug}/
Auth : AllowAny
Response 200 : même objet qu'au-dessus

### GET /api/v1/products/
Auth : AllowAny
Query params : `service` (slug), `segment` (slug), `search`, `availability`, `ordering`, `page`
Response 200 : `{ count, results: [ProductSerializer] }`

### GET /api/v1/products/{slug}/
Auth : AllowAny
Response 200 : `ProductSerializer` complet (service, segments, sources, images, faqs, price_on_request, cta_type)

### GET /api/v1/products/compare/?ids=1,2,3
Auth : AllowAny

## Espace client (IsAuthenticated)

### GET /api/v1/subscriptions/my-subscriptions/
Response 200 : `{ count, results: [SubscriptionRequestSerializer] }` (owner-scoped)

### POST /api/v1/subscriptions/
Request : `{ product_id, note? }`
Response 201 : `SubscriptionRequestSerializer` (statut serveur initial)

### GET /api/v1/subscriptions/{id}/
Owner-scoped (404 si non propriétaire)

### POST /api/v1/payments/initiate/
Request : `{ product_id, idempotency_key? }` — **montant JAMAIS accepté du client**
Response 201 : `{ id, provider, transaction_id, reference, status, amount, currency, created_at, payment_url?, simulation? }`
Response 200 (idempotence) : même payload, transaction existante
Response 400 : prix sur demande ou montant invalide

### GET /api/v1/payments/
Auth : IsAuthenticated — **strictement owner-scoped**
Query : `limit` (1-100, défaut 50)
Response 200 : `{ count, results: [...], summary: { total_paid, currency, pending_count, failed_count, completed_count, billing_status, next_due_date } }`
Mapping statuts : `COMPLETED→PAID`, `PENDING→PENDING`, `FAILED/CANCELLED→FAILED`
`paid_at` : uniquement si COMPLETED — jamais simulé. `next_due_date` : toujours `null`.

### GET /api/v1/notifications/  +  POST mark-read/  +  mark-all-read/
### GET /api/v1/tickets/my-tickets/  +  POST /api/v1/tickets/  +  POST {id}/reply/
Statuts ticket : OPEN, IN_PROGRESS, WAITING_USER, RESOLVED, CLOSED. Owner-scoped.

---

## Analytics

### POST /api/v1/analytics/events/
Auth : AllowAny (rate-limited). event_type : `offer_view`, `offer_compare`, `search`, `subscription_*`, `payment_started/completed`, `service_view`, `product_view`, `faq_view`, `chatbot_question`
Response 201 : `{ id, event_type, created_at }`

---

## Back-office (ACCESS_BACKOFFICE)

### GET /api/v1/subscriptions/admin-analytics/  +  /api/v1/analytics/summary/  +  /api/v1/users/  +  POST /products/{id}/publish/  +  /tickets/ (IsSupport)

---

## Health

### GET /health/  /health/live/  /health/ready/
Response 200 : `{ status: "ok", database, storage, version }`

---

## Codes d'erreur

| Code | Signification |
|---|---|
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Interdit (rôle insuffisant) |
| 404 | Introuvable OU non propriétaire |
| 409 | Conflit |
| 422 | Validation |
| 429 | Rate limit |
| 500 | Erreur serveur |

## Règles de sécurité (rappel)

- Montant de paiement **toujours calculé côté serveur**.
- `GET /payments/` → **strictement** les paiements de `request.user`.
- CUSTOMER → toujours 403 sur le back-office, même en URL directe.
- Aucun secret backend exposé côté frontend.

Response 200 : `{ count, results: [ProductCompareSerializer] }`

### GET /api/v1/search/?q=&service=&segment=
Auth : AllowAny
Response 200 : `{ count, results: [{ type, ... }] }` (produits + documents + FAQ groupés)

### GET /api/v1/documents/?q=&kind=&product_id=
Auth : AllowAny
Response 200 : `{ count, results: [{ id, title, kind, url, source_url, product_id }] }`

---

## Recommandations & Éligibilité

### GET /api/v1/recommendations/?product=&slug=&segment=&limit=
Auth : AllowAny
Response 200 : `{ count, results: [{ product, score, why_recommended }] }`

### POST /api/v1/eligibility/check/
Auth : AllowAny
Request : `{ product_id, address, phone? }`
Response 200 : `{ status: "SIMULATED"|"VERIFIED"|"UNAVAILABLE", eligible: bool, message, provider }`
