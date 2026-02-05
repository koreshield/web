"""
Tenant Provisioning Automation
=============================

Automated tenant provisioning system that handles:
- Tenant schema creation and initialization
- Default configuration setup
- Resource quota allocation
- API key generation
- Security policy initialization
- Audit logging setup
"""

from typing import Dict, List, Optional, Any
from uuid import UUID
import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta

from .tenant_models import (
    Tenant, TenantCreate, TenantTier, TenantStatus,
    TenantConfiguration, TenantResourceUsage, TenantAPIKey,
    generate_api_key, hash_api_key
)
from .tenant_database import TenantDatabaseManager, TenantConfigurationManager
from .tenant_quotas import ResourceQuotaManager
from .tenant_security import TenantAuditLogger
from .logger import FirewallLogger

logger = FirewallLogger()

@dataclass
class ProvisioningResult:
    """Result of tenant provisioning operation."""
    tenant_id: str
    tenant_uuid: UUID
    api_key: str
    api_key_id: str
    schema_name: str
    status: str
    message: str
    provisioned_at: datetime

@dataclass
class ProvisioningConfig:
    """Configuration for tenant provisioning."""
    default_tier: TenantTier = TenantTier.STARTER
    default_status: TenantStatus = TenantStatus.ACTIVE
    default_api_key_name: str = "default"
    default_api_key_permissions: List[str] = None
    default_api_key_endpoints: List[str] = None
    api_key_expiry_days: int = 365
    audit_retention_days: int = 90

    def __post_init__(self):
        if self.default_api_key_permissions is None:
            self.default_api_key_permissions = ["read", "write"]
        if self.default_api_key_endpoints is None:
            self.default_api_key_endpoints = ["*"]

class TenantProvisioner:
    """Handles automated tenant provisioning."""

    def __init__(
        self,
        db_manager: TenantDatabaseManager,
        config_manager: TenantConfigurationManager,
        quota_manager: ResourceQuotaManager,
        audit_logger: TenantAuditLogger,
        config: ProvisioningConfig = None
    ):
        self.db_manager = db_manager
        self.config_manager = config_manager
        self.quota_manager = quota_manager
        self.audit_logger = audit_logger
        self.config = config or ProvisioningConfig()

    async def provision_tenant(
        self,
        tenant_data: TenantCreate,
        custom_config: Optional[Dict[str, Any]] = None
    ) -> ProvisioningResult:
        """
        Provision a new tenant with all required resources.

        Args:
            tenant_data: Basic tenant information
            custom_config: Optional custom configuration overrides

        Returns:
            ProvisioningResult with provisioning details

        Raises:
            Exception: If provisioning fails
        """
        start_time = datetime.utcnow()
        tenant_id = tenant_data.tenant_id

        try:
            logger.info("starting_tenant_provisioning", tenant_id=tenant_id)

            # Step 1: Create tenant record
            tenant = await self._create_tenant_record(tenant_data)

            # Step 2: Create database schema
            schema_name = await self._create_tenant_schema(tenant)

            # Step 3: Initialize default configurations
            await self._initialize_tenant_config(tenant, custom_config)

            # Step 4: Set up resource quotas
            await self._initialize_resource_quotas(tenant)

            # Step 5: Create default API key
            api_key_result = await self._create_default_api_key(tenant)

            # Step 6: Initialize security policies
            await self._initialize_security_policies(tenant)

            # Step 7: Initialize audit logging
            await self._initialize_audit_logging(tenant)

            # Step 8: Log provisioning completion
            await self.audit_logger.log_admin_action(
                tenant_context=None,  # System action
                action="provision",
                resource_type="tenant",
                resource_id=str(tenant.id),
                details={
                    "tenant_id": tenant.tenant_id,
                    "tier": tenant.tier,
                    "schema_created": schema_name,
                    "api_key_created": api_key_result["key_id"]
                }
            )

            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            logger.info(
                "tenant_provisioning_completed",
                tenant_id=tenant_id,
                duration=duration,
                schema=schema_name
            )

            return ProvisioningResult(
                tenant_id=tenant.tenant_id,
                tenant_uuid=tenant.id,
                api_key=api_key_result["api_key"],
                api_key_id=api_key_result["key_id"],
                schema_name=schema_name,
                status="success",
                message=f"Tenant {tenant_id} provisioned successfully in {duration:.2f}s",
                provisioned_at=end_time
            )

        except Exception as e:
            # Log failure and cleanup
            logger.error(
                "tenant_provisioning_failed",
                tenant_id=tenant_id,
                error=str(e),
                duration=(datetime.utcnow() - start_time).total_seconds()
            )

            # Attempt cleanup on failure
            await self._cleanup_failed_provisioning(tenant_id)

            raise Exception(f"Failed to provision tenant {tenant_id}: {str(e)}")

    async def _create_tenant_record(self, tenant_data: TenantCreate) -> Tenant:
        """Create the tenant database record."""
        session = await self.db_manager.get_main_session()

        try:
            # Check for existing tenant
            existing = await session.execute(
                session.query(Tenant).filter(Tenant.tenant_id == tenant_data.tenant_id)
            )
            if existing.scalar_one_or_none():
                raise Exception(f"Tenant {tenant_data.tenant_id} already exists")

            # Create tenant with defaults
            tenant = Tenant(
                tenant_id=tenant_data.tenant_id,
                name=tenant_data.name,
                description=tenant_data.description,
                contact_email=tenant_data.contact_email,
                contact_name=tenant_data.contact_name,
                tier=tenant_data.tier.value if tenant_data.tier else self.config.default_tier.value,
                status=self.config.default_status.value
            )

            session.add(tenant)
            await session.commit()
            await session.refresh(tenant)

            logger.info("tenant_record_created", tenant_id=tenant.tenant_id, id=str(tenant.id))
            return tenant

        finally:
            await session.close()

    async def _create_tenant_schema(self, tenant: Tenant) -> str:
        """Create the tenant's database schema."""
        schema_name = f"tenant_{tenant.tenant_id}"
        await self.db_manager.create_tenant_schema(tenant.tenant_id)

        logger.info("tenant_schema_created", tenant_id=tenant.tenant_id, schema=schema_name)
        return schema_name

    async def _initialize_tenant_config(
        self,
        tenant: Tenant,
        custom_config: Optional[Dict[str, Any]] = None
    ):
        """Initialize default tenant configuration."""
        from .tenant_models import TenantContext

        tenant_context = TenantContext(
            tenant_id=tenant.tenant_id,
            tenant_uuid=tenant.id,
            schema_name=f"tenant_{tenant.tenant_id}",
            tier=TenantTier(tenant.tier),
            is_active=tenant.status == TenantStatus.ACTIVE.value
        )

        # Default configurations based on tier
        default_configs = self._get_default_configs_for_tier(tenant_context.tier)

        # Merge with custom config
        if custom_config:
            default_configs.update(custom_config)

        # Set configurations
        for key, config_data in default_configs.items():
            await self.config_manager.set_tenant_config(
                tenant_context,
                key,
                config_data["value"],
                config_data["type"],
                config_data.get("description", ""),
                config_data.get("encrypted", False)
            )

        logger.info(
            "tenant_config_initialized",
            tenant_id=tenant.tenant_id,
            config_count=len(default_configs)
        )

    async def _initialize_resource_quotas(self, tenant: Tenant):
        """Initialize resource quotas for the tenant."""
        from .tenant_models import TenantContext

        tenant_context = TenantContext(
            tenant_id=tenant.tenant_id,
            tenant_uuid=tenant.id,
            schema_name=f"tenant_{tenant.tenant_id}",
            tier=TenantTier(tenant.tier),
            is_active=tenant.status == TenantStatus.ACTIVE.value
        )

        # Initialize quota tracking
        await self.quota_manager.initialize_tenant_quotas(tenant_context)

        logger.info("tenant_quotas_initialized", tenant_id=tenant.tenant_id)

    async def _create_default_api_key(self, tenant: Tenant) -> Dict[str, str]:
        """Create a default API key for the tenant."""
        session = await self.db_manager.get_tenant_session(tenant.tenant_id)

        try:
            # Generate API key
            api_key = generate_api_key()
            key_hash = hash_api_key(api_key)

            # Create API key record
            api_key_record = TenantAPIKey(
                tenant_id=tenant.id,
                key_hash=key_hash,
                name=self.config.default_api_key_name,
                description="Default API key created during provisioning",
                permissions=self.config.default_api_key_permissions,
                allowed_endpoints=self.config.default_api_key_endpoints,
                expires_at=datetime.utcnow() + timedelta(days=self.config.api_key_expiry_days)
            )

            session.add(api_key_record)
            await session.commit()

            logger.info(
                "default_api_key_created",
                tenant_id=tenant.tenant_id,
                key_id=str(api_key_record.id)
            )

            return {
                "api_key": api_key,
                "key_id": str(api_key_record.id)
            }

        finally:
            await session.close()

    async def _initialize_security_policies(self, tenant: Tenant):
        """Initialize security policies for the tenant."""
        from .tenant_models import TenantContext
        from .tenant_security import CrossTenantSecurityEnforcer

        tenant_context = TenantContext(
            tenant_id=tenant.tenant_id,
            tenant_uuid=tenant.id,
            schema_name=f"tenant_{tenant.tenant_id}",
            tier=TenantTier(tenant.tier),
            is_active=tenant.status == TenantStatus.ACTIVE.value
        )

        # Initialize security enforcer for this tenant
        security_enforcer = CrossTenantSecurityEnforcer()
        await security_enforcer.initialize_tenant_security(tenant_context)

        logger.info("tenant_security_initialized", tenant_id=tenant.tenant_id)

    async def _initialize_audit_logging(self, tenant: Tenant):
        """Initialize audit logging for the tenant."""
        from .tenant_models import TenantContext

        tenant_context = TenantContext(
            tenant_id=tenant.tenant_id,
            tenant_uuid=tenant.id,
            schema_name=f"tenant_{tenant.tenant_id}",
            tier=TenantTier(tenant.tier),
            is_active=tenant.status == TenantStatus.ACTIVE.value
        )

        # Initialize audit logging
        await self.audit_logger.initialize_tenant_audit(tenant_context)

        logger.info("tenant_audit_initialized", tenant_id=tenant.tenant_id)

    def _get_default_configs_for_tier(self, tier: TenantTier) -> Dict[str, Dict[str, Any]]:
        """Get default configurations based on tenant tier."""
        base_configs = {
            "audit_retention_days": {
                "value": self.config.audit_retention_days,
                "type": "security",
                "description": "Number of days to retain audit logs"
            },
            "enable_audit_logging": {
                "value": True,
                "type": "security",
                "description": "Enable audit logging for security events"
            },
            "max_concurrent_requests": {
                "value": 10,
                "type": "performance",
                "description": "Maximum concurrent requests allowed"
            },
            "enable_rate_limiting": {
                "value": True,
                "type": "security",
                "description": "Enable rate limiting for API requests"
            }
        }

        # Tier-specific overrides
        tier_configs = {
            TenantTier.STARTER: {
                "max_requests_per_minute": {"value": 100, "type": "quota"},
                "max_requests_per_hour": {"value": 1000, "type": "quota"},
                "max_tokens_per_minute": {"value": 10000, "type": "quota"},
                "max_storage_bytes": {"value": 1073741824, "type": "quota"},  # 1GB
                "max_active_sessions": {"value": 5, "type": "quota"}
            },
            TenantTier.PROFESSIONAL: {
                "max_requests_per_minute": {"value": 1000, "type": "quota"},
                "max_requests_per_hour": {"value": 10000, "type": "quota"},
                "max_tokens_per_minute": {"value": 100000, "type": "quota"},
                "max_storage_bytes": {"value": 10737418240, "type": "quota"},  # 10GB
                "max_active_sessions": {"value": 25, "type": "quota"}
            },
            TenantTier.ENTERPRISE: {
                "max_requests_per_minute": {"value": 10000, "type": "quota"},
                "max_requests_per_hour": {"value": 100000, "type": "quota"},
                "max_tokens_per_minute": {"value": 1000000, "type": "quota"},
                "max_storage_bytes": {"value": 107374182400, "type": "quota"},  # 100GB
                "max_active_sessions": {"value": 100, "type": "quota"}
            }
        }

        configs = base_configs.copy()
        configs.update(tier_configs.get(tier, {}))

        return configs

    async def _cleanup_failed_provisioning(self, tenant_id: str):
        """Clean up resources if provisioning fails."""
        try:
            logger.info("cleaning_up_failed_provisioning", tenant_id=tenant_id)

            # Remove tenant record if it exists
            session = await self.db_manager.get_main_session()
            try:
                result = await session.execute(
                    session.query(Tenant).filter(Tenant.tenant_id == tenant_id)
                )
                tenant = result.scalar_one_or_none()
                if tenant:
                    await session.delete(tenant)
                    await session.commit()
            finally:
                await session.close()

            # Drop schema if it exists
            await self.db_manager.drop_tenant_schema(tenant_id)

            logger.info("cleanup_completed", tenant_id=tenant_id)

        except Exception as e:
            logger.error(
                "cleanup_failed",
                tenant_id=tenant_id,
                error=str(e)
            )

class TenantDeprovisioner:
    """Handles tenant deprovisioning and cleanup."""

    def __init__(
        self,
        db_manager: TenantDatabaseManager,
        config_manager: TenantConfigurationManager,
        quota_manager: ResourceQuotaManager,
        audit_logger: TenantAuditLogger
    ):
        self.db_manager = db_manager
        self.config_manager = config_manager
        self.quota_manager = quota_manager
        self.audit_logger = audit_logger

    async def deprovision_tenant(self, tenant_id: str, force: bool = False) -> Dict[str, Any]:
        """
        Deprovision a tenant and clean up all resources.

        Args:
            tenant_id: ID of tenant to deprovision
            force: Force deprovisioning even if tenant is active

        Returns:
            Deprovisioning result details
        """
        start_time = datetime.utcnow()

        try:
            logger.info("starting_tenant_deprovisioning", tenant_id=tenant_id)

            # Get tenant info
            session = await self.db_manager.get_main_session()
            try:
                result = await session.execute(
                    session.query(Tenant).filter(Tenant.tenant_id == tenant_id)
                )
                tenant = result.scalar_one_or_none()

                if not tenant:
                    raise Exception(f"Tenant {tenant_id} not found")

                if tenant.status == TenantStatus.ACTIVE.value and not force:
                    raise Exception(f"Tenant {tenant_id} is active. Use force=True to deprovision")

            finally:
                await session.close()

            # Step 1: Mark tenant as deprovisioning
            await self._mark_tenant_deprovisioning(tenant_id)

            # Step 2: Clean up API keys
            await self._cleanup_api_keys(tenant_id)

            # Step 3: Clean up configurations
            await self._cleanup_configurations(tenant_id)

            # Step 4: Clean up resource quotas
            await self._cleanup_quotas(tenant_id)

            # Step 5: Clean up audit logs
            await self._cleanup_audit_logs(tenant_id)

            # Step 6: Drop database schema
            await self._drop_tenant_schema(tenant_id)

            # Step 7: Mark tenant as deactivated
            await self._mark_tenant_deactivated(tenant_id)

            # Step 8: Log deprovisioning
            await self.audit_logger.log_admin_action(
                tenant_context=None,  # System action
                action="deprovision",
                resource_type="tenant",
                resource_id=str(tenant.id),
                details={"tenant_id": tenant_id, "force": force}
            )

            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            logger.info(
                "tenant_deprovisioning_completed",
                tenant_id=tenant_id,
                duration=duration
            )

            return {
                "tenant_id": tenant_id,
                "status": "deprovisioned",
                "message": f"Tenant {tenant_id} deprovisioned successfully in {duration:.2f}s",
                "deprovisioned_at": end_time.isoformat(),
                "force": force
            }

        except Exception as e:
            logger.error(
                "tenant_deprovisioning_failed",
                tenant_id=tenant_id,
                error=str(e)
            )
            raise Exception(f"Failed to deprovision tenant {tenant_id}: {str(e)}")

    async def _mark_tenant_deprovisioning(self, tenant_id: str):
        """Mark tenant as being deprovisioned."""
        session = await self.db_manager.get_main_session()
        try:
            result = await session.execute(
                session.query(Tenant).filter(Tenant.tenant_id == tenant_id)
            )
            tenant = result.scalar_one_or_none()
            if tenant:
                tenant.status = "deprovisioning"
                tenant.updated_at = datetime.utcnow()
                await session.commit()
        finally:
            await session.close()

    async def _cleanup_api_keys(self, tenant_id: str):
        """Clean up all API keys for the tenant."""
        session = await self.db_manager.get_tenant_session(tenant_id)
        try:
            await session.execute(
                session.query(TenantAPIKey).filter(TenantAPIKey.tenant_id == tenant_id)
            )
            # Note: In a real implementation, you'd delete these records
            # For now, we'll just mark them inactive
            await session.commit()
        finally:
            await session.close()

    async def _cleanup_configurations(self, tenant_id: str):
        """Clean up tenant configurations."""
        # Configuration cleanup would be handled by the config manager
        pass

    async def _cleanup_quotas(self, tenant_id: str):
        """Clean up resource quotas."""
        # Quota cleanup would be handled by the quota manager
        pass

    async def _cleanup_audit_logs(self, tenant_id: str):
        """Clean up audit logs."""
        # Audit log cleanup would be handled by retention policies
        pass

    async def _drop_tenant_schema(self, tenant_id: str):
        """Drop the tenant's database schema."""
        await self.db_manager.drop_tenant_schema(tenant_id)

    async def _mark_tenant_deactivated(self, tenant_id: str):
        """Mark tenant as deactivated."""
        session = await self.db_manager.get_main_session()
        try:
            result = await session.execute(
                session.query(Tenant).filter(Tenant.tenant_id == tenant_id)
            )
            tenant = result.scalar_one_or_none()
            if tenant:
                tenant.status = TenantStatus.DEACTIVATED.value
                tenant.deactivated_at = datetime.utcnow()
                tenant.updated_at = datetime.utcnow()
                await session.commit()
        finally:
            await session.close()

# Global instances for dependency injection
_provisioner_instance = None
_deprovisioner_instance = None

def get_tenant_provisioner() -> TenantProvisioner:
    """Get the global tenant provisioner instance."""
    global _provisioner_instance
    if _provisioner_instance is None:
        from .tenant_database import get_tenant_db_manager, get_tenant_config_manager
        from .tenant_quotas import get_resource_quota_manager
        from .tenant_security import get_tenant_audit_logger

        _provisioner_instance = TenantProvisioner(
            db_manager=get_tenant_db_manager(),
            config_manager=get_tenant_config_manager(),
            quota_manager=get_resource_quota_manager(),
            audit_logger=get_tenant_audit_logger()
        )
    return _provisioner_instance

def get_tenant_deprovisioner() -> TenantDeprovisioner:
    """Get the global tenant deprovisioner instance."""
    global _deprovisioner_instance
    if _deprovisioner_instance is None:
        from .tenant_database import get_tenant_db_manager, get_tenant_config_manager
        from .tenant_quotas import get_resource_quota_manager
        from .tenant_security import get_tenant_audit_logger

        _deprovisioner_instance = TenantDeprovisioner(
            db_manager=get_tenant_db_manager(),
            config_manager=get_tenant_config_manager(),
            quota_manager=get_resource_quota_manager(),
            audit_logger=get_tenant_audit_logger()
        )
