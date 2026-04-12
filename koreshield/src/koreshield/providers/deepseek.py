"""
DeepSeek API provider integration.
"""

from typing import Any, AsyncIterator, Dict

import httpx

from .base import BaseProvider


class DeepSeekProvider(BaseProvider):
    """
    Integration for DeepSeek API (OpenAI-compatible).
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
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        kwargs.pop("stream", None)
        data = {"model": model, "messages": messages, **kwargs}

        response = await (await self.get_client()).post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()

    async def chat_completion_stream(
        self, messages: list, model: str = "deepseek-chat", **kwargs
    ) -> AsyncIterator[bytes]:
        """
        Stream a chat completion from DeepSeek in OpenAI SSE format (pass-through).

        DeepSeek is OpenAI-compatible so the SSE format is identical.
        """
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        kwargs.pop("stream", None)
        data = {"model": model, "messages": messages, "stream": True, **kwargs}

        async with httpx.AsyncClient(timeout=httpx.Timeout(connect=10, read=120, write=10, pool=10)) as client:
            async with client.stream("POST", url, headers=headers, json=data) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        yield (line + "\n\n").encode()

    async def health_check(self) -> bool:
        """Perform a DeepSeek health check."""
        try:
            test_messages = [{"role": "user", "content": "Hello"}]
            await self.chat_completion(test_messages, max_tokens=1)
            return True
        except Exception:
            return False
