"""
Google Gemini API provider integration.
"""

import json
import time
import uuid
from typing import Any, AsyncIterator, Dict, List, Optional

import httpx

from .base import BaseProvider


class GeminiProvider(BaseProvider):
    """
    Integration for Google Gemini API.

    Supports both text-only and multimodal models.
    Streaming output is converted to OpenAI SSE format for a consistent proxy surface.
    """

    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
        safety_settings: Optional[List[Dict[str, Any]]] = None,
        redis_client=None,
        cache_enabled: bool = True,
    ):
        """
        Initialize Gemini provider.

        Args:
            api_key: Google AI API key
            base_url: Optional custom base URL
            safety_settings: Optional safety settings for content filtering
        """
        self.safety_settings = safety_settings or self._get_default_safety_settings()
        super().__init__(
            api_key,
            base_url,
            redis_client=redis_client,
            cache_enabled=cache_enabled,
        )

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
        self, messages: list, model: str = "gemini-1.5-flash", **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to Google Gemini.

        Args:
            messages: List of message dictionaries
            model: Model to use (e.g., "gemini-1.5-flash", "gemini-1.5-pro")
            **kwargs: Additional parameters

        Returns:
            Response dictionary in OpenAI-compatible format
        """
        gemini_contents = self._convert_messages_to_gemini(messages)

        data = {
            "contents": gemini_contents,
            "safetySettings": self.safety_settings,
        }
        # Map OpenAI generation params to Gemini equivalents where applicable
        if "max_tokens" in kwargs:
            data.setdefault("generationConfig", {})["maxOutputTokens"] = kwargs["max_tokens"]
        if "temperature" in kwargs:
            data.setdefault("generationConfig", {})["temperature"] = kwargs["temperature"]
        if "top_p" in kwargs:
            data.setdefault("generationConfig", {})["topP"] = kwargs["top_p"]

        url = f"{self.base_url}/models/{model}:generateContent?key={self.api_key}"

        response = await (await self.get_client()).post(url, json=data, timeout=60.0)
        response.raise_for_status()
        result = response.json()

        if "error" in result:
            error = result["error"]
            raise Exception(f"Gemini API error: {error.get('message', 'Unknown error')}")

        return self._convert_gemini_to_openai(result, model)

    async def chat_completion_stream(
        self, messages: list, model: str = "gemini-1.5-flash", **kwargs
    ) -> AsyncIterator[bytes]:
        """
        Stream a chat completion from Gemini, converting each SSE event to
        OpenAI SSE format for a consistent proxy surface.
        """
        gemini_contents = self._convert_messages_to_gemini(messages)

        data: Dict[str, Any] = {
            "contents": gemini_contents,
            "safetySettings": self.safety_settings,
        }
        if "max_tokens" in kwargs:
            data.setdefault("generationConfig", {})["maxOutputTokens"] = kwargs["max_tokens"]
        if "temperature" in kwargs:
            data.setdefault("generationConfig", {})["temperature"] = kwargs["temperature"]
        if "top_p" in kwargs:
            data.setdefault("generationConfig", {})["topP"] = kwargs["top_p"]

        url = f"{self.base_url}/models/{model}:streamGenerateContent?key={self.api_key}&alt=sse"

        completion_id = f"chatcmpl-{uuid.uuid4().hex[:24]}"
        created = int(time.time())

        # Emit role chunk first
        role_chunk = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": model,
            "choices": [{"index": 0, "delta": {"role": "assistant", "content": ""}, "finish_reason": None}],
        }
        yield f"data: {json.dumps(role_chunk)}\n\n".encode()

        async with httpx.AsyncClient(timeout=httpx.Timeout(connect=10, read=120, write=10, pool=10)) as client:
            async with client.stream("POST", url, json=data) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    raw = line[6:].strip()
                    if not raw:
                        continue
                    try:
                        evt = json.loads(raw)
                    except json.JSONDecodeError:
                        continue

                    # Each Gemini streaming event is a full generateContent response fragment
                    candidates = evt.get("candidates", [])
                    for candidate in candidates:
                        content = candidate.get("content", {})
                        parts = content.get("parts", [])
                        for part in parts:
                            text = part.get("text", "")
                            if text:
                                chunk = {
                                    "id": completion_id,
                                    "object": "chat.completion.chunk",
                                    "created": created,
                                    "model": model,
                                    "choices": [{"index": 0, "delta": {"content": text}, "finish_reason": None}],
                                }
                                yield f"data: {json.dumps(chunk)}\n\n".encode()

                        finish_reason = candidate.get("finishReason")
                        if finish_reason and finish_reason != "FINISH_REASON_UNSPECIFIED":
                            oai_finish = "stop" if finish_reason in ("STOP", "MAX_TOKENS") else "stop"
                            final = {
                                "id": completion_id,
                                "object": "chat.completion.chunk",
                                "created": created,
                                "model": model,
                                "choices": [{"index": 0, "delta": {}, "finish_reason": oai_finish}],
                            }
                            yield f"data: {json.dumps(final)}\n\n".encode()

        yield b"data: [DONE]\n\n"

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
                    image_data = item.get("image_url", {})
                    if isinstance(image_data, dict) and "url" in image_data:
                        data_url = image_data["url"]
                        if data_url.startswith("data:image/"):
                            parts.append({"text": "[Image content not supported in this demo]"})
                        else:
                            parts.append({"text": "[External image URLs not supported]"})
                    else:
                        parts.append({"text": "[Invalid image format]"})

        return parts

    def _convert_gemini_to_openai(self, gemini_response: dict, model: str) -> dict:
        """
        Convert Gemini response to OpenAI-like format.
        """
        candidates = gemini_response.get("candidates", [])
        if not candidates:
            return {
                "id": f"chatcmpl-{uuid.uuid4().hex[:24]}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": model,
                "choices": [],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }

        candidate = candidates[0]
        content = candidate.get("content", {})
        parts = content.get("parts", [])

        text_content = "".join(part.get("text", "") for part in parts if "text" in part)

        finish_reason = candidate.get("finishReason", "STOP").lower()
        if finish_reason == "max_tokens":
            finish_reason = "length"
        elif finish_reason not in ["stop", "length"]:
            finish_reason = "stop"

        return {
            "id": f"chatcmpl-{uuid.uuid4().hex[:24]}",
            "object": "chat.completion",
            "created": int(time.time()),
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
        """
        url = f"{self.base_url}/models?key={self.api_key}"
        response = await (await self.get_client()).get(url)
        response.raise_for_status()
        return response.json()

    async def health_check(self) -> bool:
        """Perform Gemini-specific health check."""
        try:
            await self.list_models()
            return True
        except Exception:
            try:
                test_messages = [{"role": "user", "content": "Hello"}]
                await self.chat_completion(test_messages, max_tokens=1)
                return True
            except Exception:
                return False
