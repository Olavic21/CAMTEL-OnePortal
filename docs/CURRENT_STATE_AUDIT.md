# CURRENT_STATE_AUDIT.md — Audit read-only de l'état actuel

> Date : 2026-08-30
> Méthode : analyse statique du repository (aucune modification de code)
> Périmètre : backend, frontend, base de données, authentification, RBAC,
> routes, Back Office, portail, API, users, roles, permissions.

---

## 1. Vue d'ensemble de la stack

| Couche | Technologie | Emplacement |
|---|---|---|
| Backend | Python 3.12, Django 6.0.7, DRF 3.17.1, SimpleJWT 5.5.1, drf-spectacular | `backend/` |
| Base de données | SQLite (dev) / PostgreSQL (prod/staging) | `backend/db.sqlite3` |
| Frontend | React 18.3, TypeScript, Vite 8, Tailwind 3, React Query 5, react-router-dom 7, i18next FR/EN, recharts, framer-motion | `frontend/camtel/frontend/` |
| Données métier | Snapshots officiels CAMTEL versionnés | `data/camtel_catalog/2026-08-25/` |
| Docs | RBAC, matrices, rapports d'intégration | `docs/` |

Le projet est une application Django/DRF multi-apps (`apps.users`, `apps.core`,
`apps.products`, `apps.categories`, `apps.news`, `apps.promotions`,
`apps.media`, `apps.contacts`, `apps.subscriptions`, `apps.partners`) exposée
sous `/api/v1/*`, consommée par une SPA React.

---

## 2. Ce qui fonctionne (vérifié)

### Backend
- **`python manage.py check`** : `0 issues`.
- **Migrations** : toutes appliquées (`showmigrations` à 100%).
- **`makemigrations --check --dry-run`** : `No changes detected`.
- **Tests** : baseline historique `Ran 187 tests OK (skipped=1)` (log `be_tests.log`).
- **Sécurité auth** : JWT access + refresh en cookie HttpOnly avec rotation +
  blacklist ; inscription publique → `CUSTOMER` ; `visitor` → shim → `CUSTOMER`.
- **RBAC backend** (`apps/core/permissions.py`) : `AccessBackoffice`,
  `IsAdminUser`, `AdminOnly`, `IsAdminOrEditor`,
  `ReadPublicWriteAdminOrEditor`, `can_access_backoffice()`.
  Rôles : `SUPER_ADMIN`, `ADMIN`, `PRODUCT_MANAGER`, `EDITOR`, `VIEWER`
  (déprécié), `CUSTOMER`. Aucun rôle `VISITOR`.
- **Endpoints protégés** : `/users/` (AdminOnly), `/subscriptions/` list/change
  (AdminOnly), `/activitylogs/` (AdminOnly), `/analytics/summary/`
  (IsAdminOrEditor), `/products/` écriture (STAFF), publication/suppression
  produit (Admin), tickets list (AdminOnly) + isolation owner (404).
- **Catalogue** : `Service`, `Segment`, `Product` avec taxonomie officielle
  (4 services : Fixes/Mobiles/Transport/Data Center ; 4 segments :
  Particulier/Professionnel/Entreprise/Administration). Commandes idempotentes :
  `seed_camtel_data`, `import_camtel_catalog`, `validate_camtel_data`,
  `attach_official_images`.
- **Souscriptions** : workflow complet avec `request_number`, historique
  (`SubscriptionStatusHistory`), matrice de transitions, notifications,
  ownership (404 pour les souscriptions d'autrui), `change-status`,
  `admin-analytics`.
- **Core** : notifications owner-scopées, tickets support, paiements (montant
  calculé serveur, référence unique), activity logs, dashboard summary,
  analytics summary, chatbot RAG avec fallback search, recherche globale,
  éligibilité (provider simulé, badge explicit), documents, recommandations.
- **Base actuelle (dev)** : 6 utilisateurs (superadmin/admin/editor + comptes de
  test), 46 produits, 4 services, 4 segments.

### Frontend
- **`npm run build`** : OK (build en 45 s, chunks lazy chargés).
- **`npm run lint`** : OK (0 warning).
- **`npm run test`** : 32 tests, 7 fichiers — OK.
- **Routing** : guard `RequireAuth` (rôles + permissions), routes publiques +
  espace client + `/admin` protégé, code-splitting par page.
- **Auth** : `AuthProvider` (login/register/logout/me), tokenStorage, mode demo
  opt-in (`VITE_DEMO_MODE=true`), fallback mockAuthStore.
- **Switch Portail ↔ Back Office** : composant `PortalBackofficeSwitch` présent
  dans le header public (desktop + menu mobile), piloté par
  `can_access_backoffice` du backend ; navigation sans reconnexion.
- **Hub administration** : `AdminSidebar` filtré par permissions,
  `NotificationBell`, pages admin pour presque chaque module.
- **Gestion utilisateurs (Superadmin/Admin)** : `AdminUserListPage` — création,
  changement de rôle, activation/désactivation, suppression, avec gardes
  frontend (`getAssignableRoles`, `canManageAccount`).
- **Homepage** : hero, 4 univers services, segments, « trouver ma solution »,
  produits depuis l'API, actualités depuis l'API, assistant.
- **i18n test** : OK (clés FR/EN présentes).
---

## 3. Ce qui fonctionne partiellement / est fragile

1. **Création de compte par un Admin/Superadmin** : le formulaire admin envoie
   `password`, mais `UserSerializer` ne déclare pas de champ `password` → le
   mot de passe est ignoré silencieusement. Le compte créé a un mot de passe
   inutilisable → **impossible de s'y connecter**. (Bug fonctionnel réel.)
2. **Règles de gestion des comptes non appliquées côté serveur** : le
   `UserViewSet` autorise un `ADMIN` à modifier/créer/supprimer des comptes
   `ADMIN`/`SUPER_ADMIN`, à s'auto-rétrograder, à désactiver le dernier
   superadmin. Les gardes existent côté frontend mais **pas côté backend**
   (`canManageAccount`, `getAssignableRoles`). Contre-exigence : « ne jamais
   gérer le rôle uniquement côté frontend ».
3. **Dashboard summary** trop pauvre pour le Superadmin : seuls produits publiés
   / brouillons / promotions / messages contact. Pas de compteurs utilisateurs,
   acteurs back-office, rôles, souscriptions, tickets, paiements, notifications.
4. **Header Back Office** : `AdminLayout` affiche uniquement ThemeToggle +
   NotificationBell. Absence de : nom utilisateur, rôle, switch
   Portail↔BackOffice, logout, breadcrumbs (« CAMTEL-Back Office » n'est affiché
   qu'en mobile). Le switch n'est pas visible depuis le Back Office desktop.
5. **Mêmes routes pour tous les rôles back-office** : le guard `/admin` est
   `RequireAuth roles={['editor']}` (hiérarchie) ; aucune garde frontend sur
   `/admin/catalogue`, `/admin/services`, `/admin/offres`, `/admin/clients`,
   `/admin/analytics`, `/admin/sources`, `/admin/qualite`,
   `/admin/administration`. Le menu ne masque que 4 entrées (`manage_*`).
6. **Page Administration** : sections « roles » et « settings » avec boutons
   `manage` sans action (boutons décoratifs → règle #53/#59). Aucune vraie page
   de gestion des rôles/permissions.
7. **Homepage** : charge tout le catalogue (`useCatalog({})`, page_size par
   défaut non bornée) — non conforme à la règle #48 (ne pas charger tout le
   catalogue sur la homepage). Pas de limite « produits mis en avant » par
   l'API.
8. **`frontend/camtel/frontend/.env.example`** : `VITE_DEMO_MODE=True` →
   une installation vierge qui copie ce fichier démarre **en mode mock**
   (mockAuthStore) au lieu du vrai backend. Contraire à la règle #52.
9. **Services — fallback mock** : `servicesApi.ts` retombe sur
   `mocks/services.ts` si l'API est indisponible. C'est un mode dégradé
   documenté mais il produit des données commerciales fictives si le backend
   est down. À neutraliser (erreur explicite au lieu d'un catalogue fictif).
10. **Page « Clients »** : réutilise `/users/` (gestion des comptes) → un
    `ADMIN` y a accès (AdminOnly). Pas de page dédiée « clients » au sens
    souscriptions. Point de cohérence mineur.
11. **README.md racine** : encodage cassé (mojibake), procédure incomplète
    (pas de `.env`, pas de chargement catalogue officiel, pas de procédure
---

## 4. Ce qui est mocké / simulé / hardcodé

| Élément | Statut | Emplacement | Verdict |
|---|---|---|---|
| `mocks/services.ts` | Fallback si API down | `frontend/.../src/mocks/services.ts` | À neutraliser (données commerciales fictives) |
| `mockAuthStore` | Mode demo opt-in | `frontend/.../shared/lib/mockAuthStore.ts` | OK si désactivé par défaut (à corriger dans `.env.example`) |
| Paiement | Provider `mock` (abstraction) | `backend/apps/core/providers.py` | OK — simulateur explicite |
| Éligibilité | Provider `mock` (SIMULATED) | `backend/apps/core/v2_services.py` | OK — badge SIMULATED |
| Chatbot | Fallback search | `backend/apps/core/chatbot_service.py` | OK |
| Données catalogue | OFFICIAL en base (46 produits) | DB + `data/camtel_catalog/` | OK — source de vérité backend |
| Statistiques dashboard | Endpoint réel `/dashboard/summary/` | `apps/core/views.py` | OK (mais incomplet pour Superadmin) |
| `stats` produit | Endpoint réel | `apps/products/views.py` | OK |

Aucun `console.log` dans le code source. Les `localhost:` restants sont des
configs dev légitimes (proxy Vite, Celery, fournisseurs).

---

## 5. RBAC — état réel de la matrice

| Rôle | Accès Back Office (`can_access_backoffice`) | Permissions frontend typiques | Backend |
|---|---|---|---|
| `super_admin` | ✅ | toutes | tous endpoints |
| `admin` | ✅ | manage_users, manage_subscriptions, publish, delete… | AdminOnly |
| `product_manager` | ✅ | edit_product_draft, edit_promotion… | ReadPublicWriteAdminOrEditor |
| `editor` | ✅ | edit_news, upload_media… | IsAdminOrEditor (rédactionnel) |
| `viewer` (déprécié) | ✅ (flag) / ❌ (frontend) | — | legacy |
| `customer` | ❌ | — | 403 sur tout back-office |
| Anonymous | ❌ | — | 401/403 |

**Écart critique** : les règles « qui a le droit de changer quel rôle » ne
sont **pas** vérifiées serveur (cf. §3.2). C'est la première correction à faire.

---

## 6. Base de tests frontend existants

- `permissions.test.ts` (13) : matrice, `canAccessBackoffice`, assignable roles.
- `i18n.test.ts` : présence FR/EN de toutes les clés statiques.
- `format.test.ts` (9), `Button.test.tsx` (3), `ProductCard.test.tsx` (4),
  `ClientDashboardPage` (2).

---

## 7. Plan d'action (ordre d'implémentation)

1. **RBAC serveur fort** — règles d'assignation des rôles dans `UserViewSet`
   (self-demotion, dernier superadmin, ADMIN ne gère pas ADMIN/SUPER_ADMIN) +
   champ `password` accepté à la création de compte admin.
2. **Dashboard Superadmin étendu** — compteurs réels (users, souscriptions,
   tickets, paiements, notifications) dans `/dashboard/summary/`.
3. **Back Office redesign** — header complet (CAMTEL-Back Office, user, rôle,
   switch, logout, breadcrumbs), sidebar pilotée par permissions, gardes de
   route par page.
4. **Neutralisation des fonctionnalités fantômes** — page Administration sans
   boutons morts ; `servicesApi` sans fallback commercial fictif.
5. **Homepage / branding** — allègement catalogue, meta, favicon, identité.
6. **README + setup + docs** — procédure from-scratch vérifiée, `.env.example`
   corrigé, `docs/SETUP.md`, `docs/FINAL_IMPLEMENTATION_AUDIT.md`.
7. **Tests** — backend (nouveaux cas RBAC) + frontend (build/lint/test) puis
   rapport final.

---

## 8. Conclusion

La plateforme est **structurellement solide** : l'API, le RBAC de base, le
catalogue officiel, le flux de souscription, la sécurité JWT et une partie
importante du frontend sont réels et testés. Les corrections prioritaires
portent sur l'**enforcement serveur des règles de gestion des comptes**, la
**plénitude du dashboard Superadmin**, l'**exhaustivité du layout Back Office**
(switch, user, rôles) et la **documentation from-scratch** — pas sur une
réécriture de ce qui fonctionne.
    superadmin, pas de troubleshooting). Incomplet pour une installation from
    scratch (règles #37-45).
12. **`index.html`** : meta description obsolète (« fixe, mobile, internet et
    entreprise ») vs les 4 univers officiels.