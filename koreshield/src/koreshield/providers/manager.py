"""
Provider manager with failover, load balancing, and streaming capabilities.
"""

import asyncio
import time
from typing import Any, AsyncIterator, Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

from .base import BaseProvider
from .rate_limiting import CostOptimizer, RateLimitManager


class ProviderStatus(Enum):
    """Provider health status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


@dataclass
class ProviderHealth:
    """Provider health information."""
    status: ProviderStatus
    last_check: float
    consecutive_failures: int
    response_time: Optional[float] = None
    error_message: Optional[str] = None


class ProviderManager:
    """
    Manages multiple LLM providers with failover and load balancing.

    Features:
    - Automatic failover between providers
    - Health monitoring and recovery
    - Load balancing across healthy providers
    - Cost optimization with provider selection
    - Rate limit handling
    """

    def __init__(
        self,
        providers: List[BaseProvider],
        health_check_interval: int = 60,
        max_consecutive_failures: int = 3,
        failover_timeout: float = 30.0,
        enable_cost_optimization: bool = True,
        enable_rate_limiting: bool = True
    ):
        """
        Initialize provider manager.

        Args:
            providers: List of provider instances
            health_check_interval: Seconds between health checks
            max_consecutive_failures: Max failures before marking unhealthy
            failover_timeout: Timeout for failover attempts
            enable_cost_optimization: Whether to enable cost-based selection
            enable_rate_limiting: Whether to enable rate limiting
        """
        self.providers = providers
        self.health_check_interval = health_check_interval
        self.max_consecutive_failures = max_consecutive_failures
        self.failover_timeout = failover_timeout
        self.enable_cost_optimization = enable_cost_optimization
        self.enable_rate_limiting = enable_rate_limiting

        # Health tracking
        self.provider_health: Dict[str, ProviderHealth] = {}
        self._initialize_health_tracking()

        # Active provider tracking
        self.current_provider_index = 0
        self.failover_in_progress = False

        # Cost optimization and rate limiting
        self.cost_optimizer = CostOptimizer() if enable_cost_optimization else None
        self.rate_limiter = RateLimitManager() if enable_rate_limiting else None

        # Start background health monitoring
        self._health_task: Optional[asyncio.Task] = None

    def _initialize_health_tracking(self):
        """Initialize health tracking for all providers."""
        for provider in self.providers:
            provider_name = provider.__class__.__name__
            self.provider_health[provider_name] = ProviderHealth(
                status=ProviderStatus.HEALTHY,
                last_check=time.time(),
                consecutive_failures=0
            )

    def _get_provider_name(self, provider: BaseProvider) -> str:
        """Get provider name for tracking."""
        return provider.__class__.__name__

    async def start_health_monitoring(self):
        """Start background health monitoring."""
        if self._health_task is None:
            self._health_task = asyncio.create_task(self._health_monitor_loop())

    async def stop_health_monitoring(self):
        """Stop background health monitoring."""
        if self._health_task:
            self._health_task.cancel()
            try:
                await self._health_task
            except asyncio.CancelledError:
                pass
            self._health_task = None

    async def _health_monitor_loop(self):
        """Background health monitoring loop."""
        while True:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.health_check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Health monitoring error: {e}")
                await asyncio.sleep(self.health_check_interval)

    async def _perform_health_checks(self):
        """Perform health checks on all providers."""
        tasks = []
        for provider in self.providers:
            tasks.append(self._check_provider_health(provider))

        await asyncio.gather(*tasks, return_exceptions=True)

    async def _check_provider_health(self, provider: BaseProvider):
        """Check health of a single provider."""
        provider_name = self._get_provider_name(provider)
        health = self.provider_health[provider_name]

        start_time = time.time()
        try:
            # Perform health check
            is_healthy = await provider.health_check()
            response_time = time.time() - start_time

            if is_healthy:
                health.status = ProviderStatus.HEALTHY
                health.consecutive_failures = 0
                health.response_time = response_time
                health.error_message = None
            else:
                health.status = ProviderStatus.DEGRADED
                health.consecutive_failures += 1
                health.response_time = response_time

        except Exception as e:
            health.consecutive_failures += 1
            health.error_message = str(e)
            health.response_time = time.time() - start_time

        # Mark as unhealthy if too many consecutive failures
        if health.consecutive_failures >= self.max_consecutive_failures:
            health.status = ProviderStatus.UNHEALTHY

        health.last_check = time.time()

    def get_healthy_providers(self) -> List[BaseProvider]:
        """Get list of currently healthy providers."""
        healthy = []
        for provider in self.providers:
            provider_name = self._get_provider_name(provider)
            health = self.provider_health[provider_name]
            if health.status == ProviderStatus.HEALTHY:
                healthy.append(provider)
        return healthy

    def get_best_provider(self, model: str = "", estimated_tokens: int = 1000) -> Optional[BaseProvider]:
        """
        Get the best available provider based on health, performance, and cost.

        Selection criteria (in order):
        1. Healthy status
        2. Rate limit availability
        3. Cost optimization (if enabled)
        4. Lowest response time
        5. Fewest consecutive failures

        Args:
            model: Model name for cost estimation
            estimated_tokens: Estimated tokens for rate limiting

        Returns:
            Best available provider, or None if no providers available
        """
        healthy_providers = self.get_healthy_providers()
        if not healthy_providers:
            return None

        # Filter by rate limits if enabled
        if self.enable_rate_limiting and self.rate_limiter:
            rate_limit_ok = []
            for provider in healthy_providers:
                provider_name = self._get_provider_name(provider)
                if self.rate_limiter.can_make_request(provider_name, estimated_tokens):
                    rate_limit_ok.append(provider)
            healthy_providers = rate_limit_ok

        if not healthy_providers:
            return None

        # If cost optimization is enabled and we have a model, select cheapest
        if self.enable_cost_optimization and self.cost_optimizer and model:
            cheapest = self.cost_optimizer.select_cheapest_provider(healthy_providers, model, estimated_tokens)
            if cheapest:
                return cheapest

        # Otherwise, sort by response time, then by consecutive failures
        sorted_providers = sorted(
            healthy_providers,
            key=lambda p: (
                self.provider_health[self._get_provider_name(p)].response_time or float('inf'),
                self.provider_health[self._get_provider_name(p)].consecutive_failures
            )
        )

        return sorted_providers[0]

    async def chat_completion_with_failover(
        self,
        messages: List[Dict[str, Any]],
        model: str = "",
        max_retries: int = 3,
        estimated_tokens: int = 1000,
        preferred_provider: Optional["BaseProvider"] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Perform chat completion with automatic failover, rate limiting, and cost optimization.

        Args:
            messages: Chat messages
            model: Model name (may be provider-specific)
            max_retries: Maximum number of failover attempts
            estimated_tokens: Estimated tokens for rate limiting and cost calculation
            **kwargs: Additional provider-specific parameters

        Returns:
            Chat completion response

        Raises:
            Exception: If all providers fail
        """
        if self.failover_in_progress:
            # Wait for ongoing failover to complete
            await asyncio.sleep(0.1)

        errors = []
        attempted_providers = set()

        # Build ordered provider list: preferred first, then rest by quality
        def _ordered_providers() -> List["BaseProvider"]:
            if preferred_provider is not None:
                pname = self._get_provider_name(preferred_provider)
                health = self.provider_health.get(pname)
                if health and health.status == ProviderStatus.HEALTHY:
                    rest = [p for p in self.providers if p is not preferred_provider]
                    return [preferred_provider] + rest
            return self.providers[:]

        all_providers = _ordered_providers()

        for attempt in range(max_retries):
            # Prefer the model-appropriate provider on the first attempt; fall
            # back to the standard health-based selector on subsequent attempts.
            if attempt == 0 and all_providers:
                provider = all_providers[0]
            else:
                provider = self.get_best_provider(model, estimated_tokens)

            if provider is None:
                break

            provider_name = self._get_provider_name(provider)
            if provider_name in attempted_providers:
                # Don't retry the same provider immediately
                continue

            attempted_providers.add(provider_name)

            # Wait for rate limits if necessary
            if self.enable_rate_limiting and self.rate_limiter:
                can_proceed = await self.rate_limiter.wait_for_rate_limit(provider_name, estimated_tokens)
                if not can_proceed:
                    error_msg = f"{provider_name} rate limited"
                    errors.append(error_msg)
                    continue

            try:
                # Attempt the request
                result = await asyncio.wait_for(
                    provider.chat_completion(messages, model, **kwargs),
                    timeout=self.failover_timeout
                )

                # Success - update health and record usage
                self._last_used_provider = provider_name
                health = self.provider_health[provider_name]
                health.consecutive_failures = 0
                health.status = ProviderStatus.HEALTHY

                # Record rate limit usage and cost
                if self.enable_rate_limiting and self.rate_limiter:
                    tokens_used = result.get("usage", {}).get("total_tokens", estimated_tokens)
                    self.rate_limiter.record_request(provider_name, tokens_used)

                if self.enable_cost_optimization and self.cost_optimizer:
                    input_tokens = result.get("usage", {}).get("prompt_tokens", tokens_used // 2)
                    output_tokens = result.get("usage", {}).get("completion_tokens", tokens_used // 2)
                    self.cost_optimizer.record_usage(provider_name, model, input_tokens, output_tokens)

                return result

            except asyncio.TimeoutError:
                error_msg = f"{provider_name} request timed out"
                errors.append(error_msg)
                self._mark_provider_failure(provider_name, error_msg)

            except Exception as e:
                error_msg = f"{provider_name} error: {str(e)}"
                errors.append(error_msg)
                self._mark_provider_failure(provider_name, error_msg)

        # All providers failed
        raise Exception(f"All providers failed. Errors: {'; '.join(errors)}")

    def _mark_provider_failure(self, provider_name: str, error: str):
        """Mark a provider failure and update health."""
        if provider_name in self.provider_health:
            health = self.provider_health[provider_name]
            health.consecutive_failures += 1
            health.error_message = error

            if health.consecutive_failures >= self.max_consecutive_failures:
                health.status = ProviderStatus.UNHEALTHY

    async def get_cost_stats(self) -> Dict[str, any]:
        """
        Get cost optimization statistics.

        Returns:
            Dictionary with cost and usage statistics
        """
        if not self.cost_optimizer:
            return {"cost_optimization": "disabled"}

        return {
            "usage_stats": self.cost_optimizer.get_usage_stats(),
            "cost_optimization": "enabled"
        }

    async def get_rate_limit_stats(self) -> Dict[str, any]:
        """
        Get rate limiting statistics.

        Returns:
            Dictionary with rate limit status for all providers
        """
        if not self.rate_limiter:
            return {"rate_limiting": "disabled"}

        stats = {}
        for provider in self.providers:
            provider_name = self._get_provider_name(provider)
            stats[provider_name] = self.rate_limiter.get_rate_limit_status(provider_name)

        return {
            "rate_limiting": "enabled",
            "provider_stats": stats
        }

    async def get_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """
        Get status information for all providers.

        Returns:
            Dictionary mapping provider names to status info
        """
        status = {}
        for provider in self.providers:
            provider_name = self._get_provider_name(provider)
            health = self.provider_health[provider_name]
            status[provider_name] = {
                "status": health.status.value,
                "consecutive_failures": health.consecutive_failures,
                "last_check": health.last_check,
                "response_time": health.response_time,
                "error_message": health.error_message,
            }
        return status

    async def force_health_check(self, provider_name: Optional[str] = None):
        """
        Force immediate health check.

        Args:
            provider_name: Specific provider to check, or None for all
        """
        if provider_name:
            # Find the provider
            provider = None
            for p in self.providers:
                if self._get_provider_name(p) == provider_name:
                    provider = p
                    break

            if provider:
                await self._check_provider_health(provider)
        else:
            await self._perform_health_checks()

    async def chat_completion_stream_with_failover(
        self,
        messages: List[Dict[str, Any]],
        model: str = "",
        preferred_provider: Optional["BaseProvider"] = None,
        **kwargs,
    ) -> AsyncIterator[bytes]:
        """
        Stream a chat completion with automatic failover.

        Tries the preferred (model-appropriate) provider first.  If that
        provider doesn't support streaming or raises an error, falls back to
        the next healthy provider.

        Yields:
            Raw bytes in OpenAI SSE format (``data: {...}\\n\\n`` lines).
        """
        candidates: List["BaseProvider"] = []
        if preferred_provider is not None:
            pname = self._get_provider_name(preferred_provider)
            health = self.provider_health.get(pname)
            if health and health.status == ProviderStatus.HEALTHY:
                candidates.append(preferred_provider)
        for p in self.providers:
            if p not in candidates:
                pname = self._get_provider_name(p)
                health = self.provider_health.get(pname)
                if health and health.status == ProviderStatus.HEALTHY:
                    candidates.append(p)

        if not candidates:
            error_chunk = {
                "error": {
                    "message": "No healthy providers available",
                    "type": "server_error",
                    "code": "no_providers",
                }
            }
            import json as _json
            yield f"data: {_json.dumps(error_chunk)}\n\n".encode()
            yield b"data: [DONE]\n\n"
            return

        for provider in candidates:
            provider_name = self._get_provider_name(provider)
            stream_fn = getattr(provider, "chat_completion_stream", None)
            if stream_fn is None:
                continue
            try:
                self._last_used_provider = provider_name
                async for chunk in stream_fn(messages, model, **kwargs):
                    yield chunk
                # Mark as healthy on success
                health = self.provider_health[provider_name]
                health.consecutive_failures = 0
                health.status = ProviderStatus.HEALTHY
                return
            except Exception as e:
                self._mark_provider_failure(provider_name, str(e))
                # Try next provider
                continue

        # All failed – emit an error SSE event
        import json as _json
        error_chunk = {
            "error": {
                "message": "All providers failed during streaming",
                "type": "server_error",
                "code": "all_providers_failed",
            }
        }
        yield f"data: {_json.dumps(error_chunk)}\n\n".encode()
        yield b"data: [DONE]\n\n"