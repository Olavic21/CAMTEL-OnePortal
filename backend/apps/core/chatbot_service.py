"""
Service chatbot OnePortal AI (Phase 19 — données structurées d'abord).

Orchestration :

    Question
      -> detection d'intention (prix/produit)
      -> lookup produit en DB structurée (catalogue officiel)
      -> collecte de contexte FAQ + produits
      -> run_rag_pipeline (LLM) si configuré
      -> réponse sourcée

Comportements :
    1. Intention « prix/coût » sur un produit identifié de façon non ambiguë
       → réponse construite EXCLUSIVEMENT depuis la DB catalogue (prix
       officiel, source, dernière vérification). Le RAG n'est jamais la
       seule source de vérité pour les données commerciales.
    2. CHATBOT_PROVIDER == "none" → recherche textuelle FAQ puis produits
       (comportement historique conservé).
    3. Provider configuré (mock/gemini/openai/ollama) → contexte collecté
       puis run_rag_pipeline. En cas d'échec du LLM, le pipeline renvoie un
       message dégradé explicite taggé du provider tenté (traçabilité) ;
       si CHATBOT_FALLBACK_TO_SEARCH est actif, aucun crash ne remonte.

Usage depuis ChatbotView.post :

    result = ask_chatbot(question)
    return Response(result)
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

from django.conf import settings
from django.db.models import Q

from apps.products.models import Product, ProductFAQ

logger = logging.getLogger(__name__)


# Mots vides courants ignores dans l'extraction de mots-cles (la question
# entiere n'est jamais contenue dans un nom de produit : la recherche doit se
# faire mot par mot pour que le contexte RAG soit reellement alimente).
_QUESTION_STOPWORDS = {
    "les", "des", "ces", "aux", "est", "sont", "serait", "peut", "puis",
    "veux", "veut", "voudrais", "aimerais", "comment", "quels", "quelle",
    "quel", "pourquoi", "pour", "avec", "sans", "dans", "chez", "leur",
    "leurs", "vous", "nous", "elle", "elles", "mais", "aussi", "tres",
    "faire", "etre", "avoir", "cela", "celui", "celle", "ainsi", "alors",
    "souhaite", "souhaiterais", "proceder", "avantages", "benefices",
}

# Mots de marque generiques a ignorer lors du rapprochement question/nom de
# produit (evitent que « Combien coute le CB VPS ? » matche toutes les offres VPS).
_PRODUCT_NAME_NOISE = {"camtel", "blue", "offre", "offres", "forfait"}

# Declencheurs d'intention tarifaire (Phase 19) : FR d'abord, EN ensuite.
_PRICE_INTENT_RE = re.compile(
    r"\b(prix|cout|couts|coute|coutent|cotait|combien|tarif|tarifs|"
    r"facture|abonnement|price|cost|costs|pricing)\b"
)


def _question_tokens(question: str, limit: int = 10) -> List[str]:
    """Extrait les mots-cles significatifs d'une question utilisateur.

    Historique : la recherche initiale utilisait ``icontains=question`` sur la
    question COMPLETE — or le texte integral d'une vraie question n'est jamais
    contenu dans un nom/description de produit. On matche desormais mot par
    mot (>= 3 caracteres, hors mots vides), limite aux N premiers.
    """
    tokens = re.findall(r"[a-z0-9]{3,}", (question or "").lower())
    return [t for t in tokens if t not in _QUESTION_STOPWORDS][:limit]


def _structured_product_answer(question: str) -> Optional[Dict[str, Any]]:
    """Reponse structurée depuis la DB pour une intention tarifaire (Phase 19).

    Principe : « Combien coûte le CB VPS M ? » ne doit PAS dépendre du RAG.
    On identifie le produit par recoupement des tokens de la question avec
    les tokens du nom officiel ; la réponse cite le prix officiel, la source
    et la date de dernière vérification stockés en base.

    Retourne None si l'intention n'est pas détectée ou si le produit ne peut
    être identifié sans ambiguïté (dans ce cas on retombe sur le pipeline).
    """
    lowered = (question or "").lower()
    if not _PRICE_INTENT_RE.search(lowered):
        return None
    tokens = set(_question_tokens(lowered))
    if not tokens:
        return None

    candidates = []
    for product in Product.objects.filter(is_published=True):
        name_tokens = (
            set(re.findall(r"[a-z0-9]{3,}", (product.name or "").lower()))
            - _QUESTION_STOPWORDS
            - _PRODUCT_NAME_NOISE
        )
        matched = name_tokens & tokens
        if matched:
            # Score : nb de tokens reconnus, puis precision (nom le plus court).
            candidates.append((len(matched), -len(name_tokens), product))

    if not candidates:
        return None
    candidates.sort(key=lambda item: (item[0], item[1]), reverse=True)
    best_score = (candidates[0][0], candidates[0][1])
    tied = [item for item in candidates if (item[0], item[1]) == best_score]
    if len(tied) != 1:
        # Ambiguïté (ex: « VPS » matche CB VPS S/M/L) : laisser le pipeline
        # repondre plutot que risque d'afficher le mauvais prix.
        return None
    _, _, product = tied[0]
    return _build_price_response(product)


def _format_price(product: Product) -> str:
    """Formate le prix officiel (jamais « 0 » pour un prix inconnu — Phase 31/36)."""
    if product.price is None:
        return "Prix sur demande : les tarifs officiels de cette offre ne sont pas publiés."
    amount = f"{product.price}".rstrip("0").rstrip(".") or "0"
    period = ""
    display = getattr(product, "get_billing_period_display", None)
    if callable(display):
        label = display()
        if label and str(label).lower() not in {"", "unique", "-"}:
            period = f" / {label}"
    return f"Prix officiel : {amount} {getattr(product, 'currency', 'XAF')}{period}."


def _build_price_response(product: Product) -> Dict[str, Any]:
    """Réponse taritaire sourcée (Phase 19) : source + date de vérification."""
    verified = (
        product.last_verified_at.strftime("%d/%m/%Y")
        if product.last_verified_at else "date non renseignée"
    )
    source_name = product.source_name or "Catalogue CAMTEL"
    answer = (
        f"{product.name}\n"
        f"{_format_price(product)}\n\n"
        f"Source : {source_name}\n"
        f"Dernière vérification : {verified}"
    )
    response: Dict[str, Any] = {
        "answer": answer,
        "source": "product",
        "product": {"id": product.id, "name": product.name, "slug": product.slug},
        "offer_link": f"/offres/{product.slug}",
        "see_offer_label": "[Voir l'offre]",
        "source_name": source_name,
        "last_verified_at": str(product.last_verified_at or ""),
    }
    # Phase 20 : ne jamais presenter une information perimee comme certaine.
    if product.is_stale or product.status == Product.Status.REQUIRES_VERIFICATION:
        response["answer"] += (
            "\n⚠️ Cette information doit être vérifiée auprès de CAMTEL."
        )
    return response


def _collect_context(question: str) -> List[str]:
    """Recherche FAQ + produits et retourne des fragments pour le prompt RAG."""
    documents: List[str] = []

    tokens = _question_tokens(question)
    if not tokens:
        return documents

    faq_query = Q()
    product_query = Q()
    for token in tokens:
        faq_query |= Q(question__icontains=token) | Q(answer__icontains=token)
        product_query |= Q(name__icontains=token) | Q(description__icontains=token)

    faqs = ProductFAQ.objects.filter(faq_query).select_related("product")[:5]
    for faq in faqs:
        documents.append(
            f"FAQ ({faq.product.name}): Q: {faq.question} | R: {faq.answer}"
        )

    products = Product.objects.filter(product_query, is_published=True)[:5]
    for product in products:
        desc = (product.description or "")[:500]
        documents.append(f"Produit ({product.name}): {desc}")

    return documents


def _search_fallback(question: str) -> Dict[str, Any]:
    """Recherche textuelle FAQ + produits (mode legacy et repli d'erreur LLM).

    Utilise la meme extraction de mots-cles que _collect_context pour que le
    repli trouve les memes documents que le contexte RAG. Enrichi Phase 19 :
    lien vers l'offre quand un produit est identifie.
    """
    tokens = _question_tokens(question)

    if tokens:
        faq_query = Q()
        product_query = Q()
        for token in tokens:
            faq_query |= Q(question__icontains=token) | Q(answer__icontains=token)
            product_query |= Q(name__icontains=token) | Q(description__icontains=token)

        faq = ProductFAQ.objects.filter(faq_query).select_related("product").first()
        if faq:
            return {
                "answer": faq.answer,
                "source": "faq",
                "product": {
                    "id": faq.product_id,
                    "name": faq.product.name,
                    "slug": faq.product.slug,
                },
                "offer_link": f"/offres/{faq.product.slug}",
            }

        product = Product.objects.filter(product_query, is_published=True).first()
        if product:
            return {
                "answer": f"{product.name} : {(product.description or '')[:300]}",
                "source": "product",
                "product": {"id": product.id, "name": product.name, "slug": product.slug},
                "offer_link": f"/offres/{product.slug}",
            }

    return {
        "answer": (
            "Je n'ai pas trouve de reponse precise. "
            "Contactez-nous via le formulaire de contact."
        ),
        "source": "fallback",
    }


def _chatbot_provider_configured() -> str:
    """Nom du provider LLM actif, ou chaine vide si mode legacy recherche."""
    provider = (getattr(settings, "CHATBOT_PROVIDER", "") or "").strip().lower()
    enabled = getattr(settings, "CHATBOT_ENABLED", True)
    if not enabled or not provider or provider == "none":
        return ""
    return provider


def ask_chatbot(question: str) -> Dict[str, Any]:
    """Point d'entree unique du chatbot (appele par ChatbotView.post).

    Priorites (Phase 19) :
      1. Intention tarifaire sur un produit identifie de maniere non ambiguе
         -> reponse structuree depuis la DB catalogue, sourcee ;
      2. Provider LLM configure (mock/gemini/openai/ollama)
         -> pipeline RAG sur contexte FAQ + produits collectes ;
      3. Sinon -> recherche textuelle FAQ puis produits (comportement legacy,
         conserve pour l'environnement demo sans cle API).
    """
    text = (question or "").strip()
    if not text:
        return {
            "answer": "Posez une question sur nos produits ou services.",
            "source": "empty",
        }

    # 1. Donnees structurées d'abord : le RAG n'est jamais la seule source
    #    de vérite pour les donnees commerciales (prix, offre identifiee).
    structured = _structured_product_answer(text)
    if structured is not None:
        return structured

    # 2. Pipeline RAG complet lorsque un provider LLM est configure.
    provider_name = _chatbot_provider_configured()
    if provider_name:
        from apps.core.providers import run_rag_pipeline

        documents = _collect_context(text)
        result = run_rag_pipeline(text, documents, provider_name=provider_name)
        response: Dict[str, Any] = {
            "answer": result.get("answer", ""),
            "source": result.get("provider", provider_name),
            "model": result.get("model"),
            "sources": result.get("sources", []),
            "confidence": result.get("confidence"),
        }
        # Echec LLM absorbe par le pipeline : marquer la reponse comme degradee
        # afin que l'appelant puisse la tracer sans exposer l'erreur brute.
        if result.get("error"):
            response["degraded"] = True
        return response

    # 3. Mode legacy : recherche FAQ/produits (sans LLM).
    return _search_fallback(text)
