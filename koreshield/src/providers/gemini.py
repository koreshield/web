"""
Google Gemini API provider integration.
"""

from typing import Any, Dict, List, Optional
import json

from .base import BaseProvider


class GeminiProvider(BaseProvider):
    """
    Integration for Google Gemini API.

    Supports both text-only and multimodal models.
    """

    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
        safety_settings: Optional[List[Dict[str, Any]]] = None
    ):
        """
        Initialize Gemini provider.

        Args:
            api_key: Google AI API key
            base_url: Optional custom base URL
            safety_settings: Optional safety settings for content filtering
        """
        self.safety_settings = safety_settings or self._get_default_safety_settings()
        super().__init__(api_key, base_url)

    def _get_default_url(self) -> str:
        """Get Google Gemini API URL."""
        return "https://generativelanguage.googleapis.com/v1beta"

    def _get_default_safety_settings(self) -> List[Dict[str, Any]]:
        """Get default safety settings for Gemini."""
        return [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]

    async def chat_completion(
        self, messages: list, model: str = "gemini-pro", **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to Google Gemini.

        Args:
            messages: List of message dictionaries
            model: Model to use (e.g., "gemini-pro", "gemini-pro-vision")
            **kwargs: Additional parameters

        Returns:
            Response dictionary in OpenAI-compatible format

        Raises:
            Exception: For API errors
        """
        # Convert OpenAI format to Gemini format
        gemini_contents = self._convert_messages_to_gemini(messages)

        # Prepare request data
        data = {
            "contents": gemini_contents,
            "safetySettings": self.safety_settings,
            **kwargs
        }

        # Remove OpenAI-specific parameters that Gemini doesn't understand
        data.pop('model', None)  # Gemini gets model from URL
        data.pop('stream', None)  # Streaming not supported in same way

        url = f"{self.base_url}/models/{model}:generateContent?key={self.api_key}"

        try:
            response = await (await self.get_client()).post(
                url,
                json=data,
                timeout=60.0  # Gemini can take longer
            )
            response.raise_for_status()
            result = response.json()

            # Check for Gemini-specific errors
            if "error" in result:
                error = result["error"]
                raise Exception(f"Gemini API error: {error.get('message', 'Unknown error')}")

            # Convert Gemini response back to OpenAI-like format for consistency
            return self._convert_gemini_to_openai(result, model)

        except Exception as e:
            # Enhanced error handling
            if hasattr(response, 'status_code') and response:
                if response.status_code == 400:
                    raise Exception("Invalid request to Gemini API")
                elif response.status_code == 401:
                    raise Exception("Invalid Gemini API key")
                elif response.status_code == 403:
                    raise Exception("Gemini API access denied")
                elif response.status_code == 429:
                    raise Exception("Gemini API rate limit exceeded")
                elif response.status_code == 500:
                    raise Exception("Gemini API internal error")

            raise Exception(f"Gemini API error: {str(e)}")

    def _convert_messages_to_gemini(self, messages: list) -> list:
        """
        Convert OpenAI message format to Gemini format.

        Handles system messages, user messages, and assistant messages.
        """
        gemini_contents = []
        system_instruction = None

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                # Gemini handles system messages differently
                system_instruction = content
                continue
            elif role == "assistant":
                gemini_role = "model"
            else:
                gemini_role = "user"

            # Handle different content types
            if isinstance(content, str):
                parts = [{"text": content}]
            elif isinstance(content, list):
                # Handle multimodal content (images, etc.)
                parts = self._convert_multimodal_content(content)
            else:
                parts = [{"text": str(content)}]

            gemini_contents.append({
                "role": gemini_role,
                "parts": parts
            })

        # If we have a system instruction, add it to the first user message
        if system_instruction and gemini_contents:
            for content in gemini_contents:
                if content["role"] == "user":
                    content["parts"].insert(0, {"text": f"System: {system_instruction}"})
                    break

        return gemini_contents

    def _convert_multimodal_content(self, content: list) -> list:
        """Convert multimodal content to Gemini format."""
        parts = []

        for item in content:
            if isinstance(item, dict):
                if item.get("type") == "text":
                    parts.append({"text": item.get("text", "")})
                elif item.get("type") == "image_url":
                    # Gemini expects base64 encoded images
                    image_data = item.get("image_url", {})
                    if isinstance(image_data, dict) and "url" in image_data:
                        # Extract base64 data from data URL
                        data_url = image_data["url"]
                        if data_url.startswith("data:image/"):
                            # This is a simplified version - real implementation
                            # would need proper base64 extraction
                            parts.append({"text": "[Image content not supported in this demo]"})
                        else:
                            parts.append({"text": "[External image URLs not supported]"})
                    else:
                        parts.append({"text": "[Invalid image format]"})

        return parts

    def _convert_gemini_to_openai(self, gemini_response: dict, model: str) -> dict:
        """
        Convert Gemini response to OpenAI-like format.

        Handles both successful responses and error cases.
        """
        candidates = gemini_response.get("candidates", [])
        if not candidates:
            return {
                "id": f"chatcmpl-{hash(str(gemini_response))}",
                "object": "chat.completion",
                "created": 0,
                "model": model,
                "choices": [],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }

        # Get the first candidate
        candidate = candidates[0]
        content = candidate.get("content", {})
        parts = content.get("parts", [])

        # Extract text from parts
        text_content = ""
        for part in parts:
            if "text" in part:
                text_content += part["text"]

        # Get finish reason
        finish_reason = candidate.get("finishReason", "stop").lower()
        if finish_reason == "max_tokens":
            finish_reason = "length"
        elif finish_reason not in ["stop", "length"]:
            finish_reason = "stop"

        # Convert to OpenAI format
        return {
            "id": f"chatcmpl-{hash(str(gemini_response))}",
            "object": "chat.completion",
            "created": 0,  # Gemini doesn't provide timestamp
            "model": model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": text_content
                },
                "finish_reason": finish_reason
            }],
            "usage": {
                "prompt_tokens": gemini_response.get("usageMetadata", {}).get("promptTokenCount", 0),
                "completion_tokens": gemini_response.get("usageMetadata", {}).get("candidatesTokenCount", 0),
                "total_tokens": gemini_response.get("usageMetadata", {}).get("totalTokenCount", 0)
            }
        }

    async def list_models(self) -> Dict[str, Any]:
        """
        List available Gemini models.

        Returns:
            Dictionary containing available models
        """
        url = f"{self.base_url}/models?key={self.api_key}"

        response = await (await self.get_client()).get(url)
        response.raise_for_status()
        return response.json()

    async def health_check(self) -> bool:
        """
        Perform Gemini-specific health check.

        Returns:
            True if healthy, False otherwise
        """
        try:
            # Try to list models as a lightweight health check
            await self.list_models()
            return True
        except Exception:
            # Fallback to basic chat completion check
            try:
                test_messages = [{"role": "user", "content": "Hello"}]
                await self.chat_completion(test_messages, max_tokens=1)
                return True
            except Exception:
                return False