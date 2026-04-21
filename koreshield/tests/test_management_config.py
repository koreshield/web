"""
Integration tests for management configuration endpoint security behavior.
"""

import os
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
from fastapi.testclient import TestClient

# Ensure predictable JWT env during module import.
os.environ.pop("JWT_PUBLIC_KEY", None)
os.environ.pop("JWT_PRIVATE_KEY", None)
os.environ.setdefault("JWT_ISSUER", "koreshield-auth")
os.environ.setdefault("JWT_AUDIENCE", "koreshield-api")
os.environ.setdefault("JWT_SECRET", "test-secret-with-minimum-32-characters!!")
os.environ.setdefault("KORESHIELD_EAGER_APP_INIT", "false")

from koreshield.proxy import KoreShieldProxy


def _build_admin_headers(secret: str) -> dict:
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "email": "admin@example.com",
            "role": "admin",
            "mfa_verified": True,
            "iss": "koreshield-auth",
            "aud": "koreshield-api",
            "iat": now,
            "exp": now + timedelta(hours=1),
        },
        secret,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


def test_management_config_dev_returns_redacted_values():
    secret = "dev-secret-with-minimum-length-32chars!!"
    config = {
        "server": {"environment": "development"},
        "security": {"sensitivity": "high", "default_action": "block"},
        "redis": {"enabled": False},
        "database": {
            "password": "super-secret-db-password",
            "url": "postgresql://example/db",
        },
        "nested": {
            "service_token": "abc123",
            "safe_value": "visible",
        },
    }

    with patch.dict(
        "os.environ",
        {
            "ENVIRONMENT": "development",
            "JWT_SECRET": secret,
            "JWT_ISSUER": "koreshield-auth",
            "JWT_AUDIENCE": "koreshield-api",
        },
        clear=True,
    ):
        proxy = KoreShieldProxy(config)
        client = TestClient(proxy.app)
        response = client.get("/v1/management/config", headers=_build_admin_headers(secret))
        assert response.status_code == 200
        body = response.json()

        assert body["database"]["password"] == "***redacted***"
        assert body["nested"]["service_token"] == "***redacted***"
        assert body["nested"]["safe_value"] == "visible"


def test_management_config_non_dev_returns_404():
    secret = "prod-secret-with-minimum-length-32chars!"
    config = {
        "server": {"environment": "production"},
        "security": {"sensitivity": "high", "default_action": "block"},
        "redis": {"enabled": False},
        "providers": {"openai": {"enabled": False}},
    }

    with patch.dict(
        "os.environ",
        {
            "ENVIRONMENT": "production",
            "JWT_SECRET": secret,
            "JWT_ISSUER": "koreshield-auth",
            "JWT_AUDIENCE": "koreshield-api",
        },
        clear=True,
    ):
        proxy = KoreShieldProxy(config)
        client = TestClient(proxy.app)
        response = client.get("/v1/management/config", headers=_build_admin_headers(secret))
        assert response.status_code == 404
        assert "disabled" in response.json()["detail"].lower()


def test_management_me_endpoint_returns_authenticated_user():
    secret = "dev-secret-with-minimum-length-32chars!!"
    config = {
        "server": {"environment": "development"},
        "security": {"sensitivity": "high", "default_action": "block"},
        "redis": {"enabled": False},
        "providers": {"openai": {"enabled": False}},
    }

    with patch.dict(
        "os.environ",
        {
            "ENVIRONMENT": "development",
            "JWT_SECRET": secret,
            "JWT_ISSUER": "koreshield-auth",
            "JWT_AUDIENCE": "koreshield-api",
        },
        clear=True,
    ):
        proxy = KoreShieldProxy(config)
        client = TestClient(proxy.app)
        response = client.get("/v1/management/me", headers=_build_admin_headers(secret))
        assert response.status_code == 200
        assert "user" in response.json()
        assert response.json()["user"]["email"] == "admin@example.com"
