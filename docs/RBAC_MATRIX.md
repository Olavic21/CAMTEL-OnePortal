# RBAC_MATRIX.md

Matrice des permissions CAMTEL OnePortal — ROLE / PERMISSION / RESOURCE / ACTION.

> Source de vérité : cahier des charges (sections 18, 19, 20, 21, 23) + `apps/core/permissions.py`.
> Date : 2026-08-28.

---

## 1. Rôles

| Rôle interne | Rôle API (contrat frontend) | Description |
|---|---|---|
| `SUPER_ADMIN` | `super_admin` | Super Admin — administration complète, gestion des admins |
| `ADMIN` | `admin` | Admin back-office |
| `PRODUCT_MANAGER` | `product_manager` | Gestionnaire produit (catalogue) |
| `EDITOR` | `editor` | Éditeur (actualités, médias) |
| `VIEWER` (déprécié) | `viewer` | Lecture seule back-office (legacy) |
| `CUSTOMER` | `customer` | **Rôle minimum de tout utilisateur authentifié** du portail |
| — | — | « Anonymous Visitor » : requête **non authentifiée** — PAS un rôle RBAC |

> Règle #18 : **VISITOR est supprimé du RBAC.** Le rôle API `visitor` est
> accepté en entrée comme shim de compatibilité et **mappé sur `customer`** ;
> il n'est jamais émis en sortie. `VIEWER` reste un rôle back-office lecture
> seule (couvre d'éventuels comptes legacy) et devient `customer` s'il est
> réassigné via l'API.

## 2. Permission explicite `ACCESS_BACKOFFICE` (#20/#21)

- Backend : `apps/core/permissions.py::AccessBackoffice` + `can_access_backoffice(user)`.
- Frontend : `role + can_access_backoffice` exposés par `GET /api/v1/auth/me/`
  pour piloter le switch **PORTAL ↔ BACKOFFICE** (sans double authentification).
- **Le backend reste l'autorité** sur chaque endpoint : un `CUSTOMER` reçoit
  une `403` même en manipulant directement l'URL du back-office.

| Rôle | `can_access_backoffice` |
|---|---|
| anonymous | `false` |
| `CUSTOMER` | **`false`** |
| `VIEWER` | `true` (lecture seule) |
| `PRODUCT_MANAGER`, `EDITOR` | `true` |
| `ADMIN`, `SUPER_ADMIN` | `true` |

## 3. Matrice ROLE → ACTION → RESOURCE

### 3.1 Catalogue (public / écriture)

| Action | anonymous | CUSTOMER | VIEWER | EDITOR | PRODUCT_MANAGER | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|---|---|---|
| `VIEW_PUBLIC_CATALOG` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `SEARCH` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `CREATE_PRODUCT` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `UPDATE_PRODUCT` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `PUBLISH_PRODUCT` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `DELETE_PRODUCT` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `MANAGE_SERVICES` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `MANAGE_SOURCES` / `VERIFY_SOURCE` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### 3.2 Souscriptions

| Action | anonymous | CUSTOMER | VIEWER | EDITOR | PRODUCT_MANAGER | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|---|---|---|
| `CREATE_SUBSCRIPTION` | ✅ (civil invité) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `VIEW_OWN_SUBSCRIPTIONS` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `VIEW_ALL_SUBSCRIPTIONS` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `CHANGE_SUBSCRIPTION_STATUS` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

> Ownership (#23) : le client ne voit QUE ses souscriptions ; accès à une
> souscription d'un autre → `404` (existence dissimulée).

### 3.3 Paiements

| Action | anonymous | CUSTOMER | ... | ADMIN/SUPER_ADMIN |
|---|---|---|---|---|
| `CREATE_PAYMENT` | ❌ | ✅ (montant 100% serveur) | ❌ | ✅ |
| `VIEW_OWN_PAYMENTS` | ❌ | ✅ | — | ✅ (tous) |

> Sécurité (#25) : le client ne fournit JAMAIS le montant ; `Payment.amount`
> est calculé côté serveur depuis le prix officiel du produit.

### 3.4 Tickets support

| Action | anonymous | CUSTOMER | VIEWER/EDITOR | PRODUCT_MANAGER | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|---|---|
| `CREATE_TICKET` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `VIEW_OWN_TICKETS` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `REPLY_OWN_TICKET` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `LIST_ALL_TICKETS` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `ASSIGN_TICKET` / `CLOSE` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

### 3.5 Notifications

| Action | CUSTOMER | staff |
|---|---|---|
| `VIEW_OWN_NOTIFICATIONS` | ✅ | ✅ |
| `MARK_READ` | ✅ (les siennes) | ✅ |
| `VIEW_GLOBAL_NOTIFICATIONS` (user=None) | ❌ | ✅ |

### 3.6 Analytics & qualité

| Action | droits requis |
|---|---|
| `VIEW_DASHBOARD` | `IsAdminOrEditor` (STAFF_ROLES) |
| `VIEW_ANALYTICS_SUMMARY` | `IsAdminOrEditor` |
| `POST_ANALYTICS_EVENT` (navigateur) | public (liste blanche + throttling) |
| `POST_PAYMENT_*/SUBSCRIPTION_*` | **serveur uniquement** (jamais client) |

### 3.7 Comptes & audit

| Action | PRODUCT_MANAGER | EDITOR | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|
| `MANAGE_USERS` (lister/gérer comptes non-admins) | ❌ | ❌ | ✅ | ✅ |
| `PROMOTE_TO_ADMIN` | ❌ | ❌ | ❌ | ✅ |
| `VIEW_ACTIVITY_LOG` | ❌ | ❌ | ❌ | ✅ (listable), ADMIN ✅ `target_model` |
| `ACCESS_BACKOFFICE` | ✅ | ✅ | ✅ | ✅ |

## 4. Implémentation serveur (source de vérité)

```python
# apps/core/permissions.py
STAFF_ROLES      = {'SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'EDITOR'}
ADMIN_ROLES      = {'SUPER_ADMIN', 'ADMIN'}
BACKOFFICE_ROLES = STAFF_ROLES | {'VIEWER'}   # jamais CUSTOMER

class AccessBackoffice(BasePermission): ...
class IsAdminUser(BasePermission): ...
class IsAdminOrEditor(BasePermission): ...
class AdminOnly(BasePermission): ...
class ReadPublicWriteAdminOrEditor(BasePermission): ...
```

Points d'entrée protégés par ces permissions :
`/products/` (écriture), `/products/{slug}/publish|destroy`, `/product-faqs/`,
`/subscriptions/` (list/update/change-status : `AdminOnly`),
`/users/` (`AdminOnly`), `/activitylogs/` (`AdminOnly`),
`/analytics/summary/` (`IsAdminOrEditor`), `/catalog/quality/` (`IsAdminOrEditor`).

## 5. Tests de référence

- `apps/users/tests.py::AuthApiRBACTest` : register→`customer`, `me`→`can_access_backoffice`,
  shim `visitor`→`customer`, CUSTOMER interdit de `/users/`.
- `apps/subscriptions/tests.py` : ownership (souscription B invisible pour client A → `404`).
- `apps/core/tests.py` : isolation tickets, paiement montant serveur.