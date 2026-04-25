"""
Rate limiting and cost optimization for LLM providers.
"""

import asyncio
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum

from .base import BaseProvider


class RateLimitType(Enum):
    """Types of rate limits."""
    REQUESTS_PER_MINUTE = "requests_per_minute"
    REQUESTS_PER_HOUR = "requests_per_hour"
    TOKENS_PER_MINUTE = "tokens_per_minute"
    TOKENS_PER_HOUR = "tokens_per_hour"


@dataclass
class RateLimit:
    """Rate limit configuration."""
    limit_type: RateLimitType
    limit: int
    window_seconds: int


@dataclass
class RateLimitState:
    """Current rate limit state."""
    requests_in_window: int = 0
    tokens_in_window: int = 0
    window_start: float = field(default_factory=time.time)

    def reset_if_needed(self, current_time: float, window_seconds: int):
        """Reset counters if window has expired."""
        if current_time - self.window_start >= window_seconds:
            self.requests_in_window = 0
            self.tokens_in_window = 0
            self.window_start = current_time

    def can_make_request(self, tokens: int, rate_limits: List[RateLimit]) -> bool:
        """Check if a request can be made within rate limits."""
        current_time = time.time()

        for limit in rate_limits:
            self.reset_if_needed(current_time, limit.window_seconds)

            if limit.limit_type == RateLimitType.REQUESTS_PER_MINUTE:
                if self.requests_in_window >= limit.limit:
                    return False
            elif limit.limit_type == RateLimitType.REQUESTS_PER_HOUR:
                # For hourly limits, we need to check if we're within the limit
                # This is a simplified version - in practice you'd want separate tracking
                if self.requests_in_window >= limit.limit:
                    return False
            elif limit.limit_type == RateLimitType.TOKENS_PER_MINUTE:
                if self.tokens_in_window + tokens > limit.limit:
                    return False
            elif limit.limit_type == RateLimitType.TOKENS_PER_HOUR:
                if self.tokens_in_window + tokens > limit.limit:
                    return False

        return True

    def record_request(self, tokens: int):
        """Record a request for rate limiting."""
        self.requests_in_window += 1
        self.tokens_in_window += tokens


class CostOptimizer:
    """
    Cost optimization for provider selection.

    Features:
    - Cost-based provider selection
    - Usage tracking and budgeting
    - Cost prediction and alerts
    """

    def __init__(self):
        # Cost per 1K tokens (input/output) - example rates
        self.provider_costs = {
            "OpenAIProvider": {
                "gpt-4": {"input": 0.03, "output": 0.06},
                "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002}
            },
            "AzureOpenAIProvider": {
                "gpt-4": {"input": 0.03, "output": 0.06},
                "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002}
            },
            "AnthropicProvider": {
                "claude-3-opus": {"input": 0.015, "output": 0.075},
                "claude-3-sonnet": {"input": 0.003, "output": 0.015}
            },
            "GeminiProvider": {
                "gemini-pro": {"input": 0.00025, "output": 0.0005},
                "gemini-pro-vision": {"input": 0.00025, "output": 0.0005}
            }
        }

        # Usage tracking
        self.usage_stats: Dict[str, Dict[str, int]] = {}

    def get_cost_estimate(self, provider_name: str, model: str, input_tokens: int, output_tokens: int) -> float:
        """
        Estimate cost for a request.

        Args:
            provider_name: Name of the provider
            model: Model name
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens

        Returns:
            Estimated cost in USD
        """
        if provider_name not in self.provider_costs:
            return 0.0

        model_costs = self.provider_costs[provider_name].get(model, {})
        if not model_costs:
            return 0.0

        input_cost = (input_tokens / 1000) * model_costs.get("input", 0)
        output_cost = (output_tokens / 1000) * model_costs.get("output", 0)

        return input_cost + output_cost

    def select_cheapest_provider(self, providers: List[BaseProvider], model: str,
                                 estimated_tokens: int) -> Optional[BaseProvider]:
        """
        Select the cheapest available provider for a given model.

        Args:
            providers: List of available providers
            model: Model name to use
            estimated_tokens: Estimated total tokens for the request

        Returns:
            Cheapest provider, or None if no providers available
        """
        if not providers:
            return None

        cheapest_provider = None
        lowest_cost = float('inf')

        for provider in providers:
            provider_name = provider.__class__.__name__
            cost = self.get_cost_estimate(provider_name, model, estimated_tokens // 2, estimated_tokens // 2)

            if cost < lowest_cost:
                lowest_cost = cost
                cheapest_provider = provider

        return cheapest_provider

    def record_usage(self, provider_name: str, model: str, input_tokens: int, output_tokens: int):
        """Record usage for cost tracking."""
        key = f"{provider_name}:{model}"
        if key not in self.usage_stats:
            self.usage_stats[key] = {"input_tokens": 0, "output_tokens": 0, "requests": 0}

        self.usage_stats[key]["input_tokens"] += input_tokens
        self.usage_stats[key]["output_tokens"] += output_tokens
        self.usage_stats[key]["requests"] += 1

    def get_usage_stats(self) -> Dict[str, Dict[str, int]]:
        """Get current usage statistics."""
        return self.usage_stats.copy()


class RateLimitManager:
    """
    Manages rate limits across multiple providers.

    Features:
    - Provider-specific rate limiting
    - Automatic retry with backoff
    - Rate limit state tracking
    """

    def __init__(self):
        # Default rate limits for different providers
        self.provider_limits = {
            "OpenAIProvider": [
                RateLimit(RateLimitType.REQUESTS_PER_MINUTE, 60, 60),
                RateLimit(RateLimitType.TOKENS_PER_MINUTE, 40000, 60)
            ],
            "AzureOpenAIProvider": [
                RateLimit(RateLimitType.REQUESTS_PER_MINUTE, 60, 60),
                RateLimit(RateLimitType.TOKENS_PER_MINUTE, 40000, 60)
            ],
            "AnthropicProvider": [
                RateLimit(RateLimitType.REQUESTS_PER_MINUTE, 50, 60),
                RateLimit(RateLimitType.TOKENS_PER_MINUTE, 25000, 60)
            ],
            "GeminiProvider": [
                RateLimit(RateLimitType.REQUESTS_PER_MINUTE, 60, 60),
                RateLimit(RateLimitType.TOKENS_PER_MINUTE, 32000, 60)
            ]
        }

        # Current rate limit states
        self.rate_limit_states: Dict[str, RateLimitState] = {}

    def get_provider_limits(self, provider_name: str) -> List[RateLimit]:
        """Get rate limits for a provider."""
        return self.provider_limits.get(provider_name, [])

    def can_make_request(self, provider_name: str, estimated_tokens: int = 1000) -> bool:
        """
        Check if a request can be made within rate limits.

        Args:
            provider_name: Name of the provider
            estimated_tokens: Estimated tokens for the request

        Returns:
            True if request can be made, False otherwise
        """
        if provider_name not in self.rate_limit_states:
            self.rate_limit_states[provider_name] = RateLimitState()

        state = self.rate_limit_states[provider_name]
        limits = self.get_provider_limits(provider_name)

        return state.can_make_request(estimated_tokens, limits)

    def record_request(self, provider_name: str, tokens_used: int):
        """Record a completed request for rate limiting."""
        if provider_name not in self.rate_limit_states:
            self.rate_limit_states[provider_name] = RateLimitState()

        self.rate_limit_states[provider_name].record_request(tokens_used)

    async def wait_for_rate_limit(self, provider_name: str, estimated_tokens: int = 1000) -> bool:
        """
        Wait until rate limits allow a request.

        Args:
            provider_name: Name of the provider
            estimated_tokens: Estimated tokens for the request

        Returns:
            True if can proceed, False if permanently rate limited
        """
        max_wait_time = 300  # 5 minutes max wait
        wait_time = 1  # Start with 1 second

        start_time = time.time()

        while time.time() - start_time < max_wait_time:
            if self.can_make_request(provider_name, estimated_tokens):
                return True

            await asyncio.sleep(wait_time)
            wait_time = min(wait_time * 2, 60)  # Exponential backoff, max 60s

        return False

    def get_rate_limit_status(self, provider_name: str) -> Dict[str, any]:
        """Get current rate limit status for a provider."""
        if provider_name not in self.rate_limit_states:
            return {"status": "unknown"}

        state = self.rate_limit_states[provider_name]
        limits = self.get_provider_limits(provider_name)

        current_time = time.time()
        state.reset_if_needed(current_time, 60)  # Reset if needed

        return {
            "requests_in_window": state.requests_in_window,
            "tokens_in_window": state.tokens_in_window,
            "window_start": state.window_start,
            "limits": [
                {
                    "type": limit.limit_type.value,
                    "limit": limit.limit,
                    "window_seconds": limit.window_seconds
                }
                for limit in limits
            ]
        }
