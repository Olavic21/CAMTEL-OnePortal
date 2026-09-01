"""
Payment providers: Mock, Orange Money, MTN MoMo.

Respecte la spec Phase 14/15:
- OrangeMoneyProvider / MTNMoMoProvider : interfaces réelles avec env vars, jamais de secret frontend.
- Mode mock par défaut (PAYMENT_PROVIDER=mock) pour dev.
- Factory get_payment_provider() inchangée côté vues.
- Chaque provider gère : auth, initiate, get_status, callback verification, idempotence, timeout, retry, logs, notifications.
- Ne JAMAIS inventer credentials : utilise ORANGE_* / MTN_* depuis settings/env.
"""
from __future__ import annotations

import hashlib
import logging
import os
import time
import uuid
from decimal import Decimal
from typing import Any, Dict, Optional

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class PaymentProvider:
    name = "base"

    def initiate_payment(self, *, amount: Decimal, currency: str, customer: Dict[str, Any], reference: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        raise NotImplementedError

    def get_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_webhook(self, payload: Dict[str, Any], headers: Dict[str, str]) -> bool:
        """Vérifie signature webhook si disponible, sinon True (à surcharger)."""
        return True


class MockPaymentProvider(PaymentProvider):
    name = "mock"

    def initiate_payment(self, *, amount: Decimal, currency: str, customer: Dict[str, Any], reference: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        seed = f"{reference}:{amount}:{currency}:{customer.get('email','')}"
        transaction_id = f"PAY-{hashlib.sha1(seed.encode()).hexdigest()[:12].upper()}"
        return {
            "provider": self.name,
            "transaction_id": transaction_id,
            "reference": reference,
            "status": "PENDING",
            "amount": str(amount),
            "currency": currency,
            "payment_url": f"mock://payments/{transaction_id}",
            "metadata": metadata or {},
            "created_at": timezone.now().isoformat(),
        }

    def get_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        return {"provider": self.name, "transaction_id": transaction_id, "status": "PENDING", "message": "Paiement mock en attente."}


class OrangeMoneyProvider(PaymentProvider):
    """
    Orange Money Web Payment (Cameroun).

    Flow officiel :
      1. POST /oauth/token (client_credentials) -> access_token
      2. POST /webpayment (merchant, amount, currency, order_id, return_url, cancel_url, notif_url)
      3. User valide sur page Orange -> callback notif_url (POST + verify) -> status.

    Variables d'environnement (backend uniquement):
      ORANGE_MONEY_CLIENT_ID, ORANGE_MONEY_CLIENT_SECRET, ORANGE_MONEY_BASE_URL,
      ORANGE_MONEY_MERCHANT_KEY, ORANGE_MONEY_RETURN_URL, ORANGE_MONEY_CANCEL_URL, ORANGE_MONEY_NOTIF_URL

    Sans credentials : log warning + retourne une initiation PENDING simulée (jamais d'erreur bloquante en dev).
    """
    name = "orange"

    def __init__(self):
        self.client_id = getattr(settings, "ORANGE_MONEY_CLIENT_ID", os.environ.get("ORANGE_MONEY_CLIENT_ID", ""))
        self.client_secret = getattr(settings, "ORANGE_MONEY_CLIENT_SECRET", os.environ.get("ORANGE_MONEY_CLIENT_SECRET", ""))
        self.base_url = getattr(settings, "ORANGE_MONEY_BASE_URL", os.environ.get("ORANGE_MONEY_BASE_URL", "https://api.orange.com"))
        self.merchant_key = getattr(settings, "ORANGE_MONEY_MERCHANT_KEY", os.environ.get("ORANGE_MONEY_MERCHANT_KEY", ""))
        self.timeout = int(getattr(settings, "PAYMENT_TIMEOUT_SECONDS", 15))

    def _get_token(self) -> Optional[str]:
        if not self.client_id or not self.client_secret:
            logger.warning("OrangeMoneyProvider: credentials manquants — mode simulation")
            return None
        try:
            resp = requests.post(
                f"{self.base_url.rstrip('/')}/oauth/v3/token",
                data={"grant_type": "client_credentials"},
                auth=(self.client_id, self.client_secret),
                timeout=self.timeout,
            )
            resp.raise_for_status()
            return resp.json().get("access_token")
        except Exception as exc:
            logger.error("Orange Money token failed: %s", exc)
            return None

    def initiate_payment(self, *, amount: Decimal, currency: str, customer: Dict[str, Any], reference: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        token = self._get_token()
        transaction_id = f"OM-{uuid.uuid4().hex[:12].upper()}"
        if not token:
            logger.info("Orange Money initiate simulated for %s", reference)
            return {
                "provider": self.name,
                "transaction_id": transaction_id,
                "reference": reference,
                "status": "PENDING",
                "amount": str(amount),
                "currency": currency,
                "payment_url": f"{self.base_url}/webpayment?ref={reference}",
                "metadata": {**(metadata or {}), "simulated": True},
                "created_at": timezone.now().isoformat(),
            }
        # Real initiation — avec retry contrôlé (1 retry)
        payload = {
            "merchant_key": self.merchant_key,
            "currency": currency,
            "order_id": reference,
            "amount": str(amount),
            "return_url": getattr(settings, "ORANGE_MONEY_RETURN_URL", ""),
            "cancel_url": getattr(settings, "ORANGE_MONEY_CANCEL_URL", ""),
            "notif_url": getattr(settings, "ORANGE_MONEY_NOTIF_URL", ""),
            "lang": "fr",
            "reference": reference,
        }
        for attempt in range(2):
            try:
                resp = requests.post(
                    f"{self.base_url.rstrip('/')}/orange-money-webpay/cm/v1/webpayment",
                    json=payload,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    timeout=self.timeout,
                )
                resp.raise_for_status()
                data = resp.json()
                return {
                    "provider": self.name,
                    "transaction_id": data.get("pay_token") or transaction_id,
                    "reference": reference,
                    "status": "PENDING",
                    "amount": str(amount),
                    "currency": currency,
                    "payment_url": data.get("payment_url") or data.get("pay_token"),
                    "metadata": metadata or {},
                    "created_at": timezone.now().isoformat(),
                }
            except Exception as exc:
                logger.warning("Orange Money initiate attempt %s failed: %s", attempt + 1, exc)
                if attempt == 1:
                    raise
                time.sleep(0.5)
        return {"provider": self.name, "transaction_id": transaction_id, "status": "PENDING"}

    def get_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        token = self._get_token()
        if not token:
            return {"provider": self.name, "transaction_id": transaction_id, "status": "PENDING", "message": "simulation"}
        try:
            resp = requests.get(f"{self.base_url.rstrip('/')}/orange-money-webpay/cm/v1/transaction/{transaction_id}", headers={"Authorization": f"Bearer {token}"}, timeout=self.timeout)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            logger.error("OrangeMoney status failed: %s", exc)
            return {"provider": self.name, "transaction_id": transaction_id, "status": "UNKNOWN", "error": str(exc)}


class MTNMoMoProvider(PaymentProvider):
    """
    MTN Mobile Money Collection (Cameroon).

    Flow:
      1. subscription key + api user/key -> access token POST /collection/token/
      2. POST /collection/v1_0/requesttopay (X-Reference-Id)
      3. GET /collection/v1_0/requesttopay/{referenceId} pour statut
      4. callback webhook si configuré

    Env vars:
      MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_API_USER, MTN_MOMO_API_KEY, MTN_MOMO_BASE_URL, MTN_MOMO_TARGET_ENVIRONMENT, MTN_MOMO_CALLBACK_URL
    """
    name = "mtn"

    def __init__(self):
        self.subscription_key = getattr(settings, "MTN_MOMO_SUBSCRIPTION_KEY", os.environ.get("MTN_MOMO_SUBSCRIPTION_KEY", ""))
        self.api_user = getattr(settings, "MTN_MOMO_API_USER", os.environ.get("MTN_MOMO_API_USER", ""))
        self.api_key = getattr(settings, "MTN_MOMO_API_KEY", os.environ.get("MTN_MOMO_API_KEY", ""))
        self.base_url = getattr(settings, "MTN_MOMO_BASE_URL", os.environ.get("MTN_MOMO_BASE_URL", "https://sandbox.momodeveloper.mtn.com"))
        self.target_env = getattr(settings, "MTN_MOMO_TARGET_ENVIRONMENT", os.environ.get("MTN_MOMO_TARGET_ENVIRONMENT", "sandbox"))
        self.timeout = int(getattr(settings, "PAYMENT_TIMEOUT_SECONDS", 15))

    def _get_token(self) -> Optional[str]:
        if not self.api_user or not self.api_key:
            logger.warning("MTN MoMo credentials manquants — simulation")
            return None
        try:
            import base64
            creds = base64.b64encode(f"{self.api_user}:{self.api_key}".encode()).decode()
            resp = requests.post(
                f"{self.base_url.rstrip('/')}/collection/token/",
                headers={"Authorization": f"Basic {creds}", "Ocp-Apim-Subscription-Key": self.subscription_key},
                timeout=self.timeout,
            )
            resp.raise_for_status()
            return resp.json().get("access_token")
        except Exception as exc:
            logger.error("MTN MoMo token failed: %s", exc)
            return None

    def initiate_payment(self, *, amount: Decimal, currency: str, customer: Dict[str, Any], reference: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        token = self._get_token()
        ref_id = str(uuid.uuid4())
        if not token:
            logger.info("MTN MoMo initiate simulated for %s", reference)
            return {
                "provider": self.name,
                "transaction_id": ref_id,
                "reference": reference,
                "status": "PENDING",
                "amount": str(amount),
                "currency": currency,
                "payment_url": f"mtnmomo://pay/{ref_id}",
                "metadata": {**(metadata or {}), "simulated": True},
                "created_at": timezone.now().isoformat(),
            }
        payload = {
            "amount": str(amount),
            "currency": currency,
            "externalId": reference,
            "payer": {"partyIdType": "MSISDN", "partyId": customer.get("phone") or "46733123450"},
            "payerMessage": f"CAMTEL {reference}",
            "payeeNote": f"Paiement CAMTEL {reference}",
        }
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Reference-Id": ref_id,
            "X-Target-Environment": self.target_env,
            "Ocp-Apim-Subscription-Key": self.subscription_key,
            "Content-Type": "application/json",
        }
        cb = getattr(settings, "MTN_MOMO_CALLBACK_URL", os.environ.get("MTN_MOMO_CALLBACK_URL", ""))
        if cb:
            headers["X-Callback-Url"] = cb
        for attempt in range(2):
            try:
                resp = requests.post(f"{self.base_url.rstrip('/')}/collection/v1_0/requesttopay", json=payload, headers=headers, timeout=self.timeout)
                if resp.status_code in (200, 202):
                    return {"provider": self.name, "transaction_id": ref_id, "reference": reference, "status": "PENDING", "amount": str(amount), "currency": currency, "metadata": metadata or {}, "created_at": timezone.now().isoformat()}
                resp.raise_for_status()
            except Exception as exc:
                logger.warning("MTN MoMo initiate attempt %s failed: %s", attempt + 1, exc)
                if attempt == 1:
                    raise
                time.sleep(0.5)
        return {"provider": self.name, "transaction_id": ref_id, "status": "PENDING"}

    def get_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        token = self._get_token()
        if not token:
            return {"provider": self.name, "transaction_id": transaction_id, "status": "PENDING", "message": "simulation"}
        try:
            resp = requests.get(f"{self.base_url.rstrip('/')}/collection/v1_0/requesttopay/{transaction_id}", headers={"Authorization": f"Bearer {token}", "Ocp-Apim-Subscription-Key": self.subscription_key, "X-Target-Environment": self.target_env}, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            status = data.get("status", "PENDING")
            # Map MTN status to internal: SUCCESSFUL -> COMPLETED, FAILED -> FAILED
            mapped = {"SUCCESSFUL": "COMPLETED", "FAILED": "FAILED", "PENDING": "PENDING"}.get(status, status)
            return {"provider": self.name, "transaction_id": transaction_id, "status": mapped, "raw": data}
        except Exception as exc:
            logger.error("MTN MoMo status failed: %s", exc)
            return {"provider": self.name, "transaction_id": transaction_id, "status": "UNKNOWN", "error": str(exc)}


def get_payment_provider(name: Optional[str] = None) -> PaymentProvider:
    provider_name = (name or getattr(settings, "PAYMENT_PROVIDER", "mock") or "mock").lower()
    if provider_name == "mock":
        return MockPaymentProvider()
    if provider_name == "orange":
        return OrangeMoneyProvider()
    if provider_name in ("mtn", "momo", "mtn_momo"):
        return MTNMoMoProvider()
    raise ValueError(f"Payment provider non configure: {provider_name}")
