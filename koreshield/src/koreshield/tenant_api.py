"""
Tenant Management API
====================

REST API endpoints for tenant administration including:
- Tenant CRUD operations
- API key management
- Configuration management
- Resource quota management
- Audit log access
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from .tenant_models import (
    Tenant, TenantCreate, TenantUpdate, TenantConfigurationUpdate,
    TenantAPIKeyCreate, TenantStatus, TenantTier, generate_api_key, hash_api_key
)
from .tenant_utils import get_current_tenant, require_tenant, require_active_tenant
from .tenant_database import get_tenant_db_session, get_tenant_config_manager
from .tenant_quotas import get_resource_quota_manager
from .tenant_security import get_tenant_audit_logger
from .logger import FirewallLogger

router = APIRouter(prefix="/api/v1/tenants", tags=["tenants"])
logger = FirewallLogger()

# Request/Response Models

class TenantResponse(BaseModel):
    """Tenant response model."""
    id: str
    tenant_id: str
    name: str
    description: Optional[str]
    status: str
    tier: str
    contact_email: Optional[str]
    contact_name: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class TenantDetailResponse(TenantResponse):
    """Detailed tenant response with additional info."""
    max_requests_per_minute: int
    max_requests_per_hour: int
    max_requests_per_day: int
    max_tokens_per_minute: int
    max_tokens_per_hour: int
    max_storage_bytes: int
    max_active_sessions: int
    audit_retention_days: int

class APIKeyResponse(BaseModel):
    """API key response model."""
    id: str
    name: str
    permissions: List[str]
    allowed_endpoints: List[str]
    rate_limit_override: Optional[int]
    is_active: bool
    created_at: str
    last_used_at: Optional[str]

class ConfigurationResponse(BaseModel):
    """Configuration response model."""
    key: str
    value: Any
    type: str
    description: Optional[str]
    encrypted: bool
    updated_at: str

class UsageStatsResponse(BaseModel):
    """Usage statistics response model."""
    resource_type: str
    current_usage: int
    limit: int
    remaining: int
    utilization_percent: float

# Routes

@router.post("", response_model=TenantResponse)
async def create_tenant(
    tenant_data: TenantCreate,
    session: AsyncSession = Depends(get_tenant_db_session)
):
    """Create a new tenant."""
    try:
        # Check if tenant_id already exists
        existing = await session.execute(
            session.query(Tenant).filter(Tenant.tenant_id == tenant_data.tenant_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Tenant ID already exists")

        # Create tenant
        tenant = Tenant(
            tenant_id=tenant_data.tenant_id,
            name=tenant_data.name,
            description=tenant_data.description,
            contact_email=tenant_data.contact_email,
            contact_name=tenant_data.contact_name,
            tier=tenant_data.tier.value
        )

        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)

        # Create tenant schema
        from .tenant_database import get_tenant_db_manager
        db_manager = get_tenant_db_manager()
        await db_manager.create_tenant_schema(tenant.tenant_id)

        # Log creation
        await get_tenant_audit_logger().log_admin_action(
            tenant_context=None,  # System action
            action="create",
            resource_type="tenant",
            resource_id=str(tenant.id),
            details={"tenant_id": tenant.tenant_id, "name": tenant.name}
        )

        logger.info("tenant_created", tenant_id=tenant.tenant_id, id=str(tenant.id))

        return TenantResponse.from_orm(tenant)

    except Exception as e:
        logger.error("tenant_creation_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create tenant")

@router.get("", response_model=List[TenantResponse])
async def list_tenants(
    status: Optional[TenantStatus] = None,
    tier: Optional[TenantTier] = None,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_tenant_db_session)
):
    """List tenants with optional filtering."""
    try:
        query = session.query(Tenant)

        if status:
            query = query.filter(Tenant.status == status.value)
        if tier:
            query = query.filter(Tenant.tier == tier.value)

        query = query.order_by(Tenant.created_at.desc())
        query = query.limit(limit).offset(offset)

        result = await session.execute(query)
        tenants = result.scalars().all()

        return [TenantResponse.from_orm(tenant) for tenant in tenants]

    except Exception as e:
        logger.error("tenant_list_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list tenants")

@router.get("/{tenant_id}", response_model=TenantDetailResponse)
async def get_tenant(
    tenant_id: str,
    session: AsyncSession = Depends(get_tenant_db_session)
):
    """Get detailed information about a specific tenant."""
    try:
        result = await session.execute(
            session.query(Tenant).filter(Tenant.tenant_id == tenant_id)
        )
        tenant = result.scalar_one_or_none()

        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        return TenantDetailResponse.from_orm(tenant)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("tenant_get_failed", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get tenant")

@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    tenant_data: TenantUpdate,
    session: AsyncSession = Depends(get_tenant_db_session)
):
    """Update tenant information."""
    try:
        result = await session.execute(
            session.query(Tenant).filter(Tenant.tenant_id == tenant_id)
        )
        tenant = result.scalar_one_or_none()

        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        # Update fields
        update_data = tenant_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(tenant, field):
                setattr(tenant, field, value)

        tenant.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(tenant)

        # Log update
        await get_tenant_audit_logger().log_admin_action(
            tenant_context=None,  # System action
            action="update",
            resource_type="tenant",
            resource_id=str(tenant.id),
            details={"tenant_id": tenant.tenant_id, "updated_fields": list(update_data.keys())}
        )

        logger.info("tenant_updated", tenant_id=tenant_id, updated_fields=list(update_data.keys()))

        return TenantResponse.from_orm(tenant)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("tenant_update_failed", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update tenant")

@router.delete("/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    session: AsyncSession = Depends(get_tenant_db_session)
):
    """Delete a tenant (soft delete by setting status to deactivated)."""
    try:
        result = await session.execute(
            session.query(Tenant).filter(Tenant.tenant_id == tenant_id)
        )
        tenant = result.scalar_one_or_none()

        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        # Soft delete
        tenant.status = TenantStatus.DEACTIVATED.value
        tenant.deactivated_at = datetime.utcnow()
        tenant.updated_at = datetime.utcnow()

        await session.commit()

        # Clean up resources
        from .tenant_database import get_tenant_db_manager
        db_manager = get_tenant_db_manager()
        await db_manager.cleanup_tenant_connections(tenant_id)

        # Log deletion
        await get_tenant_audit_logger().log_admin_action(
            tenant_context=None,  # System action
            action="delete",
            resource_type="tenant",
            resource_id=str(tenant.id),
            details={"tenant_id": tenant.tenant_id}
        )

        logger.info("tenant_deactivated", tenant_id=tenant_id)

        return {"message": "Tenant deactivated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("tenant_deletion_failed", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete tenant")

# API Key Management

@router.post("/{tenant_id}/api-keys", response_model=Dict[str, str])
async def create_api_key(
    tenant_id: str,
    key_data: TenantAPIKeyCreate,
    session: AsyncSession = Depends(get_tenant_db_session)
):
    """Create a new API key for a tenant."""
    try:
        # Get tenant
        result = await session.execute(
            session.query(Tenant).filter(Tenant.tenant_id == tenant_id)
        )
        tenant = result.scalar_one_or_none()

        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        # Generate API key
        api_key = generate_api_key()
        key_hash = hash_api_key(api_key)

        # Create API key record
        from .tenant_models import TenantAPIKey
        api_key_record = TenantAPIKey(
            tenant_id=tenant.id,
            key_hash=key_hash,
            name=key_data.name,
            description=key_data.description,
            permissions=key_data.permissions,
            allowed_endpoints=key_data.allowed_endpoints,
            rate_limit_override=key_data.rate_limit_override,
            expires_at=key_data.expires_at
        )

        session.add(api_key_record)
        await session.commit()

        # Log creation
        await get_tenant_audit_logger().log_admin_action(
            tenant_context=None,  # System action
            action="create",
            resource_type="api_key",
            resource_id=str(api_key_record.id),
            details={"tenant_id": tenant_id, "key_name": key_data.name}
        )

        logger.info("api_key_created", tenant_id=tenant_id, key_name=key_data.name)

        return {
            "api_key": api_key,
            "key_id": str(api_key_record.id),
            "message": "API key created successfully. Store the key securely - it will not be shown again."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("api_key_creation_failed", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create API key")

@router.get("/{tenant_id}/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys(
    tenant_id: str,
    session: AsyncSession = Depends(get_tenant_db_session)
):
    """List API keys for a tenant."""
    try:
        # Get tenant
        result = await session.execute(
            session.query(Tenant).filter(Tenant.tenant_id == tenant_id)
        )
        tenant = result.scalar_one_or_none()

        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        # Get API keys
        from .tenant_models import TenantAPIKey
        result = await session.execute(
            session.query(TenantAPIKey).filter(TenantAPIKey.tenant_id == tenant.id)
        )
        api_keys = result.scalars().all()

        return [APIKeyResponse.from_orm(key) for key in api_keys]

    except HTTPException:
        raise
    except Exception as e:
        logger.error("api_key_list_failed", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list API keys")

# Configuration Management

@router.get("/{tenant_id}/config", response_model=Dict[str, List[ConfigurationResponse]])
async def get_tenant_config(
    tenant_id: str,
    config_type: Optional[str] = None
):
    """Get tenant configuration."""
    try:
        # Get tenant context (this would be set by middleware)
        # For now, create a mock context
        from .tenant_models import TenantContext, TenantTier
        tenant_context = TenantContext(
            tenant_id=tenant_id,
            tenant_uuid=UUID('12345678-1234-5678-9012-123456789012'),  # Mock UUID
            schema_name=f"tenant_{tenant_id}",
            tier=TenantTier.STARTER,
            is_active=True
        )

        config_manager = get_tenant_config_manager()
        configs = await config_manager.get_all_tenant_configs(tenant_context, config_type)

        # Convert to response format
        response = {}
        for key, config_data in configs.items():
            config_type_key = config_data.get("type", "unknown")
            if config_type_key not in response:
                response[config_type_key] = []

            response[config_type_key].append(ConfigurationResponse(
                key=key,
                value=config_data.get("value"),
                type=config_data.get("type", "unknown"),
                description=config_data.get("description"),
                encrypted=config_data.get("encrypted", False),
                updated_at=config_data.get("updated_at", "")
            ))

        return response

    except Exception as e:
        logger.error("config_get_failed", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get configuration")

@router.put("/{tenant_id}/config")
async def update_tenant_config(
    tenant_id: str,
    config_data: TenantConfigurationUpdate
):
    """Update tenant configuration."""
    try:
        # Get tenant context
        from .tenant_models import TenantContext, TenantTier
        tenant_context = TenantContext(
            tenant_id=tenant_id,
            tenant_uuid=UUID('12345678-1234-5678-9012-123456789012'),  # Mock UUID
            schema_name=f"tenant_{tenant_id}",
            tier=TenantTier.STARTER,
            is_active=True
        )

        config_manager = get_tenant_config_manager()
        success = await config_manager.set_tenant_config(
            tenant_context,
            config_data.config_key,
            config_data.config_value,
            config_data.config_type,
            config_data.description
        )

        if not success:
            raise HTTPException(status_code=500, detail="Failed to update configuration")

        # Log update
        await get_tenant_audit_logger().log_admin_action(
            tenant_context=None,  # System action
            action="update",
            resource_type="configuration",
            details={"tenant_id": tenant_id, "key": config_data.config_key}
        )

        return {"message": "Configuration updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("config_update_failed", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update configuration")

# Usage Statistics

@router.get("/{tenant_id}/usage", response_model=Dict[str, UsageStatsResponse])
async def get_tenant_usage(
    tenant_id: str,
    time_window: str = Query("per_hour", regex="^(per_minute|per_hour|per_day)$")
):
    """Get tenant resource usage statistics."""
    try:
        # Get tenant context
        from .tenant_models import TenantContext, TenantTier
        tenant_context = TenantContext(
            tenant_id=tenant_id,
            tenant_uuid=UUID('12345678-1234-5678-9012-123456789012'),  # Mock UUID
            schema_name=f"tenant_{tenant_id}",
            tier=TenantTier.STARTER,
            is_active=True,
            resource_limits={
                "requests_per_minute": 100,
                "requests_per_hour": 1000,
                "requests_per_day": 10000,
                "tokens_per_minute": 10000,
                "tokens_per_hour": 100000,
                "storage_bytes": 1073741824,
                "active_sessions": 10
            }
        )

        quota_manager = get_resource_quota_manager()
        usage_stats = await quota_manager.get_usage_stats(tenant_context, time_window=time_window)

        # Convert to response format
        response = {}
        for resource_type, stats in usage_stats.items():
            response[resource_type] = UsageStatsResponse(
                resource_type=resource_type,
                current_usage=stats["current_usage"],
                limit=stats["limit"],
                remaining=stats["remaining"],
                utilization_percent=stats["utilization_percent"]
            )

        return response

    except Exception as e:
        logger.error("usage_get_failed", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get usage statistics")

# Audit Logs

@router.get("/{tenant_id}/audit")
async def get_tenant_audit_logs(
    tenant_id: str,
    event_type: Optional[str] = None,
    event_category: Optional[str] = None,
    severity: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0)
):
    """Get tenant audit logs."""
    try:
        # Get tenant context
        from .tenant_models import TenantContext, TenantTier
        tenant_context = TenantContext(
            tenant_id=tenant_id,
            tenant_uuid=UUID('12345678-1234-5678-9012-123456789012'),  # Mock UUID
            schema_name=f"tenant_{tenant_id}",
            tier=TenantTier.STARTER,
            is_active=True
        )

        audit_logger = get_tenant_audit_logger()
        filters = {}

        if event_type:
            filters["event_type"] = event_type
        if event_category:
            filters["event_category"] = event_category
        if severity:
            filters["severity"] = severity
        if user_id:
            filters["user_id"] = user_id

        results = await audit_logger.search_audit_logs(
            tenant_context, filters, limit=limit, offset=offset
        )

        return results

    except Exception as e:
        logger.error("audit_logs_get_failed", tenant_id=tenant_id, error=str(e))
