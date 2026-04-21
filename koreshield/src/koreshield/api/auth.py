"""
JWT-based authentication for KoreShield.
This module provides stateless authentication using JWT tokens.
The auth service issues signed JWTs, and this firewall verifies signatures.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")
load_dotenv(".env")

logger = structlog.get_logger(__name__)

# JWT Configuration - loaded from config/env during app startup
JWT_VERIFY_KEY: Optional[str] = None
JWT_SIGNING_KEY: Optional[str] = None
JWT_ALGORITHM = "RS256"
JWT_ISSUER: Optional[str] = None
JWT_AUDIENCE: Optional[str] = None
JWT_EXPIRATION_HOURS = 24
AUTH_COOKIE_NAME = "ks_access_token"

# Use HTTPBearer for Swagger UI token auth. auto_error=False allows cookie fallback.
http_bearer = HTTPBearer(
    auto_error=False,
    scheme_name="Bearer Token",
    description="Enter your JWT token from the login endpoint",
)


def _validate_jwt_security(
    algorithm: str,
    verify_key: Optional[str],
    signing_key: Optional[str],
    issuer: Optional[str],
    audience: Optional[str],
):
    """Strict startup-time JWT security validation."""
    if algorithm not in {"HS256", "RS256"}:
        raise RuntimeError(f"Unsupported JWT algorithm configured: {algorithm}")

    if not issuer or not audience:
        raise RuntimeError("JWT issuer/audience are required. Configure JWT_ISSUER and JWT_AUDIENCE.")

    if not verify_key:
        raise RuntimeError("JWT verification key not configured.")

    if algorithm == "HS256":
        if len(verify_key) < 32:
            raise RuntimeError("JWT_SECRET must be at least 32 characters for HS256.")
        if signing_key and signing_key != verify_key:
            raise RuntimeError("HS256 verification/signing keys must match.")

    if algorithm == "RS256" and not signing_key:
        logger.warning("JWT signing key not configured for RS256; token issuance endpoints will fail")


def init_jwt_config(config: dict):
    """Initialize JWT configuration from main config with strict validation."""
    global JWT_VERIFY_KEY, JWT_SIGNING_KEY, JWT_ALGORITHM, JWT_ISSUER, JWT_AUDIENCE, JWT_EXPIRATION_HOURS

    jwt_config = config.get("jwt", {})

    public_key = jwt_config.get("public_key") or os.getenv("JWT_PUBLIC_KEY")
    private_key = jwt_config.get("private_key") or os.getenv("JWT_PRIVATE_KEY")
    shared_secret = jwt_config.get("secret") or os.getenv("JWT_SECRET")

    # Enforce key separation policy: use either asymmetric keys or shared secret, never both.
    if (public_key or private_key) and shared_secret:
        raise RuntimeError(
            "Invalid JWT configuration: do not configure JWT_SECRET alongside JWT_PUBLIC_KEY/JWT_PRIVATE_KEY."
        )

    if public_key or private_key:
        JWT_ALGORITHM = "RS256"
        JWT_VERIFY_KEY = public_key or private_key
        JWT_SIGNING_KEY = private_key
    elif shared_secret:
        JWT_ALGORITHM = "HS256"
        JWT_VERIFY_KEY = shared_secret
        JWT_SIGNING_KEY = shared_secret
    else:
        JWT_VERIFY_KEY = None
        JWT_SIGNING_KEY = None
        JWT_ALGORITHM = "RS256"

    # Require explicit issuer/audience via config/env, no implicit defaults.
    JWT_ISSUER = jwt_config.get("issuer") or os.getenv("JWT_ISSUER")
    JWT_AUDIENCE = jwt_config.get("audience") or os.getenv("JWT_AUDIENCE")

    expiration_hours = jwt_config.get("expiration_hours") or os.getenv("JWT_EXPIRATION_HOURS")
    if expiration_hours:
        JWT_EXPIRATION_HOURS = int(expiration_hours)

    _validate_jwt_security(
        JWT_ALGORITHM,
        JWT_VERIFY_KEY,
        JWT_SIGNING_KEY,
        JWT_ISSUER,
        JWT_AUDIENCE,
    )

    logger.info(
        "JWT authentication configured",
        algorithm=JWT_ALGORITHM,
        issuer=JWT_ISSUER,
        audience=JWT_AUDIENCE,
    )


def issue_jwt_token(
    user_id: str,
    email: str,
    role: str,
    expires_hours: Optional[int] = None,
    *,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Issue a signed JWT for a user using the configured signing key."""
    if not JWT_SIGNING_KEY or not JWT_ISSUER or not JWT_AUDIENCE:
        raise RuntimeError("JWT signing configuration is incomplete.")

    now = datetime.now(timezone.utc)
    ttl_hours = expires_hours or JWT_EXPIRATION_HOURS
    payload = {
        "sub": str(user_id),
        "user_id": str(user_id),
        "email": email,
        "role": role,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": now,
        "exp": now + timedelta(hours=ttl_hours),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, JWT_SIGNING_KEY, algorithm=JWT_ALGORITHM)


def _extract_cookie_token(request: Request) -> Optional[str]:
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        return None
    if token.lower().startswith("bearer "):
        return token.split(" ", 1)[1].strip()
    return token


def get_request_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = None,
) -> Optional[str]:
    """Extract bearer token from Authorization header or auth cookie."""
    if credentials and hasattr(credentials, "credentials") and credentials.credentials:
        return credentials.credentials

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()

    return _extract_cookie_token(request)


def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token.
    Returns the decoded payload if valid, None otherwise.
    """
    if not JWT_VERIFY_KEY or not JWT_ISSUER or not JWT_AUDIENCE:
        logger.error("JWT verification configuration missing")
        return None

    try:
        payload = jwt.decode(
            token,
            JWT_VERIFY_KEY,
            algorithms=[JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
            options={
                "verify_exp": True,
                "verify_iat": True,
                "verify_iss": True,
                "verify_aud": True,
            },
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("security_auth_failure", reason="token_expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning("security_auth_failure", reason="invalid_token", error=str(e))
        return None
    except Exception as e:
        logger.error("security_auth_failure", reason="jwt_verification_error", error=str(e))
        return None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
) -> Dict[str, Any]:
    """Validate JWT from bearer header or secure cookie and return user info."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = get_request_token(request, credentials)
    if not token:
        logger.warning("security_auth_failure", reason="missing_token", path=str(request.url.path))
        raise credentials_exception

    payload = verify_jwt_token(token)
    if not payload:
        raise credentials_exception

    user = {
        "id": payload.get("sub") or payload.get("user_id"),
        "name": payload.get("name"),
        "email": payload.get("email"),
        "role": payload.get("role", "user"),
        "mfa_verified": bool(payload.get("mfa_verified", False)),
        "auth_method": payload.get("auth_method", "password"),
    }

    logger.info("user_authenticated", user_id=user.get("id"), email=user.get("email"), role=user.get("role"))
    return user


async def get_current_admin(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
) -> Dict[str, Any]:
    """Validate JWT and require admin/owner/superuser role."""
    user = await get_current_user(request, credentials)

    if user.get("role") not in ["admin", "owner", "superuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    if not user.get("mfa_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Multi-factor authentication required for admin access",
        )

    return user


# Legacy function for backward compatibility (returns None to indicate no DB access)
def verify_session_token(token: str) -> Optional[dict]:
    """Legacy function kept for backward compatibility."""
    logger.warning("verify_session_token called - this should use JWT verification")
    return verify_jwt_token(token)
