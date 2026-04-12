"""
Anthropic Claude API provider integration.
"""

import json
import time
import uuid
from typing import Any, AsyncIterator, Dict

import httpx

from .base import BaseProvider


class AnthropicProvider(BaseProvider):
    """
    Integration for Anthropic Claude API.

    Streaming output is converted to the OpenAI SSE format so that the proxy
    can expose a single, consistent interface regardless of the backend.
    """

    def _get_default_url(self) -> str:
        """Get Anthropic API URL."""
        return "https://api.anthropic.com/v1"

    def _build_headers(self) -> Dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

    async def chat_completion(
        self, messages: list, model: str = "claude-3-5-sonnet-20241022", **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to Anthropic and return an OpenAI-compatible dict.
        """
        url = f"{self.base_url}/messages"
        kwargs.pop("stream", None)
        # Anthropic requires max_tokens; default if caller didn't supply it.
        if "max_tokens" not in kwargs:
            kwargs["max_tokens"] = 1024

        data = {"model": model, "messages": messages, **kwargs}

        response = await (await self.get_client()).post(
            url, headers=self._build_headers(), json=data
        )
        response.raise_for_status()
        return self._to_openai_format(response.json(), model)

    async def chat_completion_stream(
        self, messages: list, model: str = "claude-3-5-sonnet-20241022", **kwargs
    ) -> AsyncIterator[bytes]:
        """
        Stream a chat completion from Anthropic, converting each event to
        OpenAI SSE format so the proxy surface is consistent.

        Anthropic SSE events               → OpenAI SSE chunks
        ─────────────────────────────────────────────────────
        content_block_delta (text_delta)   → {"choices":[{"delta":{"content":"…"}}]}
        message_stop                       → {"choices":[{"delta":{},"finish_reason":"stop"}]}
        """
        url = f"{self.base_url}/messages"
        kwargs.pop("stream", None)
        if "max_tokens" not in kwargs:
            kwargs["max_tokens"] = 1024

        data = {
            "model": model,
            "messages": messages,
            "stream": True,
            **kwargs,
        }
        headers = {**self._build_headers(), "accept": "text/event-stream"}

        completion_id = f"chatcmpl-{uuid.uuid4().hex[:24]}"
        created = int(time.time())

        # Emit the role chunk first (mirrors what OpenAI does)
        role_chunk = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": model,
            "choices": [{"index": 0, "delta": {"role": "assistant", "content": ""}, "finish_reason": None}],
        }
        yield f"data: {json.dumps(role_chunk)}\n\n".encode()

        async with httpx.AsyncClient(timeout=httpx.Timeout(connect=10, read=120, write=10, pool=10)) as client:
            async with client.stream("POST", url, headers=headers, json=data) as response:
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

                    evt_type = evt.get("type")

                    if evt_type == "content_block_delta":
                        text = evt.get("delta", {}).get("text", "")
                        if text:
                            chunk = {
                                "id": completion_id,
                                "object": "chat.completion.chunk",
                                "created": created,
                                "model": model,
                                "choices": [{"index": 0, "delta": {"content": text}, "finish_reason": None}],
                            }
                            yield f"data: {json.dumps(chunk)}\n\n".encode()

                    elif evt_type == "message_stop":
                        final = {
                            "id": completion_id,
                            "object": "chat.completion.chunk",
                            "created": created,
                            "model": model,
                            "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
                        }
                        yield f"data: {json.dumps(final)}\n\n".encode()

        yield b"data: [DONE]\n\n"

    def _to_openai_format(self, anthropic_response: dict, model: str) -> dict:
        """Convert an Anthropic /messages response to OpenAI chat.completion format."""
        content_blocks = anthropic_response.get("content", [])
        text_content = "".join(
            block.get("text", "") for block in content_blocks if block.get("type") == "text"
        )

        stop_reason = anthropic_response.get("stop_reason", "end_turn")
        finish_reason = "stop" if stop_reason in ("end_turn", "stop_sequence") else "length"

        usage = anthropic_response.get("usage", {})
        return {
            "id": f"chatcmpl-{anthropic_response.get('id', uuid.uuid4().hex[:24])}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model,
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": text_content},
                    "finish_reason": finish_reason,
                }
            ],
            "usage": {
                "prompt_tokens": usage.get("input_tokens", 0),
                "completion_tokens": usage.get("output_tokens", 0),
                "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            },
        }

    async def health_check(self) -> bool:
        """Perform an Anthropic-specific health check."""
        try:
            test_messages = [{"role": "user", "content": "Hello"}]
            await self.chat_completion(test_messages, max_tokens=1)
            return True
        except Exception:
            return False
