"""LangChain integration for KoreShield."""

from typing import Any, Dict, List, Optional, Union
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult
from langchain_core.messages import BaseMessage

from ..client import KoreShieldClient
from ..async_client import AsyncKoreShieldClient
from ..types import DetectionResult, ThreatLevel
from ..exceptions import KoreShieldError


class KoreShieldCallbackHandler(BaseCallbackHandler):
    """LangChain callback handler for KoreShield security monitoring.

    This handler automatically scans prompts and responses for security threats
    during LangChain operations.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.koreshield.com",
        block_on_threat: bool = False,
        threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
        scan_responses: bool = True,
        **client_kwargs
    ):
        """Initialize the KoreShield callback handler.

        Args:
            api_key: KoreShield API key
            base_url: KoreShield API base URL
            block_on_threat: Whether to raise exception on detected threats
            threat_threshold: Minimum threat level to trigger blocking
            scan_responses: Whether to scan LLM responses
            **client_kwargs: Additional arguments for KoreShieldClient
        """
        super().__init__()
        self.client = KoreShieldClient(api_key, base_url, **client_kwargs)
        self.block_on_threat = block_on_threat
        self.threat_threshold = threat_threshold
        self.scan_responses = scan_responses
        self.scan_results = []

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        """Called when LLM starts processing prompts."""
        for prompt in prompts:
            try:
                result = self.client.scan_prompt(prompt)
                self.scan_results.append({
                    "type": "prompt",
                    "content": prompt,
                    "result": result,
                    "timestamp": kwargs.get("run_id", None),
                })

                if self._should_block(result):
                    raise KoreShieldError(
                        f"Security threat detected in prompt: {result.threat_level.value} "
                        f"(confidence: {result.confidence:.2f})"
                    )

            except KoreShieldError:
                raise  # Re-raise security errors
            except Exception as e:
                # Log but don't block on client errors
                print(f"Warning: KoreShield scan failed: {e}")

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Called when LLM finishes processing."""
        if not self.scan_responses:
            return

        for generation in response.generations:
            for gen in generation:
                if hasattr(gen, 'text') and gen.text:
                    try:
                        result = self.client.scan_prompt(gen.text)
                        self.scan_results.append({
                            "type": "response",
                            "content": gen.text,
                            "result": result,
                            "timestamp": kwargs.get("run_id", None),
                        })

                        if self._should_block(result):
                            raise KoreShieldError(
                                f"Security threat detected in response: {result.threat_level.value} "
                                f"(confidence: {result.confidence:.2f})"
                            )

                    except KoreShieldError:
                        raise  # Re-raise security errors
                    except Exception as e:
                        # Log but don't block on client errors
                        print(f"Warning: KoreShield scan failed: {e}")

    def get_scan_results(self) -> List[Dict[str, Any]]:
        """Get all scan results from this handler."""
        return self.scan_results.copy()

    def clear_scan_results(self) -> None:
        """Clear stored scan results."""
        self.scan_results.clear()

    def _should_block(self, result: DetectionResult) -> bool:
        """Determine if a result should trigger blocking."""
        if not self.block_on_threat:
            return False

        threat_levels = {
            ThreatLevel.SAFE: 0,
            ThreatLevel.LOW: 1,
            ThreatLevel.MEDIUM: 2,
            ThreatLevel.HIGH: 3,
            ThreatLevel.CRITICAL: 4,
        }

        result_level = threat_levels.get(result.threat_level, 0)
        threshold_level = threat_levels.get(self.threat_threshold, 2)

        return result_level >= threshold_level


class AsyncKoreShieldCallbackHandler(BaseCallbackHandler):
    """Async LangChain callback handler for KoreShield security monitoring."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.koreshield.com",
        block_on_threat: bool = False,
        threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
        scan_responses: bool = True,
        **client_kwargs
    ):
        """Initialize the async KoreShield callback handler."""
        super().__init__()
        self.client = AsyncKoreShieldClient(api_key, base_url, **client_kwargs)
        self.block_on_threat = block_on_threat
        self.threat_threshold = threat_threshold
        self.scan_responses = scan_responses
        self.scan_results = []

    async def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        """Called when LLM starts processing prompts (async)."""
        for prompt in prompts:
            try:
                result = await self.client.scan_prompt(prompt)
                self.scan_results.append({
                    "type": "prompt",
                    "content": prompt,
                    "result": result,
                    "timestamp": kwargs.get("run_id", None),
                })

                if self._should_block(result):
                    raise KoreShieldError(
                        f"Security threat detected in prompt: {result.threat_level.value} "
                        f"(confidence: {result.confidence:.2f})"
                    )

            except KoreShieldError:
                raise  # Re-raise security errors
            except Exception as e:
                # Log but don't block on client errors
                print(f"Warning: KoreShield scan failed: {e}")

    async def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Called when LLM finishes processing (async)."""
        if not self.scan_responses:
            return

        for generation in response.generations:
            for gen in generation:
                if hasattr(gen, 'text') and gen.text:
                    try:
                        result = await self.client.scan_prompt(gen.text)
                        self.scan_results.append({
                            "type": "response",
                            "content": gen.text,
                            "result": result,
                            "timestamp": kwargs.get("run_id", None),
                        })

                        if self._should_block(result):
                            raise KoreShieldError(
                                f"Security threat detected in response: {result.threat_level.value} "
                                f"(confidence: {result.confidence:.2f})"
                            )

                    except KoreShieldError:
                        raise  # Re-raise security errors
                    except Exception as e:
                        # Log but don't block on client errors
                        print(f"Warning: KoreShield scan failed: {e}")

    def get_scan_results(self) -> List[Dict[str, Any]]:
        """Get all scan results from this handler."""
        return self.scan_results.copy()

    def clear_scan_results(self) -> None:
        """Clear stored scan results."""
        self.scan_results.clear()

    def _should_block(self, result: DetectionResult) -> bool:
        """Determine if a result should trigger blocking."""
        if not self.block_on_threat:
            return False

        threat_levels = {
            ThreatLevel.SAFE: 0,
            ThreatLevel.LOW: 1,
            ThreatLevel.MEDIUM: 2,
            ThreatLevel.HIGH: 3,
            ThreatLevel.CRITICAL: 4,
        }

        result_level = threat_levels.get(result.threat_level, 0)
        threshold_level = threat_levels.get(self.threat_threshold, 2)

        return result_level >= threshold_level


# Convenience functions for easy integration
def create_koreshield_callback(
    api_key: str,
    block_on_threat: bool = False,
    threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
    **kwargs
) -> KoreShieldCallbackHandler:
    """Create a KoreShield callback handler for LangChain.

    Args:
        api_key: KoreShield API key
        block_on_threat: Whether to block on detected threats
        threat_threshold: Minimum threat level for blocking
        **kwargs: Additional arguments for KoreShieldClient

    Returns:
        Configured KoreShieldCallbackHandler
    """
    return KoreShieldCallbackHandler(
        api_key=api_key,
        block_on_threat=block_on_threat,
        threat_threshold=threat_threshold,
        **kwargs
    )


def create_async_koreshield_callback(
    api_key: str,
    block_on_threat: bool = False,
    threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
    **kwargs
) -> AsyncKoreShieldCallbackHandler:
    """Create an async KoreShield callback handler for LangChain.

    Args:
        api_key: KoreShield API key
        block_on_threat: Whether to block on detected threats
        threat_threshold: Minimum threat level for blocking
        **kwargs: Additional arguments for AsyncKoreShieldClient

    Returns:
        Configured AsyncKoreShieldCallbackHandler
    """
    return AsyncKoreShieldCallbackHandler(
        api_key=api_key,
        block_on_threat=block_on_threat,
        threat_threshold=threat_threshold,
        **kwargs
    )