"""
Tenant Isolation Framework for KoreShield
==========================================

Multi-tenant architecture with complete isolation between tenants including:
- Database isolation with separate schemas/tables per tenant
- Configuration isolation with tenant-specific settings
- Resource quotas and rate limiting per tenant
- Cross-tenant security measures
- Tenant-specific audit logging
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass, field
import uuid
import hashlib

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, field_validator

from .models.base import Base

class TenantStatus(Enum):
    """Tenant lifecycle status."""
    PROVISIONING = "provisioning"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"

class TenantTier(Enum):
    """Tenant subscription tiers."""
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

class ResourceType(Enum):
    """Types of resources that can be quota-limited."""
    REQUESTS_PER_MINUTE = "requests_per_minute"
    REQUESTS_PER_HOUR = "requests_per_hour"
    REQUESTS_PER_DAY = "requests_per_day"
    TOKENS_PER_MINUTE = "tokens_per_minute"
    TOKENS_PER_HOUR = "tokens_per_hour"
    STORAGE_BYTES = "storage_bytes"
    ACTIVE_SESSIONS = "active_sessions"

# Database Models

class Tenant(Base):
    """Core tenant model with multi-tenant isolation."""
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(50), unique=True, nullable=False, index=True)  # Human-readable ID
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), nullable=False, default=TenantStatus.PROVISIONING.value)
    tier = Column(String(20), nullable=False, default=TenantTier.FREE.value)

    # Contact information
    contact_email = Column(String(255))
    contact_name = Column(String(255))

    # Subscription and billing
    subscription_id = Column(String(100))
    billing_email = Column(String(255))

    # Database isolation
    schema_name = Column(String(100), unique=True)  # PostgreSQL schema for this tenant
    database_name = Column(String(100))  # For multi-database setups

    # Security settings
    encryption_key_hash = Column(String(128))  # Hash of tenant's encryption key
    api_key_hash = Column(String(128))  # Hash of tenant's API key

    # Resource quotas
    max_requests_per_minute = Column(Integer, default=100)
    max_requests_per_hour = Column(Integer, default=1000)
    max_requests_per_day = Column(Integer, default=10000)
    max_tokens_per_minute = Column(Integer, default=10000)
    max_tokens_per_hour = Column(Integer, default=100000)
    max_storage_bytes = Column(Integer, default=1073741824)  # 1GB default
    max_active_sessions = Column(Integer, default=10)

    # Audit settings
    audit_retention_days = Column(Integer, default=90)
    compliance_requirements = Column(JSON)  # GDPR, SOC2, HIPAA, etc.

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    deactivated_at = Column(DateTime)

    # Relationships
    configurations = relationship("TenantConfiguration", back_populates="tenant", cascade="all, delete-orphan")
    audit_logs = relationship("TenantAuditLog", back_populates="tenant", cascade="all, delete-orphan")
    resource_usage = relationship("TenantResourceUsage", back_populates="tenant", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_tenant_status', 'status'),
        Index('idx_tenant_tier', 'tier'),
        Index('idx_tenant_created', 'created_at'),
    )

    def get_schema_name(self) -> str:
        """Get the database schema name for this tenant."""
        return f"tenant_{self.tenant_id}"

    def is_active(self) -> bool:
        """Check if tenant is active."""
        return self.status == TenantStatus.ACTIVE.value

    def can_make_request(self, resource_type: ResourceType, amount: int = 1) -> bool:
        """Check if tenant can consume the specified resource amount."""
        limits = {
            ResourceType.REQUESTS_PER_MINUTE: self.max_requests_per_minute,
            ResourceType.REQUESTS_PER_HOUR: self.max_requests_per_hour,
            ResourceType.REQUESTS_PER_DAY: self.max_requests_per_day,
            ResourceType.TOKENS_PER_MINUTE: self.max_tokens_per_minute,
            ResourceType.TOKENS_PER_HOUR: self.max_tokens_per_hour,
            ResourceType.STORAGE_BYTES: self.max_storage_bytes,
            ResourceType.ACTIVE_SESSIONS: self.max_active_sessions,
        }
        limit = limits.get(resource_type, 0)
        return amount <= limit

class TenantConfiguration(Base):
    """Tenant-specific configuration settings."""
    __tablename__ = "tenant_configurations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    config_key = Column(String(255), nullable=False)
    config_value = Column(JSON, nullable=False)
    config_type = Column(String(50), default="security")  # security, monitoring, providers, etc.
    is_encrypted = Column(Boolean, default=False)
    description = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))

    # Relationships
    tenant = relationship("Tenant", back_populates="configurations")

    __table_args__ = (
        Index('idx_tenant_config_key', 'tenant_id', 'config_key'),
        Index('idx_tenant_config_type', 'tenant_id', 'config_type'),
    )

class TenantResourceUsage(Base):
    """Track resource usage per tenant for quota enforcement."""
    __tablename__ = "tenant_resource_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    resource_type = Column(String(50), nullable=False)
    usage_count = Column(Integer, default=0)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tenant = relationship("Tenant", back_populates="resource_usage")

    __table_args__ = (
        Index('idx_resource_usage_tenant_period', 'tenant_id', 'resource_type', 'period_start', 'period_end'),
    )

class TenantAuditLog(Base):
    """Tenant-specific audit logging with isolation."""
    __tablename__ = "tenant_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    event_type = Column(String(100), nullable=False)
    event_category = Column(String(50), default="security")  # security, admin, api, system
    severity = Column(String(20), default="info")  # info, warning, error, critical

    # Event details
    message = Column(Text, nullable=False)
    details = Column(JSON)
    source_ip = Column(String(45))  # IPv4/IPv6
    user_agent = Column(Text)
    user_id = Column(String(100))
    session_id = Column(String(100))

    # Request context
    request_id = Column(String(100))
    endpoint = Column(String(500))
    method = Column(String(10))
    status_code = Column(Integer)

    # Compliance flags
    requires_retention = Column(Boolean, default=False)
    compliance_tags = Column(ARRAY(String), default=list)

    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tenant = relationship("Tenant", back_populates="audit_logs")

    __table_args__ = (
        Index('idx_audit_tenant_timestamp', 'tenant_id', 'timestamp'),
        Index('idx_audit_event_type', 'tenant_id', 'event_type'),
        Index('idx_audit_category', 'tenant_id', 'event_category'),
        Index('idx_audit_severity', 'tenant_id', 'severity'),
    )

class TenantAPIKey(Base):
    """Tenant API keys with scoped permissions."""
    __tablename__ = "tenant_api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    key_hash = Column(String(128), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)

    # Permissions and scopes
    permissions = Column(ARRAY(String), default=list)  # read, write, admin, etc.
    allowed_endpoints = Column(ARRAY(String), default=list)  # Specific endpoint restrictions
    rate_limit_override = Column(Integer)  # Custom rate limit for this key

    # Key lifecycle
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)
    last_used_at = Column(DateTime)
    created_by = Column(String(100))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_api_key_tenant', 'tenant_id'),
        Index('idx_api_key_hash', 'key_hash'),
    )

# Pydantic Models for API

class TenantCreate(BaseModel):
    """Request model for creating a tenant."""
    tenant_id: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-z0-9_-]+$')
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_name: Optional[str] = None
    tier: TenantTier = TenantTier.FREE

    @field_validator('tenant_id')
    @classmethod
    def validate_tenant_id(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('tenant_id must contain only alphanumeric characters, underscores, and hyphens')
        return v

class TenantUpdate(BaseModel):
    """Request model for updating a tenant."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[TenantStatus] = None
    tier: Optional[TenantTier] = None
    contact_email: Optional[str] = None
    contact_name: Optional[str] = None
    max_requests_per_minute: Optional[int] = Field(None, gt=0)
    max_requests_per_hour: Optional[int] = Field(None, gt=0)
    max_requests_per_day: Optional[int] = Field(None, gt=0)
    audit_retention_days: Optional[int] = Field(None, gt=0, le=2555)  # Max 7 years

class TenantConfigurationUpdate(BaseModel):
    """Request model for updating tenant configuration."""
    config_key: str = Field(..., min_length=1, max_length=255)
    config_value: Any
    config_type: str = "security"
    description: Optional[str] = None

class TenantAPIKeyCreate(BaseModel):
    """Request model for creating a tenant API key."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    allowed_endpoints: List[str] = Field(default_factory=list)
    rate_limit_override: Optional[int] = Field(None, gt=0)
    expires_at: Optional[datetime] = None

@dataclass
class TenantContext:
    """Runtime context for the current tenant request."""
    tenant_id: str
    tenant_uuid: uuid.UUID
    schema_name: str
    tier: TenantTier
    is_active: bool
    config_cache: Dict[str, Any] = field(default_factory=dict)
    resource_limits: Dict[ResourceType, int] = field(default_factory=dict)

    def get_config(self, key: str, default: Any = None) -> Any:
        """Get tenant-specific configuration value."""
        return self.config_cache.get(key, default)

    def can_consume_resource(self, resource_type: ResourceType, amount: int = 1) -> bool:
        """Check if tenant can consume the specified resource."""
        limit = self.resource_limits.get(resource_type, 0)
        return amount <= limit

# Utility functions

def generate_tenant_schema_name(tenant_id: str) -> str:
    """Generate a safe schema name for a tenant."""
    # Ensure it's safe for PostgreSQL schema names
    safe_id = "".join(c for c in tenant_id if c.isalnum() or c in ('_', '-')).lower()
    return f"tenant_{safe_id}"

def hash_api_key(api_key: str) -> str:
    """Hash an API key for storage."""
    return hashlib.sha256(api_key.encode()).hexdigest()

def generate_api_key() -> str:
    """Generate a secure API key."""
    return f"ks_{uuid.uuid4().hex}_{uuid.uuid4().hex[:8]}"

def create_tenant_schema(tenant_id: str) -> str:
    """Create the SQL for tenant schema creation."""
    schema_name = generate_tenant_schema_name(tenant_id)
    return f"CREATE SCHEMA IF NOT EXISTS {schema_name};"
