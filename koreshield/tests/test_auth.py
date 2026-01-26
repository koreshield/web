"""
Tests for JWT authentication system.
"""

import pytest
import jwt
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

from src.koreshield.api.auth import (
    init_jwt_config, verify_jwt_token, get_current_admin, verify_session_token,
    JWT_PUBLIC_KEY, JWT_ALGORITHM, JWT_ISSUER
)


class TestJWTConfig:
    """Test JWT configuration initialization."""

    def test_init_jwt_config_with_config(self):
        """Test initializing JWT config from config dict."""
        config = {
            "jwt": {
                "public_key": "test_public_key",
                "algorithm": "HS256",
                "issuer": "test-issuer"
            }
        }

        init_jwt_config(config)

        # Test that verification works with the configured key
        with patch('jwt.decode') as mock_decode:
            mock_decode.return_value = {"type": "access", "sub": "test"}
            result = verify_jwt_token("test.token")
            assert result is not None

    def test_init_jwt_config_with_env(self):
        """Test initializing JWT config from environment variables."""
        config = {"jwt": {}}

        with patch.dict("os.environ", {"JWT_PUBLIC_KEY": "env_public_key"}):
            init_jwt_config(config)

            # Test that verification would work (can't test actual decode without real key)
            with patch('jwt.decode') as mock_decode:
                mock_decode.return_value = {"type": "access", "sub": "test"}
                result = verify_jwt_token("test.token")
                assert result is not None

    def test_init_jwt_config_missing_key(self):
        """Test JWT config with missing public key."""
        config = {"jwt": {}}

        with patch.dict("os.environ", {}, clear=True):
            init_jwt_config(config)

            # Should return None when no key configured
            result = verify_jwt_token("test.token")
            assert result is None


class TestJWTVerification:
    """Test JWT token verification."""

    @pytest.fixture
    def valid_payload(self):
        """Create a valid JWT payload."""
        return {
            "sub": "user123",
            "name": "Test User",
            "email": "test@example.com",
            "role": "admin",
            "type": "access",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "iss": "koreshield-auth"
        }

    @pytest.fixture
    def test_key(self):
        """Test RSA public key for JWT verification."""
        return """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtest
-----END PUBLIC KEY-----"""

    def test_verify_valid_jwt_token(self, valid_payload, test_key):
        """Test verifying a valid JWT token."""
        # Initialize config
        init_jwt_config({"jwt": {"public_key": test_key, "algorithm": "RS256"}})

        # Create a token (we'll mock the decode since we don't have a real key)
        with patch('jwt.decode') as mock_decode:
            mock_decode.return_value = valid_payload

            result = verify_jwt_token("valid.jwt.token")

            assert result == valid_payload
            mock_decode.assert_called_once()

    def test_verify_jwt_token_no_public_key(self):
        """Test JWT verification when no public key is configured."""
        init_jwt_config({"jwt": {}})  # No public key

        result = verify_jwt_token("some.token")

        assert result is None

    def test_verify_expired_jwt_token(self, valid_payload, test_key):
        """Test verifying an expired JWT token."""
        init_jwt_config({"jwt": {"public_key": test_key}})

        with patch('jwt.decode', side_effect=jwt.ExpiredSignatureError("Token expired")):
            result = verify_jwt_token("expired.jwt.token")

            assert result is None

    def test_verify_invalid_jwt_token(self, valid_payload, test_key):
        """Test verifying an invalid JWT token."""
        init_jwt_config({"jwt": {"public_key": test_key}})

        with patch('jwt.decode', side_effect=jwt.InvalidTokenError("Invalid token")):
            result = verify_jwt_token("invalid.jwt.token")

            assert result is None

    def test_verify_jwt_wrong_token_type(self, valid_payload, test_key):
        """Test verifying JWT with wrong token type."""
        init_jwt_config({"jwt": {"public_key": test_key}})

        invalid_payload = valid_payload.copy()
        invalid_payload["type"] = "refresh"  # Wrong type

        with patch('jwt.decode') as mock_decode:
            mock_decode.return_value = invalid_payload

            result = verify_jwt_token("wrong.type.token")

            assert result is None


class TestFastAPIDependencies:
    """Test FastAPI authentication dependencies."""

    @pytest.fixture
    def valid_token(self):
        """Mock valid JWT token."""
        return "valid.jwt.token"

    @pytest.fixture
    def invalid_token(self):
        """Mock invalid JWT token."""
        return "invalid.jwt.token"

    @pytest.mark.asyncio
    async def test_get_current_admin_valid_token(self, valid_token):
        """Test get_current_admin with valid token."""
        user_payload = {
            "sub": "user123",
            "name": "Admin User",
            "email": "admin@example.com",
            "role": "admin",
            "type": "access"
        }

        with patch('src.koreshield.api.auth.verify_jwt_token', return_value=user_payload):
            result = await get_current_admin(valid_token)

            expected_user = {
                "id": "user123",
                "name": "Admin User",
                "email": "admin@example.com",
                "role": "admin"
            }
            assert result == expected_user

    @pytest.mark.asyncio
    async def test_get_current_admin_invalid_token(self, invalid_token):
        """Test get_current_admin with invalid token."""
        with patch('src.koreshield.api.auth.verify_jwt_token', return_value=None):
            with pytest.raises(Exception) as exc_info:
                await get_current_admin(invalid_token)

            assert exc_info.value.status_code == 401
            assert "Could not validate credentials" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_current_admin_insufficient_permissions(self, valid_token):
        """Test get_current_admin with user lacking admin permissions."""
        user_payload = {
            "sub": "user123",
            "name": "Regular User",
            "email": "user@example.com",
            "role": "user",  # Not admin
            "type": "access"
        }

        with patch('src.koreshield.api.auth.verify_jwt_token', return_value=user_payload):
            with pytest.raises(Exception) as exc_info:
                await get_current_admin(valid_token)

            assert exc_info.value.status_code == 403
            assert "Insufficient permissions" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_current_admin_superuser_role(self, valid_token):
        """Test get_current_admin with superuser role."""
        user_payload = {
            "sub": "user123",
            "name": "Super User",
            "email": "super@example.com",
            "role": "superuser",
            "type": "access"
        }

        with patch('src.koreshield.api.auth.verify_jwt_token', return_value=user_payload):
            result = await get_current_admin(valid_token)

            expected_user = {
                "id": "user123",
                "name": "Super User",
                "email": "super@example.com",
                "role": "superuser"
            }
            assert result == expected_user


class TestLegacyFunctions:
    """Test legacy authentication functions."""

    def test_verify_session_token_delegates_to_jwt(self):
        """Test that verify_session_token delegates to JWT verification."""
        with patch('src.koreshield.api.auth.verify_jwt_token') as mock_verify:
            mock_verify.return_value = {"test": "payload"}

            result = verify_session_token("test.token")

            mock_verify.assert_called_once_with("test.token")
            assert result == {"test": "payload"}