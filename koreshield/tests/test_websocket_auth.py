"""Tests for hardened websocket authentication flow."""

import os
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

# Ensure predictable JWT env during module import.
os.environ.pop("JWT_PUBLIC_KEY", None)
os.environ.pop("JWT_PRIVATE_KEY", None)
os.environ.setdefault("JWT_ISSUER", "koreshield-auth")
os.environ.setdefault("JWT_AUDIENCE", "koreshield-api")
os.environ.setdefault("JWT_SECRET", "test-secret-with-minimum-32-characters!!")
os.environ.setdefault("KORESHIELD_EAGER_APP_INIT", "false")

from src.koreshield.proxy import KoreShieldProxy


@pytest.fixture
def proxy_app():
    config = {
        "security": {"sensitivity": "medium", "default_action": "block"},
        "providers": {"openai": {"enabled": False}},
        "redis": {"enabled": False},
        "jwt": {
            "secret": "test-secret-with-minimum-32-characters!!",
            "issuer": "koreshield-auth",
            "audience": "koreshield-api",
        },
    }
    with patch.dict(os.environ, {"JWT_PUBLIC_KEY": "", "JWT_PRIVATE_KEY": ""}, clear=False):
        with patch.object(KoreShieldProxy, "_init_providers"):
            return KoreShieldProxy(config).app


def test_websocket_auth_accepts_authorization_header(proxy_app):
    with patch("src.koreshield.api.websocket.verify_jwt_token", return_value={"id": "user-1"}):
        with TestClient(proxy_app) as client:
            with client.websocket_connect(
                "/ws/events",
                headers={"Authorization": "Bearer test.jwt.token"},
            ) as ws:
                msg = ws.receive_json()
                assert msg["type"] == "connection_established"
                assert msg["data"]["user_id"] == "user-1"


def test_websocket_subprotocol_token_no_longer_authorizes(proxy_app):
    with patch("src.koreshield.api.websocket.verify_jwt_token", return_value={"id": "user-2"}):
        with TestClient(proxy_app) as client:
            with pytest.raises(Exception):
                with client.websocket_connect(
                    "/ws/events",
                    subprotocols=["bearer.test.jwt.token"],
                ):
                    pass


def test_websocket_query_token_no_longer_authorizes(proxy_app):
    with patch("src.koreshield.api.websocket.verify_jwt_token", return_value={"id": "user-3"}):
        with TestClient(proxy_app) as client:
            with pytest.raises(Exception):
                with client.websocket_connect("/ws/events?token=test.jwt.token"):
                    pass
