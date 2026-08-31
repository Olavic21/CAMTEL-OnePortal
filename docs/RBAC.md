# RBAC.md — Matrice de permissions CAMTEL OnePortal

## Rôles

| Rôle backend (`User.role`) | API (`role`) | Accès Back Office | Usage |
|---|---|---|---|
| `SUPER_ADMIN` | `super_admin` | ✅ | Tout : audit, gestion des acteurs Back Office, modification des rôles, publication, suppression |
| `ADMIN` | `admin` | ✅ | Administration opérationnelle (catalogue, souscriptions, tickets, comptes non privilégiés) |
| `PRODUCT_MANAGER` | `product_manager` | ✅ | Gestion du catalogue (création/modification offres, promotions, sources) |
| `EDITOR` | `editor` | ✅ | Contenu éditorial (actualités, média, FAQ) |
| `VIEWER` *(déprécié)* | `viewer` | ✅ (legacy) | Lecture seule — plus jamais attribué, converti en CUSTOMER |
| `CUSTOMER` | `customer` | ❌ | Espace client uniquement (portail public) |

> **Important (cahier des charges #18)** : il n'existe **aucun rôle VISITOR**.
> Un visiteur non authentifié est **ANONYMOUS**. Toute inscription publique crée
> un compte `CUSTOMER` (jamais choisi par le formulaire — rôle attribué côté
> serveur). L'entrée `visitor` historique est acceptée en *entrée* d'API comme
> alias de compatibilité et mappe sur `CUSTOMER` ; la sortie n'émet jamais
> `visitor`.

## Switch Portail ↔ Back Office (#20/#21)

- Prédicat serveur partagé : `apps/core/permissions.py::can_access_backoffice()`
  (`is_staff` ou rôle ∈ `BACKOFFICE_ROLES = STAFF_ROLES ∪ {VIEWER}` — jamais CUSTOMER).
- Exposé au frontend par `GET /api/v1/auth/me/` via `can_access_backoffice`.
- Le switch (`PortalBackofficeSwitch`) est visible uniquement si ce flag est
  vrai ; il conserve la session JWT (aucune reconnexion).
- Le backend reste l'autorité : un CUSTOMER qui appelle un endpoint back-office
  reçoit 403, un anonyme 401.

## Matrice (côté serveur — permissions DRF)
| Ressource | Lecture publique | Création | Modification | Publication | Suppression |
|---|---|---|---|---|---|
| Products / Offers | ✅ | Editor+ | Editor+ | **Admin+** | **Admin+** |
| Categories | ✅ | Editor+ | Editor+ | — | Editor+ |
| News | ✅ | Editor+ | Editor+ | Editor+ | Editor+ |
| Promotions | ✅ (list) | Editor+ | Editor+ | Editor+ | Editor+ |
| Media | ✅ | Editor+ | Editor+ | — | Editor+ |
| Contacts | ✅ (création) | Public | ❌ | (mark read) Editor+ | Editor+ |
| Subscriptions | ✅ (création) | Public/anon | Admin (change-status) | Admin | Admin |
| Users | Admin | Admin | Admin | — | Admin |
| Roles (métadonnées) | Admin | — | — | — | — |
| Activity logs | Admin (super_admin côté UI) | — | — | — | — |
| Notifications | User (in-app) / Editor+ (admin) | — | mark-read | — | — |
| Dashboard summary | Editor+ | — | — | — | — |

## Gestion des acteurs Back Office (réservée côté serveur)

- `PATCH /api/v1/users/<id>/` : un Admin ne peut **ni** gérer un compte
  `ADMIN`/`SUPER_ADMIN`, **ni** attribuer un rôle privilégié. Seul un
  `SUPER_ADMIN` le peut (`PRIVILEGED_ROLES`, `apps/users/serializers.py`).
- Protections anti-lockout : interdiction de modifier son propre compte via
  cette interface (self-demotion), interdiction de rétrograder/désactiver/
  supprimer le **dernier Super Admin actif** (`_another_active_super_admin`).
- `GET /api/v1/roles/` : métadonnées read-only (rôle, comptage réel des
  comptes, accès back-office, privilégié ou non) — Admin+.

## Implémentation
- Backend : `apps/core/permissions.py` (`ReadPublicWriteAdminOrEditor`, `IsAdminOrEditor`, `AdminOnly`, `IsAdminUser`, `IsEditorUser`...), choisies par ViewSet/action (ex. `ProductViewSet.get_permissions` réserve `publish`/`destroy` à `IsAdminUser`).
- Frontend : matrice `PERMISSIONS` (`features/auth/permissions.ts`) + gardes `RequireAuth` (roles/permission/backoffice) + `can()` (UX uniquement — jamais seule).
- Les permissions critiques sont couvertes par des tests (`apps/users/tests.py`, `apps/products/tests.py`, `apps/subscriptions/tests.py`, `apps/core/tests.py`).

## Règle de sécurité
Les permissions ne sont **jamais** uniquement frontend : tous les endpoints critiques sont validés serveur.