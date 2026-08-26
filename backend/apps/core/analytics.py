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
    "subscription_completed",
    "search",
    "faq_view",
    "chatbot_question",
)


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
            payload=payload or {},
        )
    except Exception:
        return None


def _days_param(value: Optional[str], default: int = 30) -> int:
    try:
        days = int(value or default)
    except (TypeError, ValueError):
        days = default
    return max(1, min(days, 365))


def analytics_summary(days: int = 30) -> Dict[str, Any]:
    """Resume analytique admin : KPIs, top offres/catégories, recherches.

    Args:
        days: fenêtre de lecture en jours (bornee 1..365).
    """
    from .models import AnalyticsEvent

    since = timezone.now() - timedelta(days=_days_param(str(days), 30))
    events = AnalyticsEvent.objects.filter(created_at__gte=since)

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
    }