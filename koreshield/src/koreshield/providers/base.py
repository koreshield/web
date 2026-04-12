"""
Base class for LLM provider integrations.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

import httpx

from .cache_manager import CacheManager
from .client_pool import get_shared_client_pool


class BaseProvider(ABC):
    """
    Base class for all LLM provider integrations.
    """

    def __init__(self, api_key: str, base_url: Optional[str] = None, redis_client=None, cache_enabled: bool = True):
        """
        Initialize the provider.

        Args:
            api_key: API key for the provider
            base_url: Optional base URL (for custom endpoints)
            redis_client: Redis client for caching
            cache_enabled: Whether to enable response caching
        """
        self.api_key = api_key
        self.base_url = base_url or self._get_default_url()
        
        # Use shared client pool for memory optimization
        self.client_pool = get_shared_client_pool()
        self.client_id = f"{self.__class__.__name__}_{id(self)}"
        
        # Initialize cache manager
        self.cache_manager = CacheManager(redis_client) if cache_enabled and redis_client else None

    async def get_client(self) -> httpx.AsyncClient:
        """Get HTTP client from shared pool."""
        return await self.client_pool.get_client(self.client_id)

    @abstractmethod
    def _get_default_url(self) -> str:
        """Get the default API URL for this provider."""

    @abstractmethod
    async def chat_completion(self, messages: list, **kwargs) -> Dict[str, Any]:
        """
        Send a chat completion request.

        Args:
            messages: List of message dictionaries
            **kwargs: Additional parameters

        Returns:
            Response dictionary
        """

    async def chat_completion_cached(self, messages: list, **kwargs) -> Dict[str, Any]:
        """
        Send a chat completion request with caching.

        Args:
            messages: List of message dictionaries
            **kwargs: Additional parameters

        Returns:
            Response dictionary
        """
        if not self.cache_manager:
            return await self.chat_completion(messages, **kwargs)

        # Create cache key from request data
        cache_key_data = {
            "messages": messages,
            "kwargs": kwargs
        }

        # Try to get from cache first
        cached_response = await self.cache_manager.get(cache_key_data)
        if cached_response:
            return cached_response

        # Not in cache, make the request
        response = await self.chat_completion(messages, **kwargs)

        # Cache the response (only for successful responses)
        if response and not response.get("error"):
            await self.cache_manager.set(cache_key_data, response)

        return response

    async def health_check(self) -> bool:
        """
        Perform a basic health check for the provider.

        Returns:
            True if provider is healthy, False otherwise
        """
        try:
            # Simple health check - try to make a minimal request
            # This is a basic implementation; providers can override for more specific checks
            test_messages = [{"role": "user", "content": "Hello"}]
            await self.chat_completion(test_messages, max_tokens=1)
            return True
        except Exception:
            return False

    async def close(self):
        """Close the HTTP client."""
        # Note: We don't close shared pool clients here as they're managed by the pool
