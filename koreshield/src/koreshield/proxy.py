"""
Main proxy server that intercepts LLM API requests.
"""

import json
import os
import sys
import uuid
from pathlib import Path
from typing import List, Optional, Any

import httpx
import structlog
import redis
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse

from .detector import AttackDetector
from .logger import FirewallLogger
from .policy import PolicyEngine
from .sanitizer import SanitizationEngine
from .rag_detector import RAGContextDetector
from .rag_taxonomy import RetrievedDocument

logger = structlog.get_logger(__name__)

from fastapi.middleware.cors import CORSMiddleware
from .api.management import router as management_router
from .api.analytics import router as analytics_router
from .api.rbac import router as rbac_router
from .api.reports import router as reports_router
from .api.teams import router as teams_router


from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from limits.storage import RedisStorage

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
        # Handle provider imports
        # Add src directory to path to allow importing providers
        _current_file = Path(__file__).resolve()
        _src_dir = _current_file.parent.parent
        if str(_src_dir) not in sys.path:
            sys.path.insert(0, str(_src_dir))

        from providers.openai import OpenAIProvider
        from providers.anthropic import AnthropicProvider
        from providers.deepseek import DeepSeekProvider
        from providers.gemini import GeminiProvider
        from providers.azure_openai import AzureOpenAIProvider
        self.OpenAIProvider = OpenAIProvider
        self.AnthropicProvider = AnthropicProvider
        self.DeepSeekProvider = DeepSeekProvider
        self.GeminiProvider = GeminiProvider
        self.AzureOpenAIProvider = AzureOpenAIProvider

        self.config = config
        self.app = FastAPI(
            title="KoreShield API",
            version="1.0.0",
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
            - Analytics and Monitoring: Track costs, usage, and security events
            - Policy Management: Configure security rules and access controls
            - Team Collaboration: Multi-tenant support with RBAC
            """,
            openapi_tags=[
                {"name": "Authentication", "description": "User signup, login, and account management"},
                {"name": "Chat", "description": "LLM Chat Completions endpoint with security scanning"},
                {"name": "Management", "description": "Admin Dashboard APIs for configuration and monitoring"},
                {"name": "Analytics", "description": "Usage analytics, metrics, and cost tracking"},
                {"name": "RBAC", "description": "Role-based access control and user management"},
                {"name": "Reports", "description": "Security reports and audit logs"},
                {"name": "Teams", "description": "Team and organization management"},
                {"name": "Health", "description": "System health checks and status"}
            ],
            contact={
                "name": "KoreShield Support",
                "email": "support@koreshield.com",
                "url": "https://koreshield.com"
            },
            license_info={
                "name": "Proprietary",
                "url": "https://koreshield.com/terms"
            }
        )

        # Initialize Redis connection for rate limiting and statistics
        redis_config = config.get("redis", {})
        redis_enabled = redis_config.get("enabled", True)
        redis_url = redis_config.get("url", "redis://localhost:6379/0")
        
        if redis_enabled:
            try:
                self.redis_client = redis.from_url(redis_url)
                # Test connection
                self.redis_client.ping()
                logger.info("Connected to Redis", redis_url=redis_url)
            except Exception as e:
                logger.error("Failed to connect to Redis, falling back to in-memory", error=str(e))
                self.redis_client = None
        else:
            logger.info("Redis disabled, using in-memory storage")
            self.redis_client = None

        # Initialize parameter-based rate limiter with Redis storage
        if self.redis_client:
            storage_uri = f"{redis_url}/1"  # Use database 1 for rate limits
            self.limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)
        else:
            self.limiter = Limiter(key_func=get_remote_address)
        
        self.app.state.limiter = self.limiter
        self.app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore
        self.app.add_middleware(SlowAPIMiddleware)

        # Add CORS middleware
        # SECURITY NOTE: allow_credentials=True cannot be used with allow_origins=["*"]
        # We default to specific development origins and allow override via env
        env_origins = os.getenv("CORS_ORIGINS", "")
        if env_origins:
            origins = [origin.strip() for origin in env_origins.split(",")]
        else:
            origins = [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
                "https://koreshield.com",
            ]
        
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Statistics tracking (now in Redis)
        self.stats_keys = {
            "requests_total": "koreshield:stats:requests_total",
            "requests_allowed": "koreshield:stats:requests_allowed", 
            "requests_blocked": "koreshield:stats:requests_blocked",
            "attacks_detected": "koreshield:stats:attacks_detected",
            "errors": "koreshield:stats:errors",
        }
        
        # Initialize stats in Redis if available
        if self.redis_client:
            for key in self.stats_keys.values():
                if not self.redis_client.exists(key):
                    self.redis_client.set(key, 0)
        else:
            # Initialize in-memory stats fallback when Redis is disabled
            self.stats = {stat_name: 0 for stat_name in self.stats_keys.keys()}
        
        # Store state for API access (keep in-memory copy for backward compatibility)
        self.app.state.config = self.config
        self.app.state.stats = self._get_stats_dict()  # Will be updated dynamically

        # Initialize security components
        security_config = config.get("security", {})
        self.sanitizer = SanitizationEngine(security_config)
        self.detector = AttackDetector(security_config)
        self.rag_detector = RAGContextDetector(security_config)
        self.policy_engine = PolicyEngine(config)
        self.logger = FirewallLogger()

        # Initialize providers (multiple for failover)
        self.providers: List[Any] = []
        self.provider_priority: List[str] = []
        self._init_providers(config)

        # Initialize provider manager for optimized failover and performance
        from providers.manager import ProviderManager
        from providers.health_monitor import HealthMonitor
        self.provider_manager = ProviderManager(self.providers)
        self.health_monitor = HealthMonitor(
            providers=self.providers,
            check_interval=30.0,  # Check every 30 seconds
        )

        # Initialize monitoring system
        from .monitoring import MonitoringSystem
        from .config import KoreShieldConfig
        kore_config = KoreShieldConfig()
        kore_config.load_from_dict(config)
        self.monitoring = MonitoringSystem(kore_config.monitoring, stats_getter=self._get_stats_dict)

        # Initialize JWT authentication
        from .api.auth import init_jwt_config
        init_jwt_config(config)

        # Include management router FIRST (before _setup_routes to avoid catch-all)
        self.app.include_router(management_router, prefix="/v1/management")
        
        # Include new Phase 3 routers
        self.app.include_router(analytics_router, prefix="/v1")
        self.app.include_router(rbac_router, prefix="/v1")
        self.app.include_router(reports_router, prefix="/v1")
        self.app.include_router(teams_router, prefix="/v1")
        
        # Setup routes LAST (includes catch-all route)
        self._setup_routes()

    def _init_providers(self, config: dict):
        """Initialize all enabled LLM providers with priority ordering."""
        providers_config = config.get("providers", {})
        # Redact sensitive information from logs
        safe_config = {k: {**v, 'api_key': '***redacted***'} if 'api_key' in v else v for k, v in providers_config.items()}
        logger.info(f"Available providers config: {safe_config}")

        # Provider options with priority order (higher index = higher priority)
        provider_options = [
            ("deepseek", "DEEPSEEK_API_KEY", self.DeepSeekProvider),
            ("openai", "OPENAI_API_KEY", self.OpenAIProvider),
            ("anthropic", "ANTHROPIC_API_KEY", self.AnthropicProvider),
            ("gemini", "GOOGLE_API_KEY", self.GeminiProvider),
            ("azure_openai", "AZURE_OPENAI_API_KEY", self.AzureOpenAIProvider),
        ]

        self.providers = []
        self.provider_priority = []

        for provider_name, env_var, provider_class in provider_options:
            provider_cfg = providers_config.get(provider_name, {})
            logger.info(f"Checking provider {provider_name}: enabled={provider_cfg.get('enabled', False)}")
            if provider_cfg.get("enabled", False):
                api_key = os.getenv(env_var)
                if api_key:
                    try:
                        base_url = provider_cfg.get("base_url")
                        # Pass Redis client for caching and performance optimization
                        provider_instance = provider_class(
                            api_key=api_key, 
                            base_url=base_url,
                            redis_client=self.redis_client,
                            cache_enabled=provider_cfg.get("cache_enabled", True)
                        )
                        self.providers.append(provider_instance)
                        self.provider_priority.append(provider_name)
                        logger.info(f"{provider_name.capitalize()} provider initialized successfully with caching enabled")
                    except Exception as e:
                        logger.error(f"Failed to initialize {provider_name} provider: {e}")
                else:
                    logger.warning(f"{env_var} not found in environment variables")

        if not self.providers:
            logger.warning("No LLM providers configured. Set up API keys and enable providers in config.yaml")
        else:
            logger.info(f"Initialized {len(self.providers)} providers: {', '.join(self.provider_priority)}")

    def _get_stats_dict(self) -> dict:
        """Get current statistics as a dictionary."""
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
        else:
            # Fallback to in-memory stats for backward compatibility
            return getattr(self, 'stats', {
                "requests_total": 0,
                "requests_allowed": 0,
                "requests_blocked": 0,
                "attacks_detected": 0,
                "errors": 0,
            })

    def _increment_stat(self, stat_name: str, amount: int = 1):
        """Increment a statistic counter."""
        if self.redis_client and stat_name in self.stats_keys:
            try:
                redis_key = self.stats_keys[stat_name]
                self.redis_client.incrby(redis_key, amount)
                self.redis_client.incrby(redis_key, amount)
                # Optimization: Do not update app.state.stats on every write.
                # Endpoints should call _get_stats_dict() directly.
            except Exception as e:
                logger.error(f"Failed to increment stat {stat_name}", error=str(e))
        else:
            # Fallback to in-memory
            if hasattr(self, 'stats'):
                self.stats[stat_name] = self.stats.get(stat_name, 0) + amount
                self.app.state.stats = self.stats

    @property
    def provider(self):
        """Get the primary (highest priority) provider."""
        return self.providers[0] if self.providers else None

    async def start_monitoring(self):
        """Start the monitoring system."""
        await self.monitoring.start_monitoring()

    async def stop_monitoring(self):
        """Stop the monitoring system."""
        await self.monitoring.stop_monitoring()

    def _setup_routes(self):
        """Set up FastAPI routes."""
        
        # Startup event to initialize health monitoring
        @self.app.on_event("startup")
        async def startup_event():
            import asyncio
            asyncio.create_task(self.health_monitor.start_monitoring())
        
        rate_limit = self.config.get("security", {}).get("rate_limit", "60/minute")

        # Health check endpoint
        @self.app.get("/health", tags=["Health"])
        async def health():
            return {"status": "healthy", "version": "0.1.0"}

        # Provider health check endpoint
        @self.app.get("/health/providers", tags=["Health"])
        async def provider_health():
            health_status = {}
            for i, provider in enumerate(self.providers):
                provider_name = self.provider_priority[i]
                try:
                    # For now, just check if provider exists
                    # TODO: Implement actual health checks
                    is_healthy = provider is not None
                    health_status[provider_name] = {
                        "healthy": is_healthy,
                        "priority": i,
                        "type": type(provider).__name__ if provider else None,
                    }
                except Exception as e:
                    health_status[provider_name] = {
                        "healthy": False,
                        "priority": i,
                        "error": str(e),
                    }

            return {
                "providers": health_status,
                "total_providers": len(self.providers),
                "healthy_providers": sum(1 for p in health_status.values() if p["healthy"]),
            }

        # Status/metrics endpoint
        @self.app.get("/status", tags=["Health"])
        async def status():
            provider_status = {}
            for i, provider in enumerate(self.providers):
                provider_name = self.provider_priority[i]
                provider_status[provider_name] = {
                    "configured": True,
                    "priority": i,
                    "type": type(provider).__name__,
                }

            return {
                "status": "healthy",
                "version": "0.1.0",
                "statistics": self._get_stats_dict(),
                "providers": provider_status,
                "total_providers": len(self.providers),
            }

        # Prometheus metrics endpoint
        @self.app.get("/metrics", tags=["Health"])
        async def metrics():
            from prometheus_client import CONTENT_TYPE_LATEST
            return Response(
                content=self.monitoring.get_metrics_text(),
                media_type=CONTENT_TYPE_LATEST
            )

        # OpenAI-compatible chat completions endpoint
        @self.app.post("/v1/chat/completions", tags=["Chat"])
        @self.limiter.limit(rate_limit)
        async def chat_completions(request: Request):
            return await self._handle_chat_completion(request)

        # RAG context scanning endpoint
        @self.app.post("/v1/rag/scan", tags=["Chat"])
        @self.limiter.limit(rate_limit)
        async def rag_scan(request: Request):
            return await self._handle_rag_scan(request)

        # Note: Removed catch-all route to prevent interference with specific routes
        # If needed, implement specific proxy endpoints instead


    async def _handle_chat_completion(self, request: Request) -> Response:
        """
        Handle OpenAI chat completion requests with security checks.

        Args:
            request: FastAPI request object

        Returns:
            Response with either the LLM response or an error
        """
        import time
        start_time = time.time()

        # Record request metrics
        self.monitoring.metrics.requests_total.labels(
            method=request.method,
            endpoint="/v1/chat/completions",
            status="started"
        ).inc()

        request_id = str(uuid.uuid4())

        try:
            # Parse request body
            try:
                body = await request.json()
            except Exception as e:
                logger.error("Failed to parse JSON", request_id=request_id, error=str(e))
                raise HTTPException(status_code=400, detail="Invalid JSON in request body")

            # Validate required fields
            if not isinstance(body, dict):
                raise HTTPException(status_code=400, detail="Request body must be a JSON object")

            messages = body.get("messages", [])
            if not messages or not isinstance(messages, list):
                raise HTTPException(
                    status_code=400, detail="'messages' field is required and must be a list"
                )

            model = body.get("model", "gpt-3.5-turbo")

            # Extract user messages for analysis
            user_messages = []
            for msg in messages:
                if isinstance(msg, dict) and msg.get("role") == "user":
                    content = msg.get("content", "")
                    if isinstance(content, str):
                        user_messages.append(content)

            combined_prompt = " ".join(user_messages) if user_messages else ""

            # If no user content found, still process but log warning
            if not combined_prompt:
                logger.warning("No user message content found", request_id=request_id)
                combined_prompt = ""  # Empty string for analysis

            # Update statistics
            self._increment_stat("requests_total")

            self.logger.log_request(
                request_id=request_id,
                method="POST",
                path="/v1/chat/completions",
                model=model,
                message_count=len(messages),
            )

            # Step 1: Sanitize the prompt (handle empty prompts)
            try:
                sanitization_result = self.sanitizer.sanitize(
                    combined_prompt if combined_prompt else ""
                )
            except Exception as e:
                logger.error("Sanitization error", request_id=request_id, error=str(e))
                # On sanitization error, be conservative and block
                sanitization_result = {
                    "is_safe": False,
                    "threats": [{"type": "sanitization_error", "error": str(e)}],
                    "confidence": 1.0,
                }

            # Step 2: Detect attacks (pass sanitization context)
            try:
                detection_result = self.detector.detect(
                    combined_prompt if combined_prompt else "",
                    context={"sanitization_result": sanitization_result},
                )
            except Exception as e:
                logger.error("Detection error", request_id=request_id, error=str(e))
                # On detection error, be conservative
                detection_result = {
                    "is_attack": True,
                    "attack_type": "detection_error",
                    "confidence": 1.0,
                    "indicators": [{"type": "error", "error": str(e)}],
                }

            # Step 3: Evaluate policy
            try:
                policy_result = self.policy_engine.evaluate(
                    combined_prompt if combined_prompt else "",
                    sanitization_result,
                    detection_result,
                )
            except Exception as e:
                logger.error("Policy evaluation error", request_id=request_id, error=str(e))
                # On policy error, be conservative and block
                policy_result = {
                    "allowed": False,
                    "action": "block",
                    "reason": "Policy evaluation error",
                    "policy_violations": [{"type": "error", "error": str(e)}],
                }

            # Step 4: Make decision based on policy
            default_action = self.config.get("security", {}).get("default_action", "block")

            # Use policy result if available, otherwise fall back to basic checks
            if policy_result.get("allowed", True) is False:
                # Policy says block
                should_block = True
                reason = policy_result.get("reason", "Policy violation")
            else:
                # Fall back to basic safety checks
                is_unsafe = not sanitization_result.get("is_safe", True) or detection_result.get(
                    "is_attack", False
                )
                should_block = is_unsafe and default_action == "block"
                reason = "Potential prompt injection detected"

            if should_block:
                # Block the request
                self._increment_stat("requests_blocked")
                self._increment_stat("attacks_detected")

                # Record blocked request metrics
                duration = time.time() - start_time
                self.monitoring.metrics.requests_total.labels(
                    method=request.method,
                    endpoint="/v1/chat/completions",
                    status="blocked"
                ).inc()
                self.monitoring.metrics.requests_blocked.labels(reason=reason).inc()
                self.monitoring.metrics.attacks_detected.labels(
                    attack_type="prompt_injection",
                    severity="high"  # Could be determined from detection result
                ).inc()

                self.logger.log_attack(
                    request_id=request_id,
                    attack_type="prompt_injection",
                    details={
                        "sanitization": sanitization_result,
                        "detection": detection_result,
                        "policy": policy_result,
                    },
                )
                self.logger.log_blocked(request_id=request_id, reason=reason)

                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "message": f"Request blocked: {reason}",
                            "type": "security_error",
                            "code": "prompt_injection_blocked",
                            "request_id": request_id,
                        }
                    },
                )

            # Step 5: Forward to provider with optimized failover and caching
            provider_start = time.time()
            try:
                # Use ProviderManager for intelligent provider selection with failover
                response = await self.provider_manager.chat_completion_with_failover(
                    messages=messages,
                    model=model,
                    **{k: v for k, v in body.items() if k not in ["messages", "model"]},
                )

                # Record provider metrics (get the provider that was actually used)
                provider_name = getattr(self.provider_manager, '_last_used_provider', 'unknown')
                provider_duration = time.time() - provider_start
                self.monitoring.metrics.provider_requests.labels(
                    provider=provider_name,
                    status="success"
                ).inc()
                self.monitoring.metrics.provider_latency.labels(
                    provider=provider_name
                ).observe(provider_duration)

                self._increment_stat("requests_allowed")
                self.logger.log_allowed(request_id=request_id)

                # Record successful request metrics
                duration = time.time() - start_time
                self.monitoring.metrics.requests_total.labels(
                    method=request.method,
                    endpoint="/v1/chat/completions",
                    status="success"
                ).inc()
                self.monitoring.metrics.requests_duration.labels(
                    method=request.method,
                    endpoint="/v1/chat/completions"
                ).observe(duration)

                return JSONResponse(content=response)

            except httpx.HTTPStatusError as e:
                # Record provider error metrics
                self.monitoring.metrics.provider_requests.labels(
                    provider=provider_name,
                    status=f"error_{e.response.status_code}"
                ).inc()

                self._increment_stat("errors")
                logger.error("Provider API error", status_code=e.response.status_code, error=str(e))
                return JSONResponse(
                    status_code=e.response.status_code,
                    content=e.response.json() if e.response.content else {"error": str(e)},
                )
            except Exception as e:
                # Record provider error metrics
                self.monitoring.metrics.provider_requests.labels(
                    provider=provider_name,
                    status="error_unknown"
                ).inc()

                self._increment_stat("errors")
                logger.error("Provider error", error=str(e))
                raise HTTPException(status_code=500, detail="Provider service unavailable")

        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except json.JSONDecodeError as e:
            logger.error("JSON decode error", request_id=request_id, error=str(e))
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
        except httpx.HTTPStatusError as e:
            # Provider API errors
            logger.error(
                "Provider API error", request_id=request_id, status_code=e.response.status_code
            )
            raise HTTPException(
                status_code=e.response.status_code,
                detail="Provider service error",
            )
        except Exception as e:
            self._increment_stat("errors")
            logger.error(
                "Request handling error", request_id=request_id, error=str(e), exc_info=True
            )
            raise HTTPException(status_code=500, detail="Internal server error")

    async def _handle_rag_scan(self, request: Request) -> Response:
        """
        Handle RAG context scanning requests.
        
        Scans both user query and retrieved documents for indirect
        prompt injection attacks using the 5-dimensional taxonomy.
        
        Args:
            request: FastAPI request object
            
        Returns:
            JSON response with detection results and taxonomy
        """
        import time
        start_time = time.time()
        request_id = str(uuid.uuid4())
        
        logger.info("RAG scan request received", request_id=request_id)
        
        try:
            # Parse request body
            try:
                body = await request.json()
            except Exception as e:
                logger.error("Failed to parse JSON", request_id=request_id, error=str(e))
                raise HTTPException(status_code=400, detail="Invalid JSON in request body")
            
            # Validate required fields
            if not isinstance(body, dict):
                raise HTTPException(status_code=400, detail="Request body must be a JSON object")
            
            user_query = body.get("user_query", "")
            documents_data = body.get("documents", [])
            config_override = body.get("config", {})
            
            if not isinstance(documents_data, list):
                raise HTTPException(
                    status_code=400,
                    detail="'documents' field must be a list"
                )
            
            # Convert documents to RetrievedDocument objects
            documents = []
            for idx, doc_data in enumerate(documents_data):
                if not isinstance(doc_data, dict):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Document at index {idx} must be an object"
                    )
                
                try:
                    doc = RetrievedDocument(
                        id=doc_data.get("id", f"doc_{idx}"),
                        content=doc_data.get("content", ""),
                        metadata=doc_data.get("metadata", {}),
                        score=doc_data.get("score")
                    )
                    documents.append(doc)
                except Exception as e:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid document at index {idx}: {str(e)}"
                    )
            
            # Step 1: Scan user query with standard detector
            query_detection_result = None
            if user_query:
                try:
                    query_detection_result = self.detector.detect(
                        user_query,
                        context={"source": "rag_query", "request_id": request_id}
                    )
                except Exception as e:
                    logger.error("Query detection error", request_id=request_id, error=str(e))
                    query_detection_result = {
                        "is_attack": True,
                        "attack_type": "detection_error",
                        "confidence": 1.0,
                        "indicators": [{"type": "error", "error": str(e)}],
                    }
            
            # Step 2: Scan retrieved context with RAG detector
            try:
                rag_scan_result = self.rag_detector.scan_retrieved_context(
                    documents=documents,
                    user_query=user_query,
                    config=config_override if config_override else None
                )
            except Exception as e:
                logger.error("RAG detection error", request_id=request_id, error=str(e))
                raise HTTPException(
                    status_code=500,
                    detail=f"RAG detection failed: {str(e)}"
                )
            
            # Step 3: Combined decision
            # If either query or context has threats, overall is not safe
            query_is_attack = query_detection_result.get("is_attack", False) if query_detection_result else False
            combined_is_safe = not query_is_attack and rag_scan_result.is_safe
            
            # Log results
            logger.info(
                "RAG scan complete",
                request_id=request_id,
                query_is_attack=query_is_attack,
                context_is_safe=rag_scan_result.is_safe,
                combined_is_safe=combined_is_safe,
                threats_found=rag_scan_result.total_threats_found,
                processing_time_ms=(time.time() - start_time) * 1000
            )
            
            # Update statistics
            self._increment_stat("requests_total")
            if not combined_is_safe:
                self._increment_stat("attacks_detected")
                self._increment_stat("requests_blocked")
            else:
                self._increment_stat("requests_allowed")
            
            # Record metrics
            duration = time.time() - start_time
            self.monitoring.metrics.requests_total.labels(
                method=request.method,
                endpoint="/v1/rag/scan",
                status="success"
            ).inc()
            self.monitoring.metrics.requests_duration.labels(
                method=request.method,
                endpoint="/v1/rag/scan"
            ).observe(duration)
            
            if not combined_is_safe:
                self.monitoring.metrics.attacks_detected.labels(
                    attack_type="indirect_injection",
                    severity=rag_scan_result.overall_severity.value
                ).inc()
            
            # Build response
            response_data = {
                "scan_id": rag_scan_result.scan_id,
                "is_safe": combined_is_safe,
                "overall_severity": rag_scan_result.overall_severity.value,
                "overall_confidence": rag_scan_result.overall_confidence,
                "query_analysis": {
                    "is_attack": query_is_attack,
                    "details": query_detection_result,
                } if query_detection_result else None,
                "context_analysis": rag_scan_result.to_dict(),
                "processing_time_ms": (time.time() - start_time) * 1000,
                "timestamp": rag_scan_result.scan_timestamp.isoformat(),
            }
            
            return JSONResponse(content=response_data)
            
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except Exception as e:
            self._increment_stat("errors")
            logger.error(
                "RAG scan error",
                request_id=request_id,
                error=str(e),
                exc_info=True
            )
            raise HTTPException(status_code=500, detail="Internal server error")

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


# Global app instance for direct uvicorn usage
app = create_app()
