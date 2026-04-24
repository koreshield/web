"""
SQLAlchemy model for persisted alert notification channels.
"""
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
from ..utils import utcnow_naive


class AlertChannel(Base):
    __tablename__ = "alert_channels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(50), nullable=False)   # email, slack, webhook, teams, telegram, pagerduty
    name = Column(String(200), nullable=False)
    enabled = Column(Boolean, nullable=False, default=True)
    config = Column(JSON, nullable=False, default=dict)   # Channel-specific configuration
    created_at = Column(DateTime, nullable=False, default=utcnow_naive)
    updated_at = Column(DateTime, nullable=False, default=utcnow_naive, onupdate=utcnow_naive)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "type": self.type,
            "name": self.name,
            "enabled": self.enabled,
            "config": self.config or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
