# CAMTEL OnePortal — Audit complet du projet (PHASE 0)

> Date : 2026-08-14 — Branche : `dev`
> Ce document est le **point de départ exécutif** : chaque problème est classé par criticité et sert de base d'implémentation pour les phases V1 / V2 / V3.

---

## 1. Architecture actuelle

| Couche | Technologie | Observé |
|---|---|---|
| Backend | Django 6.0.7 + DRF 3.17 + SimpleJWT 5.5 | `backend/apps` découpé en 10 applications Django |
| Base de données | PostgreSQL (prod) / SQLite (dev) | bascule par `DB_HOST` dans `settings/base.py` |
| API | REST versionnée `/api/v1/` + drf-spectacular (OpenAPI) | `config/api_urls.py`, `config/urls.py` |
| Frontend | React 18 + TypeScript (Vite) + Tailwind + React Query | `frontend/camtel/frontend` |
| i18n API | FR/EN via `Accept-Language` + champs `*_en` | `apps/core/i18n.py`, mixin `TranslatableModelSerializer` |
| Auth | JWT (access/refresh) en localStorage côté SPA | `apps/users/views.py`, intercepteur axios |
| RBAC | Rôles custom sur `User.role`, permissions par ViewSet | `apps/core/permissions.py`, `frontend/.../permissions.ts` |
| DevOps | Docker (+ staging), Nginx, GitHub Actions, healthchecks | `docker-compose*.yml`, `.github/workflows` |
| Médias | Django FileField/ImageField, S3 optionnel en prod | `apps/media`, `settings/prod.py` |
| Partners | API keys hashées (scopes) | `apps/partners` |
| Chatbot | Règle FAQ/produit simple + fallback | `apps/core/views.py#ChatbotView` |

## 2. Fonctionnalités existantes (fonctionnelles)

- Authentification JWT : login / register / refresh / logout / me.
- Catalogue `Product` filtrable (`search`, `category`, `segment`, `ordering`), tri en liste blanche.
- Comparateur d'offres `GET /products/compare/?ids=...`.
- Fiche produit avec galerie d'images, FAQ produit, export PDF.
- Catégories hiérarchiques (périmètre `segment` Grand public / Entreprise).
- Actualités (`News`) bilingues, promotions (`Promotion`) avec `active`.
- Médias sécurisés (formats autorisés, taille max 10 Mo).
- Contact (`ContactMessage`) avec throttling + boîte de réception admin.
- Souscription (`SubscriptionRequest`) création + notification admin + liste admin.
- Espace admin (back-office) : produits, catégories, actualités, promotions, médias, messages, journal d'activité, utilisateurs, notifications, dashboard.
- RBAC fin serveur + gardes frontend (`RequireAuth`, matrice `PERMISSIONS`).
- Journal d'activité (`ActivityLog`) via signaux + middleware.
- API partenaire (clés hashées, scopes, expiration, `partner-api.md`).
- Healthcheck avancé `/api/v1/health/`.
- Seed bilingue (comptes + catégories + produits + promo + actualité).
- i18n backend FR/EN (champs `*_en`, `Accept-Language`).

## 3. Fonctionnalités incomplètes / fragiles

- **Workflow de souscription** : statuts simplistes (`pending/approved/rejected/cancelled`), aucun historique, pas de numéro de demande humain.
- **Espace client** : page `/mon-compte` partielle, pas de dashboard chiffré (demandes en cours/validées), pas d'historique.
- **Notification** : envoi In-app seulement, abstraction multi-canal (email/SMS) absente.
- **Chatbot** : pas de normalisation, pas de collecte des questions sans réponse, pas de panneau admin dédié.
- **Recherche** : par produit seulement (pas actualités/promotions/FAQ), pas d'autocomplete global, pas de recherche full-text PostgreSQL.
- **Analytics** : incomplet (KPI basiques), pas de `conversion_rate`, `top_offers`, `top_categories`, `search_queries`.
- **i18n UI** : backend OK, mais textes du frontend majoritairement codés en dur (pas de i18n React effectif).
- **Documents attachés aux offres** : inexistant (PDF, CGV, guides).
- **Support/tickets** : inexistant.
- **Éligibilité / Paiement / Email system** : inexistant (couches d'abstraction à créer).
## 4. Dette technique

| Sujet | Détail | Criticité |
|---|---|---|
| Secret codé en dur | `SECRET_KEY` par défaut dans `settings/base.py` + `docker-compose` (`change-me-in-production`) | **CRITICAL** |
| Seed automatique | `seed_data` (comptes demo à mots de passe faibles) exécuté dans le `command` du conteneur backend | **CRITICAL** |
| Refresh token en localStorage | exposé au XSS ; pas de blacklist/rotation | **HIGH** |
| Logout non réel | ne révoque pas le refresh token (réponse 204 vide) | **HIGH** |
| Pas de throttling login/register | brute force possible | **HIGH** |
| Test cassé | `test_product_create_endpoint` en échec (payload `category` vs contrat `category_id`) | **HIGH** |
| Double include `api_urls` | `/api/v1/` et `/api/` chargent les mêmes routes (`config/urls.py`) | **MEDIUM** |
| Rang de rôle bâtard | `hasRole` part `ROLE_RANK` ; Product Manager / Editor parallèles — ambigu | **MEDIUM** |
| Séquences PG | script `reset_pg_sequences` requis après migration (peut diverger) | **MEDIUM** |
| `LanguageMiddleware` post-session | langue détectée puis `CommonMiddleware` — OK mais naïf | **LOW** |

## 5. Problèmes de sécurité (OWASP top 10)

| # | Problème | Criticité |
|---|---|---|
| A7/A5 | Secret administrateur en dur + env partagé (dev) | **CRITICAL** |
| A2 | Broken Access Control : `NotificationViewSet` et `SubscriptionRequest` exposent des objets sans scoping propre côté client | **HIGH** |
| A7 | Sensitive data exposure : refresh token JWT en localStorage, jetons révoqués non invalidés | **HIGH** |
| A6 | Security misconfiguration : `dev.py` `ALLOWED_HOSTS=['*']`, CORS permissif par défaut | **HIGH** |
| A9 | Components with known vulnerabilities : dépendances non auditées | **MEDIUM** |
| A3 | Injections : querysets DRF paramétrés (OK), mais pas d'audit systématique | **LOW** |
| Upload | validation extension + MIME partielle, pas d'antivirus | **MEDIUM** |
| Rate limiting | seulement contact (5/h) | **HIGH** |

## 6. Problèmes UX/accessibilité

- Pas de system de design complet (manque `Select`, `Tabs`, `Dropdown`, `ConfirmDialog`, `ErrorState`, `ErrorBoundary` dans l'usage général).
## 8. Problèmes backend

- Business logic dans les views (`ChatbotView`, `DashboardSummaryView`) — pas de couche service.
- Import `timezone` inutilisé dans `news/views.py`, `promotions/views.py`.
- `views_count` incrémenté via action manuelle (`stats`) — pas d'événement analytique.
- Pas de couche analytics/événements.

## 9. Problèmes frontend

- VITE_DEMO_MODE par défaut actif → mockAuthStore contourne le backend en dev.
- Tokens en localStorage (voir §5).
- Textes UI codés en dur.
- Pas de composant `ErrorBoundary` global, `Toast` existe.

## 10. Problèmes DevOps / CI-CD

| Sujet | Criticité |
|---|---|
| Compose backend exécute `seed_data` automatiquement (demo en production possible) | **CRITICAL** |
| `SECRET_KEY` et mot de passe DB codés dans `docker-compose.yml` | **CRITICAL** |
| CI ne couvre pas subscriptions/categories/news/promotions/contacts | **MEDIUM** |
| Pas de healthcheck `/api/ready/`, pas de metrics | **LOW** |

## 11. Problèmes de tests

- Couverture hétérogène (Core/Products/Users/Partners) ; `subscriptions`, `news`, `promotions`, `media`, `contacts`, `categories` sans tests dans le pipeline.
- 1 test cassé (fix § sur-échéance).
- Pas de tests E2E client/admin.
- Pas de permission tests exhaustifs sur les endpoints critiques.

## 13. Classification finale

### CRITICAL
- Secrets codés en dur (`SECRET_KEY`, mots de passe DB, compose).
- Seed demo automatique en production.
- Test backend cassé (CI rouge).

### HIGH
- Refresh token en localStorage / pas de révocation / logout factice.
- Throttling absent sur auth/chatbot/search.
- Workflow & historique de souscription absents.
- Modèle offre trop générique (stock imposé aux services, pas de type/segment).
- Sensitive data exposure, broken access control non audité suite.

### MEDIUM
- Analytics, recherche globale, espace client chiffré, chatbot avancé, i18n UI.
- CY: dépendances non auditées, upload config, double include URL.
- Notifications multi-canal, doc système, support/tickets.

### LOW
- Observabilité (metrics/ready), test E2E, accessibilité fine.

### V2
- RAG/LLM multi-fournisseur, documents/CGV, email system, paiement, éligibilité, API partenaires v1, recommandation.

### V3
- Intégrations CAMTEL (CRM/Billing/Provisioning) en abstractions, omnicanal, mobile-ready, IA avancée.

---

## 14. Fusion avec la mission

Ce rapport alimente directement :
- **PHASE 1** : suppression des secrets, seed conditionnel, JWT blacklist, throttling, correction CI.
- **PHASE 2** : transformation `Product` → offre télécom (champs métier + migrations propres, données existantes préservées).
- **PHASE 3** : workflow souscription (`request_number`, `SubscriptionStatusHistory`, statuts complets).
- V2/V3 : couches d'abstraction documentées et extensibles (éligibilité, paiement, email, CRM/billing/provisioning, RAG).
## 12. Recommandations (ordre prioritaire)

1. **CRITICAL** — Supprimer tout secret codé en dur ; `SECRET_KEY` obligatoire en prod (refus de démarrer) ; retirer le seed automatique en prod (`SEED_DEMO_DATA=false`) ; externaliser config compose.
2. **HIGH** — Révocation/rotation JWT (blacklist), logout réel, stockage du refresh en cookie HttpOnly (option), throttling login/register/refresh/chatbot/search.
3. **HIGH** — Corriger le test cassé ; ajouter tests critical permissions.
4. **MEDIUM/HIGH** — Modèle métier offre (type, segment, frais, engagement, technologie, éligibilité, features/benefits/terms, `product_type`).
5. **HIGH** — Workflow souscription (statuts complets, `request_number`, `SubscriptionStatusHistory`).
6. **MEDIUM** — Espace client dashboard chiffré ; analytics événements légers (`offer_view`, `offer_compare`, `subscription_*`, `search`, `faq_view`, `chatbot_question`) ; recherche globale (actualités/promotions/FAQ) ; chatbot renforcé + collecte questions sans réponse.
7. **MEDIUM** — i18n UI, docs système (PDF/CGV), tickets/support, abstractions éligibilité/paiement/email, RAG/LLM multi-fournisseur, recommandations explicables.
8. **LOW/V2/V3** — API partenaires v1 versionnée, observabilité, mobile-ready.
- Pas de gestion d'écran d'erreur global (bonne surface via API errors mais incohérente).
- i18n UI incomplète.
- Accessibilité partielle : labels/focus non audités systématiquement (WCAG 2.1 AA).
- Mobile-first : layouts publics OK, back-office à vérifier.

## 7. Problèmes de données

| Sujet | Criticité |
|---|---|
| Pas de `request_number` (numéro de demande humain) | **HIGH** |
| `Product.stock` imposé à des services (stock par défaut 0) — notion service/produit non distincte | **HIGH** |
| Pas de champ `type` (INTERNET/FIBER/MOBILE/CLOUD...) ni `segment` individuel (PARTICULIER/PROFESSIONNEL/ENTREPRISE/ADMINISTRATION) | **MEDIUM** |
| Prix `price_unit` libre (string) plutôt que `currency` + `billing_period` | **MEDIUM** |
| Pas d'historique de statut souscription | **HIGH** |
| Données demo non marquées DEMO explicitement | **MEDIUM** |
- **RAG / IA / Recommandation** : à préparer (doc d'intention `docs/oneportal-ai.md`).