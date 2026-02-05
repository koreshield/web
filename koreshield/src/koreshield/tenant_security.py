"""
Cross-Tenant Security Measures and Tenant-Specific Audit Logging
===============================================================

Ensures complete isolation between tenants and comprehensive audit trails.
"""

import asyncio
import json
import hashlib
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
import uuid

from .tenant_models import TenantContext, TenantAuditLog, Tenant
from .tenant_utils import get_current_tenant, get_current_request_id
from .logger import FirewallLogger

class CrossTenantSecurityEnforcer:
    """
    Enforces security measures to prevent cross-tenant data leakage and attacks.

    Features:
    - Tenant boundary validation
    - Data access control
    - Request isolation verification
    - Cross-tenant attack detection
    """

    def __init__(self):
        self.logger = FirewallLogger()
        self._active_sessions: Dict[str, Set[str]] = {}  # tenant_id -> session_ids

    async def validate_tenant_boundary(
        self,
        requested_tenant_id: str,
        current_tenant_context: Optional[TenantContext] = None
    ) -> Tuple[bool, str]:
        """
        Validate that a request doesn't cross tenant boundaries.

        Returns:
            Tuple of (valid: bool, reason: str)
        """
        if not current_tenant_context:
            return False, "No tenant context available"

        if requested_tenant_id != current_tenant_context.tenant_id:
            reason = f"Cross-tenant access attempt: requested={requested_tenant_id}, " \
                    f"current={current_tenant_context.tenant_id}"
            await self._log_security_event(
                "cross_tenant_access_attempt",
                current_tenant_context,
                {"requested_tenant": requested_tenant_id}
            )
            return False, reason

        return True, ""

    async def validate_data_access(
        self,
        data_tenant_id: str,
        current_tenant_context: TenantContext,
        operation: str
    ) -> Tuple[bool, str]:
        """
        Validate data access permissions across tenant boundaries.

        Args:
            data_tenant_id: Tenant ID of the data being accessed
            current_tenant_context: Current request tenant context
            operation: Type of operation (read, write, delete)

        Returns:
            Tuple of (allowed: bool, reason: str)
        """
        if data_tenant_id != current_tenant_context.tenant_id:
            reason = f"Data access violation: {operation} on {data_tenant_id} data " \
                    f"from tenant {current_tenant_context.tenant_id}"
            await self._log_security_event(
                "data_access_violation",
                current_tenant_context,
                {
                    "data_tenant": data_tenant_id,
                    "operation": operation
                }
            )
            return False, reason

        return True, ""

    async def validate_session_isolation(
        self,
        session_id: str,
        current_tenant_context: TenantContext
    ) -> Tuple[bool, str]:
        """
        Ensure session belongs to the correct tenant.

        Returns:
            Tuple of (valid: bool, reason: str)
        """
        tenant_sessions = self._active_sessions.get(current_tenant_context.tenant_id, set())

        if session_id not in tenant_sessions:
            # Check if session exists in another tenant (security issue)
            for tenant_id, sessions in self._active_sessions.items():
                if tenant_id != current_tenant_context.tenant_id and session_id in sessions:
                    reason = f"Session isolation violation: session {session_id} " \
                            f"belongs to tenant {tenant_id}, accessed by {current_tenant_context.tenant_id}"
                    await self._log_security_event(
                        "session_isolation_violation",
                        current_tenant_context,
                        {
                            "session_id": session_id,
                            "actual_tenant": tenant_id
                        }
                    )
                    return False, reason

        return True, ""

    async def track_active_session(
        self,
        session_id: str,
        tenant_context: TenantContext,
        action: str = "start"
    ) -> None:
        """Track active sessions per tenant."""
        if tenant_context.tenant_id not in self._active_sessions:
            self._active_sessions[tenant_context.tenant_id] = set()

        if action == "start":
            self._active_sessions[tenant_context.tenant_id].add(session_id)
        elif action == "end":
            self._active_sessions[tenant_context.tenant_id].discard(session_id)

    async def detect_anomalous_activity(
        self,
        tenant_context: TenantContext,
        activity_pattern: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Detect anomalous cross-tenant or suspicious activity.

        Returns:
            Alert dict if anomaly detected, None otherwise
        """
        # Simple anomaly detection - in production, this would use ML models
        anomalies = []

        # Check for rapid tenant switching
        if "tenant_switches" in activity_pattern:
            switches = activity_pattern["tenant_switches"]
            if len(switches) > 10:  # Arbitrary threshold
                anomalies.append({
                    "type": "rapid_tenant_switching",
                    "severity": "high",
                    "details": f"{len(switches)} tenant switches detected"
                })

        # Check for data access patterns
        if "cross_tenant_queries" in activity_pattern:
            queries = activity_pattern["cross_tenant_queries"]
            if queries > 0:
                anomalies.append({
                    "type": "cross_tenant_data_access",
                    "severity": "critical",
                    "details": f"{queries} cross-tenant queries detected"
                })

        if anomalies:
            alert = {
                "tenant_id": tenant_context.tenant_id,
                "timestamp": datetime.utcnow().isoformat(),
                "anomalies": anomalies,
                "activity_pattern": activity_pattern
            }

            await self._log_security_event(
                "anomalous_activity_detected",
                tenant_context,
                alert
            )

            return alert

        return None

    async def _log_security_event(
        self,
        event_type: str,
        tenant_context: TenantContext,
        details: Dict[str, Any]
    ) -> None:
        """Log a security event."""
        await TenantAuditLogger.log_event(
            tenant_context=tenant_context,
            event_type=f"security_{event_type}",
            event_category="security",
            severity="high",
            message=f"Cross-tenant security event: {event_type}",
            details=details,
            source_ip=getattr(tenant_context, 'source_ip', None),
            user_id=getattr(tenant_context, 'user_id', None)
        )

class TenantAuditLogger:
    """
    Tenant-specific audit logging with isolation and compliance features.

    Features:
    - Tenant-isolated audit logs
    - Compliance tagging (GDPR, SOC2, HIPAA)
    - Retention policy enforcement
    - Search and export capabilities
    """

    def __init__(self):
        self.logger = FirewallLogger()

    @classmethod
    async def log_event(
        cls,
        tenant_context: TenantContext,
        event_type: str,
        event_category: str = "api",
        severity: str = "info",
        message: str = "",
        details: Optional[Dict[str, Any]] = None,
        source_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        status_code: Optional[int] = None,
        requires_retention: bool = False,
        compliance_tags: Optional[List[str]] = None
    ) -> bool:
        """
        Log an audit event for a tenant.

        Returns:
            True if logged successfully, False otherwise
        """
        try:
            from .tenant_database import get_tenant_db_session

            audit_log = TenantAuditLog(
                tenant_id=tenant_context.tenant_uuid,
                event_type=event_type,
                event_category=event_category,
                severity=severity,
                message=message,
                details=details or {},
                source_ip=source_ip,
                user_agent=user_agent,
                user_id=user_id,
                session_id=session_id or get_current_request_id(),
                endpoint=endpoint,
                method=method,
                status_code=status_code,
                requires_retention=requires_retention,
                compliance_tags=compliance_tags or []
            )

            async with get_tenant_db_session() as session:
                session.add(audit_log)
                await session.commit()

            # Also log to main logger
            cls().logger.info(
                "tenant_audit_event",
                tenant_id=tenant_context.tenant_id,
                event_type=event_type,
                severity=severity,
                message=message,
                request_id=get_current_request_id()
            )

            return True

        except Exception as e:
            cls().logger.error(
                "audit_logging_failed",
                tenant_id=tenant_context.tenant_id,
                event_type=event_type,
                error=str(e)
            )
            return False

    @classmethod
    async def log_api_request(
        cls,
        tenant_context: TenantContext,
        endpoint: str,
        method: str,
        status_code: int,
        duration_ms: float,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Log an API request event."""
        severity = "info"
        if status_code >= 400:
            severity = "warning"
        if status_code >= 500:
            severity = "error"

        return await cls.log_event(
            tenant_context=tenant_context,
            event_type="api_request",
            event_category="api",
            severity=severity,
            message=f"API {method} {endpoint} - {status_code}",
            details={
                "duration_ms": duration_ms,
                "response_size": details.get("response_size") if details else None,
                **(details or {})
            },
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code
        )

    @classmethod
    async def log_security_event(
        cls,
        tenant_context: TenantContext,
        event_type: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        blocked: bool = False
    ) -> bool:
        """Log a security-related event."""
        severity = "high" if blocked else "medium"

        return await cls.log_event(
            tenant_context=tenant_context,
            event_type=f"security_{event_type}",
            event_category="security",
            severity=severity,
            message=message,
            details={
                "blocked": blocked,
                **(details or {})
            },
            requires_retention=True,
            compliance_tags=["security"]
        )

    @classmethod
    async def log_admin_action(
        cls,
        tenant_context: TenantContext,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Log an administrative action."""
        message = f"Admin action: {action} on {resource_type}"
        if resource_id:
            message += f" ({resource_id})"

        return await cls.log_event(
            tenant_context=tenant_context,
            event_type=f"admin_{action}",
            event_category="admin",
            severity="info",
            message=message,
            details=details,
            requires_retention=True,
            compliance_tags=["admin", "audit"]
        )

    async def search_audit_logs(
        self,
        tenant_context: TenantContext,
        filters: Dict[str, Any],
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search audit logs for a tenant."""
        try:
            from .tenant_database import get_tenant_db_session

            async with get_tenant_db_session() as session:
                query = session.query(TenantAuditLog).filter(
                    TenantAuditLog.tenant_id == tenant_context.tenant_uuid
                )

                # Apply filters
                if "event_type" in filters:
                    query = query.filter(TenantAuditLog.event_type == filters["event_type"])

                if "event_category" in filters:
                    query = query.filter(TenantAuditLog.event_category == filters["event_category"])

                if "severity" in filters:
                    query = query.filter(TenantAuditLog.severity == filters["severity"])

                if "user_id" in filters:
                    query = query.filter(TenantAuditLog.user_id == filters["user_id"])

                if "start_date" in filters:
                    query = query.filter(TenantAuditLog.timestamp >= filters["start_date"])

                if "end_date" in filters:
                    query = query.filter(TenantAuditLog.timestamp <= filters["end_date"])

                # Get total count
                total_count = await session.execute(
                    session.query(TenantAuditLog).filter(
                        TenantAuditLog.tenant_id == tenant_context.tenant_uuid
                    ).count()
                )
                total_count = total_count.scalar()

                # Apply pagination
                query = query.order_by(TenantAuditLog.timestamp.desc())
                query = query.limit(limit).offset(offset)

                result = await session.execute(query)
                logs = result.scalars().all()

                return {
                    "total_count": total_count,
                    "limit": limit,
                    "offset": offset,
                    "logs": [
                        {
                            "id": str(log.id),
                            "event_type": log.event_type,
                            "event_category": log.event_category,
                            "severity": log.severity,
                            "message": log.message,
                            "details": log.details,
                            "timestamp": log.timestamp.isoformat(),
                            "source_ip": log.source_ip,
                            "user_id": log.user_id,
                            "endpoint": log.endpoint,
                            "method": log.method,
                            "status_code": log.status_code
                        }
                        for log in logs
                    ]
                }

        except Exception as e:
            self.logger.error(
                "audit_log_search_failed",
                tenant_id=tenant_context.tenant_id,
                error=str(e)
            )
            return {"total_count": 0, "logs": []}

    async def export_audit_logs(
        self,
        tenant_context: TenantContext,
        filters: Dict[str, Any],
        format: str = "json"
    ) -> Optional[str]:
        """Export audit logs for compliance purposes."""
        try:
            search_results = await self.search_audit_logs(
                tenant_context, filters, limit=10000  # Reasonable limit for export
            )

            if format == "json":
                return json.dumps(search_results, indent=2, default=str)
            elif format == "csv":
                # Simple CSV export
                lines = ["timestamp,event_type,severity,message,user_id,source_ip"]
                for log in search_results["logs"]:
                    lines.append(",".join([
                        log["timestamp"],
                        log["event_type"],
                        log["severity"],
                        f'"{log["message"]}"',
                        log["user_id"] or "",
                        log["source_ip"] or ""
                    ]))
                return "\n".join(lines)

            return None

        except Exception as e:
            self.logger.error(
                "audit_log_export_failed",
                tenant_id=tenant_context.tenant_id,
                error=str(e)
            )
            return None

    async def cleanup_old_logs(self, tenant_context: TenantContext) -> int:
        """Clean up old audit logs based on retention policy."""
        try:
            from .tenant_database import get_tenant_db_session

            retention_days = tenant_context.get_config("audit_retention_days", 90)
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)

            async with get_tenant_db_session() as session:
                # Delete old logs (but keep those marked for retention)
                result = await session.execute(
                    session.query(TenantAuditLog).filter(
                        TenantAuditLog.tenant_id == tenant_context.tenant_uuid,
                        TenantAuditLog.timestamp < cutoff_date,
                        TenantAuditLog.requires_retention == False
                    ).delete()
                )

                deleted_count = result.rowcount
                await session.commit()

                if deleted_count > 0:
                    self.logger.info(
                        "audit_logs_cleaned",
                        tenant_id=tenant_context.tenant_id,
                        deleted_count=deleted_count,
                        retention_days=retention_days
                    )

                return deleted_count

        except Exception as e:
            self.logger.error(
                "audit_log_cleanup_failed",
                tenant_id=tenant_context.tenant_id,
                error=str(e)
            )
            return 0

# Global instances
_security_enforcer: Optional[CrossTenantSecurityEnforcer] = None
_audit_logger: Optional[TenantAuditLogger] = None

def get_cross_tenant_security_enforcer() -> CrossTenantSecurityEnforcer:
    """Get the global cross-tenant security enforcer."""
    global _security_enforcer
    if _security_enforcer is None:
        _security_enforcer = CrossTenantSecurityEnforcer()
    return _security_enforcer

def get_tenant_audit_logger() -> TenantAuditLogger:
    """Get the global tenant audit logger."""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = TenantAuditLogger()
