# SECURITY_AUDIT.md — Audit de sécurité CAMTEL-OnePortal

> Méthodo : revue manuelle OWASP Top 10 + vérifications automatiques
> (`manage.py check`, suite de tests complète, `pip-audit`, `npm audit`,
> tests end-to-end réels via curl contre un serveur de dev en marche).
> Chaque ligne "✅ Corrigé" ci-dessous a été **vérifiée en exécutant le code**,
> pas seulement relue — voir le détail des vérifications en section 5.
>
> Date : 2026-08-16. État après PHASE 1 (corrections critiques, V1) + lot
> sécurité complémentaire (cookie HttpOnly, CSP, uploads, tests de permission,
> migration react-router v7, validation nginx réelle).
>
> ⚠️ **Action requise de ta part** : une clé API a été trouvée en clair dans
> `.env.example` et corrigée (§6) — **régénère cette clé** par précaution.

## 1. Résumé

| Domaine | Statut | Détail |
|---|---|---|
| Secrets | ✅ Corrigé (CRITICAL) | `SECRET_KEY` obligatoire en prod ; placeholders dev ; compose sans secrets (`${VAR:?}` en staging). |
| Seed demo | ✅ Corrigé (CRITICAL) | `seed_data` bloqué hors dev sauf `SEED_DEMO_DATA=true`/`--force` ; compose n'auto-seed plus. |
| Auth JWT | ✅ Corrigé (HIGH) | Refresh token en **cookie HttpOnly**, plus jamais dans le JSON ni en `localStorage` (voir §5.1). Rotation activée (`ROTATE_REFRESH_TOKENS=True`) : chaque refresh invalide l'ancien token. Révocation effective au logout (blacklist), et le frontend appelle désormais réellement `logout()` côté serveur (bug corrigé — avant, seul le `localStorage` était nettoyé, le refresh restait valide jusqu'à expiration). |
| Transport | 🟡 À finaliser | HTTPS/HSTS configurés en prod (`prod.py`) ; à activer en conditions réelles avec certificat TLS (pas testable dans cet environnement sans domaine/certif). |
| Cookies | ✅ Corrigé (HIGH) | Refresh en cookie HttpOnly + `SameSite=Lax`, scopé à `/api/v1/auth/`. `Secure` activable via `REFRESH_COOKIE_SECURE` (à mettre `True` en prod HTTPS). |
| En-têtes HTTP | ✅ Corrigé et **validé en conditions réelles** (HIGH) | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` ajoutés au niveau du nginx passerelle (`nginx/nginx.conf`) — voir §5.2. Testés avec un vrai binaire nginx (`nginx -t` + serveur démarré + `curl`) contre des upstreams factices imitant `backend`/`frontend` en docker-compose. |
| Autorisation | ✅ Amélioré | RBAC serveur (views), permissions plates ; scoping client sur souscriptions/tickets. 4 apps qui n'avaient **aucun test** (categories, news, promotions, contacts) ont désormais des tests de permission complets (23 tests) — voir §5.3. |
| Injections | ✅ | Querysets DRF paramétrés ; tri en liste blanche. |
| Rate limiting | ✅ | login/register/refresh/chatbot/search/contact/partner. |
| Uploads | ✅ Corrigé (MEDIUM) | Validation du **contenu réel** du fichier (magic bytes + décodage Pillow pour les images), plus seulement l'extension déclarée. SVG retiré des formats autorisés (vecteur XSS stocké). 6 tests dédiés (fichier truqué, taille excessive, extension interdite, SVG, anonyme). Antivirus (ClamAV) **non fait** — nécessite une infrastructure dédiée non disponible ici ; reste une limite assumée. |
| Dépendances | ✅ Corrigé | `pip-audit` : **0 vulnérabilité**. `npm audit` : **0 vulnérabilité** après migration `react-router-dom` v6→v7 (voir §5.5) — la vuln modérée dev (`esbuild`/vite) subsiste, faible risque, non traitée. |

## 2. Menaces OWASP vs actions

| OWASP | Cible | Action appliquée |
|---|---|---|
| A07 Identification & auth failures | Auth | Throttling login/register/refresh ; logout réellement révocable des deux côtés (backend + frontend) ; refresh en cookie HttpOnly avec rotation. |
| A05 Security misconfig | Secrets, en-têtes | SECRET_KEY gated ; CORS prod en liste blanche ; DEBUG=False en staging/prod ; CSP/X-Frame-Options/Referrer-Policy au niveau nginx. |
| A01 Broken access control | Endpoints admin | RBAC serveur conservé/renforcé ; souscriptions/tickets scoping client ; 4 apps auparavant sans aucun test de permission désormais couvertes. |
| A03 Injection | Recherche/API | Querysets paramétrés ; tri en liste blanche. |
| A09 Vulnerable components | Deps | `pip-audit` (0 vuln) + `npm audit` exécutés et documentés ; à intégrer en CI (non fait — voir plan). |
| A02 Cryptographic failures | JWT | Refresh révocable + rotation ; cookie HttpOnly ; secrets hors dépôt. |
| Stored XSS | Uploads | SVG exclu, contenu vérifié par signature binaire réelle (pas l'extension). |

## 3. Banque d'identités à ne JAMAIS logguer
Mots de passe, tokens, clés API, données bancaires. Le journal `ActivityLog` ne stocke que de l'action + cible (voir `core/signals.py` et `users/views.py`).

## 4. Recommandations restantes (ordre)
1. **(MEDIUM)** Antivirus (ClamAV ou équivalent) sur les uploads — nécessite une infrastructure dédiée non disponible ici.
2. **(LOW)** Intégrer `pip-audit` et `npm audit` à la CI (actuellement exécutés manuellement).
3. **(LOW/V2)** OAuth2 partenaire + quotas de clé, monitoring des tentatives d'auth.
4. **(LOW)** Étendre les tests négatifs sur `users` (register avec username dupliqué, mot de passe faible, etc.) — actuellement 3 tests, corrects mais minimaux.
5. **(LOW)** Vulnérabilité modérée `esbuild`/vite (dev uniquement) — nécessite un bump majeur de Vite, risque faible (exploitable seulement via accès au serveur de dev local).

## 5. Détail des vérifications effectuées (2026-08-16)

### 5.1 Cookie HttpOnly — vérifié en conditions réelles
Testé avec un vrai serveur Django (`runserver`) et `curl` (pas seulement les
tests unitaires) : login pose le cookie `camtel_refresh` (`HttpOnly`,
`SameSite=Lax`, `Path=/api/v1/auth/`, `Max-Age=604800`) ; un appel refresh
avec ce cookie renouvelle l'access token **et fait tourner le JTI du refresh**
(rotation confirmée par inspection du header `Set-Cookie`) ; logout invalide
le cookie et blackliste le token ; un refresh après logout échoue (400).
63/63 tests backend passent après ce changement, 28/28 côté frontend,
`tsc -b` propre.

### 5.2 En-têtes de sécurité nginx — validé avec un vrai nginx, en conditions réelles
`nginx/nginx.conf` (passerelle staging/prod) reçoit `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` et une
`Content-Security-Policy` calibrée sur l'appli réelle (pas de script inline,
Google Fonts autorisé, `frame-ancestors 'none'`).

Validation faite avec un **vrai binaire nginx** (`apt-get install nginx`,
1.24.0) — pas seulement une relecture :
- `nginx -t` sur le fichier monté comme snippet `conf.d` (exactement comme en
  docker-compose, où `nginx.conf` remplace `/etc/nginx/conf.d/default.conf`
  à l'intérieur d'un `http{}` standard) : syntaxe validée.
- Deux upstreams factices (`backend`, `frontend`, résolus via `/etc/hosts`
  vers des adresses loopback dédiées) pour simuler les noms de service
  docker-compose, chacun servi par un `python -m http.server`.
- nginx démarré pour de vrai, requêtes `curl` réelles sur `/health`, `/`
  et `/api/` : les 5 en-têtes de sécurité sont bien présents sur chaque
  route (y compris les réponses proxyfiées), la CSP est identique partout,
  aucune régression sur le proxying.
- Test de path traversal (`/../../../etc/passwd`) : 404, pas d'accès fichier.
- **Bug pré-existant trouvé et corrigé au passage** : `/health` renvoyait
  deux en-têtes `Content-Type` (l'un du `default_type` implicite, l'autre
  d'un `add_header Content-Type text/plain;` qui s'additionne au lieu de
  remplacer). Remplacé par `default_type text/plain;` — un seul en-tête,
  vérifié par `curl -i`.

### 5.3 Tests de permission — 23 nouveaux tests, 0 régression
`apps/categories`, `apps/news`, `apps/promotions`, `apps/contacts` n'avaient
**aucun test** avant ce lot. Chacun a maintenant : lecture publique OK,
écriture anonyme refusée (401), écriture VIEWER refusée (403), écriture
EDITOR/ADMIN acceptée, suppression réservée admin. Suite complète (92 tests)
exécutée après coup : 92/92 OK.

### 5.4 Audit dépendances — détail
- `pip-audit -r requirements.txt` : `No known vulnerabilities found`.
- `npm audit` (dev, `esbuild`/vite) : vulnérabilité modérée, exploitable
  uniquement si un tiers accède au serveur de dev local — risque faible,
  non traité (nécessite bump majeur de Vite).

### 5.5 Migration react-router-dom v6 → v7 — vérifiée en profondeur
Avant de migrer : inventaire complet des imports (`grep` sur tout `src/`) —
seulement des APIs stables entre v6 et v7 en usage (`BrowserRouter`, `Routes`,
`Route`, `Link`, `NavLink`, `useNavigate`, `useParams`, `useSearchParams`,
`useLocation`, `Outlet`, `Navigate`, `MemoryRouter`), aucun `createBrowserRouter`
ni loader/action (mode "librairie", pas le mode "framework" de v7). Une seule
route `path="*"` (404 racine), sans navigation relative imbriquée à
l'intérieur — le changement de résolution `v7_relativeSplatPath` ne
s'applique donc à rien ici. Après bump `^6.26.2` → `^7.18.2` :
- `tsc -b` : propre, aucune erreur de type.
- 28/28 tests frontend passent, et les warnings "React Router Future Flag"
  qui apparaissaient avant (v7_startTransition, v7_relativeSplatPath) ont
  disparu — confirmant qu'ils sont bien devenus le comportement par défaut.
- `npm run build` (production) : build complet réussi, code-splitting par
  route toujours fonctionnel (chaque page reste un chunk séparé).
- `npm audit --omit=dev` : **0 vulnérabilité** (contre 2 modérées avant).
- 92/92 tests backend re-vérifiés (non-régression croisée).

## 6. Découverte critique du jour : clé API en clair dans `.env.example`

En travaillant sur ce fichier, une valeur `GOOGLE_API_KEY=AQ.Ab8...` (qui a
toute l'apparence d'une vraie clé, pas un placeholder) a été trouvée dans
`.env.example`. Vérification faite :
- **Jamais commitée dans git** (`git log --all -p -- .env.example` ne la
  montre à aucune révision) — elle ne se trouvait que dans le fichier de
  travail non commité sur le disque.
- Présente aussi dans `.env` (gitignoré, usage normal).
- **Remplacée par un champ vide** dans `.env.example` (ce fichier ne doit
  jamais contenir de vrai secret, commité ou non — un `git add -A` accidentel
  l'aurait exposée).

**Recommandation forte** : cette clé a transité en dehors de ta machine (elle
était dans l'archive `.zip` envoyée à cette conversation). Par précaution,
**régénère-la** depuis la console Google Cloud/AI Studio, même si elle n'a
jamais atteint git — le principe est qu'un secret qui a quitté son
environnement d'origine est considéré comme potentiellement compromis.

## 7. Intégration Gemini (2026-08-17) — clé activée, timeout durci

Vick a fourni la clé `GOOGLE_API_KEY` pour activer le chatbot Gemini. C'est
**la même clé** que celle trouvée en clair au §6 — la recommandation de la
régénérer reste valable, avec ou sans réutilisation.

### 7.1 Ce qui a été vérifié
- `GeminiProvider` s'instancie correctement avec la clé fournie (vérifié
  directement, sans appel réseau).
- Pipeline complet testé avec le SDK `google.generativeai` mocké au point
  d'entrée réseau exact (`GenerativeModel.generate_content`) — endpoint HTTP
  → `ask_chatbot` → `run_rag_pipeline` → `GeminiProvider` → SDK, tout
  s'exécute réellement sauf l'appel réseau final. 3 nouveaux tests :
  réponse générée + contexte RAG injecté, dégradation propre sur erreur SDK,
  et timeout dur (voir 7.3).
- **Non testable dans ce sandbox** : le réseau bloque
  `generativelanguage.googleapis.com` (`x-deny-reason: host_not_allowed`).
  Vick doit vérifier lui-même un vrai appel Gemini bout en bout (poser une
  question au chatbot depuis l'app, ou `curl` l'endpoint `/api/v1/chatbot/ask/`
  avec une question qui matche un produit/FAQ existant).

### 7.2 Découverte : aucun des 3 providers LLM n'avait de timeout
En testant en conditions réelles (serveur `runserver` + `curl`), l'appel
Gemini bloqué par le réseau du sandbox a révélé qu'**aucun timeout** n'était
configuré nulle part (Gemini, OpenAI, Ollama) — un appel qui ne répond
jamais bloque le thread de la requête Django indéfiniment. Corrigé :
`CHATBOT_TIMEOUT_SECONDS` (20s par défaut) ajouté aux settings et câblé dans
`GeminiProvider.generate_content` (`request_options={"timeout": N}`) et
`OpenAIProvider.generate_content` (`timeout=N`, supporté nativement par le
SDK openai≥1.0). Ollama non câblé (le client `ollama` ne supporte un timeout
que par instance, pas par appel — risque moindre en pratique, tourne
généralement en local).

### 7.3 Découverte plus sérieuse : le timeout du SDK ne suffit pas toujours
Testé en réel avec `CHATBOT_TIMEOUT_SECONDS=8` : la requête est restée
bloquée **plus de 40 secondes**, bien au-delà du timeout configuré. Cause :
le SDK `google-generativeai` utilise gRPC, qui — lors d'un échec de
connexion TLS répété (le cas ici, avec le proxy egress du sandbox) —
continue de retenter en boucle **sans jamais lever d'exception**, même
au-delà du `request_options.timeout` demandé. Le paramètre de timeout du
SDK ne borne donc pas fiablement la durée réelle dans tous les cas d'échec.

**Corrigé par un filet de sécurité supplémentaire** :
`_call_with_hard_timeout()` dans `apps/core/providers.py` — exécute l'appel
LLM dans un thread daemon et rend la main après le délai configuré, que le
thread sous-jacent ait terminé ou non. Limite assumée et documentée dans le
code : un thread Python ne peut pas être tué de force, donc l'appel abandonné
continue potentiellement en arrière-plan jusqu'à sa propre résolution — mais
la requête utilisateur n'est plus bloquée.

**Vérifié en conditions réelles, deux fois** :
- Test automatisé (`test_chatbot_gemini_hard_timeout_when_sdk_call_never_returns`) :
  SDK mocké pour ne jamais répondre (sleep 30s), timeout configuré à 1s →
  réponse obtenue en ~1s, pas en 30s.
- Test manuel via `curl` contre un vrai serveur avec la vraie clé et le
  vrai réseau bloqué : réponse en **8s** (timeout configuré) contre **40s+**
  avant le correctif. Le thread abandonné continue bien de retenter en
  arrière-plan après coup (confirmé en observant les logs nginx/gRPC
  post-réponse) — comportement documenté et accepté.

### 7.4 Bug de collision de paramètre trouvé et corrigé en cours de route
En câblant `_call_with_hard_timeout`, un bug (`timeout` passé deux fois à
la même fonction, une fois positionnel une fois nommé) a fait échouer
silencieusement l'appel LLM dans le `try/except` de `run_rag_pipeline` — les
tests l'ont détecté immédiatement (2 tests passés au rouge). Corrigé en
renommant le paramètre interne du wrapper (`_timeout_seconds`) pour éviter
toute collision avec le kwarg `timeout` destiné au provider.

### 7.5 Vérifications finales
95/95 tests backend (5 nouveaux tests chatbot Gemini/timeout inclus).
`.env`/`backend/.env` (contenant la vraie clé) explicitement exclus du zip
livré — vérifié par recherche de la clé dans l'archive (0 occurrence).

