"""Services applicatifs V3 pour CAMTEL OnePortal.

Finalise le lot V3 du cahier des charges : intégrations CAMTEL en
abstractions (CRM / Billing / Provisioning), canal SMS et orchestration
omnicanale — sans aucun faux connecteur. Chaque intégration externe est
représentée par une interface stable et un provider mock/local deterministe,
remplaçable par le vrai connecteur CAMTEL sans toucher aux vues API.

Différence assumée avec les connecteurs réels : les providers mock
retournent des références stables dérivées du contenu (hash) afin d'être
déterministes en test/démo, et n'appellent jamais le réseau.
"""
from __future__ import annotations

import hashlib
import logging
from typing import Any, Dict, Optional

from django.conf import settings

logger = logging.getLogger(__name__)

__all__ = [
    "CRMProvider",
    "MockCRMProvider",
    "BillingProvider",
    "MockBillingProvider",
    "ProvisioningProvider",
    "MockProvisioningProvider",
    "SmsProvider",
    "ConsoleSmsProvider",
    "get_crm_provider",
    "get_billing_provider",
    "get_provisioning_provider",
    "get_sms_provider",
    "run_subscription_integrations",
    "send_omnichannel_notification",
]


def _stable_ref(prefix: str, seed: str) -> str:
    """Référence déterministe type 'CUST-AB12CD34EF56' (reproductible en test)."""
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()[:12].upper()
    return f"{prefix}-{digest}"


# ---------------------------------------------------------------------------
# CRM — gestion client (upsert / lecture)
# ---------------------------------------------------------------------------

class CRMProvider:
    """Interface CRM CAMTEL (fiche client)."""

    name = "base"

    def upsert_customer(self, *, customer: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def get_customer(self, customer_ref: str) -> Dict[str, Any]:
        raise NotImplementedError


class MockCRMProvider(CRMProvider):
    """Provider CRM déterministe pour dev/test/démo (aucun appel réseau)."""

    name = "mock"

    def upsert_customer(self, *, customer: Dict[str, Any]) -> Dict[str, Any]:
        email = str(customer.get("email") or "")
        customer_ref = _stable_ref("CUST", f"{customer.get('full_name', '')}:{email}")
        return {
            "provider": self.name,
            "customer_ref": customer_ref,
            "status": "SYNCED",
            "email": email,
        }

    def get_customer(self, customer_ref: str) -> Dict[str, Any]:
        return {
            "provider": self.name,
            "customer_ref": customer_ref,
            "status": "FOUND",
        }


def get_crm_provider(name: Optional[str] = None) -> CRMProvider:
    provider_name = (name or getattr(settings, "CRM_PROVIDER", "mock") or "mock").lower()
    if provider_name == "mock":
        return MockCRMProvider()
    raise ValueError(f"CRM provider non configure: {provider_name}")


# ---------------------------------------------------------------------------
# Billing — compte de facturation
# ---------------------------------------------------------------------------

class BillingProvider:
    """Interface facturation CAMTEL (compte client + cycle de facturation)."""

    name = "base"

    def create_account(
        self,
        *,
        customer_ref: str,
        product_name: str,
        subscription_ref: str,
        amount: Optional[str] = None,
        currency: str = "XAF",
    ) -> Dict[str, Any]:
        raise NotImplementedError


class MockBillingProvider(BillingProvider):
    """Provider facturation déterministe pour dev/test/démo."""

    name = "mock"

    def create_account(
        self,
        *,
        customer_ref: str,
        product_name: str,
        subscription_ref: str,
        amount: Optional[str] = None,
        currency: str = "XAF",
    ) -> Dict[str, Any]:
        account_ref = _stable_ref("BILL", f"{customer_ref}:{subscription_ref}")
        return {
            "provider": self.name,
            "account_ref": account_ref,
            "status": "ACTIVE",
            "product": product_name,
            "amount": str(amount) if amount is not None else None,
            "currency": currency,
        }


def get_billing_provider(name: Optional[str] = None) -> BillingProvider:
    provider_name = (name or getattr(settings, "BILLING_PROVIDER", "mock") or "mock").lower()
    if provider_name == "mock":
        return MockBillingProvider()
    raise ValueError(f"Billing provider non configure: {provider_name}")


# ---------------------------------------------------------------------------
# Provisioning — activation technique du service
# ---------------------------------------------------------------------------

class ProvisioningProvider:
    """Interface provisioning CAMTEL (activation réseau du service)."""

    name = "base"

    def provision_service(
        self,
        *,
        product_name: str,
        subscription_ref: str,
        address: str = "",
    ) -> Dict[str, Any]:
        raise NotImplementedError


class MockProvisioningProvider(ProvisioningProvider):
    """Provider provisioning déterministe pour dev/test/démo."""

    name = "mock"

    def provision_service(
        self,
        *,
        product_name: str,
        subscription_ref: str,
        address: str = "",
    ) -> Dict[str, Any]:
        work_order_ref = _stable_ref("WO", f"{subscription_ref}:{product_name}:{address}")
        return {
            "provider": self.name,
            "work_order_ref": work_order_ref,
            "status": "PROVISIONED",
            "product": product_name,
            "address": address,
        }


def get_provisioning_provider(name: Optional[str] = None) -> ProvisioningProvider:
    provider_name = (
        name or getattr(settings, "PROVISIONING_PROVIDER", "mock") or "mock"
    ).lower()
    if provider_name == "mock":
        return MockProvisioningProvider()
    raise ValueError(f"Provisioning provider non configure: {provider_name}")


# ---------------------------------------------------------------------------
# SMS — canal omnicanal (complète l'email de v2_services)
# ---------------------------------------------------------------------------

class SmsProvider:
    """Interface envoi SMS (canal omnicanal V3)."""

    name = "base"

    def send(self, *, to: str, message: str) -> Dict[str, Any]:
        raise NotImplementedError


class ConsoleSmsProvider(SmsProvider):
    """Provider SMS local : journalise au lieu d'appeler une passerelle.

    Aucun faux connecteur : en production, un vrai gateway SMS (opérateur ou
    agrégateur) remplacera ce provider par la configuration uniquement.
    """

    name = "console"

    def send(self, *, to: str, message: str) -> Dict[str, Any]:
        logger.info("[SMS:%s] %s", to, message)
        return {"provider": self.name, "sent": bool(to), "to": to}


def get_sms_provider(name: Optional[str] = None) -> SmsProvider:
    provider_name = (name or getattr(settings, "SMS_PROVIDER", "console") or "console").lower()
    if provider_name == "console":
        return ConsoleSmsProvider()
    raise ValueError(f"SMS provider non configure: {provider_name}")


# ---------------------------------------------------------------------------
# Orchestration — cycle de vie souscription x intégrations V3
# ---------------------------------------------------------------------------

def _customer_payload(subscription) -> Dict[str, Any]:
    return {
        "full_name": subscription.full_name,
        "email": subscription.email,
        "phone": subscription.phone,
        "address": subscription.address,
    }


def run_subscription_integrations(
    *,
    subscription,
    old_status: str,
    new_status: str,
) -> Dict[str, Dict[str, Any]]:
    """Déclenche les intégrations CAMTEL (V3) sur les transitions clés.

    Mapping métier (cahier des charges §14) :
      - APPROVED  : upsert de la fiche client dans le CRM ;
      - ACTIVATED : provisioning du service + création du compte de
        facturation (la fiche CRM est synchronisée si absente).

    Chaque intégration est isolée : un échec externe est loggé et renvoyé
    avec ``status=FAILED`` mais ne bloque JAMAIS la transition admin
    (résilience : l'activation côté portail ne dépend pas d'un SI tiers).
    """
    results: Dict[str, Dict[str, Any]] = {}

    def _guarded(key: str, producer) -> None:
        """Isole chaque intégration : la resolution du provider ET l'appel
        sont executes dans le try (une panne fournisseur ne doit jamais
        remonter jusqu'a la vue admin)."""
        try:
            results[key] = producer()
        except Exception as exc:  # noqa: BLE001 - isolation volontaire par intégration
            logger.error("Integration V3 '%s' failed: %s", key, exc, exc_info=True)
            results[key] = {"status": "FAILED", "error": str(exc)}

    if new_status == "APPROVED":
        _guarded(
            "crm",
            lambda: get_crm_provider().upsert_customer(customer=_customer_payload(subscription)),
        )

    if new_status == "ACTIVATED":
        crm_result = results.get("crm") or {}
        if crm_result.get("status") != "SYNCED":
            _guarded(
                "crm",
                lambda: get_crm_provider().upsert_customer(customer=_customer_payload(subscription)),
            )
            crm_result = results.get("crm") or {}
        customer_ref = crm_result.get("customer_ref", "")

        _guarded(
            "provisioning",
            lambda: get_provisioning_provider().provision_service(
                product_name=subscription.product.name,
                subscription_ref=subscription.request_number,
                address=subscription.address,
            ),
        )
        price = getattr(subscription.product, "price", None)
        amount = str(price) if price is not None else None
        _guarded(
            "billing",
            lambda: get_billing_provider().create_account(
                customer_ref=customer_ref,
                product_name=subscription.product.name,
                subscription_ref=subscription.request_number,
                amount=amount,
            ),
        )

    return results


def send_omnichannel_notification(
    *,
    to_email: str = "",
    to_phone: str = "",
    subject: str = "",
    message: str,
) -> Dict[str, Any]:
    """Notification omnicanale (email + SMS) via les providers configurés.

    Désactivée par défaut (``NOTIFICATIONS_OMNICHANNEL=False``) pour ne pas
    changer le comportement existant ; s'ajoute à la notification in-app qui,
    elle, reste toujours créée. L'email réutilise le provider V2
    (``apps.core.v2_services.get_email_provider``) : Web/Mobile/Email/SMS/
    Chatbot consomment bien les mêmes services métier.
    """
    if not getattr(settings, "NOTIFICATIONS_OMNICHANNEL", False):
        return {"skipped": True}

    out: Dict[str, Any] = {}
    if to_email:
        try:
            from apps.core.v2_services import get_email_provider

            out["email"] = get_email_provider().send_template(
                to=[to_email],
                subject=subject or "CAMTEL OnePortal",
                template="{{ message }}",
                context={"message": message},
            )
        except Exception as exc:  # noqa: BLE001 - isolation par canal
            logger.error("Omnichannel email failed: %s", exc, exc_info=True)
            out["email"] = {"status": "FAILED", "error": str(exc)}

    if to_phone:
        try:
            out["sms"] = get_sms_provider().send(to=to_phone, message=message)
        except Exception as exc:  # noqa: BLE001 - isolation par canal
            logger.error("Omnichannel sms failed: %s", exc, exc_info=True)
            out["sms"] = {"status": "FAILED", "error": str(exc)}

    return out
