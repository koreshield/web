"""
Main proxy server that intercepts LLM API requests.
"""

import json
import os
import sys
import uuid
from pathlib import Path

import httpx
import structlog
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse

from .detector import AttackDetector
from .logger import FirewallLogger
from .policy import PolicyEngine
from .sanitizer import SanitizationEngine

logger = structlog.get_logger(__name__)

from fastapi.middleware.cors import CORSMiddleware
from .api.management import router as management_router


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
            title="KoreShield: Enterprise LLM Firewall", 
            version="0.1.0",
            description="Manage, monitor, and secure your LLM traffic with advanced policy enforcement and attack detection.",
            openapi_tags=[
                {"name": "Chat", "description": "LLM Chat Completions endpoint"},
                {"name": "Management", "description": "Admin Dashboard APIs"},
                {"name": "Health", "description": "System health checks"}
            ]
        )

        # Initialize parameter-based rate limiter
        self.limiter = Limiter(key_func=get_remote_address)
        self.app.state.limiter = self.limiter
        self.app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
        self.app.add_middleware(SlowAPIMiddleware)

        # Add CORS middleware
        # SECURITY NOTE: allow_credentials=True cannot be used with allow_origins=["*"]
        # We default to specific development origins and allow override via env
        env_origins = os.getenv("ALLOWED_ORIGINS", "")
        if env_origins:
            origins = env_origins.split(",")
        else:
            origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "https://koreshield.com",
            ]
        
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Statistics tracking
        self.stats = {
            "requests_total": 0,
            "requests_allowed": 0,
            "requests_blocked": 0,
            "attacks_detected": 0,
            "errors": 0,
        }
        
        # Store state for API access
        self.app.state.config = self.config
        self.app.state.stats = self.stats

        # Initialize security components
        security_config = config.get("security", {})
        self.sanitizer = SanitizationEngine(security_config)
        self.detector = AttackDetector(security_config)
        self.policy_engine = PolicyEngine(config)
        self.logger = FirewallLogger()

        # Initialize providers (multiple for failover)
        self.providers = []
        self.provider_priority = []
        self._init_providers(config)

        # Initialize monitoring system
        from .monitoring import MonitoringSystem
        self.monitoring = MonitoringSystem(config)

        self._setup_routes()
        
        # Include management router
        self.app.include_router(management_router, prefix="/v1/management")

    def _init_providers(self, config: dict):
        """Initialize all enabled LLM providers with priority ordering."""
        providers_config = config.get("providers", {})
        logger.info(f"Available providers config: {providers_config}")

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
                logger.info(f"Provider {provider_name}: API key {'found' if api_key else 'NOT found'} for env var {env_var}")
                if api_key:
                    try:
                        base_url = provider_cfg.get("base_url")
                        provider_instance = provider_class(api_key=api_key, base_url=base_url)
                        self.providers.append(provider_instance)
                        self.provider_priority.append(provider_name)
                        logger.info(f"{provider_name.capitalize()} provider initialized successfully")
                    except Exception as e:
                        logger.error(f"Failed to initialize {provider_name} provider: {e}")
                else:
                    logger.warning(f"{env_var} not found in environment variables")

        if not self.providers:
            logger.warning("No LLM providers configured. Set up API keys and enable providers in config.yaml")
        else:
            logger.info(f"Initialized {len(self.providers)} providers: {', '.join(self.provider_priority)}")

    @property
    def provider(self):
        """Get the primary (highest priority) provider."""
        return self.providers[0] if self.providers else None

    async def _get_healthy_provider(self):
        """Get the first healthy provider using failover logic."""
        for i, provider in enumerate(self.providers):
            provider_name = self.provider_priority[i]
            try:
                # For now, just check if provider is initialized
                # TODO: Implement actual health checks with test requests
                if provider:
                    logger.debug(f"Using provider: {provider_name}")
                    return provider
            except Exception as e:
                logger.warning(f"Provider {provider_name} health check failed: {e}")
                continue

        logger.error("All providers are unhealthy")
        return None

    async def start_monitoring(self):
        """Start the monitoring system."""
        await self.monitoring.start_monitoring()

    async def stop_monitoring(self):
        """Stop the monitoring system."""
        await self.monitoring.stop_monitoring()

    def _setup_routes(self):
        """Set up FastAPI routes."""
        
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
                "statistics": self.stats.copy(),
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

        # Generic proxy endpoint for other paths
        @self.app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
        async def proxy(request: Request, path: str):
            return await self._handle_request(request, path)


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
            self.stats["requests_total"] += 1

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
                self.stats["requests_blocked"] += 1
                self.stats["attacks_detected"] += 1

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

            # Step 5: Forward to provider if safe
            provider = await self._get_healthy_provider()
            if not provider:
                raise HTTPException(
                    status_code=500,
                    detail="No healthy LLM providers available. Please check provider configuration and API keys.",
                )

            # Forward the request to the provider with failover
            provider_start = time.time()
            provider_name = type(provider).__name__.replace('Provider', '').lower()
            try:
                response = await provider.chat_completion(
                    messages=messages,
                    model=model,
                    **{k: v for k, v in body.items() if k not in ["messages", "model"]},
                )

                # Record provider metrics
                provider_duration = time.time() - provider_start
                self.monitoring.metrics.provider_requests.labels(
                    provider=provider_name,
                    status="success"
                ).inc()
                self.monitoring.metrics.provider_latency.labels(
                    provider=provider_name
                ).observe(provider_duration)

                self.stats["requests_allowed"] += 1
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

                self.stats["errors"] += 1
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

                self.stats["errors"] += 1
                logger.error("Provider error", error=str(e))
                raise HTTPException(status_code=500, detail=f"Provider error: {str(e)}")

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
                detail=f"Provider API error: {e.response.text if e.response else str(e)}",
            )
        except Exception as e:
            self.stats["errors"] += 1
            logger.error(
                "Request handling error", request_id=request_id, error=str(e), exc_info=True
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
def create_app(config_path: str = None) -> FastAPI:
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
        script_dir = Path(__file__).parent.parent.parent  # Go up to llm-firewall/
        config_path = script_dir / "config" / "config.yaml"

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
