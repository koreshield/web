"""
DeepSeek API provider integration.
"""

from typing import Any, Dict

from .base import BaseProvider


class DeepSeekProvider(BaseProvider):
    """
    Integration for DeepSeek API.
    """

    def _get_default_url(self) -> str:
        """Get DeepSeek API URL."""
        return "https://api.deepseek.com/v1"

    async def chat_completion(
        self, messages: list, model: str = "deepseek-chat", **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to DeepSeek.

        Args:
            messages: List of message dictionaries
            model: Model to use (default: deepseek-chat)
            **kwargs: Additional parameters

        Returns:
            Response dictionary
        """
        url = f"{self.base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        data = {"model": model, "messages": messages, **kwargs}

        response = await (await self.get_client()).post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()