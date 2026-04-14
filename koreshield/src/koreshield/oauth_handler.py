"""
OAuth provider integration for KoreShield.
Handles GitHub and Google OAuth flows.
"""

import os
import json
import secrets
from typing import Optional
from datetime import datetime, timedelta, timezone

import httpx
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models.user import User
from .utils import utcnow_naive

logger = structlog.get_logger(__name__)

# Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


class OAuthException(Exception):
    """Base OAuth exception."""
    pass


class GitHubOAuthHandler:
    """Handle GitHub OAuth flows."""
    
    @staticmethod
    def get_authorization_url(state: str, redirect_uri: str) -> str:
        """Generate GitHub authorization URL."""
        if not GITHUB_CLIENT_ID:
            raise OAuthException("GitHub OAuth not configured")
        
        params = {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "scope": "user:email",
            "state": state,
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{GITHUB_AUTH_URL}?{query_string}"
    
    @staticmethod
    async def exchange_code_for_token(code: str, redirect_uri: str) -> str:
        """Exchange authorization code for access token."""
        if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
            raise OAuthException("GitHub OAuth credentials not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GITHUB_TOKEN_URL,
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            data = response.json()
            return data.get("access_token")
    
    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """Fetch user info from GitHub."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GITHUB_USER_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            data = response.json()
            return {
                "id": str(data.get("id")),
                "email": data.get("email"),
                "name": data.get("name") or data.get("login", ""),
                "provider": "github",
            }


class GoogleOAuthHandler:
    """Handle Google OAuth flows."""
    
    @staticmethod
    def get_authorization_url(state: str, redirect_uri: str) -> str:
        """Generate Google authorization URL."""
        if not GOOGLE_CLIENT_ID:
            raise OAuthException("Google OAuth not configured")
        
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{GOOGLE_AUTH_URL}?{query_string}"
    
    @staticmethod
    async def exchange_code_for_token(code: str, redirect_uri: str) -> str:
        """Exchange authorization code for access token."""
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            raise OAuthException("Google OAuth credentials not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("access_token")
    
    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """Fetch user info from Google."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GOOGLE_USER_URL,
                params={"access_token": access_token},
            )
            response.raise_for_status()
            data = response.json()
            return {
                "id": data.get("id"),
                "email": data.get("email"),
                "name": data.get("name", ""),
                "provider": "google",
            }


async def find_or_create_oauth_user(
    db: AsyncSession,
    provider: str,
    provider_user_id: str,
    email: str,
    name: str,
) -> User:
    """Find existing user or create new one from OAuth provider."""
    
    if provider == "github":
        result = await db.execute(
            select(User).where(User.github_id == provider_user_id)
        )
        user = result.scalar_one_or_none()
        if user:
            return user
    elif provider == "google":
        result = await db.execute(
            select(User).where(User.google_id == provider_user_id)
        )
        user = result.scalar_one_or_none()
        if user:
            return user
    
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        # Link provider to existing user
        if provider == "github":
            existing_user.github_id = provider_user_id
        elif provider == "google":
            existing_user.google_id = provider_user_id
        
        if not existing_user.oauth_provider:
            existing_user.oauth_provider = provider
        
        existing_user.updated_at = utcnow_naive()
        await db.commit()
        await db.refresh(existing_user)
        return existing_user
    
    # Create new user
    import uuid
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash="",  # No password for OAuth users
        name=name,
        role="user",
        status="active",
        email_verified=True,  # Assume OAuth provider verified email
        created_at=utcnow_naive(),
        updated_at=utcnow_naive(),
        oauth_provider=provider,
    )
    
    if provider == "github":
        user.github_id = provider_user_id
    elif provider == "google":
        user.google_id = provider_user_id
    
    # Promote to owner if first user
    result = await db.execute(select(User))
    all_users = result.scalars().all()
    if len(all_users) == 0:
        user.role = "owner"
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info(
        "oauth_user_created",
        user_id=str(user.id),
        email=user.email,
        provider=provider,
    )
    
    return user
