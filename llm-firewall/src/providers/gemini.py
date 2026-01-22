"""
Google Gemini API provider integration.
"""

from typing import Any, Dict

from .base import BaseProvider


class GeminiProvider(BaseProvider):
    """
    Integration for Google Gemini API.
    """

    def _get_default_url(self) -> str:
        """Get Google Gemini API URL."""
        return "https://generativelanguage.googleapis.com/v1beta"

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
            Response dictionary
        """
        # Convert OpenAI format to Gemini format
        gemini_messages = self._convert_messages_to_gemini(messages)

        url = f"{self.base_url}/models/{model}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        data = {"contents": gemini_messages, **kwargs}

        response = await self.client.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()

        # Convert Gemini response back to OpenAI-like format for consistency
        return self._convert_gemini_to_openai(result, model)

    def _convert_messages_to_gemini(self, messages: list) -> list:
        """Convert OpenAI message format to Gemini format."""
        gemini_contents = []

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            # Gemini uses 'user' and 'model' roles
            gemini_role = "user" if role == "user" else "model"

            gemini_contents.append({
                "role": gemini_role,
                "parts": [{"text": content}]
            })

        return gemini_contents

    def _convert_gemini_to_openai(self, gemini_response: dict, model: str) -> dict:
        """Convert Gemini response to OpenAI-like format."""
        candidates = gemini_response.get("candidates", [])
        if not candidates:
            return {"choices": [], "usage": {}}

        # Get the first candidate
        candidate = candidates[0]
        content = candidate.get("content", {})
        parts = content.get("parts", [])
        text = parts[0].get("text", "") if parts else ""

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
                    "content": text
                },
                "finish_reason": candidate.get("finishReason", "stop").lower()
            }],
            "usage": {
                "prompt_tokens": 0,  # Gemini doesn't provide token counts
                "completion_tokens": 0,
                "total_tokens": 0
            }
        }