# AUDIT FRONTEND — CAMTEL-OnePortal

Version : 1.0 — Refonte fonctionnelle & UX (Août 2026)
Périmètre : `frontend/camtel/frontend`

---

## 1. Stack technique existante (KEEP)

| Domaine | Technologie | État |
|---|---|---|
| UI | React 18.3 + TypeScript 5.5 (strict) | KEEP |
| Build | Vite 8 (+ code splitting par page via `lazy()`+`Suspense`) | KEEP |
| Styles | TailwindCSS 3.4, dark mode par classe | KEEP |
| Routing | React Router 7 (`BrowserRouter`) | KEEP |
| Data fetching | TanStack Query 5 (`queryKeys` centralisés dans `shared/lib/queryClient.ts`) | KEEP |
| HTTP | axios + JWT access + refresh en cookie HttpOnly + intercepteur 401 avec file d'attente | KEEP |
| Forms | react-hook-form + zod | KEEP |
| i18n | i18next FR/EN (`shared/lib/i18n.ts`) | KEEP |
| Animation | framer-motion | KEEP |
| Icônes | lucide-react | KEEP |
| Charts | recharts | KEEP |
| Tests | Vitest + Testing Library ; Playwright E2E | KEEP |

L'architecture existante est déjà structurée par `features/` + `shared/`, proche de l'architecture recommandée. **Cette structure est conservée** (le cahier des charges autorise explicitement de ne pas restructurer si l'existant est propre).

---

## 2. Structure des dossiers (KEEP / MODIFY)

```
src/
├── app/                 → router, providers, layouts (Public/Admin), pages racine   → MODIFY (routes + header + homepage)
├── features/            → auth, products, categories, news, promotions, media,
│                          contact, dashboard, users, subscriptions, tickets,
│                          notifications, chat(assistant), documents, eligibility,
│                          recommendations, payments, activity-log                   → KEEP + CREATE (search, services,
│                                                                                        find-solution, account)
├── shared/
│   ├── components/      → Button, Input/Textarea/Select, Badge, Card, Modal, Table,
│   │                      Breadcrumbs, Pagination, Skeleton, EmptyState, Toast,
│   │                      ThemeToggle, Logo, SearchAutocomplete, ChatbotWidget,
│   │                      OnePortalAILogo                                          → KEEP + CREATE (PriceDisplay, Alert,
│   │                                                                                  ErrorState, SuccessState, Tabs,
│   │                                                                                  Drawer, Switch)
│   ├── hooks/           → useTheme                                                    → KEEP
│   ├── lib/             → axios, i18n, queryClient, tokenStorage, mockAuthStore,
│   │                      analytics                                                    → KEEP
│   ├── types/           → index.ts (tous les types API)                                → MODIFY (nouveau modèle Service+Segment)
│   ├── utils/           → format, slugify                                               → MODIFY (PriceDisplay)
│   └── test/            → setup vitest                                                  → KEEP
├── styles/tailwind.css  → tokens base (focus, container, skip-link)                     → KEEP
```

---

## 3. Routes existantes (état actuel)

### Publiques
| Route | Page | Verdict |
|---|---|---|
| `/` | HomePage | MODIFY |
| `/produits` | ProductListPage | MODIFY |
| `/produits/comparateur` | ProductComparePage | MODIFY |
| `/produits/:slug` | ProductDetailPage | MODIFY |
| `/produits/:slug/souscrire` | SubscriptionPage | KEEP |
| `/entreprise` | EnterprisePage | REMOVE (segment ≠ service) |
| `/actualites` / `/actualites/:slug` | News | KEEP |
| `/promotions` | PromotionsPage | KEEP |
| `/documents` | DocumentsPage | KEEP |
| `/assistant` | AssistantPage (chat) | KEEP |
| `/contact` | ContactPage | KEEP |
| `/admin/login`, `/inscription` | Login / Register | KEEP |

### Espace client
| Route | Verdict |
|---|---|
| `/mon-compte`, `/mon-compte/dashboard`, `/mon-compte/abonnements`, `/mon-compte/tickets`, `/mon-compte/tickets/:id` | KEEP (compat) + MIGRER vers `/account/*` |

### Back-Office (protégé `roles={['editor']}` + permissions fines)
| Route | Verdict |
|---|---|
| `/admin`, `/admin/notifications` | KEEP + compléter (analytics, services, sources, administration) |
| `/admin/produits`, `/admin/produits/nouveau`, `/admin/produits/:id/modifier` | MODIFY → catalogue (service+segment) |
| `/admin/categories`, `/admin/actualites*`, `/admin/promotions`, `/admin/mediatheque`, `/admin/messages`, `/admin/journal`, `/admin/utilisateurs`, `/admin/souscriptions*`, `/admin/tickets*` | KEEP (compat) + nouveaux alias conformes |

---

## 4. Contrat API existant (shared/types/index.ts)

- `UserRole` = `super_admin | admin | product_manager | editor | visitor` (rôles back-office backend)
- `Segment` (ANCIEN) = `grand_public | entreprise` → **REMOVE**, remplacé par le nouveau modèle :
  `Service` = `FIXES | MOBILES | TRANSPORT | DATA_CENTER` et
  `Segment` = `PARTICULIER | PROFESSIONNEL | ENTREPRISE | ADMINISTRATION`
- `Product` (ANCIEN : `category_id`, `price`, `segment`) → MODIFY vers le nouveau contrat :
  `service`, `segment`, `pricing{type,amount,currency}`, `specifications{}`, `source{name,url,lastVerifiedAt,quality}`, `availability`
- `Paginated<T>`, `ApiError`, `Subscriptions`, `Tickets`, `Notifications`, `Recommendations`, `EligibilityResult`, `PaymentResult` : KEEP (alignés DRF)

L'évolution du type `Product` est faite de manière **rétro-compatible** : les champs existants
restent lus si présents, et les nouveaux champs sont optionnels (`?`) afin de ne pas casser le
backend actuel une fois la refonte des pages en place. Les mocks suivent strictement le nouveau contrat.
---

## 5. Gestion d''etat, API, auth (KEEP / MODIFY)

| |lement | Verdict | Commentaire |
|---|---|---|---|
| TanStack Query + ``queryKeys`` | KEEP | Conventions de cles deja propres |
| ``httpClient`` axios + refresh 401 | KEEP | Robuste (queue + cookie HttpOnly) |
| ``useAuth`` (context) | MODIFY | Ajouter ``permissions[]``, ``hasPermission()``, chargement ``/api/v1/me/`` |
| Matrice de permissions statique (``permissions.ts``) | MODIFY | Utilisee en fallback ; les permissions doivent venir du backend via ``/me`` |
| ``mockAuthStore`` (mode demo) | KEEP | Mode demo opt-in ``VITE_DEMO_MODE="true"`` |
| ``RequireAuth`` | KEEP | Gardes par role/permission |

---

## 6. Design system existant (KEEP + completer)

Deja presents : Button (primary/secondary/tertiary/danger), Input/Textarea/Select (avec label/erreur/aria),
Badge (10 tons), Card, Table generique, Breadcrumbs, Pagination, Skeleton, EmptyState,
Toast, Modal (focus trap + Escape), Drawer (existe en mode natif dans AdminLayout → extraire en composant partage).

Manquants (CREATE) : PriceDisplay, Alert, ErrorState, SuccessState, Tabs, Drawer (composant partage),
PortalBackofficeSwitch, ServiceBadge, SegmentBadge, DataQualityBadge, ProductSpecifications.

Spacing 4/8px : assure par le systeme Tailwind (spacing natif = multiple de 4px). KEEP.

---

## 7. Classification exhaustive

### KEEP (reutiliser tel quel)
- Tous les composants ``shared/components`` sauf adaptations mineures citees en MODIFY
- ``shared/lib/* `` (axios, i18n, queryClient, tokenStorage, analytics)
- ``shared/utils/format.ts`` (formatDate, formatDateTime, truncate)
- Toutes les pages News, Promotions, Documents, Contact, Assistant, Login, Register, Subscription
- Toutes les pages admin existantes (adaptees progressivement au back-office)
- Tout le module ``categories`` (les categories restent une taxonomie complementaire)
- Les hooks et API de toutes les features existantes (products, news, subscriptions, tickets, notifications, etc.)

### MODIFY
- ``app/router.tsx`` — nouvelles routes (``/services/*``, ``/search``, ``/compare``, ``/find-solution``, ``/account/*``, admin conforme)
- ``app/pages/HomePage.tsx`` — structure 4 services + profils segments + « Trouver ma solution »
- ``app/layout/PublicHeader.tsx`` — nav par services + recherche + aide + compte + acces Back-Office
- ``app/layout/PublicFooter.tsx`` — liens vers les 4 services + segments
- ``features/products/components/ProductCard.tsx`` — badges Service+Segment, PriceDisplay
- ``features/products/components/ProductFilters.tsx`` — filtre Service (independant du Segment)
- ``features/products/pages/ProductListPage.tsx`` — nouveau modele de filtres
- ``features/products/pages/ProductDetailPage.tsx`` — specifications dynamiques, source, derniere verification
- ``features/products/pages/ProductComparePage.tsx`` — comparateur pilote par schema de specifications
- ``features/auth/hooks/useAuth.tsx`` — permissions issues de ``/me``, ``hasPermission()``
- ``shared/types/index.ts`` — nouveau contrat (Service, Segment, PriceType, Availability, DataQuality, Product)
- ``shared/lib/queryClient.ts`` — cles pour services, search, recommendations
- ``shared/lib/i18n.ts`` — cles services/segments/navigation
- ``app/layout/AdminSidebar.tsx`` + ``AdminLayout.tsx`` — menu conforme (catalogue, services, offres, clients, analytics, sources, administration) + Switch

### REFACTOR
- ``features/products/components/ProductFilters.tsx`` → filtre service/segment independants
- Comparateur → ``ComparisonTable`` pilote par un ``ComparisonSchema``
- Page produit → template unique ``ProductSpecifications`` pilote par schema

### REMOVE
- ``app/pages/EnterprisePage.tsx`` + route ``/entreprise`` (le segment ENTREPRISE n''est plus un service) ; redirection vers ``/services`` possible
- Ancien type ``Segment = 'grand_public' | 'entreprise'`` remplace par le nouveau modele

### CREATE
- ``types`` centralises : ``Service``, ``Segment``, ``PriceType``, ``ProductAvailability``, ``DataQuality``, nouveau ``Product``
- ``mocks/`` : produits, services, recommandations (conformes aux interfaces TS)
- ``shared/config/services.ts`` + ``shared/config/segments.ts`` (metadonnees : libelles, icones, slugs, routes)
- Composants UI : ``PriceDisplay``, ``Alert``, ``ErrorState``, ``SuccessState``, ``Tabs``, ``Drawer``, ``PortalBackofficeSwitch``
- Composants produits : ``ProductSpecifications``, ``ServiceBadge``, ``SegmentBadge``, ``DataQualityBadge``
- Feature ``services`` : ``ServicePage`` (template commun), hooks, API
- Feature ``search`` : ``/search`` + SearchInput/SearchResults/SearchResultCard/SearchFilters/SearchEmptyState/SearchLoadingState
- Feature ``find-solution`` : parcours 4 etapes + recommandations
- Feature ``account`` : ``/account`` dashboard, ``/account/payments``, ``/account/notifications``
- Pages admin nouvelles : ``/admin/catalogue``, ``/admin/services``, ``/admin/offers``, ``/admin/clients``, ``/admin/support``, ``/admin/analytics``, ``/admin/sources``, ``/admin/administration``

---

## 8. Priorites & contraintes cles

1. Service et Segment sont **deux notions independantes** — jamais « Entreprise » comme enfant de « Service ».
2. Un prix inconnu n''est **jamais** affiche « 0 FCFA » (composant ``PriceDisplay``).
3. Les specifications produit sont **pilotees par schema**, jamais codees en dur par colonne.
4. Aucune donnee commerciale inventee : mocks conformes au contrat API, remplacables 1:1.
5. Back-Office accessible **uniquement** avec permission venant du backend (``/api/v1/me/``).
