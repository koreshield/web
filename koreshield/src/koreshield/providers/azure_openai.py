"""
Azure OpenAI API provider integration.
"""

from typing import Any, Dict, Optional

from .base import BaseProvider


class AzureOpenAIProvider(BaseProvider):
    """
    Integration for Azure OpenAI API.

    Azure OpenAI requires specific configuration:
    - Resource name (part of the base URL)
    - Deployment names (model mappings)
    - API version parameter
    """

    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
        resource_name: Optional[str] = None,
        api_version: str = "2023-12-01-preview",
        deployment_mappings: Optional[Dict[str, str]] = None,
        redis_client=None,
        cache_enabled: bool = True,
    ):
        """
        Initialize Azure OpenAI provider.

        Args:
            api_key: Azure OpenAI API key
            base_url: Full base URL (optional if resource_name provided)
            resource_name: Azure resource name (used to construct base_url)
            api_version: API version to use
            deployment_mappings: Mapping of model names to deployment names
        """
        self.resource_name = resource_name
        self.api_version = api_version
        self.last_error: str | None = None
        self.deployment_mappings = deployment_mappings or {
            "gpt-3.5-turbo": "gpt-35-turbo",
            "gpt-4": "gpt-4",
            "gpt-4-turbo": "gpt-4-turbo",
            "gpt-4o": "gpt-4o",
            "gpt-4o-mini": "gpt-4o-mini"
        }

        # Construct base URL if not provided
        if not base_url and resource_name:
            base_url = f"https://{resource_name}.openai.azure.com"

        super().__init__(
            api_key,
            base_url,
            redis_client=redis_client,
            cache_enabled=cache_enabled,
        )

    def _get_default_url(self) -> str:
        """Get Azure OpenAI API URL."""
        if self.resource_name:
            return f"https://{self.resource_name}.openai.azure.com"
        # Fallback - should be overridden
        return "https://your-resource-name.openai.azure.com"

    def _get_deployment_name(self, model: str) -> str:
        """Get the deployment name for a given model."""
        return self.deployment_mappings.get(model, model)

    def _get_health_probe_models(self) -> list[str]:
        """Return a small ordered list of likely deployment names to probe."""
        preferred_models = [
            "gpt-4o-mini",
            "gpt-4o",
            "gpt-4.1-mini",
            "gpt-4.1",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo",
        ]

        ordered = []
        for model_name in preferred_models:
            if model_name in self.deployment_mappings and model_name not in ordered:
                ordered.append(model_name)

        for model_name in self.deployment_mappings:
            if model_name not in ordered:
                ordered.append(model_name)

        return ordered or ["gpt-4o"]

    async def chat_completion(
        self, messages: list, model: str = "gpt-3.5-turbo", **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to Azure OpenAI.

        Args:
            messages: List of message dictionaries
            model: Model name (will be mapped to deployment)
            **kwargs: Additional parameters

        Returns:
            Response dictionary

        Raises:
            ValueError: If resource_name is not configured
            Exception: For API errors
        """
        if not self.resource_name and "your-resource-name" in self.base_url:
            raise ValueError("Azure resource name must be configured")

        deployment_name = self._get_deployment_name(model)

        # Azure uses different endpoint structure
        url = f"{self.base_url}/openai/deployments/{deployment_name}/chat/completions"
        url += f"?api-version={self.api_version}"

        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
        }

        # Prepare request data
        data = {
            "messages": messages,
            "model": model,  # Note: Azure ignores this but we include for compatibility
            **kwargs
        }

        try:
            response = await (await self.get_client()).post(
                url,
                headers=headers,
                json=data,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            # Enhanced error handling for Azure-specific errors
            if hasattr(response, 'status_code'):
                if response.status_code == 401:
                    raise Exception("Invalid Azure OpenAI API key")
                elif response.status_code == 403:
                    raise Exception("Access denied to Azure OpenAI resource")
                elif response.status_code == 429:
                    raise Exception("Azure OpenAI rate limit exceeded")
                elif response.status_code == 404:
                    raise Exception(f"Azure OpenAI deployment '{deployment_name}' not found")

            raise Exception(f"Azure OpenAI API error: {str(e)}")

    async def list_deployments(self) -> Dict[str, Any]:
        """
        List available deployments in the Azure resource.

        Returns:
            Dictionary containing deployment information
        """
        if not self.resource_name:
            raise ValueError("Azure resource name must be configured")

        url = f"{self.base_url}/openai/deployments?api-version={self.api_version}"
        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
        }

        response = await (await self.get_client()).get(url, headers=headers)
        response.raise_for_status()
        return response.json()

    async def health_check(self) -> bool:
        """
        Perform Azure OpenAI specific health check.

        Returns:
            True if healthy, False otherwise
        """
        try:
            # Try to list deployments as a lightweight health check
            await self.list_deployments()
            self.last_error = None
            return True
        except Exception as deployment_error:
            # Some Azure endpoint shapes do not expose the generic deployments
            # listing route. Probe known deployment names directly instead.
            chat_errors = []
            for probe_model in self._get_health_probe_models():
                try:
                    test_messages = [{"role": "user", "content": "Hello"}]
                    await self.chat_completion(test_messages, model=probe_model, max_tokens=1)
                    self.last_error = None
                    return True
                except Exception as chat_error:
                    chat_errors.append(f"{probe_model}: {chat_error}")

            self.last_error = (
                f"Deployment check failed: {deployment_error}. "
                f"Fallback chat checks failed: {' | '.join(chat_errors)}"
            )
            # Log the full error for easier VPS-side debugging
            from ..services.telemetry import logger as telemetry_logger
            telemetry_logger.error("Azure OpenAI health check failed", error=self.last_error)
            return False
