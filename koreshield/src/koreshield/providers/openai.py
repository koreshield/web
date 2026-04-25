"""
OpenAI API provider integration.
"""

from typing import Any, AsyncIterator, Dict

import httpx

from .base import BaseProvider


class OpenAIProvider(BaseProvider):
    """
    Integration for OpenAI API.
    """

    def _get_default_url(self) -> str:
        """Get OpenAI API URL."""
        return "https://api.openai.com/v1"

    async def list_models(self) -> Dict[str, Any]:
        """
        List available OpenAI models.

        Returns:
            Response dictionary containing model metadata
        """
        url = f"{self.base_url}/models"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        response = await (await self.get_client()).get(url, headers=headers)
        response.raise_for_status()
        return response.json()

    async def chat_completion(
        self, messages: list, model: str = "gpt-4o-mini", **kwargs
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
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        # Never send stream=True to the non-streaming method
        kwargs.pop("stream", None)
        data = {"model": model, "messages": messages, **kwargs}

        response = await (await self.get_client()).post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()

    async def chat_completion_stream(
        self, messages: list, model: str = "gpt-4o-mini", **kwargs
    ) -> AsyncIterator[bytes]:
        """
        Stream a chat completion from OpenAI in OpenAI SSE format (pass-through).

        Yields raw SSE bytes exactly as returned by the OpenAI API so the
        caller can forward them to the client without any transformation.
        """
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        kwargs.pop("stream", None)
        data = {"model": model, "messages": messages, "stream": True, **kwargs}

        # Use a dedicated short-lived client for streaming so we don't tie up
        # the shared connection pool while waiting for SSE chunks.
        async with httpx.AsyncClient(timeout=httpx.Timeout(connect=10, read=120, write=10, pool=10)) as client:
            async with client.stream("POST", url, headers=headers, json=data) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        yield (line + "\n\n").encode()

    async def health_check(self) -> bool:
        """
        Perform an OpenAI-specific health check.

        Returns:
            True if the provider is healthy, False otherwise
        """
        try:
            # Listing models is a lightweight auth/connectivity probe and avoids
            # tying health to a specific chat model name.
            await self.list_models()
            return True
        except Exception:
            try:
                test_messages = [{"role": "user", "content": "Hello"}]
                await self.chat_completion(test_messages, model="gpt-4o-mini", max_tokens=1)
                return True
            except Exception:
                return False
