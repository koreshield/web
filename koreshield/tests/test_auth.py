"""
Tests for JWT authentication system.
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
import pytest
from fastapi.security import HTTPAuthorizationCredentials
from starlette.requests import Request

from koreshield.api.auth import (
    get_current_admin,
    init_jwt_config,
    issue_jwt_token,
    verify_jwt_token,
    verify_session_token,
)


def _request(headers: dict[str, str] | None = None, path: str = "/test") -> Request:
    raw_headers = []
    for key, value in (headers or {}).items():
        raw_headers.append((key.lower().encode("utf-8"), value.encode("utf-8")))
    scope = {"type": "http", "path": path, "headers": raw_headers, "query_string": b""}
    return Request(scope)


class TestJWTConfig:
    def test_init_jwt_config_with_secret_env(self):
        config = {"jwt": {}}
        env = {
            "JWT_SECRET": "env-secret-with-minimum-32-characters!!",
            "JWT_ISSUER": "koreshield-auth",
            "JWT_AUDIENCE": "koreshield-api",
        }
        with patch.dict("os.environ", env, clear=True):
            init_jwt_config(config)
            with patch("jwt.decode") as mock_decode:
                mock_decode.return_value = {"sub": "user-1"}
                assert verify_jwt_token("test.token") == {"sub": "user-1"}

    def test_init_jwt_config_missing_key_raises(self):
        config = {"jwt": {"issuer": "koreshield-auth", "audience": "koreshield-api"}}
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(RuntimeError, match="verification key"):
                init_jwt_config(config)

    def test_init_jwt_config_rejects_weak_secret(self):
        config = {"jwt": {"secret": "short-secret", "issuer": "koreshield-auth", "audience": "koreshield-api"}}
        with pytest.raises(RuntimeError, match="at least 32"):
            init_jwt_config(config)


class TestJWTVerification:
    @pytest.fixture
    def valid_payload(self):
        return {
            "sub": "user123",
            "email": "test@example.com",
            "role": "admin",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "iss": "koreshield-auth",
            "aud": "koreshield-api",
        }

    def test_verify_valid_jwt_token(self, valid_payload):
        init_jwt_config(
            {
                "jwt": {
                    "secret": "test-secret-with-minimum-32-characters!!",
                    "issuer": "koreshield-auth",
                    "audience": "koreshield-api",
                }
            }
        )
        with patch("jwt.decode") as mock_decode:
            mock_decode.return_value = valid_payload
            assert verify_jwt_token("valid.jwt.token") == valid_payload
            mock_decode.assert_called_once()

    def test_verify_expired_jwt_token(self):
        init_jwt_config(
            {
                "jwt": {
                    "secret": "test-secret-with-minimum-32-characters!!",
                    "issuer": "koreshield-auth",
                    "audience": "koreshield-api",
                }
            }
        )
        with patch("jwt.decode", side_effect=jwt.ExpiredSignatureError("expired")):
            assert verify_jwt_token("expired.jwt.token") is None

    def test_verify_invalid_jwt_token(self):
        init_jwt_config(
            {
                "jwt": {
                    "secret": "test-secret-with-minimum-32-characters!!",
                    "issuer": "koreshield-auth",
                    "audience": "koreshield-api",
                }
            }
        )
        with patch("jwt.decode", side_effect=jwt.InvalidTokenError("invalid")):
            assert verify_jwt_token("invalid.jwt.token") is None


class TestFastAPIDependencies:
    @pytest.mark.asyncio
    async def test_get_current_admin_valid_token(self):
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token",
        )
        payload = {
            "sub": "user123",
            "name": "Admin User",
            "email": "admin@example.com",
            "role": "admin",
            "mfa_verified": True,
        }
        with patch("koreshield.api.auth.verify_jwt_token", return_value=payload):
            result = await get_current_admin(_request(), credentials)
            assert result["id"] == "user123"
            assert result["role"] == "admin"

    @pytest.mark.asyncio
    async def test_get_current_admin_invalid_token(self):
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid.jwt.token",
        )
        with patch("koreshield.api.auth.verify_jwt_token", return_value=None):
            with pytest.raises(Exception) as exc_info:
                await get_current_admin(_request(), credentials)
            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_admin_insufficient_permissions(self):
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token",
        )
        payload = {
            "sub": "user123",
            "name": "Regular User",
            "email": "user@example.com",
            "role": "user",
        }
        with patch("koreshield.api.auth.verify_jwt_token", return_value=payload):
            with pytest.raises(Exception) as exc_info:
                await get_current_admin(_request(), credentials)
            assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_get_current_admin_requires_mfa_for_privileged_roles(self):
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token",
        )
        payload = {
            "sub": "user123",
            "name": "Admin User",
            "email": "admin@example.com",
            "role": "admin",
            "mfa_verified": False,
        }
        with patch("koreshield.api.auth.verify_jwt_token", return_value=payload):
            with pytest.raises(Exception) as exc_info:
                await get_current_admin(_request(), credentials)
            assert exc_info.value.status_code == 403
            assert "Multi-factor authentication required" in exc_info.value.detail


def test_issue_jwt_token_uses_initialized_config():
    init_jwt_config(
        {
            "jwt": {
                "secret": "test-secret-with-minimum-32-characters!!",
                "issuer": "koreshield-auth",
                "audience": "koreshield-api",
            }
        }
    )
    token = issue_jwt_token(user_id="user-1", email="u@example.com", role="admin")
    decoded = jwt.decode(
        token,
        "test-secret-with-minimum-32-characters!!",
        algorithms=["HS256"],
        issuer="koreshield-auth",
        audience="koreshield-api",
    )
    assert decoded["sub"] == "user-1"


def test_verify_session_token_delegates_to_jwt():
    with patch("koreshield.api.auth.verify_jwt_token") as mock_verify:
        mock_verify.return_value = {"test": "payload"}
        result = verify_session_token("test.token")
        mock_verify.assert_called_once_with("test.token")
        assert result == {"test": "payload"}
