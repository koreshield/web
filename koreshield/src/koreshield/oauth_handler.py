"""
OAuth provider integration for KoreShield.
Handles GitHub and Google OAuth flows.
"""

import os
import uuid
from urllib.parse import urlencode

import httpx
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models.user import User
from .utils import utcnow_naive

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Configuration — loaded once at import time
# ---------------------------------------------------------------------------
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


class OAuthException(Exception):
    """Raised when an OAuth operation cannot proceed."""
    pass


# ---------------------------------------------------------------------------
# GitHub
# ---------------------------------------------------------------------------

class GitHubOAuthHandler:
    """Handle GitHub OAuth flows."""

    @staticmethod
    def get_authorization_url(state: str, redirect_uri: str) -> str:
        """Return the GitHub authorization URL to redirect the user to."""
        if not GITHUB_CLIENT_ID:
            raise OAuthException("GitHub OAuth not configured")
        params = {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "scope": "user:email",
            "state": state,
        }
        return f"{GITHUB_AUTH_URL}?{urlencode(params)}"

    @staticmethod
    async def exchange_code_for_token(code: str, redirect_uri: str) -> str:
        """Exchange authorization code for an access token."""
        if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
            raise OAuthException("GitHub OAuth credentials not configured")

        async with httpx.AsyncClient(timeout=10) as client:
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
            token = data.get("access_token")
            if not token:
                raise OAuthException(
                    f"GitHub did not return an access token: {data.get('error_description', data)}"
                )
            return token

    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """Fetch user profile from GitHub.

        GitHub users can hide their primary email — if ``email`` is None in the
        /user response we fall back to /user/emails and pick the primary
        verified address.
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(GITHUB_USER_URL, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            email = data.get("email")

            # Fall back to the emails endpoint for users with private emails
            if not email:
                emails_resp = await client.get(GITHUB_EMAILS_URL, headers=headers)
                if emails_resp.status_code == 200:
                    for entry in emails_resp.json():
                        if entry.get("primary") and entry.get("verified"):
                            email = entry["email"]
                            break
                    # Last resort: any verified address
                    if not email:
                        for entry in emails_resp.json():
                            if entry.get("verified"):
                                email = entry["email"]
                                break

            if not email:
                raise OAuthException(
                    "Could not retrieve a verified email address from GitHub. "
                    "Please make sure your GitHub account has a verified email."
                )

            return {
                "id": str(data["id"]),
                "email": email,
                "name": data.get("name") or data.get("login", ""),
                "provider": "github",
            }


# ---------------------------------------------------------------------------
# Google
# ---------------------------------------------------------------------------

class GoogleOAuthHandler:
    """Handle Google OAuth flows."""

    @staticmethod
    def get_authorization_url(state: str, redirect_uri: str) -> str:
        """Return the Google authorization URL to redirect the user to."""
        if not GOOGLE_CLIENT_ID:
            raise OAuthException("Google OAuth not configured")
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "online",
            "prompt": "select_account",
        }
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    @staticmethod
    async def exchange_code_for_token(code: str, redirect_uri: str) -> str:
        """Exchange authorization code for an access token."""
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            raise OAuthException("Google OAuth credentials not configured")

        async with httpx.AsyncClient(timeout=10) as client:
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
            token = data.get("access_token")
            if not token:
                raise OAuthException(
                    f"Google did not return an access token: {data.get('error_description', data)}"
                )
            return token

    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """Fetch user profile from Google."""
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                GOOGLE_USER_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            data = response.json()
            email = data.get("email")
            if not email:
                raise OAuthException("Google did not return an email address.")
            return {
                "id": data["id"],
                "email": email,
                "name": data.get("name", ""),
                "provider": "google",
            }


# ---------------------------------------------------------------------------
# Shared user creation
# ---------------------------------------------------------------------------

async def find_or_create_oauth_user(
    db: AsyncSession,
    provider: str,
    provider_user_id: str,
    email: str,
    name: str,
) -> User:
    """Find an existing user or create a new one from an OAuth provider."""

    # 1. Look up by provider ID (fastest path — already linked)
    if provider == "github":
        result = await db.execute(select(User).where(User.github_id == provider_user_id))
    else:
        result = await db.execute(select(User).where(User.google_id == provider_user_id))

    user = result.scalar_one_or_none()
    if user:
        return user

    # 2. Email match — link the provider to an existing account
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if provider == "github":
            existing_user.github_id = provider_user_id
        else:
            existing_user.google_id = provider_user_id
        if not existing_user.oauth_provider:
            existing_user.oauth_provider = provider
        existing_user.updated_at = utcnow_naive()
        await db.commit()
        await db.refresh(existing_user)
        return existing_user

    # 3. Brand-new user
    # Promote the very first user in the system to owner
    result = await db.execute(select(User).limit(1))
    is_first_user = result.scalar_one_or_none() is None

    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash="",       # OAuth users have no password
        name=name,
        role="owner" if is_first_user else "user",
        status="active",
        email_verified=True,    # OAuth provider has already verified the address
        created_at=utcnow_naive(),
        updated_at=utcnow_naive(),
        oauth_provider=provider,
    )

    if provider == "github":
        user.github_id = provider_user_id
    else:
        user.google_id = provider_user_id

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
