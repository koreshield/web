"""
Tenant Middleware for Request Routing and Context Management
===========================================================

Handles tenant identification, context setup, and request routing in multi-tenant environment.
"""

import asyncio
import time
from typing import Dict, List, Optional, Any, Callable
from contextvars import ContextVar
import uuid
import re

from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .tenant_models import TenantContext, Tenant, TenantStatus, TenantTier, ResourceType, TenantAPIKey
from .logger import FirewallLogger
from .tenant_database import get_tenant_db_session
from .tenant_utils import tenant_context, request_id_context
from .api.auth import verify_jwt_token

class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware for tenant identification and context management.

    Handles:
    - Tenant identification from API keys, headers, or subdomains
    - Tenant context setup and validation
    - Cross-tenant security enforcement
    - Resource quota checking
    - Request routing to tenant-specific resources
    """

    def __init__(
        self,
        app: ASGIApp,
        tenant_header: str = "X-Tenant-ID",
        api_key_header: str = "X-API-Key",
        tenant_cache_ttl: int = 300,  # 5 minutes
        enable_subdomain_routing: bool = False
    ):
        super().__init__(app)
        self.tenant_header = tenant_header
        self.api_key_header = api_key_header
        self.tenant_cache_ttl = tenant_cache_ttl
        self.enable_subdomain_routing = enable_subdomain_routing

        # In-memory cache for tenant data
        self._tenant_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_timestamps: Dict[str, float] = {}

        # Logger for tenant operations
        self.logger = FirewallLogger()

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process the request with tenant context."""
        start_time = time.time()

        try:
            # Generate request ID
            request_id = str(uuid.uuid4())
            request_id_context.set(request_id)

            # Extract tenant information
            tenant_info = await self._extract_tenant_info(request)

            if not tenant_info:
                return self._create_error_response(
                    "Tenant identification failed",
                    "TENANT_NOT_FOUND",
                    400
                )

            # Validate tenant and create context
            tenant_context_obj = await self._create_tenant_context(tenant_info)

            if not tenant_context_obj:
                return self._create_error_response(
                    "Invalid tenant",
                    "TENANT_INVALID",
                    403
                )

            # Set tenant context
            tenant_context.set(tenant_context_obj)

            # Check resource quotas
            quota_check = await self._check_resource_quotas(request, tenant_context_obj)
            if not quota_check["allowed"]:
                return self._create_error_response(
                    quota_check["reason"],
                    "QUOTA_EXCEEDED",
                    429
                )

            # Add tenant headers to request
            request.state.tenant_id = tenant_context_obj.tenant_id
            request.state.tenant_uuid = tenant_context_obj.tenant_uuid
            request.state.schema_name = tenant_context_obj.schema_name
            request.state.request_id = request_id

            # Process the request
            response = await call_next(request)

            # Record resource usage
            await self._record_resource_usage(request, tenant_context_obj, start_time)

            # Add tenant headers to response
            response.headers["X-Tenant-ID"] = tenant_context_obj.tenant_id
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as e:
            self.logger.error(
                "tenant_middleware_error",
                error=str(e),
                request_id=request_id_context.get(),
                path=request.url.path,
                method=request.method
            )
            return self._create_error_response(
                "Internal server error",
                "INTERNAL_ERROR",
                500
            )

    async def _extract_tenant_info(self, request: Request) -> Optional[Dict[str, Any]]:
        """Extract tenant information from request."""
        tenant_info = {}

        # Method 1: API Key from header
        api_key = request.headers.get(self.api_key_header)
        if api_key:
            tenant_info["api_key"] = api_key
            return tenant_info

        # Method 2: Tenant ID from header
        tenant_id = request.headers.get(self.tenant_header)
        if tenant_id:
            tenant_info["tenant_id"] = tenant_id
            return tenant_info

        # Method 3: Subdomain routing (if enabled)
        if self.enable_subdomain_routing:
            subdomain = self._extract_subdomain(request)
            if subdomain and subdomain != "api":  # Skip main API subdomain
                tenant_info["tenant_id"] = subdomain
                return tenant_info

        # Method 4: JWT token (check Authorization header)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix
            # JWT parsing would happen here - for now, assume tenant info in token
            tenant_info["token"] = token
            return tenant_info

        return None

    def _extract_subdomain(self, request: Request) -> Optional[str]:
        """Extract tenant ID from subdomain."""
        host = request.headers.get("host", "")
        if not host:
            return None

        # Remove port if present
        host = host.split(":")[0]

        # Handle localhost/development
        if host in ("localhost", "127.0.0.1", "0.0.0.0"):
            return None

        # Split by dots and get subdomain
        parts = host.split(".")
        if len(parts) >= 3:  # tenant.api.example.com
            return parts[0]

        return None

    async def _create_tenant_context(self, tenant_info: Dict[str, Any]) -> Optional[TenantContext]:
        """Create tenant context from extracted information."""
        try:
            # Get tenant from database
            tenant = await self._get_tenant_from_info(tenant_info)

            if not tenant:
                # Check for Admin via Token and create System Context
                if "token" in tenant_info:
                    try:
                        payload = verify_jwt_token(tenant_info["token"])
                        if not payload:
                            return None
                        role = payload.get("role")
                        if role in ["admin", "owner", "superuser"]:
                            # Create System Tenant Context
                            return TenantContext(
                                tenant_id="system",
                                tenant_uuid=uuid.UUID(int=0),
                                schema_name="public",
                                tier=TenantTier.ENTERPRISE,
                                is_active=True,
                                resource_limits={} 
                            )
                    except Exception:
                        pass
                
                return None

            if not tenant.is_active():
                return None

            # Create resource limits dict
            resource_limits = {
                ResourceType.REQUESTS_PER_MINUTE: tenant.max_requests_per_minute,
                ResourceType.REQUESTS_PER_HOUR: tenant.max_requests_per_hour,
                ResourceType.REQUESTS_PER_DAY: tenant.max_requests_per_day,
                ResourceType.TOKENS_PER_MINUTE: tenant.max_tokens_per_minute,
                ResourceType.TOKENS_PER_HOUR: tenant.max_tokens_per_hour,
                ResourceType.STORAGE_BYTES: tenant.max_storage_bytes,
                ResourceType.ACTIVE_SESSIONS: tenant.max_active_sessions,
            }

            # Load tenant configuration
            config_cache = await self._load_tenant_config(tenant.id)

            return TenantContext(
                tenant_id=tenant.tenant_id,
                tenant_uuid=tenant.id,
                schema_name=tenant.get_schema_name(),
                tier=TenantTier(tenant.tier),
                is_active=tenant.is_active(),
                config_cache=config_cache,
                resource_limits=resource_limits
            )

        except Exception as e:
            self.logger.error("tenant_context_creation_failed", error=str(e))
            return None

    async def _get_tenant_from_info(self, tenant_info: Dict[str, Any]) -> Optional[Tenant]:
        """Get tenant from extracted information."""
        # Check cache first
        cache_key = str(tenant_info)
        if cache_key in self._tenant_cache:
            cache_time = self._cache_timestamps.get(cache_key, 0)
            if time.time() - cache_time < self.tenant_cache_ttl:
                cached_data = self._tenant_cache[cache_key]
                # Reconstruct tenant object from cache
                return self._tenant_from_cache(cached_data)

        # Query database
        async with get_tenant_db_session() as session:
            query = session.query(Tenant)

            if "api_key" in tenant_info:
                # Look up by API key hash
                from .tenant_models import hash_api_key
                key_hash = hash_api_key(tenant_info["api_key"])
                tenant = await session.execute(
                    query.join(TenantAPIKey).filter(TenantAPIKey.key_hash == key_hash)
                )
                tenant = tenant.scalar_one_or_none()

            elif "tenant_id" in tenant_info:
                # Look up by tenant ID
                tenant = await session.execute(
                    query.filter(Tenant.tenant_id == tenant_info["tenant_id"])
                )
                tenant = tenant.scalar_one_or_none()

            elif "token" in tenant_info:
                # JWT token parsing would go here
                # For now, assume tenant_id is in token payload
                tenant = None  # Placeholder

            else:
                tenant = None

            if tenant:
                # Cache the result
                self._tenant_cache[cache_key] = self._tenant_to_cache(tenant)
                self._cache_timestamps[cache_key] = time.time()

            return tenant

    def _tenant_from_cache(self, cached_data: Dict[str, Any]) -> Tenant:
        """Reconstruct tenant from cache data."""
        tenant = Tenant()
        for key, value in cached_data.items():
            setattr(tenant, key, value)
        return tenant

    def _tenant_to_cache(self, tenant: Tenant) -> Dict[str, Any]:
        """Convert tenant to cacheable dict."""
        return {
            "id": tenant.id,
            "tenant_id": tenant.tenant_id,
            "name": tenant.name,
            "status": tenant.status,
            "tier": tenant.tier,
            "schema_name": tenant.schema_name,
            "max_requests_per_minute": tenant.max_requests_per_minute,
            "max_requests_per_hour": tenant.max_requests_per_hour,
            "max_requests_per_day": tenant.max_requests_per_day,
            "max_tokens_per_minute": tenant.max_tokens_per_minute,
            "max_tokens_per_hour": tenant.max_tokens_per_hour,
            "max_storage_bytes": tenant.max_storage_bytes,
            "max_active_sessions": tenant.max_active_sessions,
        }

    async def _load_tenant_config(self, tenant_uuid: uuid.UUID) -> Dict[str, Any]:
        """Load tenant-specific configuration."""
        try:
            async with get_tenant_db_session() as session:
                from .tenant_models import TenantConfiguration
                result = await session.execute(
                    session.query(TenantConfiguration).filter(
                        TenantConfiguration.tenant_id == tenant_uuid
                    )
                )
                configs = result.scalars().all()

                config_dict = {}
                for config in configs:
                    config_dict[config.config_key] = config.config_value

                return config_dict

        except Exception as e:
            self.logger.error("tenant_config_load_failed", error=str(e))
            return {}

    async def _check_resource_quotas(
        self,
        request: Request,
        tenant_context: TenantContext
    ) -> Dict[str, Any]:
        """Check if request is within tenant resource quotas."""
        try:
            # For now, implement simple request counting
            # In production, this would check Redis or database for current usage

            resource_type = ResourceType.REQUESTS_PER_MINUTE
            if not tenant_context.can_consume_resource(resource_type, 1):
                return {
                    "allowed": False,
                    "reason": f"Rate limit exceeded: {resource_type.value}"
                }

            return {"allowed": True}

        except Exception as e:
            self.logger.error("quota_check_failed", error=str(e))
            # Allow request on error to avoid blocking legitimate traffic
            return {"allowed": True}

    async def _record_resource_usage(
        self,
        request: Request,
        tenant_context: TenantContext,
        start_time: float
    ) -> None:
        """Record resource usage for quota tracking."""
        try:
            duration = time.time() - start_time

            # In production, this would update Redis counters
            # For now, just log the usage
            self.logger.info(
                "resource_usage_recorded",
                tenant_id=tenant_context.tenant_id,
                method=request.method,
                path=request.url.path,
                duration=duration,
                request_id=request_id_context.get()
            )

        except Exception as e:
            self.logger.error("resource_usage_recording_failed", error=str(e))

    def _create_error_response(
        self,
        message: str,
        error_code: str,
        status_code: int
    ) -> JSONResponse:
        """Create a standardized error response."""
        return JSONResponse(
            status_code=status_code,
            content={
                "error": {
                }
            }
        )
