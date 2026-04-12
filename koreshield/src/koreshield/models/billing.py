import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base
from ..utils import utcnow_naive


class BillingAccount(Base):
    """Local billing state mirrored from Polar for a user or team."""

    __tablename__ = "billing_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=True, unique=True)
    provider = Column(String(50), nullable=False, default="polar")
    external_customer_id = Column(String(255), nullable=False, unique=True, index=True)
    polar_customer_id = Column(String(255), unique=True)
    polar_customer_state = Column(JSON, default=dict)
    status = Column(String(50), nullable=False, default="inactive")
    plan_slug = Column(String(100), nullable=False, default="free")
    plan_name = Column(String(255))
    subscription_status = Column(String(100))
    subscription_id = Column(String(255))
    product_id = Column(String(255))
    currency = Column(String(10))
    cancel_at_period_end = Column(Boolean, nullable=False, default=False)
    current_period_end = Column(DateTime)
    billing_email = Column(String(255))
    billing_metadata = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, nullable=False, default=utcnow_naive)
    updated_at = Column(DateTime, nullable=False, default=utcnow_naive, onupdate=utcnow_naive)

    owner = relationship("User", backref="billing_accounts")
    team = relationship("Team", backref="billing_account", uselist=False)
    webhook_events = relationship("BillingWebhookEvent", back_populates="billing_account", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_billing_accounts_provider_status", "provider", "status"),
    )


class BillingWebhookEvent(Base):
    """Persist incoming webhook events for debugging and idempotency checks."""

    __tablename__ = "billing_webhook_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    billing_account_id = Column(UUID(as_uuid=True), ForeignKey("billing_accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    provider = Column(String(50), nullable=False, default="polar")
    event_type = Column(String(100), nullable=False, index=True)
    event_id = Column(String(255), unique=True, index=True)
    payload = Column(JSON, nullable=False)
    processed = Column(Boolean, nullable=False, default=False)
    processing_error = Column(Text)
    created_at = Column(DateTime, nullable=False, default=utcnow_naive)
    processed_at = Column(DateTime)

    billing_account = relationship("BillingAccount", back_populates="webhook_events")
