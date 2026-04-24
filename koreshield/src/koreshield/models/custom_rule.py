"""
SQLAlchemy model for persisted custom detection rules.

Custom rules are stored in the DB for durability and loaded into the in-memory
RuleEngine on startup.  The DB is the source of truth; RuleEngine is a
runtime cache used for fast detection during proxied requests.
"""
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
from ..utils import utcnow_naive


class CustomRuleRecord(Base):
    """Persisted representation of a custom detection rule."""
    __tablename__ = "custom_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=False)
    pattern = Column(Text, nullable=False)
    pattern_type = Column(String(50), nullable=False)   # regex, keyword, contains, startswith, endswith
    severity = Column(String(50), nullable=False)        # low, medium, high, critical
    action = Column(String(50), nullable=False)          # block, warn, log, allow
    enabled = Column(Boolean, nullable=False, default=True)
    priority = Column(Integer, nullable=False, default=5)
    tags = Column(JSON, nullable=False, default=list)           # List[str]
    conditions = Column(JSON, nullable=False, default=list)     # List[dict]
    rule_actions = Column(JSON, nullable=False, default=list)   # List[dict]
    created_at = Column(DateTime, nullable=False, default=utcnow_naive)
    updated_at = Column(DateTime, nullable=False, default=utcnow_naive, onupdate=utcnow_naive)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "pattern": self.pattern,
            "pattern_type": self.pattern_type,
            "severity": self.severity,
            "action": self.action,
            "enabled": self.enabled,
            "priority": self.priority,
            "tags": self.tags or [],
            "conditions": self.conditions or [],
            "actions": self.rule_actions or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
