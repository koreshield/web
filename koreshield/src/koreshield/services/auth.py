"""
Authentication service for KoreShield.
Handles JWT and API Key validation.
"""

import os
import uuid
import structlog
from datetime import datetime, timezone
from fastapi import HTTPException, Request
from sqlalchemy import select, or_

from ..models.api_key import APIKey
from ..api.auth import get_request_token, verify_jwt_token

logger = structlog.get_logger(__name__)

class AuthService:
    def __init__(self, db_session_factory=None):
        self.db_session_factory = db_session_factory

    async def authenticate_request(self, request: Request) -> dict:
        """
        Authenticate request using either Bearer JWT or X-API-Key.
        Returns principal info if authenticated, raises HTTPException otherwise.
        """
        auth_header = request.headers.get("Authorization", "")
        token = get_request_token(request)
        
        if token:
            payload = verify_jwt_token(token)
            if payload:
                user_id = payload.get("sub") or payload.get("user_id")
                try:
                    user_id = uuid.UUID(str(user_id)) if user_id else None
                except (ValueError, TypeError):
                    user_id = None
                return {
                    "auth_type": "jwt",
                    "user_id": user_id,
                    "email": payload.get("email"),
                    "role": payload.get("role"),
                }
            logger.warning(
                "security_auth_failure",
                reason="invalid_jwt",
                path=str(request.url.path),
                client_ip=request.client.host if request.client else None,
            )

        api_key_value = request.headers.get("X-API-Key")
        if api_key_value and self.db_session_factory:
            if not api_key_value.startswith("ks_"):
                logger.warning(
                    "security_api_key_misuse",
                    reason="malformed_api_key_prefix",
                    path=str(request.url.path),
                    client_ip=request.client.host if request.client else None,
                )
            key_hash = APIKey.hash_key(api_key_value)
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            
            async with self.db_session_factory() as session:
                result = await session.execute(
                    select(APIKey).where(
                        APIKey.key_hash == key_hash,
                        APIKey.is_revoked.is_(False),
                        or_(APIKey.expires_at.is_(None), APIKey.expires_at > now),
                    )
                )
                api_key = result.scalar_one_or_none()
                if api_key:
                    api_key.last_used_at = now
                    await session.commit()
                    return {
                        "auth_type": "api_key",
                        "user_id": api_key.user_id,
                        "api_key_id": api_key.id,
                        "key_prefix": api_key.key_prefix,
                    }
            logger.warning(
                "security_api_key_misuse",
                reason="invalid_or_revoked_api_key",
                path=str(request.url.path),
                client_ip=request.client.host if request.client else None,
            )
        elif not auth_header:
            logger.warning(
                "security_auth_failure",
                reason="missing_auth_credentials",
                path=str(request.url.path),
                client_ip=request.client.host if request.client else None,
            )

        raise HTTPException(
            status_code=401,
            detail="Authentication required. Provide a valid Bearer token or X-API-Key.",
            headers={"WWW-Authenticate": "Bearer"},
        )
