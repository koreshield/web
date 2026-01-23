"""
Base class for LLM provider integrations.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

import httpx


class BaseProvider(ABC):
    """
    Base class for all LLM provider integrations.
    """

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        """
        Initialize the provider.

        Args:
            api_key: API key for the provider
            base_url: Optional base URL (for custom endpoints)
        """
        self.api_key = api_key
        self.base_url = base_url or self._get_default_url()
        self.client = httpx.AsyncClient()

    @abstractmethod
    def _get_default_url(self) -> str:
        """Get the default API URL for this provider."""
        pass

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
        pass

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
        await self.client.aclose()
