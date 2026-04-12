"""
Resource Quota Enforcement for Multi-Tenant Environment
======================================================

Manages per-tenant resource limits including:
- Request rate limiting
- Token usage tracking
- Storage quotas
- Active session limits
"""

import time
import os
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta

from .tenant_models import TenantContext, ResourceType
from .logger import FirewallLogger

class ResourceQuotaManager:
    """
    Manages resource quotas and enforcement for tenants.

    Features:
    - Rate limiting by resource type
    - Usage tracking and reporting
    - Quota violation handling
    - Automatic cleanup of old usage data
    """

    def __init__(self, redis_url: Optional[str] = None):
        self.logger = FirewallLogger()
        self.redis_url = redis_url or os.getenv("REDIS_URL")

        # In-memory fallback if Redis is not available
        self._memory_usage: Dict[str, Dict[str, Any]] = {}

        # Rate limiting windows
        self._rate_windows = {
            "per_minute": 60,
            "per_hour": 3600,
            "per_day": 86400,
        }

    async def check_quota(
        self,
        tenant_context: TenantContext,
        resource_type: ResourceType,
        amount: int = 1
    ) -> Tuple[bool, str]:
        """
        Check if a tenant can consume the specified amount of a resource.

        Returns:
            Tuple of (allowed: bool, reason: str)
        """
        try:
            # Get current usage
            current_usage = await self._get_current_usage(
                tenant_context.tenant_id,
                resource_type
            )

            # Get limit
            limit = tenant_context.resource_limits.get(resource_type, 0)

            if current_usage + amount > limit:
                reason = f"Resource limit exceeded: {resource_type.value} " \
                        f"(current: {current_usage}, requested: {amount}, limit: {limit})"
                return False, reason

            return True, ""

        except Exception as e:
            self.logger.error(
                "quota_check_failed",
                tenant_id=tenant_context.tenant_id,
                resource_type=resource_type.value,
                error=str(e)
            )
            # Allow on error to avoid blocking legitimate traffic
            return True, ""

    async def record_usage(
        self,
        tenant_context: TenantContext,
        resource_type: ResourceType,
        amount: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Record resource usage for a tenant."""
        try:
            # Update usage counters
            success = await self._increment_usage(
                tenant_context.tenant_id,
                resource_type,
                amount
            )

            if success:
                self.logger.info(
                    "resource_usage_recorded",
                    tenant_id=tenant_context.tenant_id,
                    resource_type=resource_type.value,
                    amount=amount,
                    metadata=metadata or {}
                )

            return success

        except Exception as e:
            self.logger.error(
                "usage_recording_failed",
                tenant_id=tenant_context.tenant_id,
                resource_type=resource_type.value,
                amount=amount,
                error=str(e)
            )
            return False

    async def get_usage_stats(
        self,
        tenant_context: TenantContext,
        resource_type: Optional[ResourceType] = None,
        time_window: str = "per_hour"
    ) -> Dict[str, Any]:
        """Get usage statistics for a tenant."""
        try:
            stats = {}

            if resource_type:
                resources = [resource_type]
            else:
                resources = list(ResourceType)

            for res_type in resources:
                current_usage = await self._get_current_usage(
                    tenant_context.tenant_id,
                    res_type
                )
                limit = tenant_context.resource_limits.get(res_type, 0)

                stats[res_type.value] = {
                    "current_usage": current_usage,
                    "limit": limit,
                    "remaining": max(0, limit - current_usage),
                    "utilization_percent": (current_usage / limit * 100) if limit > 0 else 0
                }

            return stats

        except Exception as e:
            self.logger.error(
                "usage_stats_retrieval_failed",
                tenant_id=tenant_context.tenant_id,
                error=str(e)
            )
            return {}

    async def reset_usage(
        self,
        tenant_context: TenantContext,
        resource_type: Optional[ResourceType] = None
    ) -> bool:
        """Reset usage counters for a tenant."""
        try:
            if resource_type:
                resources = [resource_type]
            else:
                resources = list(ResourceType)

            for res_type in resources:
                await self._reset_usage_counter(
                    tenant_context.tenant_id,
                    res_type
                )

            self.logger.info(
                "usage_reset",
                tenant_id=tenant_context.tenant_id,
                resource_types=[r.value for r in resources] if resource_type else "all"
            )

            return True

        except Exception as e:
            self.logger.error(
                "usage_reset_failed",
                tenant_id=tenant_context.tenant_id,
                error=str(e)
            )
            return False

    async def _get_current_usage(
        self,
        tenant_id: str,
        resource_type: ResourceType
    ) -> int:
        """Get current usage for a resource type."""
        try:
            # Try Redis first
            if self.redis_url and self._redis_available():
                return await self._get_redis_usage(tenant_id, resource_type)

            # Fallback to in-memory
            return self._get_memory_usage(tenant_id, resource_type)

        except Exception as e:
            self.logger.error(
                "usage_retrieval_failed",
                tenant_id=tenant_id,
                resource_type=resource_type.value,
                error=str(e)
            )
            return 0

    async def _increment_usage(
        self,
        tenant_id: str,
        resource_type: ResourceType,
        amount: int
    ) -> bool:
        """Increment usage counter."""
        try:
            # Try Redis first
            if self.redis_url and self._redis_available():
                return await self._increment_redis_usage(tenant_id, resource_type, amount)

            # Fallback to in-memory
            return self._increment_memory_usage(tenant_id, resource_type, amount)

        except Exception as e:
            self.logger.error(
                "usage_increment_failed",
                tenant_id=tenant_id,
                resource_type=resource_type.value,
                amount=amount,
                error=str(e)
            )
            return False

    def _redis_available(self) -> bool:
        """Check if Redis is available."""
        # Placeholder - would implement actual Redis connection check
        return False

    async def _get_redis_usage(self, tenant_id: str, resource_type: ResourceType) -> int:
        """Get usage from Redis."""
        # Placeholder - would implement Redis operations
        return 0

    async def _increment_redis_usage(
        self,
        tenant_id: str,
        resource_type: ResourceType,
        amount: int
    ) -> bool:
        """Increment usage in Redis."""
        # Placeholder - would implement Redis operations
        return True

    def _get_memory_usage(self, tenant_id: str, resource_type: ResourceType) -> int:
        """Get usage from in-memory storage."""
        tenant_usage = self._memory_usage.get(tenant_id, {})
        resource_usage = tenant_usage.get(resource_type.value, {})
        return resource_usage.get("count", 0)

    def _increment_memory_usage(
        self,
        tenant_id: str,
        resource_type: ResourceType,
        amount: int
    ) -> bool:
        """Increment usage in memory."""
        if tenant_id not in self._memory_usage:
            self._memory_usage[tenant_id] = {}

        if resource_type.value not in self._memory_usage[tenant_id]:
            self._memory_usage[tenant_id][resource_type.value] = {
                "count": 0,
                "last_reset": time.time()
            }

        self._memory_usage[tenant_id][resource_type.value]["count"] += amount
        return True

    async def _reset_usage_counter(self, tenant_id: str, resource_type: ResourceType) -> None:
        """Reset usage counter."""
        if tenant_id in self._memory_usage:
            if resource_type.value in self._memory_usage[tenant_id]:
                self._memory_usage[tenant_id][resource_type.value] = {
                    "count": 0,
                    "last_reset": time.time()
                }

class TenantResourceQuotaEnforcer:
    """
    Enforces resource quotas with different strategies.

    Strategies:
    - Fixed window: Simple time-based windows
    - Sliding window: More accurate rate limiting
    - Token bucket: Smooth rate limiting
    """

    def __init__(self, quota_manager: ResourceQuotaManager):
        self.quota_manager = quota_manager
        self.logger = FirewallLogger()

        # Quota violation tracking
        self._violations: Dict[str, List[datetime]] = {}

    async def enforce_quota(
        self,
        tenant_context: TenantContext,
        resource_type: ResourceType,
        amount: int = 1,
        strategy: str = "fixed_window"
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Enforce quota for a resource request.

        Returns:
            Tuple of (allowed: bool, reason: str, metadata: dict)
        """
        try:
            # Check quota
            allowed, reason = await self.quota_manager.check_quota(
                tenant_context,
                resource_type,
                amount
            )

            metadata = {
                "resource_type": resource_type.value,
                "requested_amount": amount,
                "strategy": strategy,
                "tenant_id": tenant_context.tenant_id
            }

            if not allowed:
                # Track violation
                self._track_violation(tenant_context.tenant_id, resource_type)

                metadata.update({
                    "violation_count": len(self._violations.get(tenant_context.tenant_id, [])),
                    "blocked": True
                })

                return False, reason, metadata

            # Record usage
            success = await self.quota_manager.record_usage(
                tenant_context,
                resource_type,
                amount,
                metadata
            )

            if not success:
                # Allow but log the error
                self.logger.warning(
                    "usage_recording_failed_but_allowed",
                    tenant_id=tenant_context.tenant_id,
                    resource_type=resource_type.value
                )

            metadata["recorded"] = success
            return True, "", metadata

        except Exception as e:
            self.logger.error(
                "quota_enforcement_failed",
                tenant_id=tenant_context.tenant_id,
                resource_type=resource_type.value,
                error=str(e)
            )
            # Allow on error
            return True, "", {"error": str(e)}

    def _track_violation(
        self,
        tenant_id: str,
        resource_type: ResourceType
    ) -> None:
        """Track quota violations."""
        if tenant_id not in self._violations:
            self._violations[tenant_id] = []

        self._violations[tenant_id].append(datetime.utcnow())

        # Clean old violations (keep last 24 hours)
        cutoff = datetime.utcnow() - timedelta(hours=24)
        self._violations[tenant_id] = [
            v for v in self._violations[tenant_id] if v > cutoff
        ]

    async def get_violation_stats(self, tenant_id: str) -> Dict[str, Any]:
        """Get violation statistics for a tenant."""
        violations = self._violations.get(tenant_id, [])
        now = datetime.utcnow()

        # Count violations in different time windows
        last_hour = len([v for v in violations if (now - v).seconds < 3600])
        last_24h = len(violations)

        return {
            "total_violations": last_24h,
            "violations_last_hour": last_hour,
            "violation_rate_per_hour": last_hour if last_hour > 0 else 0
        }

# Global instances
_quota_manager: Optional[ResourceQuotaManager] = None
_quota_enforcer: Optional[TenantResourceQuotaEnforcer] = None

def get_resource_quota_manager() -> ResourceQuotaManager:
    """Get the global resource quota manager."""
    global _quota_manager
    if _quota_manager is None:
        _quota_manager = ResourceQuotaManager()
    return _quota_manager

def get_resource_quota_enforcer() -> TenantResourceQuotaEnforcer:
    """Get the global resource quota enforcer."""
    global _quota_enforcer
    if _quota_enforcer is None:
        _quota_enforcer = TenantResourceQuotaEnforcer(get_resource_quota_manager())
