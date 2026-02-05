"""
Tenant Utilities
================

Shared utilities for tenant management to avoid circular imports.
"""

from contextvars import ContextVar
from typing import Optional, Callable
from fastapi import HTTPException

from .tenant_models import TenantContext

# Context variables for tenant information
tenant_context: ContextVar[Optional[TenantContext]] = ContextVar('tenant_context', default=None)
request_id_context: ContextVar[Optional[str]] = ContextVar('request_id', default=None)

def get_current_tenant() -> Optional[TenantContext]:
    """Get the current tenant context."""
    return tenant_context.get()

def get_current_request_id() -> Optional[str]:
    """Get the current request ID."""
    return request_id_context.get()

def require_tenant(func: Callable) -> Callable:
    """Decorator to ensure tenant context is available."""
    async def wrapper(*args, **kwargs):
        tenant = get_current_tenant()
        if not tenant:
            raise HTTPException(status_code=400, detail="Tenant context required")
        return await func(*args, **kwargs)
    return wrapper

def require_active_tenant(func: Callable) -> Callable:
    """Decorator to ensure tenant is active."""
    async def wrapper(*args, **kwargs):
        tenant = get_current_tenant()
        if not tenant or not tenant.is_active:
            raise HTTPException(status_code=403, detail="Active tenant required")
        return await func(*args, **kwargs)
    return wrapper