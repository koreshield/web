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
        self.app = FastAPI(title="LLM Firewall Community", version="0.1.0")

        # Statistics tracking
        self.stats = {
            "requests_total": 0,
            "requests_allowed": 0,
            "requests_blocked": 0,
            "attacks_detected": 0,
            "errors": 0,
        }

        # Initialize security components
        security_config = config.get("security", {})
        self.sanitizer = SanitizationEngine(security_config)
        self.detector = AttackDetector(security_config)
        self.policy_engine = PolicyEngine(config)
        self.logger = FirewallLogger()

        # Initialize provider
        self.provider = None
        self._init_provider(config)

        self._setup_routes()

    def _init_provider(self, config: dict):
        """Initialize the LLM provider based on configuration."""
        providers_config = config.get("providers", {})
        logger.info(f"Available providers config: {providers_config}")

        # Try providers in order of preference
        provider_options = [
            ("deepseek", "DEEPSEEK_API_KEY", self.DeepSeekProvider),
            ("openai", "OPENAI_API_KEY", self.OpenAIProvider),
            ("anthropic", "ANTHROPIC_API_KEY", self.AnthropicProvider),
            ("gemini", "GOOGLE_API_KEY", self.GeminiProvider),
            ("azure_openai", "AZURE_OPENAI_API_KEY", self.AzureOpenAIProvider),
        ]

        for provider_name, env_var, provider_class in provider_options:
            provider_cfg = providers_config.get(provider_name, {})
            logger.info(f"Checking provider {provider_name}: enabled={provider_cfg.get('enabled', False)}")
            if provider_cfg.get("enabled", False):
                api_key = os.getenv(env_var)
                logger.info(f"Provider {provider_name}: API key {'found' if api_key else 'NOT found'} for env var {env_var}")
                if api_key:
                    base_url = provider_cfg.get("base_url")
                    self.provider = provider_class(api_key=api_key, base_url=base_url)
                    logger.info(f"{provider_name.capitalize()} provider initialized")
                    break
                else:
                    logger.warning(f"{env_var} not found in environment variables")

        if not self.provider:
            logger.warning("No LLM provider configured. Set up API keys and enable a provider in config.yaml")

    def _setup_routes(self):
        """Set up FastAPI routes."""

        # Health check endpoint
        @self.app.get("/health")
        async def health():
            return {"status": "healthy", "version": "0.1.0"}

        # Status/metrics endpoint
        @self.app.get("/status")
        async def status():
            return {
                "status": "healthy",
                "version": "0.1.0",
                "statistics": self.stats.copy(),
                "provider_configured": self.provider is not None,
            }

        # OpenAI-compatible chat completions endpoint
        @self.app.post("/v1/chat/completions")
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
            if not self.provider:
                raise HTTPException(
                    status_code=500,
                    detail="No LLM provider configured. Please set OPENAI_API_KEY environment variable.",
                )

            # Forward the request to OpenAI
            try:
                response = await self.provider.chat_completion(
                    messages=messages,
                    model=model,
                    **{k: v for k, v in body.items() if k not in ["messages", "model"]},
                )

                self.stats["requests_allowed"] += 1
                self.logger.log_allowed(request_id=request_id)

                return JSONResponse(content=response)

            except httpx.HTTPStatusError as e:
                self.stats["errors"] += 1
                logger.error("Provider API error", status_code=e.response.status_code, error=str(e))
                return JSONResponse(
                    status_code=e.response.status_code,
                    content=e.response.json() if e.response.content else {"error": str(e)},
                )
            except Exception as e:
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
