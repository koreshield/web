"""
SQLAlchemy model for persisted alert rules.
"""
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
from ..utils import utcnow_naive


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=False)
    condition = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False)  # critical, high, medium, low
    enabled = Column(Boolean, nullable=False, default=True)
    channels = Column(JSON, nullable=False, default=list)  # List[str] of channel IDs
    cooldown_minutes = Column(Integer, nullable=False, default=30)
    last_triggered = Column(DateTime, nullable=True)
    trigger_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=utcnow_naive)
    updated_at = Column(DateTime, nullable=False, default=utcnow_naive, onupdate=utcnow_naive)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "condition": self.condition,
            "severity": self.severity,
            "enabled": self.enabled,
            "channels": self.channels or [],
            "cooldown_minutes": self.cooldown_minutes,
            "last_triggered": self.last_triggered.isoformat() if self.last_triggered else None,
            "trigger_count": self.trigger_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
