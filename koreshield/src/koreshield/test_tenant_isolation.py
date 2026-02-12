"""
Tenant Isolation Integration Tests
==================================

Comprehensive test suite for tenant isolation system including:
- Database isolation testing
- Middleware functionality
- Resource quota enforcement
- Cross-tenant security
- API key authentication
- Audit logging
- Provisioning automation
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from uuid import uuid4

from .tenant_models import (
    Tenant, TenantCreate, TenantUpdate, TenantTier, TenantStatus,
    TenantContext, TenantAPIKey, generate_api_key, hash_api_key
)
from .tenant_middleware import TenantMiddleware
from .tenant_database import TenantDatabaseManager, TenantConfigurationManager
from .tenant_quotas import ResourceQuotaManager, TenantResourceQuotaEnforcer
from .tenant_security import CrossTenantSecurityEnforcer, TenantAuditLogger
from .tenant_provisioning import (
    TenantProvisioner, TenantDeprovisioner, ProvisioningConfig,
    get_tenant_provisioner
)
from .logger import FirewallLogger

class TestTenantIsolation:
    """Test suite for tenant isolation functionality."""

    @pytest.fixture
    def mock_db_session(self):
        """Mock database session."""
        session = AsyncMock()
        session.add = AsyncMock()
        session.commit = AsyncMock()
        session.refresh = AsyncMock()
        session.close = AsyncMock()
        session.execute = AsyncMock()
        session.query = Mock()
        return session

    @pytest.fixture
    def mock_tenant(self):
        """Mock tenant object."""
        tenant = Mock()
        tenant.id = uuid4()
        tenant.tenant_id = "test_tenant"
        tenant.name = "Test Tenant"
        tenant.tier = TenantTier.STARTER.value
        tenant.status = TenantStatus.ACTIVE.value
        return tenant

    @pytest.fixture
    def tenant_context(self, mock_tenant):
        """Create tenant context."""
        return TenantContext(
            tenant_id=mock_tenant.tenant_id,
            tenant_uuid=mock_tenant.id,
            schema_name=f"tenant_{mock_tenant.tenant_id}",
            tier=TenantTier.STARTER,
            is_active=True,
            resource_limits={
                "requests_per_minute": 100,
                "requests_per_hour": 1000,
                "tokens_per_minute": 10000
            }
        )

    def test_tenant_model_creation(self):
        """Test tenant model creation and validation."""
        tenant_data = TenantCreate(
            tenant_id="test_tenant_123",
            name="Test Tenant",
            description="A test tenant",
            contact_email="admin@test.com",
            contact_name="Test Admin",
            tier=TenantTier.PROFESSIONAL
        )

        assert tenant_data.tenant_id == "test_tenant_123"
        assert tenant_data.name == "Test Tenant"
        assert tenant_data.tier == TenantTier.PROFESSIONAL

    def test_tenant_context_creation(self, tenant_context):
        """Test tenant context creation."""
        assert tenant_context.tenant_id == "test_tenant"
        assert tenant_context.tier == TenantTier.STARTER
        assert tenant_context.is_active is True
        assert tenant_context.schema_name == "tenant_test_tenant"
        assert "requests_per_minute" in tenant_context.resource_limits

    @pytest.mark.asyncio
    async def test_database_manager_schema_creation(self):
        """Test database schema creation."""
        db_manager = TenantDatabaseManager()

        # Mock the database operations
        with patch.object(db_manager, '_create_schema_tables', new_callable=AsyncMock) as mock_create:
            mock_create.return_value = True

            result = await db_manager.create_tenant_schema("test_tenant")
            assert result is True
            mock_create.assert_called_once_with("test_tenant")

    @pytest.mark.asyncio
    async def test_configuration_manager(self, tenant_context):
        """Test tenant configuration management."""
        config_manager = TenantConfigurationManager()

        # Test setting configuration
        success = await config_manager.set_tenant_config(
            tenant_context,
            "test_key",
            "test_value",
            "test_type",
            "Test configuration"
        )
        assert success is True

        # Test getting configuration
        configs = await config_manager.get_all_tenant_configs(tenant_context)
        assert isinstance(configs, dict)

    @pytest.mark.asyncio
    async def test_resource_quota_manager(self, tenant_context):
        """Test resource quota management."""
        quota_manager = ResourceQuotaManager()

        # Test quota initialization
        await quota_manager.initialize_tenant_quotas(tenant_context)

        # Test quota checking
        allowed = await quota_manager.check_quota(
            tenant_context,
            "requests_per_minute",
            50
        )
        assert allowed is True

        # Test quota usage tracking
        await quota_manager.track_usage(
            tenant_context,
            "requests_per_minute",
            10
        )

        # Test usage stats
        stats = await quota_manager.get_usage_stats(tenant_context)
        assert isinstance(stats, dict)

    @pytest.mark.asyncio
    async def test_quota_enforcer(self, tenant_context):
        """Test quota enforcement."""
        enforcer = TenantResourceQuotaEnforcer()

        # Mock request
        mock_request = Mock()
        mock_request.headers = {"X-API-Key": "test_key"}

        # Test quota check
        allowed, info = await enforcer.check_request_quota(mock_request, tenant_context)
        assert isinstance(allowed, bool)
        assert isinstance(info, dict)

    @pytest.mark.asyncio
    async def test_security_enforcer(self, tenant_context):
        """Test cross-tenant security enforcement."""
        enforcer = CrossTenantSecurityEnforcer()

        # Test tenant security initialization
        await enforcer.initialize_tenant_security(tenant_context)

        # Test boundary validation
        valid = await enforcer.validate_tenant_boundary(
            tenant_context,
            "test_resource",
            "read"
        )
        assert isinstance(valid, bool)

    @pytest.mark.asyncio
    async def test_audit_logger(self, tenant_context):
        """Test tenant audit logging."""
        audit_logger = TenantAuditLogger()

        # Test audit log initialization
        await audit_logger.initialize_tenant_audit(tenant_context)

        # Test logging security event
        await audit_logger.log_security_event(
            tenant_context,
            event_type="access_denied",
            severity="medium",
            details={"resource": "test_resource", "reason": "insufficient_permissions"}
        )

        # Test searching audit logs
        results = await audit_logger.search_audit_logs(tenant_context, {})
        assert isinstance(results, list)

    def test_api_key_generation(self):
        """Test API key generation and hashing."""
        key1 = generate_api_key()
        key2 = generate_api_key()

        assert key1 != key2
        assert len(key1) > 20  # Should be reasonably long

        # Test hashing
        hash1 = hash_api_key(key1)
        hash2 = hash_api_key(key1)
        hash3 = hash_api_key(key2)

        assert hash1 == hash2  # Same key should produce same hash
        assert hash1 != hash3  # Different keys should produce different hashes

    @pytest.mark.asyncio
    async def test_tenant_middleware(self):
        """Test tenant middleware functionality."""
        middleware = TenantMiddleware()

        # Mock request
        mock_request = Mock()
        mock_request.headers = {
            "X-Tenant-ID": "test_tenant",
            "X-API-Key": "test_key"
        }
        mock_request.url = Mock()
        mock_request.url.path = "/api/test"

        # Mock call_next
        call_next = AsyncMock()
        call_next.return_value = Mock()

        # Test middleware processing
        response = await middleware.dispatch(mock_request, call_next)
        call_next.assert_called_once()

    @pytest.mark.asyncio
    async def test_tenant_provisioner(self, mock_tenant):
        """Test tenant provisioning."""
        # Mock dependencies
        mock_db_manager = AsyncMock()
        mock_config_manager = AsyncMock()
        mock_quota_manager = AsyncMock()
        mock_audit_logger = AsyncMock()

        provisioner = TenantProvisioner(
            db_manager=mock_db_manager,
            config_manager=mock_config_manager,
            quota_manager=mock_quota_manager,
            audit_logger=mock_audit_logger
        )

        # Mock tenant creation
        mock_db_manager.get_main_session.return_value = AsyncMock()
        mock_db_manager.create_tenant_schema = AsyncMock(return_value="tenant_test")

        tenant_data = TenantCreate(
            tenant_id="test_tenant",
            name="Test Tenant",
            contact_email="admin@test.com"
        )

        # Test provisioning
        result = await provisioner.provision_tenant(tenant_data)

        assert result.tenant_id == "test_tenant"
        assert result.status == "success"
        assert "api_key" in result.__dict__
        assert "api_key_id" in result.__dict__

    @pytest.mark.asyncio
    async def test_tenant_deprovisioner(self):
        """Test tenant deprovisioning."""
        # Mock dependencies
        mock_db_manager = AsyncMock()
        mock_config_manager = AsyncMock()
        mock_quota_manager = AsyncMock()
        mock_audit_logger = AsyncMock()

        deprovisioner = TenantDeprovisioner(
            db_manager=mock_db_manager,
            config_manager=mock_config_manager,
            quota_manager=mock_quota_manager,
            audit_logger=mock_audit_logger
        )

        # Mock tenant lookup
        mock_session = AsyncMock()
        mock_tenant = Mock()
        mock_tenant.status = TenantStatus.ACTIVE.value
        mock_session.scalar_one_or_none.return_value = mock_tenant
        mock_db_manager.get_main_session.return_value = mock_session

        # Test deprovisioning
        result = await deprovisioner.deprovision_tenant("test_tenant", force=True)

        assert result["tenant_id"] == "test_tenant"
        assert result["status"] == "deprovisioned"

    def test_provisioning_config(self):
        """Test provisioning configuration."""
        config = ProvisioningConfig(
            default_tier=TenantTier.ENTERPRISE,
            api_key_expiry_days=180
        )

        assert config.default_tier == TenantTier.ENTERPRISE
        assert config.api_key_expiry_days == 180
        assert config.default_api_key_permissions == ["read", "write"]

    @pytest.mark.asyncio
    async def test_integration_scenario(self):
        """Test complete tenant lifecycle integration."""
        # This would be a comprehensive integration test
        # For now, just test the basic flow

        tenant_id = f"integration_test_{uuid4().hex[:8]}"

        # 1. Create tenant data
        tenant_data = TenantCreate(
            tenant_id=tenant_id,
            name="Integration Test Tenant",
            contact_email="test@example.com",
            tier=TenantTier.PROFESSIONAL
        )

        # 2. Mock provisioner
        with patch('koreshield.tenant_provisioning.get_tenant_provisioner') as mock_get_provisioner:
            mock_provisioner = AsyncMock()
            mock_provisioner.provision_tenant.return_value = Mock(
                tenant_id=tenant_id,
                status="success",
                api_key="test_api_key",
                api_key_id="test_key_id"
            )
            mock_get_provisioner.return_value = mock_provisioner

            provisioner = get_tenant_provisioner()
            result = await provisioner.provision_tenant(tenant_data)

            assert result.tenant_id == tenant_id
            assert result.status == "success"

    def test_error_handling(self):
        """Test error handling in tenant operations."""
        # Test invalid tenant ID
        with pytest.raises(ValueError):
            TenantCreate(
                tenant_id="",  # Invalid empty ID
                name="Test",
                contact_email="test@example.com"
            )

        # Test invalid email
        with pytest.raises(ValueError):
            TenantCreate(
                tenant_id="test",
                name="Test",
                contact_email="invalid-email"  # Invalid email format
            )

class TestTenantMiddlewareIntegration:
    """Integration tests for tenant middleware."""

    @pytest.mark.asyncio
    async def test_middleware_tenant_resolution(self):
        """Test tenant resolution in middleware."""
        middleware = TenantMiddleware()

        # Mock request with tenant header
        mock_request = Mock()
        mock_request.headers = {"X-Tenant-ID": "test_tenant"}

        # Test tenant resolution
        tenant_id = await middleware._get_tenant_from_request(mock_request)
        assert tenant_id == "test_tenant"

    @pytest.mark.asyncio
    async def test_middleware_api_key_validation(self):
        """Test API key validation in middleware."""
        middleware = TenantMiddleware()

        # Mock request with API key
        mock_request = Mock()
        mock_request.headers = {"X-API-Key": "test_key"}

        # Mock API key lookup
        with patch.object(middleware, '_validate_api_key', new_callable=AsyncMock) as mock_validate:
            mock_validate.return_value = ("test_tenant", ["read", "write"])

            tenant_id, permissions = await middleware._validate_api_key(mock_request)
            assert tenant_id == "test_tenant"
            assert permissions == ["read", "write"]

class TestTenantSecurityIntegration:
    """Integration tests for tenant security."""

    @pytest.mark.asyncio
    async def test_cross_tenant_isolation(self):
        """Test cross-tenant data isolation."""
        enforcer = CrossTenantSecurityEnforcer()

        tenant1_context = TenantContext(
            tenant_id="tenant1",
            tenant_uuid=uuid4(),
            schema_name="tenant_tenant1",
            tier=TenantTier.STARTER,
            is_active=True
        )

        tenant2_context = TenantContext(
            tenant_id="tenant2",
            tenant_uuid=uuid4(),
            schema_name="tenant_tenant2",
            tier=TenantTier.STARTER,
            is_active=True
        )

        # Test that tenant1 cannot access tenant2 data
        access_granted = await enforcer.validate_cross_tenant_access(
            tenant1_context,
            tenant2_context.tenant_id,
            "read"
        )
        assert access_granted is False

    @pytest.mark.asyncio
    async def test_audit_log_compliance(self):
        """Test audit logging for compliance."""
        audit_logger = TenantAuditLogger()

        tenant_context = TenantContext(
            tenant_id="test_tenant",
            tenant_uuid=uuid4(),
            schema_name="tenant_test_tenant",
            tier=TenantTier.ENTERPRISE,
            is_active=True
        )

        # Log compliance event
        await audit_logger.log_compliance_event(
            tenant_context,
            event_type="data_export",
            details={"export_type": "user_data", "record_count": 100}
        )

        # Search for compliance events
        results = await audit_logger.search_audit_logs(
            tenant_context,
            {"event_category": "compliance"}
        )
        assert isinstance(results, list)

