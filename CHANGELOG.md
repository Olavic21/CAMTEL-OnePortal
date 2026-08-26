# CHANGELOG

Toutes les modifications notables du projet CAMTEL OnePortal.
## [Unreleased] — Données commerciales réelles CAMTEL (2026-08-25)

### Catalogue officiel traçable (remplace les données demo)
- **Snapshots versionnés** `data/camtel_catalog/2026-08-25/` : 42 entrées
  collectées sur les sites officiels (hosting.camtel.cm : 24 plans tarifés ;
  carrier.camtel.cm : 9 services ; camtel.cm : services blue/Landline/Fiber
  Connect) + 6 FAQ + sources. Aucune donnée inventée : prix inconnu → `null` +
  « Prix sur demande » ; blue.camtel.cm injoignable → forfaits Blue non créés.
- **Commande idempotente** `import_camtel_catalog` (+ `--dry-run`) :
  validation → normalisation → upsert par slug → rapport. Idempotence prouvée
  (2e passage : 0 création). FAQ officielles importées pour le chatbot/RAG.
- **Modèles** : `Product` enrichi (`brand`, `service_type`, `status`
  VALID/EXPIRED/UPCOMING/REQUIRES_VERIFICATION, `pricing_type` FIXED/QUOTE/FREE,
  volumes data/voix/SMS, `speed`, `coverage`, `subscription_method`,
  `ussd_code`, `specs` JSON, `yearly_price`, `price` nullable) ; traçabilité
  obligatoire (`source_url/source_name/source_checked_at/last_verified_at/
  data_origin`) ; `Promotion.offer/status/conditions/source_*`.
- **Images officielles** : `attach_official_images` télécharge les assets des
  domaines CAMTEL vers `media/products/` ; champ `original_source_url` sur
  `ProductImage` (16 offres illustrées, zéro hotlink).
- **API** : nouveaux filtres `brand/service_type/status/pricing_type` ;
  endpoint admin `GET /products/data-quality/` (vérifiées, STALE, sans prix,
  sans image, sans source…) ; sérialisation complète des champs traçabilité +
  `price_on_request` / `cta_type` / `is_stale`.
- **Admin** : colonnes source/vérification, actions Verify / Archive,
  promotions avec statut et conditions ; promo expirée jamais active
  (`is_currently_active`).
- **Frontend** : « Prix sur demande » (jamais 0 FCFA), CTA adaptatif
  (Souscrire / Trouver une agence / Demander un devis / Vérifier mon
  éligibilité), bloc « Source officielle · Dernière vérification », alerte
  STALE ; i18n FR/EN ; types TS étendus.
- **Eligibilité fibre** : `CamtelFiberEligibilityProvider` (API officielle via
  `CAMTEL_FIBER_ELIGIBILITY_URL`, fallback mock déclaré indicatif).
- **Fix auth** : JWT en tête de `DEFAULT_AUTHENTICATION_CLASSES` — DRF coerce
  sinon en 403 faute d'en-tête `WWW-Authenticate` (écritures anonymes → 401
  conformes au contrat).
- **Qualité** : `test_data_quality` 13/13 ; suite complète **130 tests OK** ;
  vitest 13/13 ; `tsc --noEmit` OK.
- Docs : `REAL_DATA_MIGRATION.md`, `CAMTEL_DATA_SOURCES.md`,
  `CAMTEL_REAL_DATA_REPORT.md`.

## [Unreleased] — V3 implémentée de bout en bout (2026-08-25)

### Intégrations CAMTEL en abstractions (`apps/core/v3_services.py`, nouveau)
- Interfaces `CRMProvider` / `BillingProvider` / `ProvisioningProvider` /
  `SmsProvider` + adapters mock/console **déterministes** (références stables
  `CUST-*`/`BILL-*`/`WO-*`, zéro réseau) — remplaçables par les vrais
  connecteurs CAMTEL par configuration uniquement (`CRM_PROVIDER`,
  `BILLING_PROVIDER`, `PROVISIONING_PROVIDER`, `SMS_PROVIDER`).
- Orchestrateur `run_subscription_integrations()` câblé dans
  `change-status` : APPROVED → upsert CRM ; ACTIVATED → provisioning +
  compte de facturation. Résultats exposés dans la réponse HTTP
  (`integrations`) pour observabilité back-office.
- **Résilience testée** : chaque intégration est isolée dans un try dédié
  (résolution provider incluse) — une panne externe renvoie `FAILED`
  sans jamais bloquer la transition admin (bug d'évaluation anticipée des
  providers attrapé par le test d'isolation puis corrigé).
- Omnicanal : `send_omnichannel_notification()` ajoute email (provider V2)
  + SMS à la notification in-app lors des transitions, gated par
  `NOTIFICATIONS_OMNICHANNEL=False` (défaut) — isolation par canal.
- Settings V3 ajoutés (`base.py`) + `.env`/`.env.example` documentés.

### Tests V3 (13/13 OK)
- `apps.core.tests.V3ServicesTest` (8) : mocks, factories ValueError,
  orchestration APPROVED/ACTIVATED, isolation panne CRM, omnicanal off/on.
- `apps.subscriptions.tests.SubscriptionV3IntegrationsTest` (5) : bout en
  bout endpoint admin (`integrations`/`omnichannel`), transition neutre,
  panne CRM non bloquante, dispatch réel quand activé.

### Mobile-ready (vérifié)
- OpenAPI `/api/schema/` + Swagger `/api/docs/` (drf-spectacular), JWT
  Bearer partout côté client, refresh cookie HttpOnly rotation+blacklist :
  l'API est consommable telle quelle par React Native/Flutter.



## [Unreleased] — Robustesse chatbot + stabilisation environnement (2026-08-24)

### Chatbot — corps JSON mal formé (bug 500 → 400)
- `ChatbotView.post` levait une `AttributeError: 'str' object has no attribute
  'get'` (→ 500 opaque) dès qu'un appel envoyait un corps JSON qui n'est pas un
  objet (string, liste, `null`). Le frontend envoie toujours `{ question }`,
  mais l'endpoint public doit être robuste aux appels externes/malformés.
- Corrigé : garde `isinstance(request.data, dict)` → réponse **400** explicite
  (`{'answer': ...}`) au lieu de planter. Le fallback search reste disponible
  pour une question vide.
- Test ajouté : `ChatbotViewTest.test_chatbot_malformed_body_returns_400`.
- Vérifié en conditions réelles : body valide → 200 ; body `"question"` → 400.

### Environnement local stabilisé
- `.env` racine créé (dev : `CHATBOT_PROVIDER=none`, SQLite, seed demo actif)
  pour que `load_dotenv()` charge des valeurs saines en local.
- Serveurs obsolètes de sessions précédentes (4 process `python` dont certains
  hors `.venv`) arrêtés ; serveur unique relancé proprement avec le `.venv`.
- Nettoyage des artefacts de session (`chatbot_keys.txt` vide, scripts
  `fix_backend.py`/`diag_tests.py`/`rebuild_tests.py`).

### Validation de la suite backend (état réel, honnête)
- Suite complète : **109 tests trouvés, 101 OK, 8 échecs, 1 skip**.
- Les 8 échecs sont **pré-existants et hors périmètre chatbot** : tous du type
  `403 != 401` sur les permissions anonymes (`AdminOnly`/`IsAdminOrEditor`
  renvoient 403 pour un anon au lieu du 401 documenté par `PHASE_2`).
  Listés : `categories.test_anonymous_cannot_create`, `contacts` (list + markread),
  `core.V2EndpointsTest.test_payment_initiate_...`, `media` (list + upload),
  `news.test_anonymous_cannot_create`, `promotions.test_anonymous_cannot_create`.
  À traiter dans un lot dédié (correction des permissions/`force_authenticate`),
  indépendant du correctif chatbot.
- Le nouveau `test_chatbot_malformed_body_returns_400` **passe** (non listé
  dans les 8 échecs).

## [Unreleased] — Finalisation V1/V2/V3 : médiathèque frontend restaurée (2026-08-20)

### Médiathèque (frontend regressé — page manquante)
- Le routeur importait `@/features/media/pages/AdminMediaLibraryPage`, mais le
  dossier `features/media/` était vide → échec du build de production.
- Rapporté : `mediaApi.ts` (liste paginée `/media/`, upload multipart,
  suppression), `hooks/useMedia.ts` (React Query + invalidation du cache),
  `pages/AdminMediaLibraryPage.tsx` (grille responsive, upload gated
  `upload_media`, suppression gated `delete_media`, pagination, états
  vide/chargement, toasts).
- Types partagés : `MediaFile.uploaded_by` corrigé (le serializer DRF renvoie
  `uploaded_by`, pas `uploaded_by_id`). ~8 clés i18n `admin.media.*` ajoutées
  en FR + EN.
- `tsc -b` + `vite build` + 29/29 tests Vitest OK.

### Validation pipeline backend (environnement `.venv`)
- `manage.py check` OK ; suite backend **99/99 tests OK** (`Ran 99 tests`),
  exécutée dans le `.venv` du projet (791s → 915s).
- Point d'attention : les 3 tests Gemini
  (`mock.patch('google.generativeai...')`) ne tournent que si le package
  `google-generativeai` est importable. Il est déclaré dans `requirements.txt`
  et présent dans le `.venv` ; si l'on exécute les tests avec un autre
  interpréteur Python, il faut d'abord `pip install -r requirements.txt`
  (c'est ce que fait la CI).

### Page Assistant IA (V3) + clés chatbot (correction i18n)
- **Page de chat dédiée** `features/chat/` (route `/assistant`) : `chatApi.ts`
  (POST `/chatbot/ask/`), `useChat.ts`, `AssistantPage.tsx` (conversation
  pleine page, suggestions, indicateur de saisie, auto-scroll, bouton
  réinitialiser). Endpoint public `AllowAny` + throttle chatbot.
- Lien `Assistant` ajouté à la nav publique (desktop + mobile) et à i18n
  (`nav.assistant`).
- **Bug i18n pré-existant corrigé** : le `ChatbotWidget` référençait ~8 clés
  `chatbot.*` (`title`, `welcomeMessage`, `inputPlaceholder`, etc.) qui
  n'existaient nulle part dans i18n.ts — il aurait affiché des clés brutes.
  Bloc `chatbot:` ajouté en FR + EN (dont `suggestions[]` en tableau).
- `tsc -b` + `vite build` (chunk `AssistantPage`) + 29/29 tests Vitest OK.

## [Unreleased] — Tickets support (V2) + correctif espace client (2026-08-19)

### Tickets support (section 27 mission)
- Backend complet et testé, mais **aucune interface** (même symptôme que le
  workflow de souscription). Ajouté côté frontend : types (`SupportTicket`,
  `TicketMessage`, `TicketStatus`, `TicketPriority`), `ticketsApi.ts`, hooks
  React Query (`useMyTickets`, `useCreateTicket`, `useTicketList`, `useTicket`,
  `useReplyTicket`, `useUpdateTicketStatus`).
- 4 nouvelles pages : `ClientTicketListPage` (liste + création),
  `ClientTicketDetailPage` (fil de messages + réponse côté client),
  `AdminTicketListPage` (liste + filtre statut), `AdminTicketDetailPage`
  (fil de messages + changement de statut côté admin). Composant partagé
  `TicketThread` réutilisé des deux côtés (même endpoint de réponse).
- Routes `/mon-compte/tickets[/:id]` et `/admin/tickets[/:id]`, lien de nav
  admin (réutilise la permission `manage_subscriptions`, confirmée identique
  à celle du ViewSet tickets côté backend : `AdminOnly`).
- Bug de code mort nettoyé côté backend : code inatteignable après un
  `return` dans `SupportTicketViewSet.reply` (copié-collé résiduel).
- Vérifié en conditions réelles contre un vrai serveur : création de ticket
  → réponse → changement de statut (`OPEN` → `IN_PROGRESS`), réponse API
  confirmée conforme aux types TypeScript à chaque étape.

### Correctif espace client (bug pré-existant trouvé en marge des tickets)
- **Bug de routing** : `ClientAccountPage` (parent) ne rendait aucun
  `<Outlet />`, alors que `/mon-compte/abonnements` et `/mon-compte/dashboard`
  étaient déclarées en routes imbriquées dessous — ces deux pages ne
  s'affichaient donc jamais, même en connaissant l'URL exacte. Aucun lien
  nulle part dans l'app ne pointait vers ces routes non plus (bug silencieux,
  jamais remarqué). Corrigé : routes transformées en routes sœurs, nouveau
  composant `ClientAccountNav` (Profil / Abonnements / Tableau de bord /
  Tickets) ajouté aux 4 pages de l'espace client pour les rendre enfin
  atteignables.
- **Bug de données** : `ClientSubscriptionsPage` utilisait un type local
  erroné (`product?.name`) alors que l'API renvoie `product_name` (string
  à plat, pas un objet imbriqué) — le nom du produit aurait toujours affiché
  "-". Corrigé en réutilisant le type partagé `SubscriptionRequest`. Vérifié
  en réel : une souscription créée avec le compte de test affiche bien
  "Forfait Blue X", pas "-".
- **~25 clés i18n manquantes** trouvées dans les 3 pages client
  (`account.*` incomplet, `dashboard.*` inexistant) — même défaut que le
  composant orphelin des souscriptions découvert précédemment. Toutes
  ajoutées en FR+EN, vérifiées par script de contrôle (aucune clé utilisée
  dans le code qui ne soit pas définie dans les deux blocs de langue).
- `ClientAccountPage` nettoyée : suppression d'un faux indicateur de
  chargement permanent (spinner qui ne se résolvait jamais), remplacé par un
  vrai lien vers les souscriptions.

### Vérifications finales du lot
98/98 tests backend, 29/29 tests frontend, `tsc -b` propre, build de
production réussi, testé en conditions réelles (serveur + curl) à chaque
étape : tickets (création/réponse/statut) et espace client
(dashboard/abonnements avec `product_name` correct).

### Fichiers principaux ajoutés/modifiés
`backend/apps/core/views.py` (nettoyage code mort),
`frontend/.../features/tickets/` (nouveau : api, hooks, 4 pages, composant
TicketThread), `frontend/.../features/account/components/ClientAccountNav.tsx`
(nouveau), `frontend/.../features/account/pages/` (3 pages réécrites),
`frontend/.../shared/types/index.ts` (types tickets), `frontend/.../shared/lib/i18n.ts`
(+~45 clés FR+EN), `frontend/.../app/router.tsx`, `frontend/.../app/layout/AdminSidebar.tsx`.

## [Unreleased] — Éligibilité + Paiement (V2) (2026-08-20)

Même constat que pour tickets : backend complet et testé (`MockEligibilityProvider`,
`MockPaymentProvider`), aucune interface.

- **Éligibilité** (section 28 mission) : widget `EligibilityChecker` embarqué
  sur la fiche produit — adresse/téléphone optionnels, résultat explicable
  (éligible/non + raisons). Endpoint public, aucune authentification requise.
- **Paiement** (section 29 mission) : `PaymentCta` affiché dans l'état de
  succès de `SubscriptionPage`, avec référence de transaction et mention
  explicite "environnement de démonstration". **Contrainte identifiée et
  gérée** : le formulaire de souscription est public (soumission anonyme
  possible), mais `PaymentInitiateView` exige `IsAuthenticated` côté
  backend — le CTA de paiement ne s'affiche donc que si l'utilisateur est
  connecté, pour éviter un 401 silencieux.
- Types `EligibilityResult`/`PaymentResult`, clients API, hooks React Query
  dédiés (`useCheckEligibility`, `useInitiatePayment`).
- Vérifié en conditions réelles contre un vrai serveur : éligibilité sans
  auth (fonctionne), paiement sans auth (401 confirmé, comme prévu), paiement
  avec auth (réponse conforme au type TypeScript).
- 98/98 tests backend (non-régression), 29/29 frontend, `tsc -b` propre,
  build de production réussi, ~13 nouvelles clés i18n FR+EN vérifiées par
  script.

### Fichiers principaux ajoutés/modifiés
`frontend/.../features/eligibility/` (nouveau), `frontend/.../features/payments/`
(nouveau), `frontend/.../features/products/pages/ProductDetailPage.tsx`,
`frontend/.../features/subscriptions/pages/SubscriptionPage.tsx`,
`frontend/.../shared/types/index.ts`, `frontend/.../shared/lib/i18n.ts`.

## [Unreleased] — Documents + Recommandations (V2) — clôture de l'audit V1/V2 (2026-08-20)

Derniers items de la checklist V2 (sections 24 et 35 de la mission).

- **Documents** : le backend expose un catalogue **statique** en config
  (`settings.DOCUMENT_STORE`, 2 documents d'exemple), pas de CRUD ni
  d'upload. Décision assumée : pas de fausse interface d'administration
  construite pour une fonctionnalité que le backend ne supporte pas
  réellement — juste une page de consultation publique (`DocumentsPage`,
  recherche incluse), honnête sur ce que le système fait vraiment. Lien
  ajouté au footer, route `/documents`.
- **Recommandations** : widget `RecommendedProducts` sur la fiche produit,
  affichant explicitement les **raisons** de chaque recommandation (même
  type d'offre, même segment, etc.) — le point différenciant du cahier des
  charges ("logique explicable"), pas juste une liste. Distinct du
  `SimilarProducts` déjà existant (filtre catégorie côté client) : les deux
  cohabitent, l'un componentisé côté client, l'autre calculé côté backend.
- Vérifié en conditions réelles : recherche documentaire, liste complète,
  recommandations pour un produit réel — réponses conformes aux types
  TypeScript à chaque appel.
- 98/98 tests backend (non-régression), 29/29 frontend, `tsc -b` propre,
  build de production réussi, ~13 nouvelles clés i18n vérifiées par script.

### Ce point clôt l'audit V1/V2 démarré le 2026-08-18
Récapitulatif complet des écarts trouvés et corrigés sur les deux checklists
du cahier des charges (sections 57/58) dans `ROADMAP.md`.

### Fichiers principaux ajoutés/modifiés
`frontend/.../features/documents/` (nouveau), `frontend/.../features/recommendations/`
(nouveau), `frontend/.../features/products/pages/ProductDetailPage.tsx`,
`frontend/.../app/layout/PublicFooter.tsx`, `frontend/.../app/router.tsx`,
`frontend/.../shared/types/index.ts`, `frontend/.../shared/lib/i18n.ts`.

## [Unreleased] — Audit V1 complet + comblement des écarts (2026-08-18/19)

Audit systématique de chaque checklist du cahier des charges (sections 57/58
de la mission initiale) : pour chaque item, vérification que l'endpoint
backend existe **et** qu'il est réellement appelé par le frontend — pas
seulement que le fichier existe. Trois écarts V1 trouvés et corrigés.

### Workflow de souscription (V1, section 14/18 mission)
- Le composant `AdminChangeStatusDialog` existait mais n'était importé par
  aucune route/page (composant orphelin), et référençait des clés i18n
  jamais définies (`status.pending`, etc.) — un admin n'avait aucun moyen de
  traiter une demande de souscription depuis l'UI, malgré un backend complet
  et testé (statuts, historique, `change-status`).
- Ajouté : `AdminSubscriptionListPage` (liste + filtre par statut),
  `AdminSubscriptionDetailPage` (détail + historique + formulaire de
  changement de statut), routes `/admin/souscriptions[/:id]`, lien de nav,
  permission `manage_subscriptions` (alignée sur `AdminOnly` backend :
  super_admin/admin), types `SubscriptionRequest`/`SubscriptionStatus`,
  client API + hooks React Query.
- `AdminChangeStatusDialog` réécrit : vrais hooks (`useChangeSubscriptionStatus`),
  vrai système de toast (`useToast`/`push`), clés i18n réelles
  (`admin.subscriptions.*`, 24 nouvelles clés FR+EN).
- Vérifié en conditions réelles : création d'une demande → liste → login
  admin → changement de statut → relecture confirmant l'historique à jour,
  contre un vrai serveur.

### Analytics du dashboard admin (V1, section 19/20 mission)
- Le graphique "produits les plus vus" affichait des **données factices
  codées en dur** (`viewsSample`, commentaire du code : "en l'absence de
  backend connecté") alors que `/analytics/summary/` fonctionnait déjà.
- Ajouté : `analyticsApi.ts`, `useAnalyticsSummary()`, type
  `AnalyticsSummary`. `AdminDashboardPage` réécrite pour afficher les
  vraies données (top offres, taux de conversion, événements 30 jours,
  recherches fréquentes).
- Vérifié avec de vrais événements créés en base, réponse API confirmée
  conforme au type TypeScript utilisé.

### Recherche globale (V1, section 12 mission)
- **Correction d'une évaluation précédente** : ni le frontend ni même le
  backend ne cherchaient au-delà des produits — `SearchAutocompleteView`
  ne portait que sur `Product`, malgré le cahier des charges qui demande de
  couvrir aussi actualités/promotions/FAQ.
- `SearchAutocompleteView` étendue pour interroger les 4 sources (Product,
  News, Promotion, ProductFAQ), résultats typés par `type`. 3 nouveaux
  tests (couverture des 4 sources, longueur minimale de requête, exclusion
  du contenu non publié/inactif).
- `SearchAutocomplete.tsx` réécrit pour appeler le vrai endpoint au lieu du
  filtre produit seul, avec navigation contextuelle selon le type de
  résultat.

### Collecte d'événements analytics (découverte annexe)
- Aucun événement n'était jamais envoyé depuis le frontend — la correction
  analytics ci-dessus serait restée vide en usage réel sans ça.
- Ajouté `shared/lib/analytics.ts` (`trackEvent`, fire-and-forget — un échec
  de tracking ne bloque jamais l'action utilisateur). Instrumenté :
  `search` (SearchAutocomplete), `offer_view` (ProductDetailPage, une fois
  par fiche), `offer_compare` (ProductComparePage, dès 2 offres
  sélectionnées), `subscription_started`/`subscription_submitted`
  (SubscriptionPage).

### Vérifications finales du lot V1
98/98 tests backend, 29/29 tests frontend, `tsc -b` propre, build de
production réussi. Testé en conditions réelles à chaque étape (serveur
`runserver` + `curl`), pas seulement en tests unitaires.

### Fichiers principaux ajoutés/modifiés
`backend/apps/core/views.py` (SearchAutocompleteView étendue),
`backend/apps/core/tests.py` (+3 tests recherche),
`frontend/.../features/subscriptions/` (nouvelles pages, hooks, api, types),
`frontend/.../features/account/components/AdminChangeStatusDialog.tsx`
(réécrit), `frontend/.../features/dashboard/` (analyticsApi, hook,
AdminDashboardPage réécrite), `frontend/.../shared/components/SearchAutocomplete.tsx`
(réécrit), `frontend/.../shared/lib/analytics.ts` (nouveau),
`frontend/.../shared/lib/i18n.ts` (+~30 clés FR+EN), `frontend/.../app/router.tsx`,
`frontend/.../app/layout/AdminSidebar.tsx`, `frontend/.../features/auth/permissions.ts`.

## [Unreleased] — Activation Gemini + durcissement timeout (2026-08-17)

Clé `GOOGLE_API_KEY` fournie par Vick et activée (`CHATBOT_PROVIDER=gemini`).
Découvertes en testant en conditions réelles (voir `SECURITY_AUDIT.md` §7) :

- **Aucun timeout** n'était configuré sur les 3 providers LLM (Gemini,
  OpenAI, Ollama) — un appel qui ne répond jamais bloquait le thread de
  requête indéfiniment. Ajout de `CHATBOT_TIMEOUT_SECONDS` (20s par défaut),
  câblé dans Gemini (`request_options.timeout`) et OpenAI (`timeout=`).
- **Le timeout du SDK seul ne suffit pas** : testé en réel, un échec de
  connexion TLS répété a fait retenter le SDK gRPC de Gemini pendant 40s+
  malgré un timeout de 8s configuré. Ajout d'un filet de sécurité —
  `_call_with_hard_timeout()` (timeout mur par thread daemon) — qui garantit
  que la requête utilisateur revient dans les temps, même si l'appel SDK
  sous-jacent continue en arrière-plan (limite documentée, pas de kill de
  thread possible en Python).
- Bug de collision de paramètre trouvé et corrigé pendant le câblage
  (`timeout` passé deux fois à la même fonction) — détecté par les tests.
- 3 nouveaux tests chatbot : pipeline Gemini complet (SDK mocké au point
  réseau), dégradation propre sur erreur SDK, timeout dur vérifié avec un
  SDK qui ne répond jamais (retour en ~1s au lieu de 30s simulées).
- Vérifications : 95/95 tests backend. Testé aussi via un vrai serveur avec
  la vraie clé (réseau du sandbox bloqué vers Gemini — confirmé que la
  requête revient bien en 8s au lieu de 40s+ avant le correctif).
- **Rappel sécurité** : la clé fournie est la même que celle trouvée en
  clair dans `.env.example` (voir entrée précédente) — recommandation de la
  régénérer toujours valable.

### Fichiers modifiés
`backend/config/settings/base.py` (CHATBOT_TIMEOUT_SECONDS),
`backend/apps/core/providers.py` (`_call_with_hard_timeout`, timeout câblé
Gemini/OpenAI, signature `LLMProvider.generate_content` étendue),
`backend/apps/core/chatbot_service.py`, `backend/apps/core/tests.py`.

## [Unreleased] — i18n : correction d'évaluation + finitions (2026-08-16)

**Correction importante** : une évaluation précédente ("i18n très
incomplète, ~32 clés") reposait sur le mauvais fichier — `src/locales/*/translation.json`,
jamais importés nulle part (fichiers morts). Les vraies traductions vivent
dans `src/shared/lib/i18n.ts` (~800 lignes, FR+EN, déjà utilisées par 46/67
composants). Détail dans `ROADMAP.md`.

Travail réel effectué après ce re-audit :
- Scan exhaustif (aria-label, placeholder, alt, toasts, messages de
  validation) → seulement 5 chaînes en dur trouvées et corrigées
  (`Logo.tsx`, `ThemeToggle.tsx`, `PublicHeader.tsx`, `ProductGallery.tsx`,
  `AdminProductFormPage.tsx`), avec 8 nouvelles clés `common.a11y.*`
  (FR+EN) : `closeMenu`, `enableLightTheme`, `enableDarkTheme`,
  `viewImageNumber`, `coverPreview`, `homeLink`.
- Suppression de `src/locales/` (fichiers morts, source de la confusion
  ci-dessus).
- **Bug de fragilité des tests trouvé et corrigé** : `src/shared/test/setup.ts`
  n'initialisait jamais i18next explicitement — le succès d'un test
  dépendait de l'ordre d'exécution accidentel des fichiers de test par
  Vitest. Fixé par un import explicite de `@/shared/lib/i18n` dans le setup.
  Revérifié en isolation et 2x en suite complète : déterministe.
- Vérifications : `tsc -b` propre, 28/28 tests frontend (isolation + suite
  complète x2), 92/92 tests backend (non-régression croisée).

## [Unreleased] — Validation nginx réelle + correctif (2026-08-16)

Dernier point du lot sécurité, initialement documenté comme "non testable"
faute de binaire nginx — finalement possible en installant nginx localement
(`apt-get install nginx`, autorisé par la config réseau du sandbox).

- `nginx -t` exécuté pour de vrai sur `nginx/nginx.conf`, monté exactement
  comme en docker-compose (snippet `conf.d` dans un `http{}` standard).
- nginx démarré avec deux upstreams factices simulant `backend`/`frontend` ;
  vérification `curl` réelle : les 5 en-têtes de sécurité (X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP) sont
  bien présents sur `/`, `/api/` et `/health`, y compris sur les réponses
  proxyfiées.
- **Bug corrigé** : `/health` renvoyait deux en-têtes `Content-Type`
  (doublon `default_type` + `add_header`). Remplacé par `default_type
  text/plain;`.
- Détail complet des vérifications dans `SECURITY_AUDIT.md` §5.2.

## [Unreleased] — Migration react-router-dom v6 → v7 (2026-08-16)

Suite logique du lot sécurité précédent : dernière vulnérabilité npm
restante, corrigée après un inventaire complet des usages du routing (voir
`SECURITY_AUDIT.md` §5.5 pour le détail des vérifications).

- `react-router-dom` : `^6.26.2` → `^7.18.2`.
- Aucun changement de code applicatif nécessaire — seules des APIs stables
  entre v6 et v7 étaient utilisées (pas de `createBrowserRouter`, pas de
  loaders/actions).
- Vérifications : `tsc -b` propre, 28/28 tests frontend (warnings "Future
  Flag" disparus, comme attendu), `npm run build` production réussi,
  92/92 tests backend (non-régression croisée).
- `npm audit --omit=dev` : **0 vulnérabilité** (contre 2 modérées avant).

## [Unreleased] — Lot sécurité complémentaire (2026-08-16)

Fait suite aux recommandations restantes de `SECURITY_AUDIT.md` (version
précédente, §4). Chaque point a été vérifié par des tests réels (unitaires +
appels HTTP en direct contre un serveur de dev), pas seulement écrit.

### Auth — refresh token en cookie HttpOnly
- Le refresh token n'est **plus jamais renvoyé dans le corps JSON** ni stocké
  en `localStorage`. Backend (`apps/users/views.py`) : `LoginView`,
  `RegisterView`, `RefreshView`, `LogoutView` posent/lisent/effacent un cookie
  `HttpOnly` (`camtel_refresh`, `SameSite=Lax`, scopé à `/api/v1/auth/`).
- `ROTATE_REFRESH_TOKENS=True` : rotation à chaque refresh (ancien token
  blacklisté). Vérifié en direct (JTI différent à chaque appel).
- Frontend : `tokenStorage.ts` ne gère plus que l'access token ;
  `axios.ts` passe en `withCredentials: true` ; `authApi.ts`/`useAuth.tsx`
  mis à jour en conséquence.
- **Bug corrigé** : `logout()` côté frontend n'appelait jamais l'API — le
  refresh token restait valide malgré la déconnexion apparente. Corrigé.
- Settings ajoutés : `REFRESH_COOKIE_NAME/SECURE/SAMESITE/PATH/MAX_AGE`,
  `CORS_ALLOW_CREDENTIALS=True`.

### En-têtes de sécurité HTTP
- `nginx/nginx.conf` (passerelle) : `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  `Content-Security-Policy` calibrée sur l'app réelle. Non testé avec un
  binaire nginx (indisponible dans l'environnement de dev) — à valider avant
  déploiement (`nginx -t`).

### Uploads — validation de contenu réelle
- Nouveau `apps/core/upload_validation.py` : vérifie le **contenu binaire**
  (magic bytes PDF/OLE2/OOXML, décodage Pillow pour les images) plutôt que la
  seule extension déclarée par le client (section 53 de la mission).
- SVG retiré des formats autorisés (vecteur XSS stocké).
- 6 nouveaux tests (`apps/media/tests.py`, fichier était vide auparavant).
- Antivirus (ClamAV) **non fait** — infrastructure dédiée non disponible ici,
  documenté comme limite assumée.

### Tests de permission — 4 apps auparavant sans AUCUN test
- `apps/categories`, `apps/news`, `apps/promotions`, `apps/contacts`
  n'avaient aucun test. 23 nouveaux tests (lecture publique, écriture
  anonyme/VIEWER refusée, écriture EDITOR/ADMIN acceptée, suppression admin).

### Audit dépendances
- `pip-audit -r requirements.txt` : 0 vulnérabilité.
- `npm audit` : `react-router-dom` (modérée, correctif seulement en v7,
  changement majeur non appliqué — voir `ROADMAP.md`) ; `esbuild`/vite (dev
  uniquement, risque faible, non traité).

### Découverte critique corrigée en cours de route
- Une valeur ressemblant à une vraie clé `GOOGLE_API_KEY` a été trouvée en
  clair dans `.env.example` (jamais commitée en git, mais présente sur
  disque). Remplacée par un champ vide. **Vick doit régénérer cette clé par
  précaution** (détail dans `SECURITY_AUDIT.md` §6).

### Fichiers modifiés
`backend/config/settings/base.py`, `backend/apps/users/views.py`,
`backend/apps/users/tests.py`, `backend/apps/core/upload_validation.py`
(nouveau), `backend/apps/media/serializers.py`, `backend/apps/media/tests.py`,
`backend/apps/categories/tests.py`, `backend/apps/news/tests.py`,
`backend/apps/promotions/tests.py`, `backend/apps/contacts/tests.py`,
`frontend/.../shared/lib/tokenStorage.ts`, `frontend/.../shared/lib/axios.ts`,
`frontend/.../features/auth/api/authApi.ts`,
`frontend/.../features/auth/hooks/useAuth.tsx`,
`frontend/.../features/auth/types.ts`, `nginx/nginx.conf`, `.env.example`.

### Vérifications de non-régression
92/92 tests backend, 28/28 tests frontend, `tsc -b` propre, `manage.py check`
propre, flux cookie testé en direct via curl contre un serveur réel.

## [Unreleased] — Phase 1 à 3 (V1 core)

### Sécurité & stabilisation (PHASE 1)
- **`SECRET_KEY` obligatoire en production** : `config/settings/prod.py` refuse de démarrer si la clé est absente ou égale aux placeholders de dev.
- Suppression du secret de dev par défaut jugé compromettant (remplacé par placeholder explicite `dev-only-insecure-key`).
- **Logout révocable** : `/api/v1/auth/logout/` blackliste désormais le refresh token (`rest_framework_simplejwt.token_blacklist`), journalise l'action ; durée de l'access pilotée par `JWT_ACCESS_LIFETIME_MINUTES`.
- Activation de `SIMPLE_JWT` : lifetimes configurables, blacklist.
- **Rate limiting** : ajout des scopes `login`, `register`, `auth`, `chatbot`, `search`, `partner` + throttles dédiés. Throttling global anon/user.
- **API partenaire** : throttling par clé (`PartnerRateThrottle`), `PartnerUser` doté de `pk`/`id` (corrige un crash `UserRateThrottle`).
- **Seed gated** : `seed_data` refuse de s'exécuter hors dev sauf `SEED_DEMO_DATA=true` ou `--force`. Docker compose (dev/staging) ne seed plus automatiquement ; secrets retirés des fichiers compose (var `:?` requises en staging).

### Modèle métier offre (PHASE 2)
- `Product` enrichi : `product_type` (SERVICE_OFFER/PHYSICAL_PRODUCT), `offer_type` (types télécom), `segment` (PARTICULIER/PROFESSIONNEL/ENTREPRISE/ADMINISTRATION), `billing_period`, `activation_fee`, `installation_fee`, `contract_duration`, `technology`, `availability`, `eligibility`, `features`, `benefits`, `terms`, `currency`. Propriété `manage_stock`.
- Sérialiseur produit : exposition des nouveaux champs + `manage_stock`; comparateur enrichi.
- Filtres catalogue : `offer_type`, `product_type`, `availability`, `min_price`, `max_price` (+ index).

### Workflow souscription (PHASE 3)
- `SubscriptionRequest` : numéro de demande humain unique `SUB-YYYY-NNNNNN` (auto-généré), statuts complets (`PENDING/UNDER_REVIEW/ADDITIONAL_INFO_REQUIRED/APPROVED/SCHEDULED/ACTIVATED/REJECTED/CANCELLED`), champ `address`.
- Nouveau modèle `SubscriptionStatusHistory` (audit des transitions).
- Endpoints : `POST .../change-status/` (transition + historique + notification), `GET .../my-subscriptions/`, `GET .../my-dashboard/` (espace client).
- Notifications in-app à la création et à chaque transition.

### Tests
- Correction du test cassé `test_product_create_endpoint` (`category` → `category_id`).
- Nouveaux tests : workflow souscription (7), filtres offres (4), logout + blacklist, modèle utilisateur.
- CI étendu à toutes les applications Django (`apps`).

### CI / Docs
- CI couvre désormais toutes les apps backend.
- README enrichi (workflow, offres, sécurité, variables).
- Ajout : `PROJECT_AUDIT.md`, `CHANGELOG.md`, `SECURITY_AUDIT.md`, `ARCHITECTURE_FINAL.md`, rapports V1/V2/V3, doc API et RBAC.

### Migrations
- `products.0006_product_activation_fee_product_availability_and_more`
- `subscriptions.0002_subscriptionstatushistory_and_more` (+ data backfill)
- `subscriptions.0003_alter_subscriptionrequest_request_number`
- `token_blacklist` (SimpleJWT)

### Comptes / fichiers principaux
Voir `V1_COMPLETION_REPORT.md` et `PROJECT_AUDIT.md` pour le détail.
