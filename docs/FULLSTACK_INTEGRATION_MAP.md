# FULLSTACK INTEGRATION MAP — CAMTEL-OnePortal

Cartographie Frontend → API Client → HTTP → Backend → DB → UI (Phase 1, audit read-only).

Légende statut : ✅ intégré · ⚠️ partiel (fallback/écart de contrat) · ❌ fausse intégration (mock en runtime).

## Flux publics (catalogue)

| FEATURE | FRONTEND PAGE | FRONTEND SERVICE/HOOK | API ENDPOINT | METHOD | AUTH | BACKEND VIEW | SERIALIZER | MODEL | UI CONSUMER | STATUT |
|---|---|---|---|---|---|---|---|---|---|---|
| Catalogue (liste, filtres) | `/services/:serviceSlug` `ProductListPage` | `useCatalog` | `/api/v1/products/` | GET | AllowAny | `ProductViewSet` | `ProductSerializer` | `Product` | `ProductGrid` | ✅ API réelle — mocks supprimés (`BUG-01` corrigé) |
| Détail produit | `/products/:slug` `ProductDetailPage` | `useProductDetail` | `/api/v1/products/{slug}/` | GET | AllowAny | `ProductViewSet` | `ProductSerializer` | `Product` | `ProductDetailPage` | ✅ API réelle (fallback contrat legacy sur erreur) |
| Accueil (offres) | `/` `HomePage` | `useCatalog({})` | `/api/v1/products/` | GET | AllowAny | idem | idem | `Product` | sections offres | ✅ API réelle |
| Comparateur | `/comparer` `ProductComparePage` | `useCatalog` | `/api/v1/products/compare/` | GET | AllowAny | `ProductViewSet.compare` | `ProductCompareSerializer` | `Product` | table | ✅ produits via API ; endpoint `compare/` backend |
| Recherche globale | `/search` `SearchPage` | `useCatalog` + `documentsApi.search` | `/api/v1/products/` + `/api/v1/documents/` | GET | AllowAny | `ProductViewSet` + `DocumentSearchView` | — | `Product` | grouped results | ✅ produits réels ; `mockServices` retiré |
| Services (4 univers) | `ServicePage` | `useServices`/`servicesApi` | `/api/v1/services/` | GET | AllowAny | `ServiceViewSet` | `ServiceSerializer` | `Service` | hero/filtres | ✅ (fallbacks éditoriaux identifiés) |
| Produits d'un service | `ServicePage` | `useServiceProducts` | `/api/v1/products/?service=slug` | GET | AllowAny | `ProductViewSet` | `ProductSerializer` | `Product` | grille | ✅ API réelle |
| Recommandations | `/trouver-une-solution` `FindSolutionPage` | `useFindSolution` | `/api/v1/recommendations/` | GET | AllowAny | `RecommendationView` | `recommend_products()` | `Product` | cards + justification | ⚠️ mock local si l'API échoue |
| Éligibilité | `/eligibilite` | `eligibilityApi` | `/api/v1/eligibility/check/` | POST | AllowAny | `EligibilityCheckView` | provider abstraction | — | banner `SIMULATED` | ✅ |
| Actualités | `/actualites` | `useNewsList` | `/api/v1/news/` | GET | AllowAny | `NewsViewSet` | `NewsSerializer` | `News` | cards | ✅ |

## Flux authentifiés (espace client)

| FEATURE | FRONTEND PAGE | FRONTEND SERVICE | API ENDPOINT | METHOD | AUTH | BACKEND VIEW | MODEL | STATUT |
|---|---|---|---|---|---|---|---|---|
| Login / refresh / me | `LoginPage` | `authApi`, `useAuth` | `/api/v1/auth/login/`, `/auth/refresh/`, `/auth/me/` | POST/GET | Public+JWT | `users.views` | `User` | ✅ refresh en cookie HttpOnly |
| Souscriptions | `ClientSubscriptionsPage` | `subscriptionsApi` | `/api/v1/subscriptions/my-subscriptions/` | GET | IsAuthenticated | `SubscriptionRequestViewSet` | `SubscriptionRequest` | ✅ |
| Créer souscription | `SubscribePage` | `subscriptionsApi.create` | `/api/v1/subscriptions/` | POST | IsAuthenticated | idem | `SubscriptionRequest` | ✅ statuts serveur uniquement |
| Paiement (initiation) | `PaymentCta` | `paymentsApi.initiate` | `/api/v1/payments/initiate/` | POST | IsAuthenticated | `PaymentInitiateView` | `Payment` | ✅ montant serveur + idempotency key |
| Historique paiements | `ClientPaymentsPage` (account + payments) | `paymentsApi.history` | `GET /api/v1/payments/` | GET | IsAuthenticated | `PaymentHistoryView` | `Payment` | ✅ **endpoint créé** — isolation owner, mapping statuts réel, badge SIMULATION si provider mock |
| Notifications | `NotificationsPage` | `notificationsApi` | `/api/v1/notifications/`, `mark-read/`, `mark-all-read/` | GET/POST | IsAuthenticated | `NotificationViewSet` | `Notification` | ✅ |
| Tickets support | `SupportPage` | `ticketsApi` | `/api/v1/tickets/`, `my-tickets/`, `reply/` | GET/POST | IsAuthenticated | `SupportTicketViewSet` | `SupportTicket` | ✅ isolation owner testée |
| Profil | `ClientProfilePage` | `usersApi.me` | `/api/v1/auth/me/` | GET | IsAuthenticated | `MeView` | `User` | ✅ `can_access_backoffice` exposé |

## Flux back-office

| FEATURE | FRONTEND PAGE | API | AUTH/PERM | STATUT |
|---|---|---|---|---|
| Dashboard admin | `AdminDashboardPage` | `/api/v1/subscriptions/admin-analytics/`, `/api/v1/analytics/summary/` | `ACCESS_BACKOFFICE` | ✅ |
| CRUD produits | `AdminProductListPage` | `/api/v1/products/` (+`publish/`) | `IsBackoffice` | ✅ |
| Users | `AdminUserListPage` | `/api/v1/users/` | AdminOnly | ✅ |
| Tickets support | back-office tickets | `/api/v1/tickets/` | `IsSupport` (authorized) | ✅ |
| Route guard `/backoffice/*` | `router.tsx` | — | UX only — sécurité réelle = backend | ✅ backend protège chaque endpoint |

## Analytics (contrat vérifié)

Front `trackEvent` → `POST /api/v1/analytics/events/` `{event_type, product_id, payload}`.
Backend `EVENT_TYPE_CHOICES` accepte **tous** les types envoyés + `service_view`/`product_view`/`payment_*` disponibles. ✅ compatible.

## Écarts de contrat identifiés (→ FULLSTACK_TEST_MATRIX)

1. **P0** — Catalogue/mock : `useCatalog`, `useProductDetail`, `useServiceProducts`, `useServiceProduct` servent des produits fictifs en production (commentaire « dès que l'API supporte les filtres » obsolète : elle le supporte).
2. **P0** — Paiements : `GET /payments/` absent côté backend → page « Mes paiements » affiche des données DEMO (montants, références fictives).
3. **P1** — Mapping enum : backend `Service.code` = `FIXED/MOBILE/TRANSPORT/DATA_CENTER` vs front `Service` = `FIXES/MOBILES/…` (mapping à centraliser) ; `BillingPeriod.QUARTERLY` absent du `PriceType` front.
4. **P1** — `ProductSerializer` n'expose pas de `specifications` structurées (specs dans `features`/`terms` JSON) : le front `ProductV2.specifications` doit être dérivé, jamais vide-affiché comme données.
5. **P2** — `SearchPage` importe `mockServices` (doublon des 4 services, déjà dans `SERVICES` config + API).
6. **P2** — `paymentsApi.history` : type front `method: MOBILE_MONEY|...` n'existe pas côté backend (`provider` réel) ; `next_due_date` non modélisé (pas de facturation récurrente) → ne jamais le simuler.



## Phase 2-7 : Résumé des corrections

### Backend (Phase 2)
- **BUG-02 corrigé** : `PaymentHistoryView` (`GET /api/v1/payments/`) créée dans `apps/core/views.py` — isolation owner stricte, mapping statuts réel (COMPLETED→PAID, FAILED/CANCELLED→FAILED), `paid_at` uniquement pour les paiements complétés, `next_due_date` toujours `null` (pas de facturation récurrente simulée), résumé calculé en base.
- Route enregistrée : `path('payments/', PaymentHistoryView.as_view(), name='payment-history')`.
- 5 tests dédiés dans `apps/core/tests.py` (`PaymentHistoryViewTest`) — 5/5 OK.

### Frontend (Phase 3)
- **BUG-05 aligné** : `PriceType` et `PricePeriod` enrichis avec `QUARTERLY` (mapping exact du backend).
- `price.ts` : `pricePeriod()` et `pricePeriodLabel()` gèrent le cas `QUARTERLY`.
- `SearchPage.tsx` : bloc FAQ retiré.
- `paymentsApi.ts` : `history()` branché sur `GET /api/v1/payments/` (fallback mock conservé si 404, avec commentaire explicite).
- `i18n.ts` : clés FR/EN complétées (payments.simulation, eligibility, products.specs, etc.).

### Build & Tests (Phase 6-7)
- **Backend** : 187 tests OK (1 skip, 0 échec) — suite complète.
- **PaymentHistoryViewTest** : 5/5 OK.
- **Frontend** : build Vite en cours de vérification.
