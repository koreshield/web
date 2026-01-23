"""
Azure OpenAI API provider integration.
"""

from typing import Any, Dict

from .base import BaseProvider


class AzureOpenAIProvider(BaseProvider):
    """
    Integration for Azure OpenAI API.
    """

    def _get_default_url(self) -> str:
        """Get Azure OpenAI API URL."""
        # Azure requires custom base URL with resource name
        return "https://your-resource-name.openai.azure.com"

    async def chat_completion(
        self, messages: list, model: str = "gpt-35-turbo", **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to Azure OpenAI.

        Args:
            messages: List of message dictionaries
            model: Model deployment name in Azure
            **kwargs: Additional parameters

        Returns:
            Response dictionary
        """
        # Azure uses different endpoint structure
        url = f"{self.base_url}/openai/deployments/{model}/chat/completions"
        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
        }
        data = {"messages": messages, **kwargs}

        response = await self.client.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()