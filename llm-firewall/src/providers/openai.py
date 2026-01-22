"""
OpenAI API provider integration.
"""

from typing import Any, Dict

from .base import BaseProvider


class OpenAIProvider(BaseProvider):
    """
    Integration for OpenAI API.
    """

    def _get_default_url(self) -> str:
        """Get OpenAI API URL."""
        return "https://api.openai.com/v1"

    async def chat_completion(
        self, messages: list, model: str = "gpt-3.5-turbo", **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to OpenAI.

        Args:
            messages: List of message dictionaries
            model: Model to use
            **kwargs: Additional parameters

        Returns:
            Response dictionary
        """
        url = f"{self.base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        data = {"model": model, "messages": messages, **kwargs}

        response = await self.client.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
