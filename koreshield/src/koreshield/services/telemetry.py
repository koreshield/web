"""
Telemetry and Audit service for KoreShield.
Handles metrics, logging, and statistics.
"""

import uuid
import structlog
import asyncio
from datetime import datetime, timezone
from collections import deque

logger = structlog.get_logger(__name__)

class TelemetryService:
    def __init__(self, monitoring_system, redis_client=None, db_session_factory=None):
        self.monitoring = monitoring_system
        self.redis_client = redis_client
        self.db_session_factory = db_session_factory
        
        self.stats_keys = {
            "requests_total": "koreshield:stats:requests_total",
            "requests_allowed": "koreshield:stats:requests_allowed",
            "requests_blocked": "koreshield:stats:requests_blocked",
            "attacks_detected": "koreshield:stats:attacks_detected",
            "errors": "koreshield:stats:errors",
        }
        
        # In-memory fallback
        self.stats = {stat_name: 0 for stat_name in self.stats_keys.keys()}
        self.audit_log_store = deque(maxlen=500)

    def get_stats(self) -> dict:
        """Get current statistics."""
        if self.redis_client:
            stats = {}
            for stat_name, redis_key in self.stats_keys.items():
                try:
                    value = self.redis_client.get(redis_key)
                    stats[stat_name] = int(value) if value else 0
                except Exception as e:
                    logger.error(f"Failed to get stat {stat_name}", error=str(e))
                    stats[stat_name] = 0
            return stats
        return self.stats

    def increment_stat(self, stat_name: str, amount: int = 1):
        """Increment a statistic counter."""
        if self.redis_client and stat_name in self.stats_keys:
            try:
                redis_key = self.stats_keys[stat_name]
                self.redis_client.incrby(redis_key, amount)
            except Exception as e:
                logger.error(f"Failed to increment stat {stat_name}", error=str(e))
        else:
            self.stats[stat_name] = self.stats.get(stat_name, 0) + amount

    def build_audit_entry(self, log_data: dict) -> dict:
        """Normalize request log payloads for management log responses."""
        timestamp = log_data.get("timestamp")
        if isinstance(timestamp, datetime):
            timestamp_value = timestamp.isoformat()
        else:
            timestamp_value = str(timestamp or datetime.now(timezone.utc).isoformat())

        status_code = log_data.get("status_code", 200)
        is_blocked = bool(log_data.get("is_blocked"))

        return {
            "id": str(uuid.uuid4()),
            "request_id": log_data.get("request_id"),
            "timestamp": timestamp_value,
            "event": "request_log",
            "path": log_data.get("path"),
            "method": log_data.get("method"),
            "provider": log_data.get("provider"),
            "model": log_data.get("model"),
            "status": "failure" if is_blocked or status_code >= 400 else "success",
            "status_code": status_code,
            "latency_ms": log_data.get("latency_ms"),
            "tokens_total": log_data.get("tokens_total", 0),
            "cost": log_data.get("cost", 0.0),
            "is_blocked": is_blocked,
            "attack_detected": bool(log_data.get("attack_detected")),
            "attack_type": log_data.get("attack_type"),
            "attack_details": log_data.get("attack_details") or {},
            "user_id": str(log_data.get("user_id")) if log_data.get("user_id") else None,
            "ip": log_data.get("ip_address"),
            "user_agent": log_data.get("user_agent"),
        }

    def append_audit_log(self, entry: dict) -> None:
        """Store an audit entry in memory."""
        if entry:
            self.audit_log_store.appendleft(entry)

    def queue_request_log(self, log_data: dict) -> None:
        """Record a request log and persist asynchronously."""
        entry = self.build_audit_entry(log_data)
        self.append_audit_log(entry)
        
        if self.db_session_factory:
            from ..models.request_log import RequestLog
            async def log_async():
                try:
                    async with self.db_session_factory() as session:
                        log_entry = RequestLog(**log_data)
                        session.add(log_entry)
                        await session.commit()
                except Exception as e:
                    logger.error("Failed to log request to DB", error=str(e))
            
            asyncio.create_task(log_async())

    def queue_rag_scan(self, principal, scan_id, user_query, documents, response_data):
        """Record a RAG scan and persist asynchronously."""
        if not self.db_session_factory:
            # Fallback to audit log
            self.append_audit_log({"event": "rag_scan", "scan_id": scan_id, "is_safe": response_data.get("is_safe")})
            return

        from ..models.rag_scan import RagScan
        async def log_rag_async():
            try:
                async with self.db_session_factory() as session:
                    entry = RagScan(
                        scan_id=scan_id,
                        user_id=principal.get("user_id"),
                        api_key_id=principal.get("api_key_id"),
                        user_query=user_query,
                        documents=documents,
                        response=response_data,
                        is_safe=bool(response_data.get("is_safe", True)),
                        total_threats_found=int(response_data.get("context_analysis", {}).get("total_threats_found", 0)),
                        processing_time_ms=float(response_data.get("latency_ms", 0.0)),
                    )
                    session.add(entry)
                    await session.commit()
            except Exception as e:
                logger.error("Failed to log RAG scan to DB", error=str(e))
        
        asyncio.create_task(log_rag_async())

    async def get_metrics(self):
        """Get Prometheus metrics."""
        return self.monitoring.get_metrics_text()
