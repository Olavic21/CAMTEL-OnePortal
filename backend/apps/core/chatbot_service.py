"""
Service chatbot OnePortal AI.

Orchestre la recherche textuelle (FAQ + produits) et, lorsqu'un
provider LLM est configure (CHATBOT_PROVIDER != "none"), génère une
réponse via le pipeline RAG.

Usage depuis ChatbotView.post :

    result = ask_chatbot(question)
    return Response(result)
"""
import logging
import re
from typing import Any, Dict, List

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


def _question_tokens(question: str, limit: int = 8) -> List[str]:
    """Extrait les mots-cles significatifs d'une question utilisateur.

    Historique : la recherche utilisait ``icontains=question`` sur la question
    COMPLETE — or le texte integral d'une vraie question n'est jamais contenu
    dans un nom/description de produit. Resultat : contexte RAG vide, le LLM
    n'etait jamais appele et tout tombait sur le fallback. On matche desormais
    mot par mot (>= 3 caracteres, hors mots vides), limite aux 8 premiers.
    """
    tokens = re.findall(r"[a-z0-9]{3,}", (question or "").lower())
    return [t for t in tokens if t not in _QUESTION_STOPWORDS][:limit]


def _collect_context(question: str) -> List[str]:
    """Recherche FAQ + produits et retourne des fragments de texte pour le prompt RAG."""
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
        documents.append(f"FAQ ({faq.product.name}): Q: {faq.question} | R: {faq.answer}")

    products = Product.objects.filter(product_query, is_published=True)[:5]
    for product in products:
        desc = (product.description or "")[:500]
        documents.append(f"Produit ({product.name}): {desc}")

    return documents


def ask_chatbot(question: str) -> Dict[str, Any]:
    """Point d'entree unique pour le chatbot.

    Comportement :
      1. Si CHATBOT_PROVIDER == "none" → recherche textuelle uniquement (legacy).
      2. Si CHATBOT_PROVIDER configure → construit le contexte, appelle le LLM
      via run_rag_pipeline, renvoie la reponse generee.
      3. En cas d'erreur LLM et CHATBOT_FALLBACK_TO_SEARCH →
         recherche textuelle de repli.

    Returns:
        Dict avec au moins `answer` et `source`.
    """
    provider_name = getattr(settings, "CHATBOT_PROVIDER", "none")
    fallback = getattr(settings, "CHATBOT_FALLBACK_TO_SEARCH", True)

    # --- Mode "none" : recherche textuelle uniquement (legacy) ---
    if not getattr(settings, "CHATBOT_ENABLED", True) or provider_name == "none":
        return _search_fallback(question)

        # --- Mode LLM : recherche contexte + generation ---
    documents = _collect_context(question)
    context = "\n\n".join(documents) if documents else ""

    if not context.strip():
        # Aucun document trouve → on peut quand meme interroger le LLM
        # (il dira "je ne sais pas"). Mais on garde le fallback search si demandé.
        if fallback:
            return _search_fallback(question)
        return {
            "answer": (
                "Je ne dispose pas d'information fiable a ce sujet. "
                "Veuillez contacter notre support via le formulaire de contact."
            ),
            "source": "fallback",
            "provider": provider_name,
            "confidence": 0.0,
        }

    try:
        from apps.core.providers import run_rag_pipeline
        result = run_rag_pipeline(
            question=question,
            documents=documents,
            provider_name=provider_name,
            temperature=getattr(settings, "CHATBOT_TEMPERATURE", 0.3),
            max_tokens=getattr(settings, "CHATBOT_MAX_TOKENS", 512),
            timeout=getattr(settings, "CHATBOT_TIMEOUT_SECONDS", 20),
        )
        answer = result.get("answer", "")
        if answer:
            # Enrichir avec les infos de recherche pour le frontend
            search_result = _search_fallback(question)
            search_result["answer"] = answer
            search_result["source"] = result.get("provider", provider_name)
            search_result["confidence"] = result.get("confidence", 0.9)
            search_result["model"] = result.get("model", provider_name)
            if documents:
                search_result["sources"] = result.get("sources", [])
            return search_result
    except Exception as exc:
        logger.error("Chatbot LLM failed: %s", exc, exc_info=True)
        if not fallback:
            raise

    return _search_fallback(question)


def _search_fallback(question: str) -> Dict[str, Any]:
    """Recherche textuelle FAQ + produits (comportement legacy).

    Utilise la meme extraction de mots-cles que _collect_context pour que le
    fallback trouve les memes documents que le contexte RAG.
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
                "product": faq.product.name,
            }

        product = Product.objects.filter(product_query, is_published=True).first()
        if product:
            return {
                "answer": f"{product.name}: {product.description[:300]}",
                "source": "product",
            }

    return {
        "answer": (
            "Je n'ai pas trouve de reponse precise. "
            "Contactez-nous via le formulaire de contact."
        ),
        "source": "fallback",
    }
