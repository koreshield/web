"""
Main proxy server that intercepts LLM API requests.
"""

import json
import io
import zipfile
import os
import uuid
import time
import contextlib
import copy
from collections import deque
from contextlib import asynccontextmanager
from typing import Optional
from datetime import datetime, timezone
import asyncio

import httpx
import structlog
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import select, func, delete

from .detector import AttackDetector
from .logger import FirewallLogger
from .rag_taxonomy import RetrievedDocument
from .database import AsyncSessionLocal
from .models.request_log import RequestLog
from .models.rag_scan import RagScan
from .api.auth import init_jwt_config

# New Service Architecture
from .services.auth import AuthService
from .services.telemetry import TelemetryService
from .services.provider import ProviderService
from .services.security import SecurityService
from .services.governance import GovernanceService
from .services.operational_status import OperationalStatusService
from .services.audit_integrity import AuditIntegrityService

logger = structlog.get_logger(__name__)

from fastapi.middleware.cors import CORSMiddleware
from .api.management import router as management_router, provision_test_key as _provision_test_key
from .api.analytics import router as analytics_router
from .api.rbac import router as rbac_router
from .api.reports import router as reports_router
from .api.teams import router as teams_router
from .api.rules import router as rules_router
from .api.alerts import router as alerts_router
from .api.billing import router as billing_router
from .api import websocket as websocket_module
from .api.websocket import router as websocket_router


from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

class KoreShieldProxy:
    """
    Main proxy class that handles requests between applications and LLM providers.
    """

    def __init__(self, config: dict):
        """
        Initialize the KoreShield proxy.

        Args:
            config: Configuration dictionary
        """
        self.config = copy.deepcopy(config)

        # Initialize JWT configuration before any service uses auth
        init_jwt_config(self.config)
        self.app = FastAPI(
            title="KoreShield API",
            version="1.1.0",
            description="""
            Enterprise LLM Security Platform

            ## Getting Started
            1. Sign up: Create an account at /v1/management/signup
            2. Login: Get your JWT token from /v1/management/login
            3. Authorize: Click the Authorize button above and paste your token
            4. Use the API: Send prompts through /v1/chat/completions with automatic security scanning

            ## Core Features
            - Real-time Threat Detection: Automatic scanning of all LLM interactions
            - Multi-Provider Support: OpenAI, Anthropic, DeepSeek, Gemini, Azure OpenAI
            - Analytics and Monitoring: Track costs, usage, attack vectors, provider performance, and compliance posture
            - Policy Management: Configure security rules and access controls
            - Team Collaboration: Multi-tenant support with RBAC
            """,
            openapi_tags=[
                {"name": "Authentication", "description": "User signup, login, JWT authentication, and account management"},
                {"name": "OAuth", "description": "Sign in with GitHub or Google — initiates the OAuth flow and exchanges the authorization code for a KoreShield session"},
                {"name": "API Keys", "description": "Generate, list, inspect, and revoke API keys for SDK and direct API access"},
                {"name": "Chat", "description": "OpenAI-compatible chat completions endpoint with built-in threat detection and provider routing"},
                {"name": "Scan", "description": "Direct prompt scanning, batch scanning, tool call scanning, governed runtime sessions, and review workflows"},
                {"name": "Management", "description": "Dashboard configuration, request logs, security policies, and platform statistics"},
                {"name": "Rules", "description": "Custom detection rules: create, update, delete, and test pattern-based rules"},
                {"name": "Alerts", "description": "Alert rules and notification channels: configure conditions, severities, cooldowns, and delivery channels"},
                {"name": "Analytics", "description": "Usage analytics, cost tracking, attack vector distribution, top targeted endpoints, provider performance metrics, and real-time compliance posture"},
                {"name": "RBAC", "description": "Role-based access control: manage users, roles, and permission assignments"},
                {"name": "Reports", "description": "Security reports: templates, scheduling, generation, and download"},
                {"name": "Teams", "description": "Team and organisation management: members, roles, invites, and shared dashboards"},
                {"name": "Billing", "description": "Subscription management via Polar: account state, checkout, customer portal, and webhooks"},
                {"name": "WebSocket", "description": "Real-time event streaming over WebSocket"},
                {"name": "Health", "description": "System health checks, provider status, Prometheus metrics, and live statistics"},
            ],
            contact={
                "name": "KoreShield",
                "email": "hello@koreshield.com",
                "url": "https://koreshield.com"
            },
            license_info={
                "name": "Proprietary",
                "url": "https://koreshield.com/terms"
            },
            lifespan=self._lifespan,
        )

        # 1. Initialize Logging
        self.logger = FirewallLogger()

        # 2. Initialize Redis connection
        redis_config = config.get("redis", {})
        redis_enabled = redis_config.get("enabled", True)
        # The example config stores url as "${REDIS_URL}" (a YAML literal that Python
        # does NOT expand). Detect unexpanded placeholders and fall back to the env var.
        _redis_url_raw = str(redis_config.get("url") or "")
        if not _redis_url_raw or "${" in _redis_url_raw:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        else:
            redis_url = _redis_url_raw

        if redis_enabled:
            try:
                import redis
                import redis.asyncio as aioredis
                self.redis_client = redis.from_url(redis_url)
                self.redis_async_client = aioredis.from_url(redis_url)
                self.redis_client.ping()
            except Exception as e:
                logger.error("Failed to connect to Redis", error=str(e))
                self.redis_client = None
                self.redis_async_client = None
        else:
            self.redis_client = None
            self.redis_async_client = None

        # 2. Initialize Rate Limiter
        if self.redis_client:
            storage_uri = f"{redis_url}/1"
            self.limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)
        else:
            self.limiter = Limiter(key_func=get_remote_address)
        
        self.app.state.limiter = self.limiter
        self.app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
        self.app.add_middleware(SlowAPIMiddleware)

        # Global fallback: ensure unhandled exceptions return JSON with CORS headers
        # (Starlette's ServerErrorMiddleware would otherwise return a bare 500 HTML
        # response before CORSMiddleware can attach Allow-Origin headers, causing
        # the browser to report a CORS error instead of the real HTTP 500.)
        @self.app.exception_handler(Exception)
        async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
            logger.error(
                "unhandled_exception",
                path=str(request.url.path),
                error=str(exc),
                exc_info=True,
            )
            origin = request.headers.get("origin", "")
            cors_origins = [
                "https://koreshield.com",
                "https://www.koreshield.com",
                "https://api.koreshield.com",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8000",
            ]
            headers = {}
            if origin in cors_origins:
                headers["Access-Control-Allow-Origin"] = origin
                headers["Access-Control-Allow-Credentials"] = "true"
            return JSONResponse(
                status_code=500,
                content={"error": "internal_server_error", "message": "An unexpected error occurred."},
                headers=headers,
            )

        # 3. Initialize Base Security Components
        security_config = config.get("security", {})
        self.detector = AttackDetector(security_config)
        self.app.state.detector = self.detector

        # 4. Initialize status and monitoring systems
        self.audit_integrity = AuditIntegrityService()
        self.operational_status = OperationalStatusService()

        from .monitoring import MonitoringSystem
        from .config import KoreShieldConfig
        kore_config = KoreShieldConfig()
        kore_config.load_from_dict(copy.deepcopy(config))
        self.monitoring = MonitoringSystem(
            kore_config.monitoring,
            stats_getter=lambda: self.telemetry.get_stats() if hasattr(self, "telemetry") else {},
            event_publisher=self._publish_event,
            status_getter=self._handle_status,
        )
        self.app.state.monitoring = self.monitoring

        # 5. Initialize Modular Services
        self.telemetry = TelemetryService(
            monitoring_system=self.monitoring,
            redis_client=self.redis_client,
            db_session_factory=AsyncSessionLocal,
            audit_integrity_service=self.audit_integrity,
        )
        self.auth = AuthService(db_session_factory=AsyncSessionLocal)
        
        # Override provider enabled status from environment if ENABLED_PROVIDERS is set
        enabled_providers_env = os.getenv("ENABLED_PROVIDERS")
        if enabled_providers_env:
            enabled_list = [p.strip().lower() for p in enabled_providers_env.split(",")]
            providers_config = config.get("providers", {})
            for provider_name in providers_config:
                providers_config[provider_name]["enabled"] = provider_name in enabled_list
                # Log if we are overriding
                self.logger.logger.info(f"Provider {provider_name} status overridden by ENABLED_PROVIDERS: {providers_config[provider_name]['enabled']}")

        self.provider_service = ProviderService(config, redis_client=self.redis_client)
        self.security = SecurityService(config)
        self.governance = GovernanceService(config, self.detector)

        # 6. Initialize State & Store
        self.app.state.config = self.config
        self.app.state.scan_store = deque(maxlen=1000)
        self.app.state.scan_index = {}
        self.app.state.rag_scan_store = deque(maxlen=250)
        self.app.state.rag_scan_index = {}
        self.app.state.audit_log_store = self.telemetry.audit_log_store
        self.app.state.audit_integrity = self.audit_integrity
        self.app.state.operational_status = self.operational_status
        
        # Router-required state
        self.app.state.policy_engine = self.security.policy_engine
        self.app.state.security = self.security
        self.app.state.governance = self.governance
        self.app.state.stats = self.telemetry.get_stats()

        # 7. Setup Routers & Middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                "https://koreshield.com",
                "https://www.koreshield.com",
                "https://api.koreshield.com",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8000"
            ],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        self.app.include_router(management_router, prefix="/v1/management")
        self.app.include_router(analytics_router, prefix="/v1")
        self.app.include_router(rbac_router, prefix="/v1")
        self.app.include_router(reports_router, prefix="/v1")
        self.app.include_router(teams_router, prefix="/v1")
        self.app.include_router(rules_router, prefix="/v1")
        self.app.include_router(alerts_router, prefix="/v1")
        self.app.include_router(billing_router, prefix="/v1")
        self.app.include_router(websocket_router)

        # Internal CI/CD management endpoints (no prefix → /internal/…)
        from fastapi import APIRouter as _APIRouter
        _internal_router = _APIRouter(prefix="/internal", tags=["Internal"])
        _internal_router.add_api_route(
            "/test-keys",
            _provision_test_key,
            methods=["POST"],
            include_in_schema=False,
        )
        self.app.include_router(_internal_router)

        if self.redis_async_client:
            websocket_module.set_redis_client(self.redis_async_client)
        
        self._setup_routes()

        # Emit system status updates on lifecycle events
        @self.app.on_event("startup")
        async def _startup_event():
            # Start background health monitoring
            await self.start_monitoring()
            asyncio.create_task(self._background_heartbeat())
            await self._handle_event_broadcast("system_status", {"status": "online", "version": self.app.version})

        @self.app.on_event("shutdown")
        async def _shutdown_event():
            await self._handle_event_broadcast("system_status", {"status": "shutdown"})
            await self.stop_monitoring()

    async def _handle_event_broadcast(self, event_type: str, data: dict) -> None:
        """Centralized and throttled event broadcast over WebSockets."""
        try:
            await self._publish_event(event_type, data)
        except Exception as e:
            logger.debug("Broadcast failed", error=str(e))

    async def _background_heartbeat(self):
        """Periodically refresh system health and broadcast changes."""
        last_snapshot = None
        while True:
            try:
                # Refresh health snapshot
                snapshot = await self.provider_service.get_health_snapshot()
                
                # Persist in Redis for reactive status page
                if self.redis_client:
                    self.redis_client.set("koreshield:status:snapshot", json.dumps(snapshot))
                
                # Broadcast changes if health state transitions
                if snapshot != last_snapshot:
                    await self._handle_event_broadcast("system_health_update", snapshot)
                    last_snapshot = snapshot
                
            except Exception as e:
                logger.error("Heartbeat monitoring error", error=str(e))
                
            await asyncio.sleep(60) # Refresh every minute

    async def _publish_event(self, event_type: str, data: dict) -> None:
        """Publish an event over the WebSocket pub/sub channel."""
        await websocket_module.publish_event(event_type, data)

    async def _handle_health(self) -> dict:
        """Health check endpoint."""
        return {
            "status": "healthy",
            "version": "0.1.0"
        }

    async def _handle_health_providers(self) -> dict:
        """Health check for all configured LLM providers."""
        snapshot = await self.provider_service.get_health_snapshot()
        healthy_count = len([p for p in snapshot.values() if p.get("status") == "healthy"])
        enabled_count = len([p for p in snapshot.values() if p.get("enabled")])
        
        return {
            "providers": snapshot,
            "total_providers": len(self.provider_service.providers),
            "healthy_providers": healthy_count,
            "enabled_providers": enabled_count,
            "configured": True
        }

    async def _handle_status(self) -> dict:
        """Dashboard status endpoint."""
        stats = self.telemetry.get_stats()
        providers = await self.provider_service.get_health_snapshot()
        
        # Only enabled providers should affect runtime routing health.
        # Disabled providers can legitimately report a non-healthy status
        # (for example "disabled") without meaning the live routing plane
        # is degraded.
        routing_status = "healthy"
        if any(
            p.get("enabled") and p.get("status") != "healthy"
            for p in providers.values()
        ):
            routing_status = "degraded"
            
        snapshot = {
            "status": "healthy",
            "version": "0.1.0",
            "statistics": stats,
            "providers": providers,
            "components": {
                "provider_routing": {"status": routing_status}
            },
            "total_providers": len(providers),
            "enabled_providers": len([p for p in providers.values() if p.get("enabled")]),
            "initialized_providers": len([p for p in providers.values() if p.get("initialized")]),
        }
        await self.operational_status.record_snapshot(snapshot)
        return snapshot

    async def _handle_metrics(self) -> Response:
        """Prometheus metrics endpoint."""
        metrics_text = await self.telemetry.get_metrics()
        return Response(content=metrics_text, media_type="text/plain")

    @property
    def provider(self):
        """Get the primary (highest priority) provider."""
        return self.provider_service.providers[0] if self.provider_service.providers else None

    async def start_monitoring(self):
        """Start the monitoring system."""
        await self.monitoring.start_monitoring()

    async def stop_monitoring(self):
        """Stop the monitoring system."""
        await self.monitoring.stop_monitoring()

    @asynccontextmanager
    async def _lifespan(self, app: FastAPI):
        monitor_task = asyncio.create_task(self.provider_service.health_monitor.start_monitoring())
        try:
            yield
        finally:
            monitor_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await monitor_task

    def _setup_routes(self):
        """Set up FastAPI routes."""

        rate_limit = self.config.get("security", {}).get("rate_limit", "60/minute")

        # Health check endpoint
        @self.app.get("/health", tags=["Health"], summary="Health Check")
        async def health():
            return JSONResponse(content=await self._handle_health())

        # Provider health check endpoint
        @self.app.get("/health/providers", tags=["Health"], summary="Provider Health")
        async def provider_health():
            return JSONResponse(content=await self._handle_health_providers())

        # Status/metrics endpoint
        @self.app.get("/status", tags=["Health"], summary="System Status")
        async def status():
            return JSONResponse(content=await self._handle_status())

        @self.app.get("/health/status", tags=["Health"], summary="Operational Status Report")
        async def operational_status():
            snapshot = await self._handle_status()
            report = await self.operational_status.get_public_status_report(snapshot)
            return JSONResponse(content=report)

        # Prometheus metrics endpoint
        @self.app.get("/metrics", tags=["Health"], summary="Prometheus Metrics")
        async def metrics():
            return await self._handle_metrics()

        # OpenAI-compatible chat completions endpoint
        @self.app.post(
            "/v1/chat/completions",
            tags=["Chat"],
            summary="Protected Chat Completions",
            description=(
                "OpenAI-compatible chat completions endpoint with built-in threat detection. "
                "Drop-in replacement for OpenAI's `/v1/chat/completions`.\n\n"
                "**Streaming**: Pass `\"stream\": true` in the request body to receive a "
                "`text/event-stream` (Server-Sent Events) response in OpenAI SSE format.\n\n"
                "**Model routing** (automatic — no config needed):\n"
                "- `gpt-*` / `o1-*` / `o3-*` → OpenAI\n"
                "- `claude-*` → Anthropic\n"
                "- `gemini-*` → Google Gemini\n"
                "- `deepseek-*` → DeepSeek\n\n"
                "If the preferred provider is unavailable, KoreShield fails over to the next "
                "healthy provider automatically."
            ),
        )
        @self.limiter.limit(rate_limit)
        async def chat_completions(request: Request):
            return await self._handle_chat_completion(request)

        # RAG context scanning endpoint
        @self.app.post("/v1/rag/scan", tags=["Chat"], summary="Scan RAG Context", description="Scan retrieved documents for indirect prompt injection threats before passing to the LLM.")
        @self.limiter.limit(rate_limit)
        async def rag_scan(request: Request):
            return await self._handle_rag_scan(request)

        @self.app.get("/v1/rag/scans", tags=["Chat"], summary="List RAG Scans", description="Retrieve the history of RAG security scans with pagination.")
        @self.limiter.limit(rate_limit)
        async def list_rag_scans(request: Request, limit: int = 50, offset: int = 0):
            principal = await self._authenticate_request(request)

            if AsyncSessionLocal:
                async with AsyncSessionLocal() as session:
                    base_query = select(RagScan)
                    count_query = select(func.count()).select_from(RagScan)

                    if principal.get("user_id"):
                        base_query = base_query.where(RagScan.user_id == principal["user_id"])
                        count_query = count_query.where(RagScan.user_id == principal["user_id"])
                    elif principal.get("api_key_id"):
                        base_query = base_query.where(RagScan.api_key_id == principal["api_key_id"])
                        count_query = count_query.where(RagScan.api_key_id == principal["api_key_id"])

                    base_query = base_query.order_by(RagScan.created_at.desc()).limit(limit).offset(offset)
                    result = await session.execute(base_query)
                    scans = [row.to_detail_dict() for row in result.scalars().all()]
                    total = await session.execute(count_query)
                    total_count = int(total.scalar() or 0)

                    return {
                        "scans": scans,
                        "total": total_count,
                        "limit": limit,
                        "offset": offset,
                    }

            scans = list(self.app.state.rag_scan_store)
            total = len(scans)
            return {
                "scans": scans[offset: offset + limit],
                "total": total,
                "limit": limit,
                "offset": offset,
            }

        @self.app.get("/v1/rag/scans/{scan_id}", tags=["Chat"], summary="Get RAG Scan", description="Get the full details of a specific RAG security scan by ID.")
        @self.limiter.limit(rate_limit)
        async def get_rag_scan(scan_id: str, request: Request):
            principal = await self._authenticate_request(request)

            if AsyncSessionLocal:
                async with AsyncSessionLocal() as session:
                    query = select(RagScan).where(RagScan.scan_id == scan_id)
                    if principal.get("user_id"):
                        query = query.where(RagScan.user_id == principal["user_id"])
                    elif principal.get("api_key_id"):
                        query = query.where(RagScan.api_key_id == principal["api_key_id"])
                    result = await session.execute(query)
                    scan = result.scalar_one_or_none()
                    if not scan:
                        raise HTTPException(status_code=404, detail="RAG scan not found")
                    return scan.to_detail_dict()

            scan = self.app.state.rag_scan_index.get(scan_id)
            if not scan:
                raise HTTPException(status_code=404, detail="RAG scan not found")
            return scan

        @self.app.delete("/v1/rag/scans/{scan_id}", tags=["Chat"], summary="Delete RAG Scan", description="Delete a specific RAG security scan record by ID.")
        @self.limiter.limit(rate_limit)
        async def delete_rag_scan(scan_id: str, request: Request):
            principal = await self._authenticate_request(request)

            if not AsyncSessionLocal:
                self.app.state.rag_scan_index.pop(scan_id, None)
                self.app.state.rag_scan_store = deque(
                    [item for item in self.app.state.rag_scan_store if item.get("scan_id") != scan_id],
                    maxlen=250,
                )
                return {"deleted": True}

            async with AsyncSessionLocal() as session:
                query = delete(RagScan).where(RagScan.scan_id == scan_id)
                if principal.get("user_id"):
                    query = query.where(RagScan.user_id == principal["user_id"])
                elif principal.get("api_key_id"):
                    query = query.where(RagScan.api_key_id == principal["api_key_id"])
                result = await session.execute(query)
                await session.commit()
                if result.rowcount == 0:
                    raise HTTPException(status_code=404, detail="RAG scan not found")
                return {"deleted": True}

        @self.app.delete("/v1/rag/scans", tags=["Chat"], summary="Clear All RAG Scans", description="Delete all RAG scan records for the authenticated principal.")
        @self.limiter.limit(rate_limit)
        async def clear_rag_scans(request: Request):
            principal = await self._authenticate_request(request)

            if not AsyncSessionLocal:
                self.app.state.rag_scan_index = {}
                self.app.state.rag_scan_store = deque(maxlen=250)
                return {"deleted": True}

            async with AsyncSessionLocal() as session:
                query = delete(RagScan)
                if principal.get("user_id"):
                    query = query.where(RagScan.user_id == principal["user_id"])
                elif principal.get("api_key_id"):
                    query = query.where(RagScan.api_key_id == principal["api_key_id"])
                await session.execute(query)
                await session.commit()
                return {"deleted": True}

        @self.app.get("/v1/rag/scans/{scan_id}/pack", tags=["Chat"], summary="Download RAG Scan Pack", description="Download the full request, response, and document payloads for a RAG scan as a ZIP archive.")
        @self.limiter.limit(rate_limit)
        async def download_rag_scan_pack(scan_id: str, request: Request):
            principal = await self._authenticate_request(request)

            scan_detail = None
            if AsyncSessionLocal:
                async with AsyncSessionLocal() as session:
                    query = select(RagScan).where(RagScan.scan_id == scan_id)
                    if principal.get("user_id"):
                        query = query.where(RagScan.user_id == principal["user_id"])
                    elif principal.get("api_key_id"):
                        query = query.where(RagScan.api_key_id == principal["api_key_id"])
                    result = await session.execute(query)
                    scan = result.scalar_one_or_none()
                    if scan:
                        scan_detail = scan.to_detail_dict()
            else:
                scan_detail = self.app.state.rag_scan_index.get(scan_id)

            if not scan_detail:
                raise HTTPException(status_code=404, detail="RAG scan not found")

            request_payload = {
                "scan_id": scan_detail.get("scan_id"),
                "timestamp": scan_detail.get("timestamp"),
                "user_query": scan_detail.get("user_query"),
                "documents": scan_detail.get("documents", []),
            }
            response_payload = scan_detail.get("response") or {}

            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
                archive.writestr("request.json", json.dumps(request_payload, indent=2, default=str))
                archive.writestr("response.json", json.dumps(response_payload, indent=2, default=str))
                archive.writestr("documents.json", json.dumps(request_payload.get("documents", []), indent=2, default=str))

            buffer.seek(0)
            headers = {
                "Content-Disposition": f"attachment; filename=rag-scan-{scan_id}.zip"
            }
            return Response(content=buffer.read(), media_type="application/zip", headers=headers)

        # Prompt scanning endpoints
        @self.app.post(
            "/v1/scan",
            tags=["Scan"],
            summary="Scan Prompt",
            description=(
                "Scan a single prompt for threats including prompt injection, PII leakage, "
                "jailbreak attempts, and policy violations.\n\n"
                "**Response fields** (stable contract):\n"
                "- `blocked` — whether KoreShield blocked this prompt\n"
                "- `confidence` — detection confidence 0–1\n"
                "- `attack_type` — primary attack category or `null`\n"
                "- `attack_categories` — all detected categories\n"
                "- `indicators` — specific patterns that triggered detection\n"
                "- `message` — human-readable summary\n"
                "- `request_id` — unique identifier for audit purposes\n"
                "- `severity` — `none | low | medium | high | critical`\n\n"
                "Returns **HTTP 403** when `blocked: true`, **HTTP 200** otherwise."
            ),
        )
        @self.limiter.limit(rate_limit)
        async def scan_prompt(request: Request):
            return await self._handle_scan(request)

        @self.app.post("/v1/scan/batch", tags=["Scan"], summary="Batch Scan Prompts", description="Scan multiple prompts in a single request. Each item is evaluated independently and results are returned in the same order.")
        @self.limiter.limit(rate_limit)
        async def scan_prompt_batch(request: Request):
            return await self._handle_scan_batch(request)

        @self.app.post("/v1/tools/scan", tags=["Scan"], summary="Scan Tool Call", description="Evaluate a tool call for security risks including confused-deputy attacks, excessive permissions, and unsafe argument patterns.")
        @self.limiter.limit(rate_limit)
        async def scan_tool_call(request: Request):
            return await self._handle_tool_scan(request)

        @self.app.post("/v1/tools/sessions", tags=["Scan"], summary="Create Runtime Session", description="Start a governed runtime session to track a sequence of tool calls with policy-backed allow, warn, and block decisions.")
        @self.limiter.limit(rate_limit)
        async def create_tool_runtime_session(request: Request):
            return await self._handle_create_tool_session(request)

        @self.app.get("/v1/tools/sessions", tags=["Scan"], summary="List Runtime Sessions", description="List active and recent governed runtime sessions. Filter by status (active, completed, blocked).")
        @self.limiter.limit(rate_limit)
        async def list_tool_runtime_sessions(request: Request, limit: int = 50, status: str | None = None):
            return await self._handle_list_tool_sessions(request, limit=limit, status=status)

        @self.app.get("/v1/tools/sessions/{session_id}", tags=["Scan"], summary="Get Runtime Session", description="Get the full state and event history of a specific governed runtime session.")
        @self.limiter.limit(rate_limit)
        async def get_tool_runtime_session(session_id: str, request: Request):
            return await self._handle_get_tool_session(request, session_id)

        @self.app.post("/v1/tools/sessions/{session_id}/state", tags=["Scan"], summary="Update Session State", description="Update the state of a governed runtime session, e.g. marking it completed or attaching additional context.")
        @self.limiter.limit(rate_limit)
        async def update_tool_runtime_session(session_id: str, request: Request):
            return await self._handle_update_tool_session_state(request, session_id)

        @self.app.get("/v1/tools/reviews", tags=["Scan"], summary="List Tool Reviews", description="List pending and resolved human-review tickets raised by the runtime tool governance engine.")
        @self.limiter.limit(rate_limit)
        async def list_tool_runtime_reviews(request: Request, limit: int = 50, status: str | None = None):
            return await self._handle_list_tool_reviews(request, limit=limit, status=status)

        @self.app.get("/v1/tools/reviews/{ticket_id}", tags=["Scan"], summary="Get Tool Review", description="Get the full details of a specific tool review ticket including the flagged tool call and its risk assessment.")
        @self.limiter.limit(rate_limit)
        async def get_tool_runtime_review(ticket_id: str, request: Request):
            return await self._handle_get_tool_review(request, ticket_id)

        @self.app.post("/v1/tools/reviews/{ticket_id}/decision", tags=["Scan"], summary="Submit Review Decision", description="Approve or reject a pending tool review ticket. Approvals allow the tool call to proceed; rejections block it and log the decision.")
        @self.limiter.limit(rate_limit)
        async def decide_tool_runtime_review(ticket_id: str, request: Request):
            return await self._handle_review_decision(request, ticket_id)

        @self.app.get("/v1/scans", tags=["Scan"], summary="List Scans", description="List recent prompt scan results with pagination.")
        @self.limiter.limit(rate_limit)
        async def list_scans(request: Request, limit: int = 100, offset: int = 0):
            await self._authenticate_request(request)
            scans = list(self.app.state.scan_store)
            total = len(scans)
            return {
                "scans": scans[offset: offset + limit],
                "total": total,
                "limit": limit,
                "offset": offset,
            }

        @self.app.get("/v1/scans/{scan_id}", tags=["Scan"], summary="Get Scan", description="Get the full details of a prompt scan result.")
        @self.limiter.limit(rate_limit)
        async def get_scan(scan_id: str, request: Request):
            await self._authenticate_request(request)
            scan = self.app.state.scan_index.get(scan_id)
            if not scan:
                raise HTTPException(status_code=404, detail="Scan not found")
            return scan

        # Note: Removed catch-all route to prevent interference with specific routes
        # If needed, implement specific proxy endpoints instead


    async def _log_request_async(self, log_data: dict):
        """Log request to database asynchronously."""
        if not AsyncSessionLocal:
            return
        try:
            async with AsyncSessionLocal() as session:
                log_entry = RequestLog(**log_data)
                session.add(log_entry)
                await session.commit()
        except Exception as e:
            logger.error("Failed to log request to DB", error=str(e))

    def _build_request_audit_entry(self, log_data: dict) -> dict:
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

    def _append_audit_log(self, entry: dict) -> None:
        """Store an audit entry in memory for dashboard visibility."""
        if not entry:
            return
        self.app.state.audit_log_store.appendleft(entry)

    def _queue_request_log(self, log_data: dict) -> None:
        """Record a request log immediately in memory and persist asynchronously."""
        self._append_audit_log(self._build_request_audit_entry(log_data))
        asyncio.create_task(self._log_request_async(log_data))

    @staticmethod
    def _principal_log_fields(principal: dict | None) -> dict:
        """Extract request-log ownership fields from an authenticated principal."""
        if not principal:
            return {}
        return {
            "user_id": principal.get("user_id"),
            "api_key_id": principal.get("api_key_id"),
        }

    def _record_scan_result(self, payload: dict) -> None:
        """Store a prompt scan result for the `/v1/scans` history endpoints."""
        scan_id = payload.get("request_id")
        if not scan_id:
            return
        self.app.state.scan_index[scan_id] = payload
        self.app.state.scan_store.appendleft(payload)

    async def _authenticate_request(self, request: Request) -> dict:
        """Forward to AuthService."""
        return await self.auth.authenticate_request(request)

    async def _handle_chat_completion(self, request: Request) -> Response:
        """
        Handle OpenAI-compatible chat completion requests with security scanning.

        Supports both standard (non-streaming) and streaming (Server-Sent Events)
        responses.  When ``stream: true`` is present in the request body the
        method returns a ``StreamingResponse`` with ``text/event-stream`` content
        type that forwards raw SSE bytes from the selected LLM provider.

        Model-aware routing automatically selects the correct upstream provider
        (OpenAI for ``gpt-*``, Anthropic for ``claude-*``, etc.) and falls back
        to any other healthy provider if the preferred one is unavailable.
        """
        start_time = time.time()

        # Record request metrics
        self.monitoring.metrics.requests_total.labels(
            method=request.method,
            endpoint="/v1/chat/completions",
            status="started"
        ).inc()

        request_id = str(uuid.uuid4())

        try:
            principal = await self._authenticate_request(request)

            # ── Parse body ──────────────────────────────────────────────────
            try:
                body = await request.json()
            except Exception as e:
                logger.error("Failed to parse JSON", request_id=request_id, error=str(e))
                raise HTTPException(status_code=400, detail="Invalid JSON in request body")

            if not isinstance(body, dict):
                raise HTTPException(status_code=400, detail="Request body must be a JSON object")

            messages = body.get("messages", [])
            if not messages or not isinstance(messages, list):
                raise HTTPException(
                    status_code=400, detail="'messages' field is required and must be a list"
                )

            model = body.get("model", "gpt-4o-mini")
            stream = bool(body.get("stream", False))

            # ── Extract user content for security scanning ───────────────────
            user_messages = [
                msg.get("content", "")
                for msg in messages
                if isinstance(msg, dict) and msg.get("role") == "user"
                and isinstance(msg.get("content", ""), str)
            ]
            combined_prompt = " ".join(user_messages)

            if not combined_prompt:
                logger.warning("No user message content found", request_id=request_id)

            self.telemetry.increment_stat("requests_total")
            self.logger.log_request(
                request_id=request_id,
                method="POST",
                path="/v1/chat/completions",
                model=model,
                message_count=len(messages),
            )

            # ── Security scan ────────────────────────────────────────────────
            scan = self.security.scan_prompt(combined_prompt, context={"principal": principal})
            should_block = scan["blocked"]

            if scan["detection"].get("is_attack"):
                await self._handle_event_broadcast(
                    "threat_detected",
                    {
                        "request_id": request_id,
                        "endpoint": "/v1/chat/completions",
                        "attack_type": scan["detection"].get("attack_type", "prompt_injection"),
                        "confidence": scan["detection"].get("confidence"),
                        "severity": scan["severity"],
                        "action_taken": "blocked" if should_block else "allowed",
                        "user_id": principal.get("user_id"),
                    },
                )

            if should_block:
                self.telemetry.increment_stat("requests_blocked")
                self.telemetry.increment_stat("attacks_detected")
                self.telemetry.queue_request_log({
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc),
                    "provider": "koreshield",
                    "model": model,
                    "method": request.method,
                    "path": "/v1/chat/completions",
                    "status_code": 403,
                    "latency_ms": (time.time() - start_time) * 1000,
                    "is_blocked": True,
                    "attack_detected": True,
                    "attack_type": scan["detection"].get("attack_type"),
                    "attack_details": scan["detection"],
                    **self._principal_log_fields(principal),
                })
                return JSONResponse(
                    status_code=403,
                    content={
                        "blocked": True,
                        "reason": scan["reason"],
                        "risk_class": scan.get("severity", "high"),
                        "review_required": True,
                        "capability_signals": scan.get("detection", {}).get("indicators", []),
                        "error": {
                            "code": "prompt_injection",
                            "message": f"Blocked: {scan['reason']}",
                        },
                    },
                )

            # ── Provider passthrough kwargs (everything except messages/model/stream) ──
            passthrough = {
                k: v for k, v in body.items()
                if k not in ("messages", "model", "stream")
            }

            # ── Streaming response ───────────────────────────────────────────
            if stream:
                async def _sse_generator():
                    try:
                        async for chunk in self.provider_service.chat_completion_stream(
                            messages=messages,
                            model=model,
                            **passthrough,
                        ):
                            yield chunk
                    except Exception as exc:
                        logger.error("Streaming provider error", request_id=request_id, error=str(exc))
                        import json as _json
                        err = {"error": {"message": "Provider streaming error", "type": "server_error"}}
                        yield f"data: {_json.dumps(err)}\n\n".encode()
                        yield b"data: [DONE]\n\n"

                self.telemetry.increment_stat("requests_allowed")
                # Fire-and-forget telemetry (we don't have token counts yet)
                self.telemetry.queue_request_log({
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc),
                    "provider": self.provider_service.get_last_used_provider(),
                    "model": model,
                    "method": request.method,
                    "path": "/v1/chat/completions",
                    "status_code": 200,
                    "latency_ms": (time.time() - start_time) * 1000,
                    "is_blocked": False,
                    **self._principal_log_fields(principal),
                })

                return StreamingResponse(
                    _sse_generator(),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "X-Accel-Buffering": "no",
                        "X-Request-Id": request_id,
                    },
                )

            # ── Non-streaming response ───────────────────────────────────────
            try:
                response = await self.provider_service.chat_completion(
                    messages=messages,
                    model=model,
                    **passthrough,
                )

                duration = time.time() - start_time
                provider_name = self.provider_service.get_last_used_provider()

                self.telemetry.increment_stat("requests_allowed")
                self.telemetry.queue_request_log({
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc),
                    "provider": provider_name,
                    "model": model,
                    "method": request.method,
                    "path": "/v1/chat/completions",
                    "status_code": 200,
                    "latency_ms": duration * 1000,
                    "tokens_total": response.get("usage", {}).get("total_tokens", 0),
                    "is_blocked": False,
                    **self._principal_log_fields(principal),
                })

                return JSONResponse(content=response)

            except Exception as e:
                self.telemetry.increment_stat("errors")
                self.telemetry.queue_request_log({
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc),
                    "provider": self.provider_service.get_last_used_provider() or "koreshield",
                    "model": model,
                    "method": request.method,
                    "path": "/v1/chat/completions",
                    "status_code": 502,
                    "latency_ms": (time.time() - start_time) * 1000,
                    "is_blocked": False,
                    "attack_detected": False,
                    "attack_details": {"provider_error": str(e)},
                    **self._principal_log_fields(principal),
                })
                logger.error("Provider error", request_id=request_id, error=str(e))
                raise HTTPException(status_code=502, detail=f"Provider error: {e}")

        except HTTPException:
            raise
        except json.JSONDecodeError as e:
            logger.error("JSON decode error", request_id=request_id, error=str(e))
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
        except httpx.HTTPStatusError as e:
            logger.error(
                "Provider API error", request_id=request_id, status_code=e.response.status_code
            )
            raise HTTPException(status_code=e.response.status_code, detail="Provider service error")
        except Exception as e:
            self.telemetry.increment_stat("errors")
            logger.error(
                "Request handling error", request_id=request_id, error=str(e), exc_info=True
            )
            raise HTTPException(status_code=500, detail="Internal server error")

    async def _handle_tool_scan(self, request: Request) -> Response:
        """Forward to GovernanceService."""
        request_id = str(uuid.uuid4())
        start_time = time.time()
        try:
            principal = await self._authenticate_request(request)
            body = await request.json()

            # Accept both flat format {tool_name, args, context}
            # and OpenAI-style nested format {tool_call: {name, arguments}}
            nested = body.get("tool_call") or {}
            tool_name = (
                body.get("tool_name")
                or nested.get("name")
                or nested.get("function", {}).get("name")
            )
            args = (
                body.get("args")
                or body.get("arguments")            # Accept "arguments" as flat field too
                or nested.get("arguments")
                or nested.get("function", {}).get("arguments")
                or {}
            )
            # arguments may arrive as a JSON string (OpenAI format)
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except (json.JSONDecodeError, ValueError):
                    args = {"raw": args}

            context = body.get("context", {})

            if not tool_name:
                return JSONResponse(
                    status_code=400,
                    content={"error": "tool_name is required (flat: tool_name, or nested: tool_call.name)"},
                )

            result = self.governance.analyze_tool_call(
                tool_name=tool_name,
                args=args,
                context=context,
                principal=principal,
            )

            outcome = self.governance.record_decision(
                session_id=result["session_id"],
                principal=principal,
                request_id=request_id,
                tool_analysis=result["analysis"],
                policy_result=result["policy"],
                action_taken=result["action"],
                allowed=not result["blocked"],
            )

            if result["blocked"]:
                self.telemetry.increment_stat("requests_blocked")
                self.telemetry.increment_stat("attacks_detected")

            self.telemetry.queue_request_log({
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc),
                "provider": "tooling",
                "model": tool_name,
                "method": request.method,
                "path": "/v1/tools/scan",
                "status_code": 403 if result["blocked"] else 200,
                "latency_ms": (time.time() - start_time) * 1000,
                "is_blocked": result["blocked"],
                "attack_detected": result["blocked"],
                "attack_details": result["analysis"],
                **self._principal_log_fields(principal),
            })

            # Build a JSON-safe response — strip non-serializable values
            analysis = result["analysis"].copy()
            analysis.pop("args", None)  # raw args may not be serializable; serialized_args is already present

            response_payload = {
                **analysis,
                "scan_id": request_id,
                "allowed": not result["blocked"],
                "blocked": result["blocked"],
                "policy_result": result["policy"],
                "review_ticket": outcome.get("review_ticket"),
                "session": outcome.get("session"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            return JSONResponse(
                status_code=403 if result["blocked"] else 200,
                content=response_payload,
            )

        except HTTPException:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.error("tool_scan_unhandled_error", request_id=request_id, error=str(exc), exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal error during tool scan",
                    "request_id": request_id,
                    "detail": str(exc),
                },
            )

    async def _handle_create_tool_session(self, request: Request) -> Response:
        principal = await self._authenticate_request(request)
        body = await request.json()
        session = self.governance.create_session(principal, body)
        return JSONResponse(status_code=201, content=session)

    async def _handle_list_tool_sessions(self, request: Request, limit: int = 50, status: Optional[str] = None) -> Response:
        principal = await self._authenticate_request(request)
        payload = self.governance.list_sessions(principal, limit=limit, status=status)
        return JSONResponse(status_code=200, content=payload)

    async def _handle_get_tool_session(self, request: Request, session_id: str) -> Response:
        principal = await self._authenticate_request(request)
        session = self.governance.get_session(session_id, principal)
        if not session:
            raise HTTPException(status_code=404, detail="Runtime session not found")
        return JSONResponse(status_code=200, content=session)

    async def _handle_update_tool_session_state(self, request: Request, session_id: str) -> Response:
        principal = await self._authenticate_request(request)
        body = await request.json()
        session = self.governance.update_session(session_id, principal, body.get("state"), note=body.get("note"))
        if not session:
            raise HTTPException(status_code=404, detail="Runtime session not found")
        return JSONResponse(status_code=200, content=session)

    async def _handle_list_tool_reviews(self, request: Request, limit: int = 50, status: Optional[str] = None) -> Response:
        principal = await self._authenticate_request(request)
        payload = self.governance.list_reviews(principal, status=status, limit=limit)
        return JSONResponse(status_code=200, content=payload)

    async def _handle_get_tool_review(self, request: Request, ticket_id: str) -> Response:
        principal = await self._authenticate_request(request)
        review = self.governance.get_review(ticket_id, principal)
        if not review:
            raise HTTPException(status_code=404, detail="Runtime review not found")
        return JSONResponse(status_code=200, content=review)

    async def _handle_review_decision(self, request: Request, ticket_id: str) -> Response:
        principal = await self._authenticate_request(request)
        body = await request.json()
        review = self.governance.decide_review(ticket_id, principal, body.get("decision"), note=body.get("note"))
        if not review:
            raise HTTPException(status_code=404, detail="Runtime review not found")
        return JSONResponse(status_code=200, content=review)


    async def _handle_rag_scan(self, request: Request) -> Response:
        """Forward to SecurityService."""
        request_id = str(uuid.uuid4())
        principal = await self._authenticate_request(request)
        
        # Parse and validate JSON body
        try:
            body = await request.json()
        except Exception as e:
            logger.error("Failed to parse JSON", request_id=request_id, error=str(e))
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
            
        user_query = body.get("user_query", "")
        documents_data = body.get("documents", [])
        
        # Convert documents with validation
        try:
            documents = []
            for d in documents_data:
                if not isinstance(d, dict):
                    raise HTTPException(status_code=400, detail="Each document must be an object")
                documents.append(RetrievedDocument(
                    id=d.get("id"),
                    content=d.get("content"),
                    metadata=d.get("metadata"),
                    score=d.get("score")
                ))
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Failed to convert documents", error=str(e))
            raise HTTPException(status_code=400, detail="Invalid document format")

        import time
        start_scan_time = time.time()
        
        rag_scan_result = self.security.scan_rag(
            user_query=user_query,
            documents=documents,
            config_override=body.get("config")
        )

        processing_time_ms = (time.time() - start_scan_time) * 1000

        query_scan = self.security.scan_prompt(user_query, context={"principal": principal}) if user_query else None
        is_safe = (not query_scan["blocked"] if query_scan else True) and rag_scan_result.is_safe

        self.telemetry.increment_stat("requests_total")
        if not is_safe:
            self.telemetry.increment_stat("attacks_detected")
            self.telemetry.increment_stat("requests_blocked")

        response_data = {
            "scan_id": rag_scan_result.scan_id or request_id,
            "is_safe": is_safe,
            "blocked": not is_safe, # Restore explicitly for tests
            "overall_severity": rag_scan_result.overall_severity.value,
            "overall_confidence": rag_scan_result.overall_confidence,
            "context_analysis": rag_scan_result.to_dict(),
            "processing_time_ms": processing_time_ms,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self.telemetry.queue_request_log({
            "request_id": response_data["scan_id"],
            "timestamp": datetime.now(timezone.utc),
            "provider": "koreshield",
            "model": "rag_scan",
            "method": request.method,
            "path": "/v1/rag/scan",
            "status_code": 200,
            "latency_ms": processing_time_ms,
            "is_blocked": not is_safe,
            "attack_detected": not is_safe,
            "attack_type": "indirect_injection" if not is_safe else None,
            "attack_details": {
                "threat_references": response_data["context_analysis"].get("document_threats", []),
                "total_threats_found": response_data["context_analysis"].get("statistics", {}).get("total_threats_found", 0),
                "severity": response_data["overall_severity"],
            },
            **self._principal_log_fields(principal),
        })

        self.telemetry.queue_rag_scan(
            principal=principal,
            scan_id=rag_scan_result.scan_id or request_id,
            user_query=user_query,
            documents=documents_data,
            response_data=response_data
        )

        return JSONResponse(content=response_data)

    async def _handle_scan(self, request: Request) -> Response:
        """
        Scan a prompt for threats and return a structured assessment.

        Response fields match the KoreShield Client Usage Guide contract:
        ``blocked``, ``confidence``, ``attack_type``, ``attack_categories``,
        ``indicators``, ``message``, ``request_id``, ``timestamp``.
        """
        request_id = str(uuid.uuid4())
        start_time = time.time()
        try:
            principal = await self._authenticate_request(request)

            try:
                body = await request.json()
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid JSON in request body")

            if not isinstance(body, dict):
                raise HTTPException(status_code=400, detail="Request body must be a JSON object")

            scan = self.security.scan_prompt(
                body.get("prompt") or "",
                context=body.get("context") if isinstance(body.get("context"), dict) else None,
            )

            self.telemetry.increment_stat("requests_total")
            if scan["blocked"]:
                self.telemetry.increment_stat("requests_blocked")
                self.telemetry.increment_stat("attacks_detected")
                try:
                    asyncio.create_task(self.monitoring.notify_operational_event(
                        event_name="prompt_scan_completed",
                        severity="warning",
                        message=f"Prompt scan blocked: {scan.get('reason', 'threat detected')}",
                        details={
                            "request_id": request_id,
                            "attack_type": scan["detection"].get("attack_type", "prompt_injection"),
                            "severity": scan["severity"],
                            "action": "blocked",
                        },
                        publish_event_type="scan_event",
                    ))
                except Exception as notify_err:
                    logger.warning("scan_notify_failed", error=str(notify_err))

            detection = scan.get("detection", {})
            attack_type = detection.get("attack_type") or (
                "prompt_injection" if scan["blocked"] else None
            )
            # Derive human-readable attack categories from indicators
            indicators: list = detection.get("indicators", [])
            # Build a concise human-facing message
            if scan["blocked"]:
                human_message = f"Threat detected: {scan.get('reason', attack_type or 'unknown')}."
            elif detection.get("is_attack"):
                human_message = "Potential threat detected but allowed by policy."
            else:
                human_message = "Prompt is safe."

            response_payload = {
                # Primary guide-contract fields
                "blocked": scan["blocked"],
                "confidence": detection.get("confidence", scan.get("confidence", 0.0)),
                "attack_type": attack_type,
                "attack_categories": list({
                    i.get("category") or i.get("type") or "unknown"
                    for i in indicators
                    if isinstance(i, dict)
                } | ({attack_type} if attack_type else set())),
                "indicators": [
                    i.get("pattern") or i.get("name") or str(i)
                    for i in indicators
                    if i
                ],
                "message": human_message,
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                # Extended fields — useful for dashboards and SOC workflows
                "is_safe": scan.get("is_safe", not scan["blocked"]),
                "severity": scan.get("severity", "none"),
                "threat_level": scan.get("threat_level", "none"),
                "reason": scan.get("reason"),
                "processing_time_ms": (time.time() - start_time) * 1000,
                "policy": scan.get("policy", {}),
            }

            self._record_scan_result(response_payload)
            self.telemetry.queue_request_log({
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc),
                "provider": "koreshield",
                "model": "prompt_scan",
                "method": request.method,
                "path": "/v1/scan",
                "status_code": 403 if scan["blocked"] else 200,
                "latency_ms": response_payload["processing_time_ms"],
                "is_blocked": scan["blocked"],
                "attack_detected": bool(detection.get("is_attack") or scan["blocked"]),
                "attack_type": attack_type,
                "attack_details": {
                    "confidence": response_payload["confidence"],
                    "indicators": indicators,
                    "policy": response_payload["policy"],
                    "reason": response_payload["reason"],
                },
                **self._principal_log_fields(principal),
            })

            return JSONResponse(
                status_code=403 if scan["blocked"] else 200,
                content=response_payload,
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error("scan_handler_error", request_id=request_id, error=str(e), exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "error": "scan_failed",
                    "message": "An internal error occurred while processing the scan request.",
                    "request_id": request_id,
                },
            )

    async def _handle_scan_batch(self, request: Request) -> Response:
        """Forward to SecurityService."""
        request_id = str(uuid.uuid4())
        principal = await self._authenticate_request(request)
        start_time = time.time()
        body = await request.json()
        
        requests_payload = body.get("requests", [])
        results = []
        
        for item in requests_payload:
            scan = self.security.scan_prompt(
                item.get("prompt"),
                context=item.get("context")
            )
            results.append({
                "result": scan,
                "request_id": str(uuid.uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            
            self.telemetry.increment_stat("requests_total")
            if scan["blocked"]:
                self.telemetry.increment_stat("requests_blocked")
                self.telemetry.increment_stat("attacks_detected")

        self.telemetry.queue_request_log({
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc),
            "provider": "sdk_batch",
            "model": "batch_scan",
            "method": request.method,
            "path": "/v1/scan/batch",
            "status_code": 200,
            "latency_ms": (time.time() - start_time) * 1000,
            "is_blocked": any(r["result"]["blocked"] for r in results),
            **self._principal_log_fields(principal),
        })

        return JSONResponse(content={
            "results": results,
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    async def _handle_request(self, request: Request, path: str) -> Response:
        """
        Handle generic proxy requests (for non-chat endpoints).

        Args:
            request: FastAPI request object
            path: Request path

        Returns:
            Response
        """
        logger.info("Generic request received", path=path, method=request.method)

        # For MVP, only chat completions are supported
        return JSONResponse(
            status_code=501,
            content={
                "error": {
                    "message": f"Endpoint {path} not yet supported",
                    "type": "not_implemented",
                    "supported_endpoints": ["/v1/chat/completions", "/health"],
                }
            },
        )


# Create global app instance for uvicorn
def create_app(config_path: Optional[str] = None) -> FastAPI:
    """
    Create and configure the FastAPI application.

    Args:
        config_path: Path to configuration file (optional, will auto-detect)

    Returns:
        Configured FastAPI application
    """
    import yaml
    from pathlib import Path

    # Auto-detect config path based on script location
    if config_path is None:
        script_dir = Path(__file__).parent.parent.parent  # Go up to koreshield/
        config_file = script_dir / "config" / "config.yaml"
    else:
        config_file = Path(config_path)
    if not config_file.exists():
        # Try example config
        example_config = config_file.parent / "config.example.yaml"
        if example_config.exists():
            print(f"Loading example config from: {example_config}")
            config = yaml.safe_load(example_config.read_text()) or {}
        else:
            print("Warning: No config file found")
            config = {}
    else:
        print(f"Loading config from: {config_file}")
        config = yaml.safe_load(config_file.read_text()) or {}

    # Create proxy instance
    proxy = KoreShieldProxy(config)
    return proxy.app


# Global app instance for direct uvicorn usage.
# Tests can disable eager app construction to avoid import-time side effects.
if os.getenv("KORESHIELD_EAGER_APP_INIT", "true").strip().lower() in {"1", "true", "yes"}:
    app = create_app()
else:
    app = FastAPI()
