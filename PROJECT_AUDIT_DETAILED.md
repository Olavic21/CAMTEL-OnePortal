# CAMTEL OnePortal — Audit Détaillé Exécutif (20 Août 2026)

## Vue d'ensemble

Le projet est en **état fonctionnel intermédiaire**. Architecture Django/DRF + React est saine. Migrations et modèles sont bien structurés. **Sécurité et stabilité V1 demandent des corrections critiques mais rapides.**

---

## 1. ÉTAT ACTUEL RÉCAPITULATIF

| Domaine | Statut | Détail |
|---|---|---|
| Backend Django | ✅ FONCTIONNEL | Django 6.0.7, DRF 3.17, JWT SimpleJWT avec rotation/blacklist |
| Frontend React | ✅ FONCTIONNEL | React 18, TypeScript, Vite, TailwindCSS, React Query |
| Base de données | ✅ PRÊT | PostgreSQL (prod), SQLite (dev), migrations appliquées |
| Authentification | ⚠️ À AMÉLIORER | JWT OK, refresh token en cookie (bon), mais logout incomplet |
| RBAC | ✅ FONCTIONNEL | 6 rôles, permissions par endpoint, matrice claire |
| Catalogue produits | ✅ FONCTIONNEL | Modèle riche (ServiceOffer/PhysicalProduct, OfferType, Segment, Technology) |
| Souscription | ⚠️ INCOMPLET | Workflow basique, pas d'historique, numéro demande OK |
| Espace client | ⚠️ INCOMPLET | Dashboard partiel, pas de suivi en temps réel |
| Admin back-office | ✅ FONCTIONNEL | Modules présents, fonctionne |
| Notifications | ⚠️ IN-APP SEULEMENT | Email/SMS abstraits mais pas implémentés |
| Recherche | ✅ BASIQUE | Produits seulement, pas d'autocomplete global |
| Chatbot | ✅ FONCTIONNEL | FAQ règle/fallback, providers Gemini (test KO), Mock (OK) |
| Tests | ⚠️ PARTIELS | 18/18 products OK, 30/33 core OK (3 erreurs Gemini) |
| Sécurité | ⚠️ CRITIQUE | SECRET_KEY en dur (prod.py OK), seed demo contrôlé |
| Documentation | ✅ PRÉSENTE | README, ARCHITECTURE, SECURITY_AUDIT existent |

---

## 2. PROBLÈMES CRITIQUES (PHASE 1 — À CORRIGER D'ABORD)

### 2.1 SECRET_KEY & Configuration

**État**: ✅ PROD OK, ⚠️ DEV À REVOIR

- `prod.py` : force SECRET_KEY + lance ImproperlyConfigured si absent (bon).
- `base.py` : placeholder 'dev-only-insecure-key-not-for-production' en dev (OK pour dev).
- **Action** : `.env.example` doit documenter toutes les vars. Aucun changement backend nécessaire.

### 2.2 Seed Demo Automatique

**État**: ✅ CONTRÔLÉ

- `docker-compose.yml` : SEED_DEMO_DATA=true par défaut en dev (acceptable).
- `seed_data.py` : protégé par `if not settings.DEBUG and not seed_env and not force` (bon).
- **Comptes de démo** :
  - superadmin / CamtelAdmin2026!
  - admin / admin123
  - editor / editor123
- **Action** : Clarifier dans les docs que ces comptes sont DEMO seulement. Aucun changement code requis.

### 2.3 Refresh Token Rotation & Logout

**État**: ⚠️ PARTIELLEMENT BON

- Refresh token en cookie HttpOnly (bon).
- Rotation active (`ROTATE_REFRESH_TOKENS=True`), blacklist après rotation (bon).
- **Problème** : `logout` endpoint → `204 No Content` vide. Le refresh token est **révoqué côté serveur** (signal + blacklist) mais le frontend doit nettoyer son état. Pas de problème de sécurité, mais UX à clarifier.
- **Action** : Ajouter un test explicite + documenter le comportement.

### 2.4 Rate Limiting

**État**: ⚠️ INCOMPLET

- Présent : contact (5/h), login (5/h), register (3/h), partner API (variable).
- **Manque** : password_reset, search, chatbot.
- **Action** : Ajouter throttles sur endpoints sensibles (voir section 4).

### 2.5 Tests Cassés (Chatbot Gemini)

**État**: ❌ 3 ERREURS

```
test_chatbot_gemini_provider_pipeline_with_mocked_sdk — ERREUR
test_chatbot_gemini_degrades_gracefully_on_sdk_error — ERREUR
test_chatbot_gemini_hard_timeout_when_sdk_call_never_returns — ERREUR
```

**Cause** : Mock patche `google.generativeai` qui n'existe pas dans le scope du mock.
- **Action** : Refactoriser pour mock le module entièrement (voir section 5).

---

## 3. PROBLÈMES MAJEURS (PHASE 2+)

### 3.1 Workflow Souscription

**État**: ⚠️ BASIQUE

- Modèle `SubscriptionRequest` : statuts OK (PENDING → UNDER_REVIEW → ... → ACTIVATED/REJECTED).
- **Manque** : Historique des transitions (`SubscriptionStatusHistory` modèle existe mais peu utilisé).
- **Manque** : Notifications à chaque transition.
- **Action** : Implémenter signal post_save + créer entrée historique automatiquement.

### 3.2 Espace Client

**État**: ⚠️ INCOMPLET

- Endpoints existent (`/me`, `/my-subscriptions/`, `/my-notifications/`).
- **Manque** : Dashboard avec KPI (demandes en cours, demandes validées, etc.).
- **Manque** : Historique activités détaillé.
- **Action** : Créer endpoint `/dashboard/` avec agrégations (PHASE 3).

### 3.3 Notifications Multi-canal

**État**: ⚠️ IN-APP SEULEMENT

- Modèle `Notification` : type (in_app, email, sms), contenus OK.
- **Manque** : Implémentation email (templates, SMTP).
- **Manque** : Implémentation SMS (abstraction provider).
- **Action** : Créer `EmailProvider` interface + LocalFilesystem fallback (PHASE 2).

### 3.4 Recherche Globale

**État**: ⚠️ PRODUITS SEULEMENT

- Endpoint `/api/v1/search/autocomplete/` : produits, actualités, promotions, FAQ (fonctionne).
- **Manque** : Full-text PostgreSQL (tsvector existe mais non exploité).
- **Manque** : Autocomplete client-side (Vite -> frontend à revoir).
- **Action** : Exploiter SearchVectorField, ajouter GIN index (PHASE 3).

### 3.5 Chatbot

**État**: ✅ LEGACY FAQ OK, ⚠️ RAG INCOMPLET

- Fallback FAQ/produit : fonctionnel.
- Provider Mock : OK.
- Provider Gemini : tests cassés, mais logique existe.
- **Manque** : RAG réel (documents, context retrieval).
- **Action** : Fixer tests, puis implémenter RAG en PHASE 2.

---

## 4. PROBLÈMES MINEURS / DETTES TECHNIQUES

| Problème | Criticité | Résolution |
|---|---|---|
| `LanguageMiddleware` post-session | LOW | Noop, keep as is |
| `views_count` incrémenté manuellement | LOW | Créer signal post-save |
| Pas de analytics collection | MEDIUM | Service AnalyticsEvent |
| Double include URL (`/api/` + `/api/v1/`) | MEDIUM | Clarifier conf (check config/urls.py) |
| Rang de rôle ambigu | MEDIUM | Matrice RBAC explicite (doc + test) |
| Séquences PostgreSQL (reset_pg_sequences) | MEDIUM | Migration 0004+ auto-reset? |
| ALLOWED_HOSTS=[*] en dev.py | LOW | Acceptable dev only |
| Pas de ErrorBoundary global React | MEDIUM | À ajouter (PHASE 5) |
| Textes UI codés en dur (React) | MEDIUM | i18n React (PHASE 2) |

---

## 5. SÉCURITÉ — AUDIT OWASP

| # | Risque | État | Mitigation |
|---|---|---|---|
| A1 | Injection | ✅ SAFE | DRF QuerySet paramétrés, pas de raw SQL |
| A2 | Broken Access Control | ✅ SÉCURISÉ | RBAC par role, token JWT, perms par viewset |
| A3 | Sensitive Data Exposure | ⚠️ À SURVEILLER | Refresh token HTTP only (bon), access token en mémoire (OK), passwords hashés (OK) |
| A4 | XML External Entities | ✅ N/A | Pas de parsing XML utilisateur |
| A5 | Broken Authentication | ⚠️ À AMÉLIORER | Throttles login/register/password-reset, mais pas uniformes |
| A6 | Security Misconfiguration | ⚠️ À VÉRIFIER | dev.py ALLOWED_HOSTS=['*'] (OK dev only), prod.py sérieuses |
| A7 | XSS | ✅ SAFE | React escaped HTML, DRF JSON responses |
| A8 | CSRF | ✅ SAFE | CSRF middleware, SameSite cookies |
| A9 | Known Vulnerabilities | ⚠️ À AUDITER | Dépendances non auditées (pip audit?) |
| A10 | Insufficient Logging | ⚠️ À AMÉLIORER | ActivityLog existe, mais pas d'alertes |

---

## 6. TESTS — COUVERTURE ACTUELLE

### Backend

| App | Total | Passés | Échoués | Taux |
|---|---|---|---|---|
| products | 18 | 18 | 0 | 100% ✅ |
| core | 33 | 30 | 3 | 91% ⚠️ |
| users | ? | ? | ? | ? |
| subscriptions | ? | ? | ? | ? |
| news | ? | ? | ? | ? |
| autres | ? | ? | ? | ? |

**Erreurs connues** :
- `test_chatbot_gemini_provider_pipeline_with_mocked_sdk`
- `test_chatbot_gemini_degrades_gracefully_on_sdk_error`
- `test_chatbot_gemini_hard_timeout_when_sdk_call_never_returns`

**Cause** : Mock `google.generativeai` → AttributeError.

---

## 7. ARCHITECTURE — ÉVALUATION

### Positif

- Séparation claire des concerns (apps Django).
- Services abstraits (payment, eligibility, chatbot providers).
- Migrations propres et progressives.
- i18n backend bien implémenté (FR/EN).
- RBAC serveur-centric (bon pour sécurité).
- Signals pour audit (ActivityLog, SearchVector).

### À améliorer

- Pas de couche service explicite (logique métier dans les viewsets).
- Tests unitaires légers (focus API + permissions).
- Pas de tests E2E (Selenium/Cypress).
- Frontend i18n manquant (textes hard-codés).
- Pas de service analytics centralisé.

---

## 8. DÉPENDANCES — AUDIT RAPIDE

```
Django 6.0.7 ✅
DRF 3.17.1 ✅
SimpleJWT 5.5.1 ✅
Pillow 12.3.0 ✅
psycopg2-binary 2.9.10 ✅
google-generativeai 0.8.5 ⚠️ (peut être stale)
openai 1.99.9 ⚠️ (peut être stale)
```

**Action** : `pip audit` avant déploiement.

---

## 9. FICHIERS CLÉS MODIFIÉS / CRÉÉS (PHASE 0-1)

- ✅ backend/config/settings/base.py (REFRESH_COOKIE_*, SIMPLE_JWT, THROTTLE_*)
- ✅ backend/config/settings/prod.py (SECRET_KEY validation)
- ✅ backend/config/settings/dev.py (DEBUG=True, ALLOWED_HOSTS=['*'])
- ✅ backend/apps/core/management/commands/seed_data.py (SEED_DEMO_DATA protect)
- ✅ backend/apps/users/views.py (LoginView, RegisterView, LogoutView avec cookies)
- ⚠️ backend/apps/core/tests.py (erreurs Gemini à fixer)

---

## 10. ORDRE D'EXÉCUTION PHASE 1 (SÉCURITÉ & STABILISATION)

1. **Fixer tests cassés** (chatbot Gemini) — 30 min
2. **Rate limiting** — ajouter throttles password_reset, search, chatbot — 30 min
3. **Documenter logout** — expliquer cookie révocation — 15 min
4. **Auditer OWASP** — review endpoints sensibles — 1h
5. **Créer .env.example** — documenter tous les secrets — 30 min
6. **.env.*.local** — ignoré en .gitignore — vérifier — 5 min
7. **Ajouter pip audit** — script/pipeline CI/CD — 30 min
8. **Tests RBAC complets** — chaque permission critiq — 1h
9. **Documenter sécurité** — SECURITY.md à jour — 30 min

**Total estimé** : ~5 heures de travail.

---

## 11. PRIORITÉS POUR PHASE 2-3

- Workflow souscription + historique + notifications
- Espace client dashboard
- Email provider + templates
- Recherche full-text + autocomplete
- RAG chatbot
- Tests E2E critiques
- i18n frontend

---

## 12. RECOMMANDATIONS FINALES

1. ✅ **NE PAS** repartir de zéro — réutiliser tout ce qui fonctionne.
2. ✅ **Fixer d'abord** les 3 erreurs tests.
3. ✅ **Améliorer tests** → 95%+ couverture.
4. ✅ **Documenter** chaque feature (API, RBAC, secrets).
5. ✅ **Tester en prod-like** (PostgreSQL 16, env vars strictes).
6. ❌ **Éviter** microservices, Kubernetes, sur-engineering.

---

**Rapport généré le 20 août 2026. Base de travail pour PHASE 1 (Sécurité & Stabilisation).**
