"""Services applicatifs V2 pour CAMTEL OnePortal.

Ces services finalisent la V2 sans faux connecteurs : chaque intégration externe
est représentée par une interface stable et un provider mock/local testable.
Les vrais connecteurs Mobile Money, email SMTP transactionnel, GED ou scoring SI
CAMTEL pourront remplacer ces providers sans modifier les vues API.
"""
from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, Iterable, List, Optional

from django.conf import settings
from django.core.mail import send_mail
from django.template import engines
from django.utils import timezone

from apps.products.models import Product


# Re-export payment providers (Phase 14) — source of truth is payment_providers.py
try:
    from apps.core.payment_providers import (  # noqa: F401
        PaymentProvider,
        MockPaymentProvider,
        OrangeMoneyProvider,
        MTNMoMoProvider,
        get_payment_provider,
    )
except ImportError:
    # Fallback si module absent (tests isolés)
    class PaymentProvider:  # type: ignore
        name = "base"
        def initiate_payment(self, *, amount, currency, customer, reference, metadata=None): raise NotImplementedError
        def get_payment_status(self, transaction_id): raise NotImplementedError
    class MockPaymentProvider(PaymentProvider):  # type: ignore
        name = "mock"
        def initiate_payment(self, *, amount, currency, customer, reference, metadata=None):
            seed = f"{reference}:{amount}:{currency}:{customer.get('email','')}"
            transaction_id = f"PAY-{hashlib.sha1(seed.encode()).hexdigest()[:12].upper()}"
            return {"provider": self.name, "transaction_id": transaction_id, "reference": reference, "status": "PENDING", "amount": str(amount), "currency": currency, "payment_url": f"mock://payments/{transaction_id}", "metadata": metadata or {}, "created_at": timezone.now().isoformat()}
        def get_payment_status(self, transaction_id): return {"provider": self.name, "transaction_id": transaction_id, "status": "PENDING"}
    def get_payment_provider(name=None):  # type: ignore
        from django.conf import settings as _s
        pn = (name or getattr(_s, "PAYMENT_PROVIDER", "mock") or "mock").lower()
        if pn == "mock": return MockPaymentProvider()
        raise ValueError(f"Payment provider non configure: {pn}")


@dataclass
class EligibilityResult:
    eligible: bool
    status: str
    reasons: List[str]
    score: float
    product_id: int
    address: str = ""
    provider: str = "mock"

    def as_dict(self) -> Dict[str, Any]:
        return {
            "eligible": self.eligible,
            "status": self.status,
            "reasons": self.reasons,
            "score": self.score,
            "product_id": self.product_id,
            "address": self.address,
            "provider": self.provider,
        }


class EligibilityProvider:
    """Interface d'éligibilité technique/commerciale."""

    name = "base"

    def check(self, product: Product, *, address: str = "", phone: str = "") -> EligibilityResult:
        raise NotImplementedError


class MockEligibilityProvider(EligibilityProvider):
    """Règles mock explicables basées sur les champs métier Product."""

    name = "mock"

    def check(self, product: Product, *, address: str = "", phone: str = "") -> EligibilityResult:
        reasons: List[str] = []
        score = 0.5

        # P1-2: Add clear disclaimer that this is a simulated check
        reasons.insert(0, "Vérification indicative — confirmation technique requise.")

        if not product.is_active or not product.is_published:
            reasons.append("Offre indisponible à la souscription.")
            return EligibilityResult(False, "UNAVAILABLE", reasons, 0.0, product.id, address)

        if product.availability == Product.Availability.ALL:
            reasons.append("Offre disponible nationalement.")
            score += 0.4
        elif product.availability == Product.Availability.REGION:
            if address:
                reasons.append("Adresse fournie pour vérification régionale.")
                score += 0.25
            else:
                reasons.append("Adresse requise pour confirmer la disponibilité régionale.")
                score -= 0.15
        elif product.availability == Product.Availability.ADDRESS_CHECK:
            if address:
                reasons.append("Adresse reçue, pré-éligibilité favorable sous réserve d'étude technique.")
                score += 0.15
            else:
                reasons.append("Vérification d'adresse obligatoire pour cette offre.")
                score -= 0.25

        if product.manage_stock and product.stock <= 0:
            reasons.append("Produit physique actuellement en rupture de stock.")
            score = min(score, 0.2)

        eligible = score >= 0.5
        status = "SIMULATED" if eligible else "REQUIRES_REVIEW"
        return EligibilityResult(eligible, status, reasons, round(max(0.0, min(score, 1.0)), 2), product.id, address, self.name)


def get_eligibility_provider(name: Optional[str] = None) -> EligibilityProvider:
    provider_name = (name or getattr(settings, "ELIGIBILITY_PROVIDER", "mock") or "mock").lower()
    if provider_name == "mock":
        return MockEligibilityProvider()
    if provider_name == "camtel_fiber":
        return CamtelFiberEligibilityProvider()
    raise ValueError(f"Eligibility provider non configure: {provider_name}")


class CamtelFiberEligibilityProvider(EligibilityProvider):
    """Eligibilite fibre via l'API officielle CAMTEL Fiber Connect.

    Regle mission #12 : si l'API reelle n'est pas accessible/configuree,
    NE PAS creer de fausse integration. Le provider :
      1. appelle CAMTEL_FIBER_ELIGIBILITY_URL (endpoint officiel) si defini ;
      2. sinon, retombe explicitement sur le mock en marquant le resultat
         comme indicatif (fallback declare, jamais un faux "oui CAMTEL").
    """

    name = "camtel_fiber"

    def check(self, product: Product, *, address: str = "", phone: str = "") -> EligibilityResult:
        api_url = getattr(settings, "CAMTEL_FIBER_ELIGIBILITY_URL", "")
        if not api_url:
            result = MockEligibilityProvider().check(product, address=address, phone=phone)
            result.reasons.insert(
                0,
                "Mode indicatif : API officielle Fiber Connect non configuree "
                "(CAMTEL_FIBER_ELIGIBILITY_URL). Resultat non contractuel.",
            )
            result.provider = self.name
            if result.eligible:
                result.status = "REQUIRES_VERIFICATION"
                result.eligible = False
            return result

        import requests  # import paresseux : dependance optionnelle a l'execution

        try:
            response = requests.post(
                api_url,
                json={"product_id": product.id, "address": address, "phone": phone},
                timeout=10,
            )
            response.raise_for_status()
            payload = response.json()
        except Exception as exc:  # noqa: BLE001 - fallback explicite demande (#12)
            fallback = MockEligibilityProvider().check(product, address=address, phone=phone)
            fallback.reasons.insert(
                0, f"API officielle Fiber Connect injoignable ({exc.__class__.__name__}). Resultat indicatif."
            )
            if fallback.eligible:
                fallback.status = "REQUIRES_VERIFICATION"
                fallback.eligible = False
            return fallback

        # When using real API, status should be VERIFIED
        return EligibilityResult(
            eligible=bool(payload.get("eligible")),
            status="VERIFIED" if payload.get("eligible") else "NOT_ELIGIBLE",
            reasons=list(payload.get("reasons", [])) or ["Reponse du service officiel CAMTEL Fiber Connect."],
            score=float(payload.get("score", 1.0)),
            product_id=product.id,
            address=address,
            provider=self.name,
        )



class EmailProvider:
    """Interface email transactionnel V2."""

    name = "base"
    def send_template(
        self,
        *,
        to: Iterable[str],
        subject: str,
        template: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        raise NotImplementedError


class DjangoEmailProvider(EmailProvider):
    """Provider email utilisant le backend Django configuré."""

    name = "django"
    def send_template(
        self,
        *,
        to: Iterable[str],
        subject: str,
        template: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        recipients = [email for email in to if email]
        rendered = engines["django"].from_string(template).render(context or {})
        sent = send_mail(
            subject=subject,
            message=rendered,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@oneportal.local"),
            recipient_list=recipients,
            fail_silently=False,
        )
        return {"provider": self.name, "sent": sent, "recipients": recipients, "subject": subject}


class ConsoleEmailProvider(DjangoEmailProvider):
    """Alias explicite pour le mode console/local."""

    name = "console"


def get_email_provider(name: Optional[str] = None) -> EmailProvider:
    provider_name = (name or getattr(settings, "EMAIL_PROVIDER", "console") or "console").lower()
    if provider_name in {"console", "django"}:
        return ConsoleEmailProvider() if provider_name == "console" else DjangoEmailProvider()
    raise ValueError(f"Email provider non configure: {provider_name}")


class DocumentStore:
    """Catalogue documentaire V2 prêt pour RAG (CGV, guides, PDF)."""

    def __init__(self, documents: Optional[List[Dict[str, Any]]] = None):
        self.documents = documents if documents is not None else getattr(settings, "DOCUMENT_STORE", [])

    def list_documents(self, *, product_id: Optional[int] = None, kind: Optional[str] = None) -> List[Dict[str, Any]]:
        docs = list(self.documents)
        if product_id is not None:
            docs = [doc for doc in docs if doc.get("product_id") in {None, product_id}]
        if kind:
            docs = [doc for doc in docs if doc.get("kind") == kind]
        return docs

    def search(self, query: str, *, limit: int = 5) -> List[Dict[str, Any]]:
        q = (query or "").lower().strip()
        if not q:
            return self.list_documents()[:limit]
        scored = []
        for doc in self.documents:
            haystack = " ".join(str(doc.get(key, "")) for key in ("title", "summary", "kind", "tags")).lower()
            score = sum(1 for token in q.split() if token in haystack)
            if score:
                scored.append((score, doc))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [doc for _, doc in scored[:limit]]


def recommend_products(product: Optional[Product] = None, *, segment: str = "", limit: int = 3) -> List[Dict[str, Any]]:
    """Recommandations explicables, déterministes et sans tracking externe."""
    qs = Product.objects.filter(is_active=True, is_published=True).select_related("category")
    if product is not None:
        qs = qs.exclude(pk=product.pk)

    candidates = list(qs[:100])
    recommendations = []
    for candidate in candidates:
        score = 0
        reasons: List[str] = []
        if product is not None:
            if candidate.offer_type == product.offer_type:
                score += 3
                reasons.append("Même type d'offre")
            if candidate.segment == product.segment:
                score += 2
                reasons.append("Même segment client")
            if candidate.category_id == product.category_id:
                score += 2
                reasons.append("Même catégorie")
            try:
                candidate_price = Decimal(str(candidate.price))
                product_price = Decimal(str(product.price))
                price_is_lower = candidate_price <= product_price
            except (TypeError, ValueError):
                price_is_lower = False
            if price_is_lower:
                score += 1
                reasons.append("Prix inférieur ou comparable")
        if segment and candidate.segment == segment:
            score += 2
            reasons.append("Correspond au segment demandé")
        if not reasons:
            reasons.append("Offre active et publiée")
        recommendations.append((score, candidate, reasons))

    recommendations.sort(key=lambda item: (item[0], item[1].views_count, -item[1].id), reverse=True)
    return [
        {
            "id": item.id,
            "name": item.name,
            "slug": item.slug,
            "price": str(item.price),
            "currency": item.currency,
            "offer_type": item.offer_type,
            "segment": item.segment,
            "score": score,
            "reasons": reasons,
        }
        for score, item, reasons in recommendations[:limit]
    ]


def recommend_products_by_criteria(
    *,
    service: str = "",
    segment: str = "",
    budget: Optional[float] = None,
    min_speed: Optional[float] = None,
    min_storage: Optional[float] = None,
    users: Optional[float] = None,
    limit: int = 6,
) -> List[Product]:
    """Moteur « Trouver ma solution » (section 14 du cahier des charges).

    Endpoint POST /api/v1/recommendations/ — le scoring n'est PAS delegue au
    client : le frontend envoie des criteres, le backend filtre et trie le
    catalogue reellement publie (regle #52 : aucune offre inventee).

    Score deterministe et explicable :
      * budget         : prix connu <= budget (hors QUOTE)            (+3)
      * debit          : specs speed/bandwidth >= min_speed           (+2)
      * stockage       : specs storage >= min_storage                 (+2)
      * multi-users    : bandwidth >= users * 10                      (+1)
      * disponibilite  : availability == ALL                          (+1)
    Tri final : score, puis popularite (views_count), puis id decroissant.
    """
    qs = Product.objects.filter(is_active=True, is_published=True).select_related(
        "category", "service"
    )
    if service:
        qs = qs.filter(service__slug=service)
    if segment:
        qs = qs.filter(segment=segment)
    candidates = list(qs[:200])

    def _spec_number(candidate: Product, *keys: str) -> Optional[float]:
        specs = candidate.specs if isinstance(candidate.specs, dict) else {}
        for key in keys:
            raw = specs.get(key)
            if raw is None and key == "speed" and candidate.speed:
                raw = candidate.speed
            if raw is None:
                continue
            try:
                return float(str(raw).split()[0].replace(",", "."))
            except (TypeError, ValueError):
                continue
        return None

    scored: list = []
    for candidate in candidates:
        score = 0
        if (
            budget is not None
            and candidate.price is not None
            and candidate.pricing_type != Product.PricingType.QUOTE
        ):
            try:
                if float(candidate.price) <= budget:
                    score += 3
            except (TypeError, ValueError):
                pass
        if min_speed is not None:
            speed = _spec_number(candidate, "speed", "bandwidth")
            if speed is not None and speed >= min_speed:
                score += 2
        if min_storage is not None:
            storage = _spec_number(candidate, "storage")
            if storage is not None and storage >= min_storage:
                score += 2
        if users is not None:
            bandwidth = _spec_number(candidate, "bandwidth", "speed")
            if bandwidth is not None and bandwidth >= users * 10:
                score += 1
        if candidate.availability == Product.Availability.ALL:
            score += 1
        scored.append((score, candidate))

    scored.sort(key=lambda item: (item[0], item[1].views_count, -item[1].id), reverse=True)
    return [candidate for _, candidate in scored[: max(1, min(limit, 12))]]


def generate_reference(prefix: str = "V2") -> str:
    return f"{prefix}-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"