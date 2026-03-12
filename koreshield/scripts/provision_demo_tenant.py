"""
Provision a demo user, team, and API key for investor demos.

Requirements:
- DATABASE_URL must be set (postgresql://...)
- This script will create records if they do not already exist.
"""

import asyncio
import os
import re
from datetime import datetime, timezone

import bcrypt
from sqlalchemy import select

from koreshield.database import AsyncSessionLocal
from koreshield.models.api_key import APIKey
from koreshield.models.team import Team, TeamMember
from koreshield.models.user import User

DEMO_EMAIL = os.getenv("DEMO_EMAIL", "demo@koreshield.com")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "ChangeMe-Now-123!")
DEMO_NAME = os.getenv("DEMO_NAME", "KoreShield Demo Admin")
DEMO_TEAM_NAME = os.getenv("DEMO_TEAM_NAME", "KoreShield Demo")
DEMO_TEAM_SLUG = os.getenv("DEMO_TEAM_SLUG")
DEMO_KEY_NAME = os.getenv("DEMO_KEY_NAME", "Demo API Key")
DEMO_KEY_DESC = os.getenv("DEMO_KEY_DESC", "Investor demo key")


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "koreshield-demo"


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def main() -> None:
    if AsyncSessionLocal is None:
        raise RuntimeError("DATABASE_URL not configured; cannot provision demo tenant.")

    team_slug = DEMO_TEAM_SLUG or slugify(DEMO_TEAM_NAME)

    async with AsyncSessionLocal() as session:
        # User
        result = await session.execute(select(User).where(User.email == DEMO_EMAIL))
        user = result.scalar_one_or_none()

        if not user:
            password_hash = bcrypt.hashpw(DEMO_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            user = User(
                email=DEMO_EMAIL,
                password_hash=password_hash,
                name=DEMO_NAME,
                role="admin",
                status="active",
                email_verified=True,
                created_at=utcnow_naive(),
                updated_at=utcnow_naive(),
            )
            session.add(user)
            await session.flush()

        # Team
        result = await session.execute(select(Team).where(Team.slug == team_slug))
        team = result.scalar_one_or_none()

        if not team:
            team = Team(
                name=DEMO_TEAM_NAME,
                slug=team_slug,
                owner_id=user.id,
                created_at=utcnow_naive(),
                updated_at=utcnow_naive(),
            )
            session.add(team)
            await session.flush()

        # Team membership
        result = await session.execute(
            select(TeamMember)
            .where(TeamMember.team_id == team.id)
            .where(TeamMember.user_id == user.id)
        )
        membership = result.scalar_one_or_none()

        if not membership:
            membership = TeamMember(
                team_id=team.id,
                user_id=user.id,
                role="owner",
                joined_at=utcnow_naive(),
            )
            session.add(membership)

        # API key
        result = await session.execute(
            select(APIKey)
            .where(APIKey.user_id == user.id)
            .where(APIKey.name == DEMO_KEY_NAME)
            .where(APIKey.is_revoked.is_(False))
        )
        api_key = result.scalar_one_or_none()

        full_key = None
        if not api_key:
            full_key, key_hash, key_prefix = APIKey.generate_key()
            api_key = APIKey(
                user_id=user.id,
                key_hash=key_hash,
                key_prefix=key_prefix,
                name=DEMO_KEY_NAME,
                description=DEMO_KEY_DESC,
                created_at=utcnow_naive(),
                updated_at=utcnow_naive(),
            )
            session.add(api_key)

        await session.commit()

    print("Demo provisioning complete.")
    print(f"User: {DEMO_EMAIL}")
    print(f"Team: {DEMO_TEAM_NAME} ({team_slug})")
    if full_key:
        print("API Key (save now):", full_key)
    else:
        print("API Key: existing key already present for this user.")


if __name__ == "__main__":
    asyncio.run(main())
