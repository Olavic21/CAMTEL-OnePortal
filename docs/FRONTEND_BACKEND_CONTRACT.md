# FRONTEND_BACKEND_CONTRACT.md

Contrat API entre le portail client (PORTAL) et le back-office (BACKOFFICE).
Le frontend consomme **exclusivement** ces endpoints. Toute modification d'un
endpoint doit suivre la règle #50 (versioning ou compatibilité temporaire).

Base URL : `https://api.camtel-portal.cm` (dev: `http://localhost:8000`).
Les endpoints sont préfixés `/api/v1/`.

---

## Authentication & session

| Élément | Contrat |
|---|---|
| `POST /api/v1/auth/token/` | `{username, password}` → `{access, refresh}`. |
| `POST /api/v1/auth/token/refresh/` | `{refresh}` → `{access}`. |
| `GET /api/v1/auth/me/` | `{is_authenticated, user:{id,username,email,role}, permissions:[], can_access_backoffice: bool}` |
| Switch PORTAL ↔ BACKOFFICE | **même session** — décision via `can_access_backoffice` exposé par `/me`. Le backend protège chaque endpoint BO côté serveur. |

Rôle `anonymous` n’est **jamais** émis en sortie ; un visiteur non authentifié reçoit `is_authenticated:false, role:null, can_access_backoffice:false`.

---

## user (profil)

| Method | URL | Auth | Permission |
|---|---|---|---|
| GET | /api/v1/auth/me/ | optional | — |
| GET | /api/v1/users/profile/ | required | owner |
| PATCH | /api/v1/users/profile/ | required | owner |

---

## Services / Segments

```
GET /api/v1/services/
GET /api/v1/services/{slug}/      # fixes | mobiles | transport | data-center
GET /api/v1/segments/
GET /api/v1/segments/{slug}/       # particulier | professionnel | entreprise | administration
```

Réponse : `{id, slug, name, description, status, display_order}`.

---

## Products (catalogue)

```
GET /api/v1/products/
GET /api/v1/products/{slug}/
```

Filtres query : `?service=data-center&segment=entreprise&pricing_type=MONTHLY&availability=AVAILABLE&status=ACTIVE&product_type=VPS&min_price=&max_price=&ordering=`

**ProductResponse** :
```
{
  id, slug, name, service:{slug,name}, segments:[{slug,code,name}],
  category:{slug,name}, description, pricing:{type,currency,price,billing_period,billing_period_label},
  is_active, views_count,
  specifications:[{key,value,unit,data_type}],
  benefits:[{title,description,display_order}],
  images:[{url,alt_text,is_primary}],
  faqs:[{question,answer,order}],
  source:{verification_status, source_name, source_url, last_verified_at},
  status
}
```

`price` est `null` quand `pricing_type=QUOTE` (jamais `price=0` pour « inconnu »).

---

## Search

```
GET /api/v1/products/search/?q=voiture&service=mobiles&segment=particulier
```
→ `{query, count, results: [ProductSummary], pagination}`.

---

## Subscriptions

```
POST /api/v1/subscriptions/          # create (AllowAny) — client calcule rien
GET  /api/v1/subscriptions/my-subscriptions/
GET  /api/v1/subscriptions/my-dashboard/
GET  /api/v1/subscriptions/{slug}/    # owner ou admin
POST /api/v1/subscriptions/{slug}/change-status/  # admin
GET  /api/v1/subscriptions/{slug}/stats/
```

**Création** : le client envoie `{product, full_name, email, phone, message, address}` ; le **backend** calcule le prix. Le client ne contrôle jamais `amount` ni `price`.

**Statuts** : `PENDING | UNDER_REVIEW | ADDITIONAL_INFO_REQUIRED | APPROVED | SCHEDULED | ACTIVATED | ACTIVE | SUSPENDED | REJECTED | CANCELLED | COMPLETED | DRAFT | ACTIVATING`.
Alias acceptés en entrée : `SUBMITTED`→`PENDING`.

---

## Payments

```
POST /api/v1/payments/initiate/       # body: {product_id} OU {subscription_id}
GET  /api/v1/payments/{reference}/
```

**Sécurité** : le montant est **toujours calculé serveur** depuis le produit officiel. Un `amount` fourni par le client est ignoré. Idempotence via `idempotency_key`. `409 Conflict` si déjà payé.

---

## Notifications

```
GET /api/v1/notifications/           # scope client = SES notifications
POST /api/v1/notifications/{id}/mark-read/
POST /api/v1/notifications/mark-all-read/
```

Fil : `?unread=true`. Champ `channel` : `SUBSCRIPTION | PAYMENT | TICKET | ACTIVATION | SYSTEM`.

---

## Support / tickets

```
GET  /api/v1/tickets/my-tickets/     # client → SES tickets
POST /api/v1/tickets/                # create (propriétaire = client)
GET  /api/v1/tickets/{id}/           # owner ou admin
POST /api/v1/tickets/{id}/reply/     # owner ou support/admin
```

`list` est admin-only. Un client accède à un ticket B via `403`.

---

## Analytics

```
POST /api/v1/analytics/             # public, rate-limited
GET  /api/v1/analytics/summary/      # admin/editor
```

Payload max 4 Ko, max 20 clés, valeurs scalaires. Événements interdits par le client : `payment_*`, `subscription_approved/activated` (serveur seul).

---

## Chatbot

```
POST /api/v1/chatbot/
{ question: "Quel est le prix du VPS M ?" }
```
→ `{answer, source: {product, price, currency, source_url, last_verified_at, verification_status}, provider, intent}`.
Priorité absolue à la **DB catalogue** avant le RAG.

---

## Health

```
GET /health/live
GET /health/ready   # {status, database, cache, storage}
```

---

## Erreurs communes

| Code | Signification |
|---|---|
| 401 | Auth requise |
| 403 | Permission refusée (RBAC) |
| 404 | Ressource inexistante ou invisible (IDOR) |
| 409 | Idempotence / double opération |
| 400 | Validation / transition interdite |
