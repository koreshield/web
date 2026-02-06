
"""
JWT-based authentication for KoreShield.
This module provides stateless authentication using JWT tokens.
The auth service issues signed JWTs, and this firewall only verifies signatures.
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")
load_dotenv(".env")

logger = structlog.get_logger(__name__)

# JWT Configuration - will be loaded from config
JWT_PUBLIC_KEY = None
JWT_ALGORITHM = "RS256"
JWT_ISSUER = "koreshield-auth"

# Use HTTPBearer for simple JWT token authentication in Swagger UI
http_bearer = HTTPBearer(scheme_name="Bearer Token", description="Enter your JWT token from the login endpoint")

def init_jwt_config(config: dict):
    """Initialize JWT configuration from main config."""
    global JWT_PUBLIC_KEY, JWT_ALGORITHM, JWT_ISSUER

    jwt_config = config.get("jwt", {})
    JWT_PUBLIC_KEY = jwt_config.get("public_key") or os.getenv("JWT_PUBLIC_KEY")
    JWT_ALGORITHM = jwt_config.get("algorithm", "RS256")
    JWT_ISSUER = jwt_config.get("issuer", "koreshield-auth")

    if not JWT_PUBLIC_KEY:
        logger.warning("JWT_PUBLIC_KEY not configured - authentication will fail")
    else:
        logger.info("JWT authentication configured", algorithm=JWT_ALGORITHM, issuer=JWT_ISSUER)

def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token using public key.
    Returns the decoded payload if valid, None otherwise.
    """
    if not JWT_PUBLIC_KEY:
        logger.error("JWT_PUBLIC_KEY not configured")
        return None

    try:
        # Decode and verify the JWT
        payload = jwt.decode(
            token,
            JWT_PUBLIC_KEY,
            algorithms=[JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            options={
                "verify_exp": True,
                "verify_iat": True,
                "verify_aud": False  # We'll handle audience verification manually if needed
            }
        )

        # Additional validation
        if payload.get("type") != "access":
            logger.warning("Invalid token type", token_type=payload.get("type"))
            return None

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid token", error=str(e))
        return None
    except Exception as e:
        logger.error("JWT verification error", error=str(e))
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(http_bearer)) -> Dict[str, Any]:
    """
    FastAPI dependency to validate JWT token and return user info.
    Allows any authenticated user (no role restriction).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_jwt_token(credentials.credentials)
    if not payload:
        raise credentials_exception

    # Extract user information from JWT payload
    user = {
        "id": payload.get("sub") or payload.get("user_id"),
        "name": payload.get("name"),
        "email": payload.get("email"),
        "role": payload.get("role", "user")
    }

    # Audit logging for authentication
    logger.info("user_authenticated", user_id=user.get("id"), email=user.get("email"), role=user.get("role"))

    return user

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(http_bearer)) -> Dict[str, Any]:
    """
    FastAPI dependency to validate JWT token and return user info.
    Requires admin, owner, or superuser role.
    """
    # First validate the user is authenticated
    user = await get_current_user(credentials)

    # Then check for admin permission
    if user.get("role") not in ["admin", "owner", "superuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    return user

# Legacy function for backward compatibility (returns None to indicate no DB access)
def verify_session_token(token: str) -> Optional[dict]:
    """
    Legacy function - now uses JWT verification instead of database.
    This function is kept for backward compatibility but delegates to JWT verification.
    """
    logger.warning("verify_session_token called - this should use JWT verification")
    return verify_jwt_token(token)
