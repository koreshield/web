"""
LLM Provider Management service for KoreShield.
Handles initialization, failover, and health monitoring.
"""

import os
import time
import structlog
import asyncio
from typing import List, Any
from pathlib import Path
import sys

from providers.manager import ProviderManager
from providers.health_monitor import HealthMonitor

logger = structlog.get_logger(__name__)

class ProviderService:
    def __init__(self, config: dict, redis_client=None):
        self.config = config
        self.redis_client = redis_client
        self.providers: List[Any] = []
        self.provider_priority: List[str] = []
        
        # Provider Catalog (Metadata)
        # This will be used to initialize the actual provider classes
        from providers.openai import OpenAIProvider
        from providers.anthropic import AnthropicProvider
        from providers.deepseek import DeepSeekProvider
        from providers.gemini import GeminiProvider
        from providers.azure_openai import AzureOpenAIProvider
        
        self.provider_catalog = [
            ("deepseek", ["DEEPSEEK_API_KEY"], DeepSeekProvider),
            ("openai", ["OPENAI_API_KEY"], OpenAIProvider),
            ("anthropic", ["ANTHROPIC_API_KEY"], AnthropicProvider),
            ("gemini", ["GOOGLE_API_KEY", "GEMINI_API_KEY"], GeminiProvider),
            ("azure_openai", ["AZURE_OPENAI_API_KEY"], AzureOpenAIProvider),
        ]
        
        self._init_providers()
        self.provider_manager = ProviderManager(self.providers)
        self.health_monitor = HealthMonitor(
            providers=self.providers,
            check_interval=30.0,
        )

    def _init_providers(self):
        """Initialize enabled LLM providers."""
        providers_config = self.config.get("providers", {})
        
        for provider_name, env_vars, provider_class in self.provider_catalog:
            provider_cfg = providers_config.get(provider_name, {})
            if provider_cfg.get("enabled", False):
                api_key = None
                for env_var in env_vars:
                    api_key = os.getenv(env_var)
                    if api_key:
                        break
                
                if api_key:
                    try:
                        provider_kwargs = {
                            "api_key": api_key,
                            "base_url": provider_cfg.get("base_url"),
                            "redis_client": self.redis_client,
                            "cache_enabled": provider_cfg.get("cache_enabled", True),
                        }
                        if provider_name == "azure_openai":
                            provider_kwargs.update({
                                "resource_name": provider_cfg.get("resource_name"),
                                "api_version": provider_cfg.get("api_version", "2024-10-21"),
                                "deployment_mappings": provider_cfg.get("deployment_mappings"),
                            })
                        
                        provider_instance = provider_class(**provider_kwargs)
                        self.providers.append(provider_instance)
                        self.provider_priority.append(provider_name)
                    except Exception as e:
                        logger.error(f"Failed to initialize {provider_name}", error=str(e))

    async def get_health_snapshot(self) -> dict:
        """Get live health for all providers."""
        status = {}
        providers_config = self.config.get("providers", {})
        
        for name, _, _ in self.provider_catalog:
            cfg = providers_config.get(name, {})
            is_enabled = cfg.get("enabled", False)
            is_initialized = name in self.provider_priority
            
            if is_initialized:
                status_str = "healthy" # Will be updated by live check if applicable
            elif is_enabled:
                status_str = "missing_credentials"
            else:
                status_str = "disabled"

            status[name] = {
                "enabled": is_enabled,
                "initialized": is_initialized,
                "healthy": True, # Default
                "status": status_str
            }
            
        # Add live check results
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

    async def chat_completion(self, messages, model, **kwargs):
        """Forward chat completion to ProviderManager."""
        return await self.provider_manager.chat_completion_with_failover(
            messages=messages,
            model=model,
            **kwargs
        )

    def get_last_used_provider(self):
        return getattr(self.provider_manager, '_last_used_provider', 'unknown')
