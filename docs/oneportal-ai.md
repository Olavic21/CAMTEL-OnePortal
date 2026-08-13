# OnePortal AI — Assistant intelligent

Documentation de l'assistant **OnePortal AI** intégré au portail CAMTEL (widget chat en bas à gauche du site public).

---

## 1. Vue d'ensemble

OnePortal AI aide les visiteurs à trouver des réponses sur les produits et services CAMTEL. Il est composé de :

| Couche | Fichier / endpoint | Rôle |
|---|---|---|
| **Frontend** | `frontend/camtel/frontend/src/shared/components/ChatbotWidget.tsx` | Widget de chat (UI, envoi des questions) |
| **Frontend** | `frontend/camtel/frontend/src/shared/components/OnePortalAILogo.tsx` | Identité visuelle OnePortal AI |
| **Backend** | `POST /api/v1/chatbot/ask/` | Traitement de la question et génération de la réponse |
| **Backend** | `backend/apps/core/views.py` → `ChatbotView` | Logique métier actuelle |
| **Données** | Tables `Product`, `ProductFAQ` | Base de connaissances consultée |

---

## 2. LLM utilisé — état actuel

> **Important : aucun LLM (Large Language Model) n'est branché aujourd'hui.**

OnePortal AI **ne fait pas appel** à OpenAI, Anthropic, Google Gemini, Ollama ou autre modèle génératif. L'assistant repose sur une **recherche textuelle** dans la base de données Django :

1. **FAQ produits** (`ProductFAQ`) — recherche par mot-clé dans la question ou la réponse
2. **Catalogue produits** (`Product`, publiés uniquement) — recherche dans le nom et la description
3. **Message de repli (fallback)** — si aucune correspondance n'est trouvée

Le nom « IA » correspond à la **roadmap V3** : l'architecture (widget + API dédiée) est prête pour accueillir un vrai LLM ultérieurement, sans changer le contrat frontend.

---

## 3. Fonctionnement détaillé

### 3.1 Schéma du flux

```text
Visiteur saisit une question
        │
        ▼
ChatbotWidget.tsx  ──POST /api/v1/chatbot/ask/──►  ChatbotView (Django)
        │                                                    │
        │                              ┌─────────────────────┴─────────────────────┐
        │                              ▼                     ▼                     ▼
        │                        Recherche FAQ        Recherche produit      Fallback
        │                        (ProductFAQ)         (Product publié)       (contact)
        │                              │                     │                     │
        └◄──────── JSON { answer } ────┴─────────────────────┴─────────────────────┘
```

### 3.2 Algorithme backend (`ChatbotView`)

Fichier : `backend/apps/core/views.py`

| Étape | Condition | Réponse |
|---|---|---|
| 1 | Question vide | `"Posez une question sur nos produits ou services."` |
| 2 | Correspondance dans `ProductFAQ` (question **ou** réponse contient le texte saisi) | Réponse = `faq.answer`, `source: "faq"`, `product: <nom>` |
| 3 | Correspondance dans un produit publié (`name` ou `description`) | Réponse = nom + 300 premiers caractères de la description, `source: "product"` |
| 4 | Aucune correspondance | Message invitant à utiliser le formulaire de contact, `source: "fallback"` |

La question est normalisée en **minuscules** avant la recherche (`question.strip().lower()`).

### 3.3 Comportement frontend

Fichier : `frontend/camtel/frontend/src/shared/components/ChatbotWidget.tsx`

- **Message d'accueil** (local, sans appel API) :
  `"Bonjour ! Je peux vous aider a trouver un produit CAMTEL ou repondre a vos questions."`
- **Envoi** : `POST /chatbot/ask/` avec `{ "question": "<texte utilisateur>" }`
- **Erreur réseau / backend indisponible** : message local de secours orientant vers le formulaire de contact

Le widget est monté dans `PublicLayout` : visible sur toutes les pages publiques du site.

---

## 4. API

### Endpoint

```http
POST /api/v1/chatbot/ask/
Content-Type: application/json
Accept-Language: fr   # optionnel (i18n global du portail)
```

### Corps de la requête

```json
{
  "question": "Quels sont vos forfaits internet ?"
}
```

### Réponses

**FAQ trouvée :**

```json
{
  "answer": "Notre offre Fibre Pro inclut...",
  "source": "faq",
  "product": "Fibre Pro Entreprise"
}
```

**Produit trouvé :**

```json
{
  "answer": "Fibre Pro Entreprise: Connectivité dédiée haut débit...",
  "source": "product"
}
```

**Aucun résultat :**

```json
{
  "answer": "Je n'ai pas trouvé de réponse précise. Contactez-nous via le formulaire de contact.",
  "source": "fallback"
}
```

**Question vide :**

```json
{
  "answer": "Posez une question sur nos produits ou services."
}
```

### Test en ligne de commande

```bash
curl -X POST http://127.0.0.1:8000/api/v1/chatbot/ask/ \
  -H "Content-Type: application/json" \
  -d '{"question": "internet"}'
```

---

## 5. Paramètres modifiables (implémentation actuelle)

Comme il n'y a pas de LLM, les « paramètres » sont **du code et des données**, pas des variables de modèle (temperature, top_p, etc.).

### 5.1 Messages affichés au utilisateur

| Paramètre | Fichier | Ligne / zone | Valeur actuelle |
|---|---|---|---|
| Message d'accueil | `ChatbotWidget.tsx` | état initial `messages` | `"Bonjour ! Je peux vous aider..."` |
| Message erreur réseau | `ChatbotWidget.tsx` | bloc `catch` de `sendMessage` | `"Je n'ai pas pu joindre le service..."` |
| Question vide | `core/views.py` | `ChatbotView.post` | `"Posez une question..."` |
| Fallback sans résultat | `core/views.py` | `ChatbotView.post` | `"Je n'ai pas trouvé de réponse précise..."` |

### 5.2 Logique de recherche

| Paramètre | Fichier | Modification possible |
|---|---|---|
| Longueur max description produit | `core/views.py` | `product.description[:300]` → changer `300` |
| Sensibilité à la casse | `core/views.py` | `.lower()` sur la question (actuellement insensible à la casse côté requête) |
| Priorité FAQ vs produit | `core/views.py` | Ordre des blocs `if faq` / `if product` |
| Produits éligibles | `core/views.py` | Filtre `is_published=True` |

### 5.3 Enrichir la base de connaissances (sans code)

Les réponses les plus pertinentes viennent des **FAQ produits** gérées dans le back-office :

1. Connexion admin → **Produits** → modifier un produit
2. Section **Questions fréquentes** : ajouter question / réponse
3. Les entrées sont stockées dans `ProductFAQ` et indexées automatiquement par le chatbot

Plus les FAQ sont complètes, plus OnePortal AI paraît « intelligent » sans LLM.

---

## 6. Intégrer un vrai LLM (guide d'extension)

Pour remplacer ou compléter la recherche par un modèle génératif (OpenAI, Azure OpenAI, Ollama local, etc.), voici l'approche recommandée.

### 6.1 Architecture cible

```text
ChatbotView
    │
    ├─► 1. Recherche FAQ / produits (contexte RAG)
    │
    └─► 2. Appel LLM avec prompt système + contexte + question
              │
              └─► Réponse naturelle générée
```

**RAG (Retrieval-Augmented Generation)** : le LLM reçoit d'abord les FAQ/produits pertinents comme contexte, ce qui limite les hallucinations sur l'offre CAMTEL.

### 6.2 Variables d'environnement suggérées

Ajouter dans `.env` (exemple OpenAI-compatible) :

```env
# OnePortal AI — LLM
CHATBOT_ENABLED=true
CHATBOT_PROVIDER=openai          # openai | azure | ollama | none
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_API_KEY=sk-...
CHATBOT_API_BASE=                # optionnel (Azure, proxy, Ollama)
CHATBOT_MAX_TOKENS=512
CHATBOT_TEMPERATURE=0.3
CHATBOT_SYSTEM_PROMPT="Tu es OnePortal AI, l'assistant CAMTEL. Réponds en français, de façon concise, uniquement à partir du contexte fourni."
CHATBOT_FALLBACK_TO_SEARCH=true  # si LLM indisponible, garder la recherche actuelle
```

Lire ces variables dans `backend/config/settings/base.py`, puis les utiliser dans un service dédié, par exemple `backend/apps/core/chatbot_service.py`.

### 6.3 Paramètres LLM usuels

| Paramètre | Rôle | Valeur recommandée (support client) |
|---|---|---|
| `model` | Modèle utilisé | `gpt-4o-mini`, `claude-3-haiku`, `llama3` (Ollama) |
| `temperature` | Créativité (0 = déterministe, 1 = créatif) | `0.2` – `0.4` |
| `max_tokens` | Longueur max de la réponse | `256` – `512` |
| `top_p` | Échantillonnage nucleus | `0.9` (si supporté) |
| `system_prompt` | Personnalité et contraintes | Ton CAMTEL, langue FR, pas d'invention hors contexte |

### 6.4 Exemple de service LLM (pseudo-code)

```python
# backend/apps/core/chatbot_service.py (à créer)
from django.conf import settings

def ask_llm(question: str, context: str) -> str:
    if settings.CHATBOT_PROVIDER == 'none':
        return None

    response = openai_client.chat.completions.create(
        model=settings.CHATBOT_MODEL,
        temperature=settings.CHATBOT_TEMPERATURE,
        max_tokens=settings.CHATBOT_MAX_TOKENS,
        messages=[
            {"role": "system", "content": settings.CHATBOT_SYSTEM_PROMPT},
            {"role": "user", "content": f"Contexte CAMTEL:\n{context}\n\nQuestion: {question}"},
        ],
    )
    return response.choices[0].message.content
```

Puis dans `ChatbotView.post` :

1. Construire le `context` depuis FAQ/produits trouvés
2. Appeler `ask_llm()` si `CHATBOT_ENABLED`
3. Sinon (ou en échec), conserver la logique de recherche actuelle

### 6.5 Dépendances Python (exemple OpenAI)

```bash
pip install openai
```

Ajouter `openai` dans `requirements.txt`.

---

## 7. Fichiers de référence

| Fichier | Description |
|---|---|
| `backend/apps/core/views.py` | `ChatbotView` — logique de réponse |
| `backend/apps/core/urls.py` | Route `chatbot/ask/` |
| `backend/apps/products/models.py` | Modèle `ProductFAQ` |
| `frontend/.../ChatbotWidget.tsx` | Widget utilisateur |
| `frontend/.../OnePortalAILogo.tsx` | Branding OnePortal AI |
| `frontend/.../PublicLayout.tsx` | Intégration du widget |

---

## 8. Limites connues

- Pas de mémoire de conversation (chaque question est traitée isolément)
- Recherche par **contient** (`icontains`) — pas de recherche sémantique / vectorielle
- Pas de détection de langue côté chatbot (hérite de l'i18n global pour les produits traduits)
- Pas de rate limiting spécifique au chatbot (throttling global DRF uniquement)

---

## 9. Roadmap suggérée

| Phase | Amélioration |
|---|---|
| **Actuel** | Recherche FAQ + produits |
| **V3.1** | Variables d'environnement + service LLM optionnel |
| **V3.2** | RAG avec embeddings (pgvector / Pinecone) |
| **V3.3** | Historique de session, analytics des questions sans réponse |

---

## 10. Résumé

| Question | Réponse |
|---|---|
| Quel LLM est utilisé ? | **Aucun** pour l'instant — recherche en base de données |
| Où modifier les messages ? | `ChatbotWidget.tsx` et `ChatbotView` dans `core/views.py` |
| Où enrichir les réponses ? | FAQ produits dans le back-office admin |
| Comment brancher un LLM ? | Service dédié + variables `.env` (section 6) |
| Endpoint API | `POST /api/v1/chatbot/ask/` |
