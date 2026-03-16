import base64
import hashlib
import hmac
import json
import os
from dataclasses import dataclass
from typing import Any

import httpx


class PolarConfigurationError(RuntimeError):
    """Raised when Polar environment is not configured."""


@dataclass
class PolarConfig:
    access_token: str
    server: str
    webhook_secret: str | None

    @property
    def api_base_url(self) -> str:
        if self.server == "sandbox":
            return "https://sandbox-api.polar.sh/v1"
        return "https://api.polar.sh/v1"


def get_polar_config() -> PolarConfig:
    access_token = os.getenv("POLAR_ACCESS_TOKEN", "").strip()
    server = os.getenv("POLAR_SERVER", "production").strip().lower() or "production"
    webhook_secret = os.getenv("POLAR_WEBHOOK_SECRET", "").strip() or None

    if not access_token:
        raise PolarConfigurationError("POLAR_ACCESS_TOKEN is not configured")

    if server not in {"production", "sandbox"}:
        raise PolarConfigurationError("POLAR_SERVER must be either 'production' or 'sandbox'")

    return PolarConfig(
        access_token=access_token,
        server=server,
        webhook_secret=webhook_secret,
    )


class PolarClient:
    def __init__(self, config: PolarConfig | None = None):
        self.config = config or get_polar_config()

    async def _request(self, method: str, path: str, json_body: dict[str, Any] | None = None) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.config.access_token}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method,
                f"{self.config.api_base_url}{path}",
                headers=headers,
                json=json_body,
            )
        response.raise_for_status()
        return response.json()

    async def create_checkout(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", "/checkouts/", json_body=payload)

    async def create_customer_session(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", "/customer-sessions/", json_body=payload)

    async def get_customer_state_by_external_id(self, external_customer_id: str) -> dict[str, Any]:
        return await self._request("GET", f"/customers/external/{external_customer_id}/state")

    @staticmethod
    def verify_webhook_signature(raw_body: bytes, headers: dict[str, str], webhook_secret: str | None) -> bool:
        if not webhook_secret:
            return True

        webhook_id = headers.get("webhook-id", "")
        webhook_timestamp = headers.get("webhook-timestamp", "")
        webhook_signature = headers.get("webhook-signature", "")
        if not webhook_id or not webhook_timestamp or not webhook_signature:
            return False

        signed_content = f"{webhook_id}.{webhook_timestamp}.{raw_body.decode('utf-8')}".encode("utf-8")
        secret_bytes = base64.b64encode(webhook_secret.encode("utf-8"))
        digest = base64.b64encode(hmac.new(secret_bytes, signed_content, hashlib.sha256).digest()).decode("utf-8")

        signatures = []
        for item in webhook_signature.split(" "):
            if "," in item:
                item = item.split(",", 1)[1]
            if "=" in item:
                item = item.split("=", 1)[1]
            signatures.append(item.strip())

        return any(hmac.compare_digest(digest, signature) for signature in signatures if signature)

    @staticmethod
    def load_webhook_payload(raw_body: bytes) -> dict[str, Any]:
        return json.loads(raw_body.decode("utf-8"))
