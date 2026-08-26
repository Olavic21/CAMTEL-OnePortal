# ROADMAP — CAMTEL-OnePortal

> Ce document remplace la logique "tout faire d'un coup" du prompt de mission
> initial par un plan réaliste, par lots, chacun vérifié par des tests avant
> de passer au suivant. Pas de deadline fixe actuellement (projet perso de
> stage, développé au rythme de Vick).

## Fait (vérifié par tests, pas seulement écrit)

- ✅ **V1 core** : auth JWT, RBAC, modèle métier offre télécom, workflow
  souscription, espace client, back-office, notifications, chatbot FAQ.
- ✅ **V2 abstractions** : paiement mock, éligibilité mock, RAG/chatbot
  providers, tickets support, analytics events, recherche documentaire,
  recommandations explicables.
- ✅ **Lot sécurité (2026-08-16)** : refresh token en cookie HttpOnly +
  rotation, logout réellement révocable des deux côtés, en-têtes de
  sécurité HTTP (CSP/X-Frame-Options/...) au niveau nginx, validation de
  contenu réelle des uploads (magic bytes, pas juste l'extension), 23
  nouveaux tests de permission sur 4 apps qui n'en avaient aucun,
  `pip-audit`/`npm audit` exécutés et documentés, clé API en clair trouvée
  et corrigée dans `.env.example`.
- ✅ **Migration react-router-dom v6→v7 (2026-08-16)** : dernière
  vulnérabilité npm corrigée. `npm audit --omit=dev` : 0 vulnérabilité.
- ✅ **Validation nginx réelle (2026-08-16)** : `nginx -t` + serveur démarré
  + `curl` contre des upstreams factices — en-têtes de sécurité confirmés en
  conditions réelles sur `/`, `/api/`, `/health`. Bug de double en-tête
  `Content-Type` sur `/health` trouvé et corrigé au passage.
- ✅ **i18n frontend (2026-08-16)** — **correction d'une évaluation erronée**
  faite précédemment : j'avais vérifié `src/locales/*/translation.json` (32
  lignes, jamais importés nulle part — des fichiers morts) et conclu que
  l'i18n était "très incomplète". En réalité, les vraies traductions vivent
  dans `src/shared/lib/i18n.ts` (~800 lignes, FR+EN complets, 46/67
  composants utilisent déjà `useTranslation`). Un scan exhaustif
  (`aria-label`, `placeholder`, `alt`, `toast.*`, messages de validation
  zod) n'a trouvé que **5 chaînes réellement en dur** (aria-labels/alt sur
  `Logo`, `ThemeToggle`, `PublicHeader`, `ProductGallery`,
  `AdminProductFormPage`) — corrigées avec 8 nouvelles clés `common.a11y.*`.
  Fichiers `src/locales/` morts supprimés pour ne plus induire en erreur une
  future session. **Bug de fragilité des tests trouvé et corrigé au
  passage** : `src/shared/test/setup.ts` n'initialisait jamais i18next
  explicitement — un test passait ou échouait selon l'ordre d'exécution
  accidentel des fichiers de test. Fixé par un import explicite dans le
  setup ; revérifié en isolation + 2x en suite complète, déterministe.
- ✅ **Chatbot Gemini activé (2026-08-17)** : clé fournie par Vick branchée.
  Timeout ajouté sur les 3 providers LLM (absent partout avant). Puis,
  après avoir constaté en conditions réelles que le timeout SDK seul ne
  suffisait pas (échec gRPC ignorant le timeout demandé, requête bloquée
  40s+), ajout d'un filet de sécurité (timeout dur par thread) — vérifié à
  la fois par test automatisé et par un vrai appel serveur (retour en 8s au
  lieu de 40s+). **Non vérifiable en conditions réelles dans ce sandbox**
  (réseau bloqué vers `generativelanguage.googleapis.com`) — reste à
  confirmer par Vick.
- ✅ **Audit V1/V2 complet contre le cahier des charges (2026-08-18/19)** —
  vérification systématique de chaque endpoint backend contre son usage
  réel côté frontend (pas seulement "le fichier existe"). Trois écarts réels
  trouvés en V1 et corrigés :
  - **Workflow de souscription** : le backend gérait tout (statuts,
    historique, `change-status`, testé), mais un composant
    `AdminChangeStatusDialog` existait sans être branché à aucune route — un
    admin n'avait aucun moyen de traiter une demande. Le composant
    référençait aussi des clés i18n qui n'existaient nulle part. Corrigé :
    page liste (`AdminSubscriptionListPage`) + page de traitement
    (`AdminSubscriptionDetailPage`), routes `/admin/souscriptions[/:id]`,
    lien de nav, permission `manage_subscriptions` alignée sur `AdminOnly`
    backend, composant réparé (vrais hooks React Query, vrai système de
    toast, clés i18n réelles).
  - **Analytics du dashboard** : affichait un graphique avec des **données
    factices codées en dur** ("en l'absence de backend connecté", dixit le
    commentaire du code lui-même) alors que `/analytics/summary/`
    fonctionnait déjà. Branché sur le vrai endpoint (top offres, taux de
    conversion, recherches fréquentes).
  - **Recherche globale** : ni le frontend ni même le **backend** ne
    cherchaient au-delà des produits (contrairement à ce qu'une évaluation
    précédente avait affirmé — corrigé ici aussi). `SearchAutocompleteView`
    étendue pour couvrir produits + actualités + promotions + FAQ (3 tests),
    `SearchAutocomplete.tsx` réécrit pour l'utiliser.
  - **Découverte annexe** : aucun événement analytics n'était jamais envoyé
    depuis le frontend (le dashboard aurait été vide en usage réel malgré la
    correction ci-dessus). Client de tracking créé (`shared/lib/analytics.ts`,
    fire-and-forget) et instrumenté sur les actions clés : recherche, vue
    produit, comparaison, début/soumission de souscription.
  - Vérifié à chaque étape : tests dédiés + `tsc -b` + suite complète +
    build de production + appels HTTP réels contre un serveur en marche.
    98/98 tests backend, 29/29 frontend au terme du lot V1.
- ✅ **Tickets support V2 + correctif espace client (2026-08-19)** :
  - **Tickets** : backend testé, aucune UI (même symptôme que le workflow de
    souscription). 4 pages ajoutées (liste/détail client + liste/détail
    admin), composant `TicketThread` partagé, routes, nav. Vérifié en réel :
    création → réponse → changement de statut contre un vrai serveur.
  - **Bug de routing trouvé en marge** : `ClientAccountPage` ne rendait
    aucun `<Outlet />` alors que `/mon-compte/abonnements` et
    `/mon-compte/dashboard` étaient imbriquées dessous — ces pages ne
    s'affichaient jamais, et aucun lien nulle part n'y menait. Corrigé
    (routes sœurs + nouveau composant `ClientAccountNav`).
  - **Bug de données trouvé en marge** : `ClientSubscriptionsPage` lisait
    `product?.name` (inexistant) au lieu de `product_name` (le vrai champ
    API) — le nom du produit aurait toujours affiché "-". Corrigé et
    vérifié en réel (souscription créée → "Forfait Blue X" s'affiche
    correctement, plus "-").
  - ~25 clés i18n manquantes ajoutées (`account.*`, `dashboard.*`), même
    défaut que le composant orphelin des souscriptions.
  - 98/98 tests backend, 29/29 frontend, testé en conditions réelles à
    chaque étape (tickets + espace client).
- ✅ **Éligibilité + Paiement V2 (2026-08-20)** : widget `EligibilityChecker`
  sur la fiche produit (public, sans auth), `PaymentCta` après souscription
  réussie (affiché seulement si connecté — le paiement exige
  `IsAuthenticated` côté backend alors que la souscription reste publique,
  contrainte identifiée et gérée). Vérifié en réel : éligibilité publique
  OK, paiement sans auth → 401 confirmé comme attendu, paiement avec auth
  conforme au type. 98/98 backend, 29/29 frontend.
- ✅ **Documents + Recommandations V2 (2026-08-20) — clôture de l'audit V1/V2** :
  - **Documents** : le backend expose un catalogue **statique** (config, pas
    de CRUD/upload). Décision assumée : pas de fausse UI d'admin pour une
    fonctionnalité que le backend ne supporte pas — juste une page de
    consultation publique avec recherche (`DocumentsPage`).
  - **Recommandations** : widget `RecommendedProducts` sur la fiche produit,
    affichant les **raisons** de chaque recommandation (le point
    différenciant du cahier des charges : "logique explicable"), distinct du
    `SimilarProducts` existant (filtre catégorie côté client).
  - Vérifié en réel : recherche documentaire, recommandations pour un
    produit réel, réponses conformes aux types. 98/98 backend, 29/29
    frontend.

## Audit V1/V2 — bilan complet (clos le 2026-08-20)

Toutes les checklists du cahier des charges (sections 57 V1 et 58 V2) ont été
vérifiées endpoint par endpoint contre l'usage réel du frontend, pas
seulement contre l'existence des fichiers. Récapitulatif des écarts trouvés
et corrigés (détail complet dans `CHANGELOG.md`) :

| Item | Constat initial | État final |
|---|---|---|
| Workflow de souscription (V1) | Composant orphelin, 0 UI admin | ✅ Corrigé |
| Analytics dashboard (V1) | Données factices en dur | ✅ Corrigé |
| Recherche globale (V1) | Produits seulement, FE **et** BE | ✅ Corrigé |
| Collecte d'événements (V1) | Jamais envoyés | ✅ Corrigé |
| Espace client `/mon-compte/*` (V1) | Routes cassées (`Outlet` manquant), inaccessibles | ✅ Corrigé |
| Tickets support (V2) | Backend testé, 0 UI | ✅ Corrigé |
| Éligibilité (V2) | Backend testé, 0 UI | ✅ Corrigé |
| Paiement (V2) | Backend testé, 0 UI | ✅ Corrigé |
| Documents (V2) | Backend statique, 0 UI | ✅ Corrigé (lecture seule, assumé) |
| Recommandations (V2) | Backend testé, 0 UI | ✅ Corrigé |

Verdict honnête : le pattern répété partout était "backend solide et testé,
zéro interface" — pas un problème de qualité de code, un problème
d'intégration jamais terminée. Chaque correction a été vérifiée par tests
dédiés + `tsc -b` + suite complète + build de production + appels HTTP réels
contre un serveur en marche, jamais juste "le code compile".

## Priorité immédiate proposée (à valider avec Vick)

1. **Vérifier le chatbot Gemini en conditions réelles** — pose une question
   au chatbot depuis l'app (ou `curl /api/v1/chatbot/ask/`) pour confirmer
   qu'un vrai appel fonctionne ; je n'ai pas pu le tester moi-même (réseau
   du sandbox bloqué vers Gemini).
2. Le reste des recommandations de `SECURITY_AUDIT.md` §4 — rien d'urgent,
   tout le reste identifié est déjà traité.

## Ensuite (par ordre décroissant de valeur / effort raisonnable)

- Intégrer `pip-audit` + `npm audit` à la CI (actuellement manuel).
- Étoffer les tests `users` (register dupliqué, mot de passe faible...).
- Accessibilité WCAG 2.1 AA — non auditée à ce jour.
- Tests end-to-end (parcours client complet, parcours admin) — pas encore
  faits, contrairement à ce qu'un rapport précédent pouvait laisser croire.
- Antivirus sur les uploads — bloqué par l'absence d'infra ClamAV/équivalent
  disponible ; à revoir si un vrai serveur de déploiement existe.
- Timeout Ollama non câblé par appel (le client ne le supporte qu'à la
  construction) — risque moindre car généralement local, mais à revoir si
  Ollama est utilisé derrière un réseau instable.
- Chunk `AdminDashboardPage` ~369 Ko (recharts) au build de production —
  au-delà du seuil d'avertissement Vite. Pas bloquant, mais un lazy-load
  dédié du chart ou une lib plus légère serait plus propre si le temps de
  chargement du dashboard admin devient sensible.

## Ce qu'on ne fait PAS "à l'aveugle"

Le prompt de mission initial demande une plateforme entreprise complète
(V1+V2+V3, RAG réel, paiement réel, i18n total, WCAG AA, E2E, audit sécurité
complet) — c'est un scope de plusieurs semaines de travail d'équipe. Ce
roadmap découpe volontairement le travail en lots vérifiables plutôt que de
prétendre livrer "100%" d'un coup. Si un point n'est pas clair côté priorité,
la règle est de demander à Vick plutôt que de deviner.
