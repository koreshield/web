import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base


def utcnow_naive() -> datetime:
    """UTC now as naive datetime for existing DB schema compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

class RequestLog(Base):
    """
    Database model for logging API requests for analytics and reporting.
    """
    __tablename__ = 'request_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(String(255), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=utcnow_naive, index=True, nullable=False)
    
    # Request details
    provider = Column(String(50), nullable=False, index=True)
    model = Column(String(100), nullable=False)
    method = Column(String(10), nullable=False)
    path = Column(String(255), nullable=False)
    status_code = Column(Integer, nullable=False)
    latency_ms = Column(Float, nullable=False)
    
    # Cost & Usage
    tokens_prompt = Column(Integer, default=0)
    tokens_completion = Column(Integer, default=0)
    tokens_total = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    
    # Security context
    is_blocked = Column(Boolean, default=False, index=True)
    block_reason = Column(String(255))
    attack_detected = Column(Boolean, default=False, index=True)
    attack_type = Column(String(50))
    attack_details = Column(JSON, default={})
    
    # Client Metadata
    ip_address = Column(String(50))
    user_agent = Column(String(255))
    
    # Associations
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True, index=True)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey('api_keys.id'), nullable=True, index=True)
    
    # Relationships
    user = relationship("User")
    api_key = relationship("APIKey")

    def to_dict(self):
        return {
            "id": str(self.id),
            "request_id": self.request_id,
            "timestamp": self.timestamp.isoformat(),
            "provider": self.provider,
            "model": self.model,
            "status_code": self.status_code,
            "latency_ms": self.latency_ms,
            "cost": self.cost,
            "tokens_total": self.tokens_total,
            "is_blocked": self.is_blocked,
            "attack_detected": self.attack_detected,
        }
