"""
Integration tests for auth, account lifecycle, and billing flows.
"""

import asyncio
import os
from pathlib import Path
from unittest.mock import patch
from uuid import UUID

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from src.koreshield.api import billing, management, teams
from src.koreshield.api.auth import init_jwt_config
from src.koreshield.models.base import Base
from src.koreshield.models.team import Team, TeamMember


def _build_test_client(tmp_path: Path) -> tuple[TestClient, sessionmaker, object, tuple[object, object], object]:
    db_path = tmp_path / "account-lifecycle.sqlite3"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", future=True)
    session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    asyncio.run(_create_schema(engine))
    env_patcher = patch.dict(
        os.environ,
        {
            "JWT_SECRET": "test-secret-with-minimum-32-characters!!",
            "JWT_ISSUER": "koreshield-auth",
            "JWT_AUDIENCE": "koreshield-api",
            "JWT_PUBLIC_KEY": "",
            "JWT_PRIVATE_KEY": "",
            "POLAR_ACCESS_TOKEN": "",
            "POLAR_WEBHOOK_SECRET": "",
            "POLAR_SERVER": "sandbox",
        },
        clear=False,
    )
    env_patcher.start()
    try:
        init_jwt_config(
            {
                "jwt": {
                    "secret": "test-secret-with-minimum-32-characters!!",
                    "issuer": "koreshield-auth",
                    "audience": "koreshield-api",
                }
            }
        )
    except Exception:
        env_patcher.stop()
        raise

    app = FastAPI()
    app.include_router(management.router, prefix="/v1/management")
    app.include_router(billing.router, prefix="/v1")
    app.include_router(teams.router, prefix="/v1")
    app.dependency_overrides[management.get_db] = override_get_db
    app.dependency_overrides[billing.get_db] = override_get_db
    app.dependency_overrides[teams.get_db] = override_get_db

    async def fake_send_welcome_email(email: str, name: str | None = None) -> bool:
        return True

    async def fake_send_verification_email(email: str, token: str, name: str | None = None) -> bool:
        return True

    original_senders = (management.send_welcome_email, management.send_verification_email)
    management.send_welcome_email = fake_send_welcome_email
    management.send_verification_email = fake_send_verification_email

    client = TestClient(app)
    return client, session_factory, engine, original_senders, env_patcher


async def _create_schema(engine) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def _dispose_engine(engine) -> None:
    await engine.dispose()


async def _create_team_membership(
    session_factory: sessionmaker,
    *,
    user_id: str,
    team_name: str = "KoreShield Team",
    team_slug: str = "koreshield-team",
    role: str = "owner",
) -> Team:
    async with session_factory() as session:
        team = Team(
            name=team_name,
            slug=team_slug,
            owner_id=UUID(user_id),
        )
        session.add(team)
        await session.flush()

        membership = TeamMember(
            team_id=team.id,
            user_id=UUID(user_id),
            role=role,
        )
        session.add(membership)
        await session.commit()
        await session.refresh(team)
        return team


def _signup(client: TestClient, email: str = "user@example.com", password: str = "Password123!") -> dict:
    response = client.post(
        "/v1/management/signup",
        json={"email": email, "password": password, "name": "Kore User"},
    )
    assert response.status_code == 201
    return response.json()


def test_regular_user_session_lifecycle_supports_me_and_logout(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        signup_data = _signup(client)
        assert signup_data["user"]["role"] == "user"

        me_response = client.get("/v1/management/me")
        assert me_response.status_code == 200
        assert me_response.json()["user"]["email"] == "user@example.com"

        logout_response = client.post("/v1/management/logout")
        assert logout_response.status_code == 200
        assert logout_response.json()["status"] == "logged_out"

        after_logout_response = client.get("/v1/management/me")
        assert after_logout_response.status_code == 401
    finally:
        management.send_welcome_email, management.send_verification_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_billing_account_created_for_authenticated_user_scope(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        signup_data = _signup(client)
        user_id = signup_data["user"]["id"]

        response = client.get("/v1/billing/account")
        assert response.status_code == 200
        payload = response.json()

        assert payload["owner_user_id"] == user_id
        assert payload["team_id"] is None
        assert payload["billing_email"] == "user@example.com"
        assert payload["plan_slug"] == "free"
        assert payload["status"] == "inactive"
        assert payload["external_customer_id"] == f"user:{user_id}"
    finally:
        management.send_welcome_email, management.send_verification_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_billing_account_prefers_team_scope_for_owner(tmp_path: Path):
    client, session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        signup_data = _signup(client)
        team = asyncio.run(
            _create_team_membership(
                session_factory,
                user_id=signup_data["user"]["id"],
            )
        )

        response = client.get("/v1/billing/account")
        assert response.status_code == 200
        payload = response.json()

        assert payload["team_id"] == str(team.id)
        assert payload["external_customer_id"] == f"team:{team.id}"
        assert payload["billing_email"] == "user@example.com"
    finally:
        management.send_welcome_email, management.send_verification_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_billing_checkout_returns_503_without_polar_configuration(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        _signup(client)

        response = client.post(
            "/v1/billing/checkout",
            json={"product_id": "prod_test_123"},
        )

        assert response.status_code == 503
        assert response.json()["detail"] == "POLAR_ACCESS_TOKEN is not configured"
    finally:
        management.send_welcome_email, management.send_verification_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_billing_portal_returns_503_without_polar_configuration(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        _signup(client)

        response = client.post(
            "/v1/billing/portal",
            json={"return_url": "https://koreshield.com/billing"},
        )

        assert response.status_code == 503
        assert response.json()["detail"] == "POLAR_ACCESS_TOKEN is not configured"
    finally:
        management.send_welcome_email, management.send_verification_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_teams_collection_routes_work_without_redirects(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        _signup(client)

        list_response = client.get("/v1/teams")
        assert list_response.status_code == 200
        assert list_response.json() == []

        create_response = client.post(
            "/v1/teams",
            json={"name": "KoreShield Ops", "slug": "koreshield-ops"},
        )
        assert create_response.status_code == 200
        payload = create_response.json()
        assert payload["name"] == "KoreShield Ops"
        assert payload["slug"] == "koreshield-ops"
        assert payload["my_role"] == "owner"

        trailing_list_response = client.get("/v1/teams/")
        assert trailing_list_response.status_code == 200
        assert len(trailing_list_response.json()) == 1
    finally:
        management.send_welcome_email, management.send_verification_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))
