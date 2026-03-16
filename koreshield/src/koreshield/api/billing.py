import json
import os
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import httpx
import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.billing import BillingAccount, BillingWebhookEvent
from ..models.team import Team, TeamMember
from ..models.user import User
from ..services.polar import PolarClient, PolarConfigurationError, get_polar_config
from .auth import get_current_user

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/billing", tags=["Billing"])

STATE_REFRESH_EVENTS = {
    "customer.state_changed",
    "subscription.created",
    "subscription.updated",
    "subscription.active",
    "subscription.canceled",
    "subscription.uncanceled",
    "subscription.revoked",
    "subscription.past_due",
    "order.created",
    "order.paid",
    "order.refunded",
}


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class CheckoutRequest(BaseModel):
    product_id: str
    success_url: str | None = None


class PortalRequest(BaseModel):
    return_url: str | None = None


class BillingAccountResponse(BaseModel):
    id: str
    owner_user_id: str
    team_id: str | None
    provider: str
    status: str
    plan_slug: str
    plan_name: str | None
    subscription_status: str | None
    subscription_id: str | None
    product_id: str | None
    currency: str | None
    cancel_at_period_end: bool
    current_period_end: str | None
    billing_email: str | None
    external_customer_id: str
    polar_customer_id: str | None
    metadata: dict[str, Any]
    polar_customer_state: dict[str, Any]
    model_config = ConfigDict(from_attributes=True)


def serialize_account(account: BillingAccount) -> BillingAccountResponse:
    return BillingAccountResponse(
        id=str(account.id),
        owner_user_id=str(account.owner_user_id),
        team_id=str(account.team_id) if account.team_id else None,
        provider=account.provider,
        status=account.status,
        plan_slug=account.plan_slug,
        plan_name=account.plan_name,
        subscription_status=account.subscription_status,
        subscription_id=account.subscription_id,
        product_id=account.product_id,
        currency=account.currency,
        cancel_at_period_end=account.cancel_at_period_end,
        current_period_end=account.current_period_end.isoformat() if account.current_period_end else None,
        billing_email=account.billing_email,
        external_customer_id=account.external_customer_id,
        polar_customer_id=account.polar_customer_id,
        metadata=account.billing_metadata or {},
        polar_customer_state=account.polar_customer_state or {},
    )


async def get_user_record(db: AsyncSession, current_user: dict) -> User:
    result = await db.execute(select(User).where(User.id == UUID(current_user["id"])))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def get_default_billing_team(db: AsyncSession, user_id: UUID) -> Team | None:
    query = (
        select(Team)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .where(TeamMember.user_id == user_id)
        .where(TeamMember.role.in_(["owner", "admin"]))
        .order_by(Team.created_at.asc())
    )
    result = await db.execute(query)
    return result.scalars().first()


async def get_or_create_billing_account(
    db: AsyncSession,
    current_user: dict,
) -> BillingAccount:
    user = await get_user_record(db, current_user)
    user_id = UUID(current_user["id"])
    default_team = await get_default_billing_team(db, user_id)

    query = select(BillingAccount).where(BillingAccount.owner_user_id == user_id)
    if default_team:
        query = query.where(BillingAccount.team_id == default_team.id)
    else:
        query = query.where(BillingAccount.team_id.is_(None))

    result = await db.execute(query)
    account = result.scalar_one_or_none()
    if account:
        return account

    external_customer_id = f"team:{default_team.id}" if default_team else f"user:{user_id}"
    account = BillingAccount(
        owner_user_id=user_id,
        team_id=default_team.id if default_team else None,
        billing_email=user.email,
        external_customer_id=external_customer_id,
        billing_metadata={
            "owner_email": user.email,
            "owner_name": user.name,
            "scope": "team" if default_team else "user",
            "team_slug": default_team.slug if default_team else None,
        },
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


def extract_plan_snapshot(customer_state: dict[str, Any]) -> dict[str, Any]:
    active_subscriptions = customer_state.get("active_subscriptions") or []
    first_subscription = active_subscriptions[0] if active_subscriptions else {}
    product = first_subscription.get("product") or {}
    if not product and customer_state.get("product"):
        product = customer_state.get("product") or {}

    status = "active" if active_subscriptions else "inactive"
    subscription_status = first_subscription.get("status") or status
    recurring_interval = (
        (first_subscription.get("price") or {}).get("recurring_interval")
        or (first_subscription.get("recurring_interval"))
    )

    return {
        "status": status,
        "plan_slug": product.get("slug") or ("free" if not active_subscriptions else "paid"),
        "plan_name": product.get("name"),
        "subscription_status": subscription_status,
        "subscription_id": first_subscription.get("id"),
        "product_id": product.get("id"),
        "currency": (first_subscription.get("price") or {}).get("price_currency"),
        "cancel_at_period_end": bool(first_subscription.get("cancel_at_period_end", False)),
        "current_period_end": first_subscription.get("current_period_end"),
        "metadata": {
            "recurring_interval": recurring_interval,
            "granted_benefits": customer_state.get("granted_benefits") or [],
            "active_meter_count": len(customer_state.get("active_meters") or []),
        },
    }


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized).replace(tzinfo=None)


async def sync_account_from_polar(account: BillingAccount, db: AsyncSession) -> BillingAccount:
    client = PolarClient()
    customer_state = await client.get_customer_state_by_external_id(account.external_customer_id)
    snapshot = extract_plan_snapshot(customer_state)

    account.polar_customer_state = customer_state
    account.polar_customer_id = customer_state.get("customer", {}).get("id") or account.polar_customer_id
    account.status = snapshot["status"]
    account.plan_slug = snapshot["plan_slug"]
    account.plan_name = snapshot["plan_name"]
    account.subscription_status = snapshot["subscription_status"]
    account.subscription_id = snapshot["subscription_id"]
    account.product_id = snapshot["product_id"]
    account.currency = snapshot["currency"]
    account.cancel_at_period_end = snapshot["cancel_at_period_end"]
    account.current_period_end = parse_datetime(snapshot["current_period_end"])
    account.billing_metadata = {
        **(account.billing_metadata or {}),
        **snapshot["metadata"],
    }
    account.updated_at = utcnow_naive()

    await db.commit()
    await db.refresh(account)
    return account


@router.get("/account", response_model=BillingAccountResponse)
async def get_billing_account(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await get_or_create_billing_account(db, current_user)
    try:
        account = await sync_account_from_polar(account, db)
    except PolarConfigurationError:
        logger.warning("polar_not_configured_for_account_fetch", user_id=current_user["id"])
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code != 404:
            logger.warning("polar_account_sync_failed", status_code=exc.response.status_code, body=exc.response.text)
    return serialize_account(account)


@router.post("/checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await get_or_create_billing_account(db, current_user)
    user = await get_user_record(db, current_user)

    try:
        client = PolarClient(get_polar_config())
    except PolarConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    payload = {
        "products": [request.product_id],
        "customer_email": account.billing_email or user.email,
        "customer_name": user.name or user.email,
        "external_customer_id": account.external_customer_id,
        "success_url": request.success_url,
        "metadata": {
            **(account.billing_metadata or {}),
            "owner_user_id": str(account.owner_user_id),
            "team_id": str(account.team_id) if account.team_id else None,
        },
    }
    default_currency = os.getenv("POLAR_DEFAULT_CURRENCY", "").strip().upper()
    if default_currency:
        payload["currency"] = default_currency

    try:
        checkout = await client.create_checkout(payload)
    except httpx.HTTPStatusError as exc:
        logger.error("polar_checkout_failed", status_code=exc.response.status_code, body=exc.response.text)
        raise HTTPException(status_code=502, detail="Unable to create Polar checkout session") from exc

    return {"url": checkout.get("url"), "checkout": checkout}


@router.post("/portal")
async def create_customer_portal_session(
    request: PortalRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await get_or_create_billing_account(db, current_user)
    if not account.polar_customer_id:
        try:
            account = await sync_account_from_polar(account, db)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                raise HTTPException(
                    status_code=400,
                    detail="No Polar customer exists for this account yet. Complete checkout first.",
                ) from exc
            if exc.response.status_code != 404:
                logger.error("polar_customer_lookup_failed", status_code=exc.response.status_code, body=exc.response.text)
                raise HTTPException(status_code=502, detail="Unable to load Polar customer state") from exc

    if not account.polar_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No Polar customer exists for this account yet. Complete checkout first.",
        )

    try:
        client = PolarClient(get_polar_config())
    except PolarConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    payload = {
        "customer_id": account.polar_customer_id,
        "return_url": request.return_url,
    }

    try:
        portal = await client.create_customer_session(payload)
    except httpx.HTTPStatusError as exc:
        logger.error("polar_customer_portal_failed", status_code=exc.response.status_code, body=exc.response.text)
        raise HTTPException(status_code=502, detail="Unable to create Polar customer portal session") from exc

    return {"url": portal.get("customer_portal_url") or portal.get("url"), "session": portal}


@router.post("/sync", response_model=BillingAccountResponse)
async def sync_billing_account(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await get_or_create_billing_account(db, current_user)
    try:
        account = await sync_account_from_polar(account, db)
    except PolarConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            return serialize_account(account)
        logger.error("polar_manual_sync_failed", status_code=exc.response.status_code, body=exc.response.text)
        raise HTTPException(status_code=502, detail="Unable to sync billing state from Polar") from exc

    return serialize_account(account)


@router.post("/webhooks/polar")
async def polar_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    raw_body = await request.body()

    try:
        config = get_polar_config()
    except PolarConfigurationError:
        config = None

    if config and not PolarClient.verify_webhook_signature(raw_body, dict(request.headers), config.webhook_secret):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Polar webhook signature")

    try:
        payload = PolarClient.load_webhook_payload(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc

    event_type = payload.get("type") or payload.get("event") or "unknown"
    event_id = payload.get("id") or payload.get("event_id")
    data = payload.get("data") or {}
    customer = data.get("customer") or payload.get("customer") or {}
    external_customer_id = (
        customer.get("external_id")
        or data.get("external_customer_id")
        or payload.get("external_customer_id")
    )

    existing_event = None
    if event_id:
        result = await db.execute(select(BillingWebhookEvent).where(BillingWebhookEvent.event_id == event_id))
        existing_event = result.scalar_one_or_none()
    if existing_event:
        return {"status": "ignored", "reason": "duplicate"}

    billing_account = None
    if external_customer_id:
        result = await db.execute(
            select(BillingAccount).where(BillingAccount.external_customer_id == external_customer_id)
        )
        billing_account = result.scalar_one_or_none()

    webhook_event = BillingWebhookEvent(
        billing_account_id=billing_account.id if billing_account else None,
        event_type=event_type,
        event_id=event_id,
        payload=payload,
        processed=False,
    )
    db.add(webhook_event)

    try:
        if billing_account and event_type == "customer.state_changed":
            billing_account.polar_customer_state = data
            if customer:
                billing_account.polar_customer_id = customer.get("id") or billing_account.polar_customer_id
            snapshot = extract_plan_snapshot(data)
            billing_account.status = snapshot["status"]
            billing_account.plan_slug = snapshot["plan_slug"]
            billing_account.plan_name = snapshot["plan_name"]
            billing_account.subscription_status = snapshot["subscription_status"]
            billing_account.subscription_id = snapshot["subscription_id"]
            billing_account.product_id = snapshot["product_id"]
            billing_account.currency = snapshot["currency"]
            billing_account.cancel_at_period_end = snapshot["cancel_at_period_end"]
            billing_account.current_period_end = parse_datetime(snapshot["current_period_end"])
            billing_account.billing_metadata = {
                **(billing_account.billing_metadata or {}),
                **snapshot["metadata"],
            }
        elif billing_account and event_type in STATE_REFRESH_EVENTS:
            await sync_account_from_polar(billing_account, db)
        elif billing_account and event_type.startswith("customer.") and customer:
            billing_account.polar_customer_id = customer.get("id") or billing_account.polar_customer_id

        webhook_event.processed = True
        webhook_event.processed_at = utcnow_naive()
        await db.commit()
    except Exception as exc:
        webhook_event.processing_error = str(exc)
        webhook_event.processed_at = utcnow_naive()
        await db.commit()
        logger.exception("polar_webhook_processing_failed", event_type=event_type, event_id=event_id)
        raise HTTPException(status_code=500, detail="Failed to process webhook") from exc

    return {"status": "ok"}
