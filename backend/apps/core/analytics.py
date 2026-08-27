"""
Service analytics V2 — collecte d'evenements structurés et résumés admin.

Chaque evenement est leger et anonymise par design (payload sans PII).
Les fonctions sont independantes de l'API : elles restent utilisables
depuis des vues, des signals Django ou des workers.
"""
from __future__ import annotations

from datetime import timedelta
from collections import Counter
import json
from typing import Any, Dict, Iterable, List, Optional

from django.db.models import Count
from django.utils import timezone

from apps.products.models import Product

_EVENT_TYPES = (
    "offer_view",
    "offer_compare",
    "subscription_started",
    "subscription_submitted",
    "subscription_approved",
    "subscription_activated",
    "payment_started",
    "payment_completed",
    "search",
    "faq_view",
    "chatbot_question",
    "recommendation_clicked",
)

# Phase 18 : limites strictes de payload pour eviter abus et bloat DB.
_MAX_PAYLOAD_KEYS = 20
_MAX_PAYLOAD_JSON_BYTES = 4096
_MAX_STRING_VALUE_LEN = 200


def _sanitize_payload(payload: Any) -> Dict[str, Any]:
    """Nettoie et borne un payload analytique fourni par le client.

    - accepte uniquement des dicts ;
    - max 20 cles, valeurs string tronquees, scalaires simples uniquement ;
    - drop complet si le JSON resulte plus grand que 4 Ko.
    """
    if not isinstance(payload, dict):
        return {}
    clean: Dict[str, Any] = {}
    for key in list(payload.keys())[:_MAX_PAYLOAD_KEYS]:
        value = payload[key]
        key = str(key)[:64]
        if isinstance(value, str):
            clean[key] = value[:_MAX_STRING_VALUE_LEN]
        elif isinstance(value, bool) or isinstance(value, int) or isinstance(value, float):
            clean[key] = value
        # lists/dicts imbriques refuses : surface d'attaque trop large.
        if len(json.dumps(clean, default=str).encode()) > _MAX_PAYLOAD_JSON_BYTES:
            return {}
    return clean


def record_event(
    *,
    event_type: str,
    user=None,
    product: Optional[Product] = None,
    payload: Optional[Dict[str, Any]] = None,
) -> Optional[object]:
    """Enregistre un evenement analytique ; ne leve jamais d'exception.

    Retourne l'instance AnalyticsEvent creee, ou None si le type est inconnu
    ou si l'insertion echoue (l'analytics ne doit pas casser le parcours).
    """
    if event_type not in _EVENT_TYPES:
        return None
    try:
        from .models import AnalyticsEvent

        return AnalyticsEvent.objects.create(
            event_type=event_type,
            user=user if getattr(user, "is_authenticated", False) else None,
            product=product,
            payload=_sanitize_payload(payload or {}),
        )
    except Exception:
        return None


def _days_param(value: Optional[str], default: int = 30) -> int:
    try:
        days = int(value or default)
    except (TypeError, ValueError):
        days = default
    return max(1, min(days, 365))


def analytics_summary(
    days: int = 30,
    category: str = '',
    product: str = '',
    segment: str = '',
) -> Dict[str, Any]:
    """Resume analytique admin : KPIs, top offres/catégories, recherches, funnel.

    Args:
        days: fenêtre de lecture en jours (bornee 1..365).
        category: filtre slug de categorie.
        product: filtre id ou slug de produit.
        segment: filtre segment produit (PARTICULIER/PROFESSIONNEL/...).
    """
    from .models import AnalyticsEvent

    since = timezone.now() - timedelta(days=_days_param(str(days), 30))
    events = AnalyticsEvent.objects.filter(created_at__gte=since)

    # Filtres Phase 17 : date / categorie / produit / segment.
    if category:
        events = events.filter(product__category__slug=category)
    if segment:
        events = events.filter(product__segment=segment)
    if product:
        field = 'id' if str(product).isdigit() else 'slug'
        events = events.filter(**{f'product__{field}': product})

    counts: Dict[str, int] = {name: 0 for name in _EVENT_TYPES}
    for row in events.values("event_type").annotate(c=Count("id")):
        counts[row["event_type"]] = row["c"]
    total = sum(counts.values())
    top_offers = list(
        events.exclude(product=None)
        .filter(event_type__in=("offer_view", "offer_compare"))
        .values("product__id", "product__name")
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )

    top_categories = list(
        events.exclude(product__isnull=True)
        .values("product__category__name")
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )

    counter = Counter()
    for payload in events.filter(event_type="search").values_list("payload", flat=True):
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except ValueError:
                payload = {}
        if isinstance(payload, dict):
            query = payload.get("query")
            if query:
                counter[query] += 1
    top_queries = [q for q, _ in counter.most_common(10)]

    started = counts.get("subscription_started", 0)
    submitted = counts.get("subscription_submitted", 0)
    conversion_rate = round((submitted / started) * 100, 2) if started else 0.0

    return {
        "period_days": max(1, min(int(days) if str(days).isdigit() else 30, 365)),
        "total_events": total,
        "counts": counts,
        "top_offers": top_offers,
        "top_categories": top_categories,
        "top_search_queries": top_queries,
        "conversion_rate": conversion_rate,
        "funnel": _subscription_funnel(counts, since, category=category, product=product, segment=segment),
    }


def _subscription_funnel(
    event_counts: Dict[str, int],
    since,
    category: str = '',
    product: str = '',
    segment: str = '',
) -> Dict[str, Any]:
    """Funnel officiel Phase 17 : Views -> Started -> Submitted -> Approved -> Activated.

    Les etapes 'views' et 'started' proviennent des AnalyticsEvent (meme
    filtres) ; les etapes metier proviennent de la base souscriptions (source
    de verite), approved/activated etant comptes sur l'historique de statuts
    pour rester justes meme apres transition vers un statut terminal.
    """
    from apps.subscriptions.models import (
        SubscriptionRequest,
        SubscriptionStatusHistory,
    )

    subscriptions = SubscriptionRequest.objects.filter(created_at__gte=since)
    history = SubscriptionStatusHistory.objects.filter(created_at__gte=since)
    if category:
        subscriptions = subscriptions.filter(product__category__slug=category)
        history = history.filter(subscription__product__category__slug=category)
    if segment:
        subscriptions = subscriptions.filter(product__segment=segment)
        history = history.filter(subscription__product__segment=segment)
    if product:
        field = 'id' if str(product).isdigit() else 'product__slug'
        subscriptions = subscriptions.filter(**{field: product})
        hfield = f'subscription__{field}'
        history = history.filter(**{hfield: product})

    submitted = subscriptions.count()
    approved = history.filter(new_status=SubscriptionRequest.Status.APPROVED).count()
    activated = history.filter(new_status=SubscriptionRequest.Status.ACTIVATED).count()
    views = event_counts.get('offer_view', 0)
    started = event_counts.get('subscription_started', 0)

    def rate(numerator: int, denominator: int) -> float:
        return round((numerator / denominator) * 100, 2) if denominator else 0.0

    return {
        'views': views,
        'subscription_started': started,
        'submitted': submitted,
        'approved': approved,
        'activated': activated,
        'view_to_start': rate(started, views),
        'start_to_submit': rate(submitted, started),
        'submit_to_approve': rate(approved, submitted),
        'approve_to_activate': rate(activated, approved),
        'global_conversion': rate(activated, views),
    }