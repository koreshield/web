"""
Integration tests for management password reset flows.
"""

import asyncio
from datetime import timedelta
from pathlib import Path

import bcrypt
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from koreshield.api import management
from koreshield.models.base import Base
from koreshield.models.user import User, utcnow_naive


def _build_test_client(tmp_path: Path) -> tuple[TestClient, sessionmaker, list[dict], object, object]:
    db_path = tmp_path / "password-reset.sqlite3"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", future=True)
    session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    sent_emails: list[dict] = []

    async def override_get_db():
        async with session_factory() as session:
            yield session

    async def fake_send_password_reset_email(email: str, token: str, name: str | None = None) -> bool:
        sent_emails.append({"email": email, "token": token, "name": name})
        return True

    asyncio.run(_create_schema(engine))

    app = FastAPI()
    app.include_router(management.router, prefix="/v1/management")
    app.dependency_overrides[management.get_db] = override_get_db
    original_sender = management.send_password_reset_email
    management.send_password_reset_email = fake_send_password_reset_email
    client = TestClient(app)

    return client, session_factory, sent_emails, engine, original_sender


async def _create_schema(engine) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def _dispose_engine(engine) -> None:
    await engine.dispose()


async def _create_user(
    session_factory: sessionmaker,
    *,
    email: str,
    password: str = "OldPassword123!",
    name: str = "Test User",
    status: str = "active",
) -> User:
    async with session_factory() as session:
        user = User(
            email=email,
            password_hash=bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
            name=name,
            role="user",
            status=status,
            email_verified=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


async def _get_user_by_email(session_factory: sessionmaker, email: str) -> User | None:
    async with session_factory() as session:
        result = await session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()


async def _set_reset_token(
    session_factory: sessionmaker,
    *,
    email: str,
    token: str,
    expires_at,
) -> None:
    async with session_factory() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        user.reset_password_token = token
        user.reset_password_expires_at = expires_at
        await session.commit()


def test_forgot_password_generates_token_and_sends_email(tmp_path: Path):
    client, session_factory, sent_emails, engine, original_sender = _build_test_client(tmp_path)
    try:
        asyncio.run(_create_user(session_factory, email="user@example.com", name="Kore User"))

        response = client.post(
            "/v1/management/forgot-password",
            json={"email": "user@example.com"},
        )

        assert response.status_code == 200
        assert "If an account exists" in response.json()["message"]
        assert len(sent_emails) == 1
        assert sent_emails[0]["email"] == "user@example.com"

        user = asyncio.run(_get_user_by_email(session_factory, "user@example.com"))
        assert user is not None
        assert user.reset_password_token == sent_emails[0]["token"]
        assert user.reset_password_expires_at is not None
        assert user.reset_password_expires_at > utcnow_naive()
    finally:
        management.send_password_reset_email = original_sender
        client.close()
        asyncio.run(_dispose_engine(engine))


def test_forgot_password_does_not_leak_unknown_email(tmp_path: Path):
    client, session_factory, sent_emails, engine, original_sender = _build_test_client(tmp_path)
    try:
        response = client.post(
            "/v1/management/forgot-password",
            json={"email": "missing@example.com"},
        )

        assert response.status_code == 200
        assert "If an account exists" in response.json()["message"]
        assert sent_emails == []
        assert asyncio.run(_get_user_by_email(session_factory, "missing@example.com")) is None
    finally:
        management.send_password_reset_email = original_sender
        client.close()
        asyncio.run(_dispose_engine(engine))


def test_reset_password_updates_hash_and_clears_token(tmp_path: Path):
    client, session_factory, _sent_emails, engine, original_sender = _build_test_client(tmp_path)
    try:
        asyncio.run(_create_user(session_factory, email="user@example.com"))
        asyncio.run(
            _set_reset_token(
                session_factory,
                email="user@example.com",
                token="valid-token",
                expires_at=utcnow_naive() + timedelta(minutes=15),
            )
        )

        response = client.post(
            "/v1/management/reset-password",
            json={"token": "valid-token", "new_password": "NewPassword123!"},
        )

        assert response.status_code == 200
        assert "Password reset successful" in response.json()["message"]

        user = asyncio.run(_get_user_by_email(session_factory, "user@example.com"))
        assert user is not None
        assert user.reset_password_token is None
        assert user.reset_password_expires_at is None
        assert bcrypt.checkpw("NewPassword123!".encode("utf-8"), user.password_hash.encode("utf-8"))
    finally:
        management.send_password_reset_email = original_sender
        client.close()
        asyncio.run(_dispose_engine(engine))


def test_reset_password_rejects_expired_token(tmp_path: Path):
    client, session_factory, _sent_emails, engine, original_sender = _build_test_client(tmp_path)
    try:
        asyncio.run(_create_user(session_factory, email="user@example.com"))
        asyncio.run(
            _set_reset_token(
                session_factory,
                email="user@example.com",
                token="expired-token",
                expires_at=utcnow_naive() - timedelta(minutes=1),
            )
        )

        response = client.post(
            "/v1/management/reset-password",
            json={"token": "expired-token", "new_password": "NewPassword123!"},
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid or expired reset token"

        user = asyncio.run(_get_user_by_email(session_factory, "user@example.com"))
        assert user is not None
        assert user.reset_password_token is None
        assert user.reset_password_expires_at is None
    finally:
        management.send_password_reset_email = original_sender
        client.close()
        asyncio.run(_dispose_engine(engine))


def test_reset_password_rejects_weak_password(tmp_path: Path):
    client, session_factory, _sent_emails, engine, original_sender = _build_test_client(tmp_path)
    try:
        asyncio.run(_create_user(session_factory, email="user@example.com"))
        asyncio.run(
            _set_reset_token(
                session_factory,
                email="user@example.com",
                token="valid-token",
                expires_at=utcnow_naive() + timedelta(minutes=15),
            )
        )

        response = client.post(
            "/v1/management/reset-password",
            json={"token": "valid-token", "new_password": "short"},
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Password must be at least 8 characters long"
    finally:
        management.send_password_reset_email = original_sender
        client.close()
        asyncio.run(_dispose_engine(engine))
