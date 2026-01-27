"""
Anthropic Claude API provider integration.
"""

from typing import Any, Dict

from .base import BaseProvider


class AnthropicProvider(BaseProvider):
    """
    Integration for Anthropic Claude API.
    """

    def _get_default_url(self) -> str:
        """Get Anthropic API URL."""
        return "https://api.anthropic.com/v1"

    async def chat_completion(
        self, messages: list, model: str = "claude-3-opus-20240229", **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to Anthropic.

        Args:
            messages: List of message dictionaries
            model: Model to use
            **kwargs: Additional parameters

        Returns:
            Response dictionary
        """
        url = f"{self.base_url}/messages"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        data = {"model": model, "messages": messages, **kwargs}

        response = await (await self.get_client()).post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
