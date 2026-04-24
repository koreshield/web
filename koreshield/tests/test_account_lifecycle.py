"""
Integration tests for auth, account lifecycle, and billing flows.
"""

import asyncio
import os
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, patch
from uuid import UUID

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from koreshield.api import billing, management, rbac, reports, teams
from koreshield.api.auth import init_jwt_config
from koreshield.models.base import Base
from koreshield.models.report import Report
from koreshield.models.team import Team, TeamMember
from koreshield.models.user import User


def _build_test_client(tmp_path: Path) -> tuple[TestClient, sessionmaker, object, tuple[object, object, object], object]:
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
            "ENVIRONMENT": "test",
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
    app.include_router(reports.router, prefix="/v1")
    app.include_router(rbac.router, prefix="/v1")
    app.dependency_overrides[management.get_db] = override_get_db
    app.dependency_overrides[billing.get_db] = override_get_db
    app.dependency_overrides[teams.get_db] = override_get_db
    app.dependency_overrides[reports.get_db] = override_get_db
    reports.AsyncSessionLocal = session_factory

    async def fake_send_welcome_email(email: str, name: str | None = None) -> bool:
        return True

    async def fake_send_verification_email(email: str, token: str, name: str | None = None) -> bool:
        return True

    async def fake_send_admin_mfa_email(email: str, code: str, name: str | None = None) -> bool:
        return True

    original_senders = (
        management.send_welcome_email,
        management.send_verification_email,
        management.send_admin_mfa_email,
    )
    management.send_welcome_email = fake_send_welcome_email
    management.send_verification_email = fake_send_verification_email
    management.send_admin_mfa_email = fake_send_admin_mfa_email

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


async def _update_user_role(
    session_factory: sessionmaker,
    *,
    user_id: str,
    role: str,
) -> None:
    async with session_factory() as session:
        result = await session.execute(select(User).where(User.id == UUID(user_id)))
        user = result.scalar_one()
        user.role = role
        await session.commit()


async def _create_user_directly(
    session_factory: sessionmaker,
    *,
    email: str,
    name: str,
    password_hash: str,
    role: str = "owner",
) -> User:
    async with session_factory() as session:
        user = User(
            email=email,
            name=name,
            password_hash=password_hash,
            role=role,
            status="active",
            email_verified=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


async def _add_team_member(
    session_factory: sessionmaker,
    *,
    team_id: str,
    user_id: str,
    role: str = "owner",
) -> None:
    async with session_factory() as session:
        session.add(
            TeamMember(
                team_id=UUID(team_id),
                user_id=UUID(user_id),
                role=role,
            )
        )
        await session.commit()


def _signup(client: TestClient, email: str = "user@example.com", password: str = "Password123!") -> dict:
    response = client.post(
        "/v1/management/signup",
        json={"email": email, "password": password, "name": "Kore User"},
    )
    assert response.status_code == 201
    return response.json()


def _login_with_mfa_if_needed(
    client: TestClient,
    email: str = "user@example.com",
    password: str = "Password123!",
) -> dict:
    response = client.post(
        "/v1/management/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    payload = response.json()
    if payload.get("mfa_required"):
        verify_response = client.post(
            "/v1/management/mfa/verify",
            json={
                "challenge_token": payload["challenge_token"],
                "code": payload["debug_code"],
            },
        )
        assert verify_response.status_code == 200
        return verify_response.json()
    return payload


def test_regular_user_session_lifecycle_supports_me_and_logout(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        signup_data = _signup(client)
        assert signup_data["user"]["role"] == "owner"

        me_response = client.get("/v1/management/me")
        assert me_response.status_code == 200
        assert me_response.json()["user"]["email"] == "user@example.com"

        logout_response = client.post("/v1/management/logout")
        assert logout_response.status_code == 200
        assert logout_response.json()["status"] == "logged_out"

        after_logout_response = client.get("/v1/management/me")
        assert after_logout_response.status_code == 401
    finally:
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_authenticated_user_can_update_profile_details(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        _signup(client)

        response = client.patch(
            "/v1/management/me",
            json={
                "name": "Isaac Nsisong",
                "company": "KoreShield",
                "job_title": "Co-founder & CTO",
            },
        )
        assert response.status_code == 200
        payload = response.json()["user"]

        assert payload["name"] == "Isaac Nsisong"
        assert payload["company"] == "KoreShield"
        assert payload["job_title"] == "Co-founder & CTO"
    finally:
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_login_promotes_legacy_user_when_workspace_has_no_privileged_users(tmp_path: Path):
    client, session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        signup_data = _signup(client)
        user_id = signup_data["user"]["id"]

        asyncio.run(_update_user_role(session_factory, user_id=user_id, role="user"))
        client.post("/v1/management/logout")

        login_response = client.post(
            "/v1/management/login",
            json={"email": "user@example.com", "password": "Password123!"},
        )
        assert login_response.status_code == 200
        login_payload = login_response.json()
        assert login_payload["user"]["role"] == "owner"
        assert login_payload["mfa_required"] is True
        assert login_payload["challenge_token"]
        assert login_payload["debug_code"]

        verify_response = client.post(
            "/v1/management/mfa/verify",
            json={
                "challenge_token": login_payload["challenge_token"],
                "code": login_payload["debug_code"],
            },
        )
        assert verify_response.status_code == 200
        assert verify_response.json()["user"]["role"] == "owner"

        me_response = client.get("/v1/management/me")
        assert me_response.status_code == 200
        assert me_response.json()["user"]["role"] == "owner"
    finally:
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
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
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
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
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_billing_account_reuses_existing_team_scope_for_second_owner(tmp_path: Path):
    client, session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        signup_data = _signup(client)
        first_user_id = signup_data["user"]["id"]
        team = asyncio.run(
            _create_team_membership(
                session_factory,
                user_id=first_user_id,
            )
        )

        first_response = client.get("/v1/billing/account")
        assert first_response.status_code == 200
        first_payload = first_response.json()

        second_user = asyncio.run(
            _create_user_directly(
                session_factory,
                email="second-owner@example.com",
                name="Second Owner",
                password_hash=management._hash_password("Password123!"),
                role="owner",
            )
        )
        asyncio.run(
            _add_team_member(
                session_factory,
                team_id=str(team.id),
                user_id=str(second_user.id),
                role="owner",
            )
        )

        client.post("/v1/management/logout")
        _login_with_mfa_if_needed(
            client,
            email="second-owner@example.com",
            password="Password123!",
        )

        second_response = client.get("/v1/billing/account")
        assert second_response.status_code == 200
        second_payload = second_response.json()

        assert second_payload["id"] == first_payload["id"]
        assert second_payload["team_id"] == str(team.id)
        assert second_payload["external_customer_id"] == f"team:{team.id}"
    finally:
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_internal_team_emails_receive_unlimited_enterprise_billing_state(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        os.environ["BILLING_INTERNAL_UNLIMITED_EMAILS"] = "internal-owner@example.com"
        signup_data = _signup(client, email="internal-owner@example.com")
        user_id = signup_data["user"]["id"]

        response = client.get("/v1/billing/account")
        assert response.status_code == 200
        payload = response.json()

        assert payload["owner_user_id"] == user_id
        assert payload["plan_slug"] == "enterprise"
        assert payload["plan_name"] == "Enterprise"
        assert payload["status"] == "active"
        assert payload["subscription_status"] == "active"
        assert payload["currency"] == "GBP"
        assert payload["metadata"]["internal_unlimited"] is True
        assert payload["metadata"]["protected_requests"] == "unlimited"
        assert payload["metadata"]["team_access"] == "unlimited"

        checkout_response = client.post(
            "/v1/billing/checkout",
            json={"product_id": "prod_test_123"},
        )
        assert checkout_response.status_code == 400
        assert "unlimited enterprise access" in checkout_response.json()["detail"]

        portal_response = client.post(
            "/v1/billing/portal",
            json={"return_url": "https://koreshield.com/billing"},
        )
        assert portal_response.status_code == 400
        assert "unlimited enterprise access" in portal_response.json()["detail"]
    finally:
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
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
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
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
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_billing_checkout_normalizes_payload_for_polar(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        _signup(client, email="billing@koreshield.ai")

        with patch.dict(
            os.environ,
            {
                "POLAR_ACCESS_TOKEN": "polar_test_token",
                "POLAR_WEBHOOK_SECRET": "polar_test_secret",
                "POLAR_SERVER": "sandbox",
                "POLAR_DEFAULT_CURRENCY": "GBP",
            },
            clear=False,
        ):
            with patch("koreshield.api.billing.PolarClient") as client_mock, patch(
                "koreshield.api.billing.get_polar_config"
            ) as config_mock:
                checkout_mock = AsyncMock(
                    return_value={"url": "https://sandbox-checkout.polar.sh/session/test"}
                )
                client_mock.return_value.create_checkout = checkout_mock
                config_mock.return_value = billing.get_polar_config()

                response = client.post(
                    "/v1/billing/checkout",
                    json={
                        "product_id": "prod_test_123",
                        "success_url": "https://koreshield.com/billing?checkout=success",
                    },
                )

                assert response.status_code == 200
                assert response.json()["url"] == "https://sandbox-checkout.polar.sh/session/test"

                sent_payload = checkout_mock.await_args.args[0]
                assert sent_payload["product_id"] == "prod_test_123"
                assert sent_payload["currency"] == "gbp"
                assert sent_payload["customer_email"] == "billing@koreshield.ai"
                assert "products" not in sent_payload
                assert sent_payload["metadata"]["scope"] == "user"
                assert sent_payload["metadata"]["owner_email"] == "billing@koreshield.ai"
                assert "team_id" not in sent_payload["metadata"]
                assert "team_slug" not in sent_payload["metadata"]
    finally:
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_billing_checkout_retries_without_currency_when_product_currency_mismatches(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        _signup(client, email="billing@koreshield.ai")

        with patch.dict(
            os.environ,
            {
                "POLAR_ACCESS_TOKEN": "polar_test_token",
                "POLAR_WEBHOOK_SECRET": "polar_test_secret",
                "POLAR_SERVER": "sandbox",
                "POLAR_DEFAULT_CURRENCY": "GBP",
            },
            clear=False,
        ):
            with patch("koreshield.api.billing.PolarClient") as client_mock, patch(
                "koreshield.api.billing.get_polar_config"
            ) as config_mock:
                request = httpx.Request("POST", "https://sandbox-api.polar.sh/v1/checkouts/")
                response = httpx.Response(
                    422,
                    request=request,
                    json={
                        "detail": [
                            {
                                "loc": ["body", "product_id"],
                                "msg": "Product is not available in the specified currency.",
                            }
                        ]
                    },
                )
                checkout_mock = AsyncMock(
                    side_effect=[
                        httpx.HTTPStatusError("currency mismatch", request=request, response=response),
                        {"url": "https://sandbox-checkout.polar.sh/session/test"},
                    ]
                )
                client_mock.return_value.create_checkout = checkout_mock
                config_mock.return_value = billing.get_polar_config()

                response = client.post(
                    "/v1/billing/checkout",
                    json={
                        "product_id": "prod_test_123",
                        "success_url": "https://koreshield.com/billing?checkout=success",
                    },
                )

                assert response.status_code == 200
                assert response.json()["url"] == "https://sandbox-checkout.polar.sh/session/test"

                first_payload = checkout_mock.await_args_list[0].args[0]
                second_payload = checkout_mock.await_args_list[1].args[0]
                assert first_payload["currency"] == "gbp"
                assert "currency" not in second_payload
                assert second_payload["product_id"] == "prod_test_123"
    finally:
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
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
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_team_invites_and_shared_dashboards_flow(tmp_path: Path):
    client, _session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        _signup(client)

        create_team_response = client.post(
            "/v1/teams",
            json={"name": "Security Ops", "slug": "security-ops"},
        )
        assert create_team_response.status_code == 200
        team_id = create_team_response.json()["id"]

        invite_response = client.post(
            f"/v1/teams/{team_id}/invites",
            json={"email": "analyst@koreshield.com", "role": "viewer"},
        )
        assert invite_response.status_code == 201
        invite_id = invite_response.json()["id"]

        duplicate_invite_response = client.post(
            f"/v1/teams/{team_id}/invites",
            json={"email": "analyst@koreshield.com", "role": "viewer"},
        )
        assert duplicate_invite_response.status_code == 400

        list_invites_response = client.get(f"/v1/teams/{team_id}/invites")
        assert list_invites_response.status_code == 200
        assert len(list_invites_response.json()) == 1

        dashboard_response = client.post(
            f"/v1/teams/{team_id}/dashboards",
            json={
                "name": "Threat Review",
                "dashboard_type": "security",
                "config": {"widgets": ["threats", "providers"]},
            },
        )
        assert dashboard_response.status_code == 201
        dashboard_id = dashboard_response.json()["id"]

        duplicate_dashboard_response = client.post(
            f"/v1/teams/{team_id}/dashboards",
            json={
                "name": "Threat Review",
                "dashboard_type": "security",
                "config": {"widgets": []},
            },
        )
        assert duplicate_dashboard_response.status_code == 400

        list_dashboards_response = client.get(f"/v1/teams/{team_id}/dashboards")
        assert list_dashboards_response.status_code == 200
        assert len(list_dashboards_response.json()) == 1

        delete_dashboard_response = client.delete(f"/v1/teams/{team_id}/dashboards/{dashboard_id}")
        assert delete_dashboard_response.status_code == 204

        cancel_invite_response = client.delete(f"/v1/teams/{team_id}/invites/{invite_id}")
        assert cancel_invite_response.status_code == 204
    finally:
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))


def test_reports_update_delete_and_download_flow(tmp_path: Path):
    client, session_factory, engine, original_senders, env_patcher = _build_test_client(tmp_path)
    try:
        _signup(client)
        client.post("/v1/management/logout")
        _login_with_mfa_if_needed(client)

        create_response = client.post(
            "/v1/reports",
            json={
                "name": "Monthly Security Summary",
                "description": "Initial description",
                "template": "Security Overview",
                "schedule": "manual",
                "format": "pdf",
                "filters": {"date_range": "30d", "providers": [], "tenants": [], "metrics": []},
            },
        )
        assert create_response.status_code == 200
        report_id = create_response.json()["id"]

        update_response = client.put(
            f"/v1/reports/{report_id}",
            json={"name": "Updated Security Summary", "format": "json"},
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Security Summary"
        assert update_response.json()["format"] == "json"

        generate_response = client.post(f"/v1/reports/{report_id}/generate")
        assert generate_response.status_code == 200

        report_list_response = client.get("/v1/reports")
        assert report_list_response.status_code == 200
        assert any(report["id"] == report_id for report in report_list_response.json())

        async def _mark_report_complete():
            async with session_factory() as session:
                result = await session.execute(select(Report).where(Report.id == UUID(report_id)))
                report = result.scalar_one()
                report.status = "completed"
                report.format = "pdf"
                report.last_run_at = datetime.utcnow()
                await session.commit()

        asyncio.run(_mark_report_complete())

        download_response = client.get(f"/v1/reports/{report_id}/download")
        assert download_response.status_code == 200
        assert download_response.headers["content-type"].startswith("application/pdf")

        delete_response = client.delete(f"/v1/reports/{report_id}")
        assert delete_response.status_code == 204
    finally:
        management.send_welcome_email, management.send_verification_email, management.send_admin_mfa_email = original_senders
        client.close()
        env_patcher.stop()
        asyncio.run(_dispose_engine(engine))
def test_rbac_delete_custom_role_guardrails():
    rbac._initialize_defaults()
    custom_role_id = "999"
    rbac._roles_store[custom_role_id] = rbac.Role(
        id=custom_role_id,
        name="Custom Role",
        description="Custom permissions",
        permissions=["view:dashboard"],
        user_count=0,
    )

    admin_user = {"id": "1", "role": "admin"}
    response = asyncio.run(rbac.delete_role(custom_role_id, current_user=admin_user))
    assert response is None
    assert custom_role_id not in rbac._roles_store
