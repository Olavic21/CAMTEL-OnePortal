# RBAC.md — Matrice de permissions CAMTEL OnePortal

## Rôles
| Rôle backend (`User.role`) | API (`role`) | Usage |
|---|---|---|
| `SUPER_ADMIN` | `super_admin` | Tout (audit, users, suppression, publication) |
| `ADMIN` | `admin` | Administration opérationnelle (publication, users, logs) |
| `PRODUCT_MANAGER` | `product_manager` | Gestion du catalogue (création/modification offres) |
| `EDITOR` | `editor` | Création/modification contenu (actualités, promotions, FAQ) |
| `VIEWER` | `visitor` | Lecture seule / espace client (inscription publique) |

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
| Activity logs | Admin | — | — | — | — |
| Notifications | User (in-app) / Editor+ (admin) | — | mark-read | — | — |
| Dashboard summary | Editor+ | — | — | — | — |

## Implémentation
- Backend : `apps/core/permissions.py` (`ReadPublicWriteAdminOrEditor`, `IsAdminOrEditor`, `AdminOnly`, `IsAdminUser`, `IsEditorUser`...), choisies par ViewSet/action (ex. `ProductViewSet.get_permissions` réserve `publish`/`destroy` à `IsAdminUser`).
- Frontend : matrice `PERMISSIONS` + gardes `RequireAuth` + `can()` (UX uniquement — jamais seule).
- Les permissions critiques sont couvertes par des tests (`apps/products/tests.py`, `apps/subscriptions/tests.py`).

## Règle de sécurité
Les permissions ne sont **jamais** uniquement frontend : tous les endpoints critiques sont validés serveur.