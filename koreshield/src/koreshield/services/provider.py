"""
LLM Provider Management service for KoreShield.
Handles initialization, failover, health monitoring, and model-aware routing.
"""

import os
import time
from typing import Any, AsyncIterator, List, Optional, Tuple

import structlog

from ..providers.manager import ProviderManager
from ..providers.health_monitor import HealthMonitor

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Model → provider routing table
# Priority: more specific prefixes first.
# ---------------------------------------------------------------------------
_MODEL_ROUTING: List[Tuple[str, str]] = [
    # OpenAI
    ("gpt-", "openai"),
    ("o1-", "openai"),
    ("o3-", "openai"),
    ("o4-", "openai"),
    ("text-embedding-", "openai"),
    ("dall-e-", "openai"),
    ("whisper-", "openai"),
    # Anthropic
    ("claude-", "anthropic"),
    # Google Gemini
    ("gemini-", "gemini"),
    ("palm-", "gemini"),
    # DeepSeek
    ("deepseek-", "deepseek"),
    # Azure OpenAI (typically accessed with the deployment name, not a fixed prefix)
    # Fallback handled by returning None
]


def _resolve_provider_name(model: str) -> Optional[str]:
    """Return the canonical provider name for a model string, or None."""
    model_lower = (model or "").lower()
    for prefix, name in _MODEL_ROUTING:
        if model_lower.startswith(prefix):
            return name
    return None


class ProviderService:
    def __init__(self, config: dict, redis_client=None):
        self.config = config
        self.redis_client = redis_client
        self.providers: List[Any] = []
        self.provider_priority: List[str] = []

        # Provider catalog (ordered by default priority)
        from ..providers.openai import OpenAIProvider
        from ..providers.anthropic import AnthropicProvider
        from ..providers.deepseek import DeepSeekProvider
        from ..providers.gemini import GeminiProvider
        from ..providers.azure_openai import AzureOpenAIProvider

        self.provider_catalog = [
            ("deepseek", ["DEEPSEEK_API_KEY"], DeepSeekProvider),
            ("openai", ["OPENAI_API_KEY"], OpenAIProvider),
            ("anthropic", ["ANTHROPIC_API_KEY"], AnthropicProvider),
            ("gemini", ["GOOGLE_API_KEY", "GEMINI_API_KEY"], GeminiProvider),
            ("azure_openai", ["AZURE_OPENAI_API_KEY"], AzureOpenAIProvider),
        ]

        # name → provider instance, for O(1) lookup
        self._provider_map: dict[str, Any] = {}

        self._init_providers()
        self.provider_manager = ProviderManager(self.providers)
        self.health_monitor = HealthMonitor(
            providers=self.providers,
            check_interval=30.0,
        )

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    def _init_providers(self):
        """Initialize enabled LLM providers from config + environment."""
        providers_config = self.config.get("providers", {})

        for provider_name, env_vars, provider_class in self.provider_catalog:
            provider_cfg = providers_config.get(provider_name, {})
            if not provider_cfg.get("enabled", False):
                continue

            api_key = next((os.getenv(v) for v in env_vars if os.getenv(v)), None)
            if not api_key:
                logger.warning(f"Provider {provider_name} enabled but no API key found", env_vars=env_vars)
                continue

            try:
                kwargs: dict = {
                    "api_key": api_key,
                    "base_url": provider_cfg.get("base_url"),
                    "redis_client": self.redis_client,
                    "cache_enabled": provider_cfg.get("cache_enabled", True),
                }
                if provider_name == "azure_openai":
                    kwargs.update({
                        "resource_name": provider_cfg.get("resource_name"),
                        "api_version": provider_cfg.get("api_version", "2024-10-21"),
                        "deployment_mappings": provider_cfg.get("deployment_mappings"),
                    })

                instance = provider_class(**kwargs)
                self.providers.append(instance)
                self.provider_priority.append(provider_name)
                self._provider_map[provider_name] = instance
                logger.info(f"Initialized provider: {provider_name}")
            except Exception as e:
                logger.error(f"Failed to initialize {provider_name}", error=str(e))

    # ------------------------------------------------------------------
    # Model-aware routing
    # ------------------------------------------------------------------

    def get_provider_for_model(self, model: str) -> Optional[Any]:
        """
        Return the best provider instance for *model*.

        Prefers the provider whose prefix matches the model name.  Falls back
        to the first available provider so the request is never dropped if the
        preferred provider isn't configured.
        """
        name = _resolve_provider_name(model)
        if name and name in self._provider_map:
            return self._provider_map[name]
        # Default: first available provider
        return self.providers[0] if self.providers else None

    # ------------------------------------------------------------------
    # Health snapshot
    # ------------------------------------------------------------------

    async def get_health_snapshot(self) -> dict:
        """Get live health for all providers."""
        status = {}
        providers_config = self.config.get("providers", {})

        for name, _, _ in self.provider_catalog:
            cfg = providers_config.get(name, {})
            is_enabled = cfg.get("enabled", False)
            is_initialized = name in self.provider_priority

            if is_initialized:
                status_str = "healthy"
            elif is_enabled:
                status_str = "missing_credentials"
            else:
                status_str = "disabled"

            status[name] = {
                "enabled": is_enabled,
                "initialized": is_initialized,
                "healthy": True,
                "status": status_str,
            }

        for i, provider in enumerate(self.providers):
            name = self.provider_priority[i]
            try:
                start = time.perf_counter()
                is_healthy = await provider.health_check()
                status[name].update({
                    "healthy": is_healthy,
                    "response_time_ms": (time.perf_counter() - start) * 1000,
                    "status": "healthy" if is_healthy else "unhealthy",
                })
            except Exception as e:
                status[name].update({"healthy": False, "status": "unhealthy", "error": str(e)})

        return status

    # ------------------------------------------------------------------
    # Chat completion (non-streaming)
    # ------------------------------------------------------------------

    async def chat_completion(self, messages, model: str, **kwargs) -> dict:
        """
        Forward chat completion to the model-appropriate provider, with
        automatic failover to any other healthy provider.
        """
        preferred = self.get_provider_for_model(model)
        result = await self.provider_manager.chat_completion_with_failover(
            messages=messages,
            model=model,
            preferred_provider=preferred,
            **kwargs,
        )
        return result

    # ------------------------------------------------------------------
    # Chat completion (streaming)
    # ------------------------------------------------------------------

    async def chat_completion_stream(
        self, messages, model: str, **kwargs
    ) -> AsyncIterator[bytes]:
        """
        Stream a chat completion, routing to the model-appropriate provider.

        Yields raw bytes in OpenAI SSE format.
        """
        preferred = self.get_provider_for_model(model)
        async for chunk in self.provider_manager.chat_completion_stream_with_failover(
            messages=messages,
            model=model,
            preferred_provider=preferred,
            **kwargs,
        ):
            yield chunk

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def get_last_used_provider(self) -> str:
        return getattr(self.provider_manager, "_last_used_provider", "unknown")
