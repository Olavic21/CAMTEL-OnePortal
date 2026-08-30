# FULLSTACK TEST MATRIX — CAMTEL-OnePortal

Matrice de test end-to-end (Phase 1). Chaque ligne trace ROLE → FRONTEND → API → BACKEND → DB → résultat attendu/observé.

| ID | FLOW | ROLE | FRONTEND | API | BACKEND | DATABASE | EXPECTED | ACTUAL | STATUS |
|---|---|---|---|---|---|---|---|---|---|
| 001 | Home → Fixes → produit → search | Anonymous | HomePage → ServicePage → ProductDetailPage → SearchPage | `GET /products/?service=fixes` | `ProductViewSet` | `Product` (service=FIXED) | offres réelles DB, filtres ok | offres API réelles (mocks supprimés) | ✅ PASS |
| 002 | Data Center → VPS → détail | Anonymous | ServicePage(data-center) → ProductDetailPage | `GET /products/{slug}/` | `ProductViewSet` | `Product` | détail DB + source + prix | détail API (E2E smoke : 29 produits data-center) | ✅ PASS |
| 003 | Login → dashboard → souscription | Customer | LoginPage → ClientDashboardPage | `POST /auth/login/`, `GET /subscriptions/my-subscriptions/` | JWT + owner filter | `User`, `SubscriptionRequest` | données own uniquement | ✅ | ✅ PASS |
| 004 | Ticket → notification | Customer | SupportPage | `POST /tickets/`, `GET /notifications/` | owner filter | `SupportTicket`, `Notification` | isolation A/B | ✅ (tests backend) | ✅ PASS |
| 005 | Paiement | Customer | PaymentCta → ClientPaymentsPage | `POST /payments/initiate/`, `GET /payments/` | montant serveur + idempotence | `Payment` | historique réel, 1 txn par clé | endpoint créé + front branché (smoke : 401 anonyme) | ✅ PASS |
| 006 | Privileged → back-office → publish | SUPPORT/ADMIN | PortalBackofficeSwitch → AdminProductListPage | `POST /products/{id}/publish/` | `IsBackoffice` + audit | `Product`, `ActivityLog` | OK + audit log | ✅ | ✅ PASS |
| 007 | Customer → back-office | Customer | URL `/backoffice` directe | `GET /subscriptions/admin-analytics/` | 403 serveur | — | DENIED même en URL directe | guard front + 403 backend | ✅ PASS |
| 008 | Customer A → ressource B | Customer | — | `GET /tickets/{B}/`, `/subscriptions/{B}/` | 404 owner-scoped | — | 403/404 | 404 (tests backend) | ✅ PASS |
| 009 | Search → backend → UI | Anonymous | SearchPage | `GET /products/?search=`, `/documents/?q=` | search DB | `Product` | résultats réels | produits API réels + docs réelles (mockServices retiré de SearchPage) | ✅ PASS |
| 010 | Chatbot → source | Anonymous | AssistantPage/ChatbotWidget | `POST /chatbot/query/` | DB-first + RAG | `Product`, docs | réponse + source + last_verified | branché backend | ✅ PASS |
| 011 | Éligibilité SIMULATED | Anonymous | EligibilityChecker | `POST /eligibility/check/` | provider mock | — | badge SIMULATED explicite | ✅ | ✅ PASS |
| 012 | Analytics events | Anonymous/Customer | `trackEvent` | `POST /analytics/events/` | validation event_type | `AnalyticsEvent` | 201, type accepté | ✅ (contrat vérifié) | ✅ PASS |
| 013 | Recommandations | Anonymous | FindSolutionPage | `GET /recommendations/?segment=` | `recommend_products` | `Product` | résultats + justification réels | fallback mock si API échoue | ⚠️ P1 |
| 014 | 401 → refresh → retry | Customer | axios interceptor | `POST /auth/refresh/` (cookie) | JWT rotation | — | sans boucle infinie | ✅ | ✅ PASS |
| 015 | Prix « sur demande » | Anonymous | ProductDetailPage | `GET /products/{slug}/` | `price_on_request` | `Product` | « Prix sur demande », jamais 0 FCFA | à re-tester après branchage | ⚠️ P1 |

## Bugs dérivés (→ Phase 2/3)

- **BUG-01 (P0) — CORRIGÉ** : catalogue branché sur l'API (`listCatalogProducts`/`fetchCatalogProduct` + `useCatalog`/`useProductDetail`/`useServiceProducts`) ; `mocks/products.ts` supprimé.
- **BUG-02 (P0) — CORRIGÉ** : `GET /api/v1/payments/` créé (`apps.core.PaymentHistoryView`, owner-scoped, tests dédiés 5/5) ; `paymentsApi.history()` branché ; `mocks/payments.ts` supprimé ; pages `ClientPaymentsPage` (account + payments) branchées.
- **BUG-03 (P1) — CORRIGÉ** : `PriceType` étendu (QUARTERLY) + `pricePeriod()`/labels trimestriels.
- **BUG-04 (P2) — CORRIGÉ** : `mockServices` retiré de SearchPage (filtres via `SERVICES` config + API) ; ne reste que le fallback éditorial documenté de `servicesApi` (aucune donnée commerciale).
- **BUG-05 (P2) — CORRIGÉ** : contrat `Payment` aligné sur le backend réel (`provider`, `simulation`, `next_due_date: null` documenté, période dérivée de `created_at` — jamais simulée).
