# OnePortal AI — Chatbot, RAG et fournisseurs LLM

Documentation opérationnelle de l'assistant **OnePortal AI** intégré au portail CAMTEL.

- Endpoint public : `POST /api/v1/chatbot/ask/`
- Widget frontend : `frontend/camtel/frontend/src/shared/components/ChatbotWidget.tsx`
- Service backend : `backend/apps/core/chatbot_service.py`
- Abstraction LLM/RAG : `backend/apps/core/providers.py`

---

## 1. Vue d'ensemble

OnePortal AI répond aux visiteurs à partir de la base de connaissances CAMTEL :

- FAQ produits : `ProductFAQ.question` et `ProductFAQ.answer`.
- Produits publiés : `Product.name` et `Product.description`.
- Pipeline RAG optionnel : le contexte FAQ/produits est injecté dans un prompt et envoyé à un fournisseur LLM configuré par environnement.

Le chatbot est **piloté par variables d'environnement**. Par défaut, il reste en mode sûr `none` : aucune API externe n'est appelée et la réponse provient uniquement de la recherche textuelle locale.

---

## 2. Flux de traitement

```text
Visiteur
  │
  ▼
ChatbotWidget.tsx
  │ POST /api/v1/chatbot/ask/ {"question":"..."}
  ▼
ChatbotView
  │
  ▼
ask_chatbot(question)
  │
  ├─ si CHATBOT_ENABLED=False ou CHATBOT_PROVIDER=none
  │    └─ recherche locale FAQ/produits (_search_fallback)
  │
  └─ si provider LLM actif (mock/gemini/openai/ollama)
       ├─ collecte contexte FAQ/produits (_collect_context)
       ├─ build_rag_prompt(question, context)
       ├─ run_rag_pipeline(...)
       └─ fallback recherche locale si erreur et CHATBOT_FALLBACK_TO_SEARCH=True
```

---

## 3. API HTTP

### 3.1 Requête

```http
POST /api/v1/chatbot/ask/
Content-Type: application/json
```

```json
{
  "question": "Quels sont les avantages de la fibre CAMTEL ?"
}
```

### 3.2 Réponse typique

Mode FAQ locale :

```json
{
  "answer": "La réponse issue de la FAQ produit...",
  "source": "faq",
  "product": "Nom du produit"
}
```

Mode produit local :

```json
{
  "answer": "Nom du produit: extrait de description...",
  "source": "product"
}
```

Mode LLM/RAG :

```json
{
  "answer": "Réponse générée à partir du contexte CAMTEL.",
  "source": "openai",
  "confidence": 0.9,
  "model": "gpt-4o-mini",
  "sources": ["doc-0", "doc-1"]
}
```

Fallback sans résultat :

```json
{
  "answer": "Je n'ai pas trouve de reponse precise. Contactez-nous via le formulaire de contact.",
  "source": "fallback"
}
```

Question vide :

```json
{
  "answer": "Posez une question sur nos produits ou services."
}
```

### 3.3 Accès et throttling

- Permission : public (`AllowAny`).
- Throttle DRF : scope `chatbot`, valeur actuelle `30/min` dans `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES`.
- Limitation interne LLM optionnelle : `CHATBOT_RATE_LIMIT`, pause minimale en secondes entre deux appels LLM par process.

---

## 4. Variables d'environnement

Définir les secrets dans `.env`, variables système, Docker secrets, CI/CD secrets ou le gestionnaire de secrets de l'hébergeur. **Ne jamais committer de vraie clé API.**

| Variable | Défaut | Rôle |
|---|---:|---|
| `CHATBOT_ENABLED` | `True` | Active/désactive le chatbot côté service. Si `False`, retour à la recherche locale. |
| `CHATBOT_PROVIDER` | `none` | Fournisseur : `none`, `mock`, `gemini`, `openai`, `ollama`. |
| `CHATBOT_MODEL` | vide | Modèle à utiliser. Si vide, chaque provider utilise son défaut. |
| `CHATBOT_TEMPERATURE` | `0.3` | Créativité du modèle. Pour support client, garder bas (`0.2` à `0.4`). |
| `CHATBOT_MAX_TOKENS` | `512` | Longueur maximale demandée au LLM. |
| `CHATBOT_FALLBACK_TO_SEARCH` | `True` | En cas d'erreur LLM ou absence de contexte, revient à la recherche FAQ/produits. |
| `CHATBOT_SYSTEM_PROMPT` | prompt CAMTEL FR | Instruction système injectée dans le prompt RAG. |
| `CHATBOT_RATE_LIMIT` | `0.0` | Pause minimale, en secondes, entre appels LLM dans un process Django. |
| `GOOGLE_API_KEY` | vide | Clé Google Gemini pour `CHATBOT_PROVIDER=gemini`. |
| `OPENAI_API_KEY` | vide | Clé OpenAI pour `CHATBOT_PROVIDER=openai`. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL du serveur Ollama pour `CHATBOT_PROVIDER=ollama`. |

---

## 5. Matrice des fournisseurs

| Provider | API externe | Clé requise | Package Python | Modèle par défaut | Comportement |
|---|---|---|---|---|---|
| `none` | Non | Non | Aucun | `fallback-search` | Recherche locale FAQ/produits uniquement. |
| `mock` | Non | Non | Aucun | `mock-gpt` | Génère une réponse factice déterministe, utile en dev/test. |
| `gemini` | Oui | `GOOGLE_API_KEY` | `google-generativeai` | `gemini-1.5-flash` | RAG via Google Gemini. Sans clé, fallback mock. SDK installé via `requirements.txt`. |
| `openai` | Oui | `OPENAI_API_KEY` | `openai` | `gpt-4o-mini` | RAG via OpenAI. Sans clé, fallback mock. SDK installé via `requirements.txt`. |
| `ollama` | Serveur local/réseau | Non | `ollama` | `llama3` | RAG via serveur Ollama. Nécessite `ollama serve` et modèle téléchargé. |

> Note : les packages Gemini/OpenAI sont déclarés dans `requirements.txt`. Les imports restent en lazy loading dans `providers.py`, donc le backend démarre même si aucun provider externe n'est activé.

---

## 6. Exemples `.env`

### 6.1 Mode par défaut sans LLM externe

```env
CHATBOT_ENABLED=True
CHATBOT_PROVIDER=none
CHATBOT_FALLBACK_TO_SEARCH=True
```

### 6.2 Mode mock dev/test

```env
CHATBOT_ENABLED=True
CHATBOT_PROVIDER=mock
CHATBOT_MODEL=mock-gpt
CHATBOT_TEMPERATURE=0.3
CHATBOT_MAX_TOKENS=512
```

### 6.3 Google Gemini

```env
CHATBOT_ENABLED=True
CHATBOT_PROVIDER=gemini
CHATBOT_MODEL=gemini-1.5-flash
GOOGLE_API_KEY=your-google-api-key
CHATBOT_FALLBACK_TO_SEARCH=True
```

SDK Python requis : `google-generativeai`, déjà déclaré dans `requirements.txt`.

### 6.4 OpenAI

```env
CHATBOT_ENABLED=True
CHATBOT_PROVIDER=openai
CHATBOT_MODEL=gpt-4o-mini
OPENAI_API_KEY=your-openai-api-key
CHATBOT_FALLBACK_TO_SEARCH=True
```

SDK Python requis : `openai`, déjà déclaré dans `requirements.txt`.

### 6.5 Ollama local

```env
CHATBOT_ENABLED=True
CHATBOT_PROVIDER=ollama
CHATBOT_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434
CHATBOT_FALLBACK_TO_SEARCH=True
```

Préparation locale :

```bash
pip install ollama
ollama pull llama3
ollama serve
```

Dans Docker, `localhost` désigne le conteneur backend. Utiliser plutôt le nom du service Ollama, par exemple :

```env
OLLAMA_BASE_URL=http://ollama:11434
```

---

## 7. Comportements de repli et erreurs

### 7.1 Recherche locale

La recherche locale est implémentée dans `_search_fallback(question)` :

1. Première FAQ dont la question ou la réponse contient le texte saisi.
2. Premier produit publié dont le nom ou la description contient le texte saisi.
3. Message générique invitant à contacter le support.

### 7.2 Absence de contexte RAG

Si aucun document FAQ/produit n'est trouvé :

- Avec `CHATBOT_FALLBACK_TO_SEARCH=True` : retour au fallback local.
- Avec `CHATBOT_FALLBACK_TO_SEARCH=False` : réponse générique indiquant l'absence d'information fiable.

### 7.3 Provider indisponible

- `gemini` sans `GOOGLE_API_KEY` : fallback vers `MockLLMProvider`.
- `openai` sans `OPENAI_API_KEY` : fallback vers `MockLLMProvider`.
- `gemini/openai` avec clé mais package Python absent : erreur `ImproperlyConfigured`.
- `ollama` nécessite le package `ollama` et un serveur accessible via `OLLAMA_BASE_URL`.
- Si la génération LLM échoue dans `run_rag_pipeline`, la réponse contient une confiance `0.0`; `ask_chatbot` revient ensuite à la recherche locale si `CHATBOT_FALLBACK_TO_SEARCH=True`.

---

## 8. Prompt RAG

Le prompt système par défaut impose :

- Répondre en français.
- Être concis et exact.
- Utiliser uniquement le contexte fourni.
- Dire clairement lorsque la réponse n'est pas connue.

Le contexte transmis au LLM est construit à partir de maximum 5 FAQ et 5 produits, puis tronqué dans `run_rag_pipeline` aux 5 premiers documents de 1000 caractères maximum chacun.

Exemples de fragments :

```text
FAQ (Nom produit): Q: ... | R: ...
Produit (Nom produit): description...
```

---

## 9. Tests et vérification

### 9.1 Test rapide de l'endpoint

```bash
curl -X POST http://127.0.0.1:8000/api/v1/chatbot/ask/ \
  -H "Content-Type: application/json" \
  -d '{"question":"fibre"}'
```

### 9.2 Validation Django

```bash
cd backend
python manage.py check
python manage.py test apps.core --verbosity 2
```

### 9.3 Vérification mock sans secret

```bash
CHATBOT_PROVIDER=mock python manage.py test apps.core.ChatbotViewTest --verbosity 2
```

Sur Windows PowerShell :

```powershell
$env:CHATBOT_PROVIDER="mock"
python manage.py test apps.core --verbosity 2
Remove-Item Env:\CHATBOT_PROVIDER
```

---

## 10. Sécurité et production

Checklist avant production :

- Garder `CHATBOT_PROVIDER=none` tant qu'aucun contrat LLM n'est validé.
- Stocker `GOOGLE_API_KEY` et `OPENAI_API_KEY` uniquement dans des secrets d'environnement.
- Ne jamais écrire les clés dans `.env.example`, README, logs ou tickets.
- Vérifier les conditions de confidentialité du provider LLM choisi.
- Activer `CHATBOT_FALLBACK_TO_SEARCH=True` pour garder un service dégradé fonctionnel.
- Surveiller coûts et latence côté provider externe.
- Garder `CHATBOT_TEMPERATURE` basse pour limiter les hallucinations.
- Maintenir le contenu FAQ/produits à jour : le RAG ne doit répondre qu'à partir de ces données.

---

## 11. Fichiers de référence

| Fichier | Rôle |
|---|---|
| `backend/apps/core/views.py` | `ChatbotView`, endpoint public et throttle. |
| `backend/apps/core/urls.py` | Route `chatbot/ask/`. |
| `backend/apps/core/chatbot_service.py` | Orchestration recherche locale + RAG + fallback. |
| `backend/apps/core/providers.py` | Providers `none`, `mock`, `gemini`, `openai`, `ollama`, prompt RAG. |
| `backend/apps/core/throttling.py` | Scope `chatbot`. |
| `backend/config/settings/base.py` | Variables `CHATBOT_*`, clés API, `OLLAMA_BASE_URL`. |
| `.env.example` | Modèle de configuration sans secret réel. |
| `frontend/camtel/frontend/src/shared/components/ChatbotWidget.tsx` | Widget utilisateur. |
| `frontend/camtel/frontend/src/shared/components/OnePortalAILogo.tsx` | Branding OnePortal AI. |

---

## 12. Résumé

| Question | Réponse |
|---|---|
| Où mettre les clés LLM ? | Dans l'environnement : `GOOGLE_API_KEY` ou `OPENAI_API_KEY`; jamais dans Git. |
| Quel provider par défaut ? | `CHATBOT_PROVIDER=none`, recherche locale FAQ/produits. |
| Providers valides ? | `none`, `mock`, `gemini`, `openai`, `ollama`. |
| Endpoint frontend/backend ? | `POST /api/v1/chatbot/ask/`. |
| Comment tester sans secret ? | `CHATBOT_PROVIDER=mock`. |
| Comment garder un service dégradé ? | `CHATBOT_FALLBACK_TO_SEARCH=True`. |
