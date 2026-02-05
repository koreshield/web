"""
Tests for rate limiting and cost optimization.
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, patch

from src.providers.rate_limiting import CostOptimizer, RateLimitManager, RateLimitType, RateLimit


class TestCostOptimizer:
    """Test cost optimization functionality."""

    def test_cost_estimate(self):
        """Test cost estimation for different providers."""
        optimizer = CostOptimizer()

        # Test OpenAI GPT-4 cost
        cost = optimizer.get_cost_estimate("OpenAIProvider", "gpt-4", 1000, 500)
        expected = (1000 / 1000) * 0.03 + (500 / 1000) * 0.06  # $0.045
        assert cost == expected

        # Test unknown provider
        cost = optimizer.get_cost_estimate("UnknownProvider", "model", 1000, 500)
        assert cost == 0.0

    def test_select_cheapest_provider(self):
        """Test cheapest provider selection."""
        from src.providers.base import BaseProvider

        class MockProvider(BaseProvider):
            def __init__(self, name: str):
                self.name = name
                super().__init__("key")

            def _get_default_url(self) -> str:
                return "https://mock.com"

            async def chat_completion(self, messages, model="", **kwargs):
                return {"result": "mock"}

        optimizer = CostOptimizer()

        providers = [
            MockProvider("OpenAIProvider"),
            MockProvider("GeminiProvider"),  # Should be cheaper
        ]

        cheapest = optimizer.select_cheapest_provider(providers, "gpt-3.5-turbo", 2000)
        assert cheapest.name == "OpenAIProvider"  # OpenAI should be selected for its own model

    def test_usage_recording(self):
        """Test usage recording and statistics."""
        optimizer = CostOptimizer()

        optimizer.record_usage("OpenAIProvider", "gpt-4", 100, 50)
        optimizer.record_usage("OpenAIProvider", "gpt-4", 200, 100)

        stats = optimizer.get_usage_stats()
        key = "OpenAIProvider:gpt-4"

        assert key in stats
        assert stats[key]["input_tokens"] == 300
        assert stats[key]["output_tokens"] == 150
        assert stats[key]["requests"] == 2


class TestRateLimitManager:
    """Test rate limiting functionality."""

    def test_can_make_request_within_limits(self):
        """Test rate limit checking within limits."""
        manager = RateLimitManager()

        # Should allow request within limits
        assert manager.can_make_request("OpenAIProvider", 1000)

        # Record a request
        manager.record_request("OpenAIProvider", 1000)

        # Should still allow more requests
        assert manager.can_make_request("OpenAIProvider", 1000)

    def test_rate_limit_exceeded(self):
        """Test rate limit exceeded."""
        manager = RateLimitManager()

        # Exhaust the rate limit
        for i in range(60):  # OpenAI limit is 60 requests per minute
            manager.record_request("OpenAIProvider", 100)
            # Small delay to ensure we're within the same window
            import time
            time.sleep(0.001)

        # Should not allow more requests
        assert not manager.can_make_request("OpenAIProvider", 100)

    @pytest.mark.asyncio
    async def test_wait_for_rate_limit(self):
        """Test waiting for rate limit reset."""
        manager = RateLimitManager()

        # Exhaust rate limit
        for _ in range(60):
            manager.record_request("OpenAIProvider", 100)

        # Should not be able to make request immediately
        assert not manager.can_make_request("OpenAIProvider", 100)

        # Wait for rate limit should eventually allow
        can_proceed = await manager.wait_for_rate_limit("OpenAIProvider", 100)
        assert can_proceed

    def test_get_rate_limit_status(self):
        """Test getting rate limit status."""
        manager = RateLimitManager()

        # Initialize the state by making a request
        manager.can_make_request("OpenAIProvider", 1000)

        status = manager.get_rate_limit_status("OpenAIProvider")

        assert "requests_in_window" in status
        assert "tokens_in_window" in status
        assert "limits" in status
        assert len(status["limits"]) > 0

    def test_unknown_provider_limits(self):
        """Test handling unknown providers."""
        manager = RateLimitManager()

        # Should have no limits for unknown provider
        limits = manager.get_provider_limits("UnknownProvider")
        assert len(limits) == 0

        # Should allow requests for unknown providers
        assert manager.can_make_request("UnknownProvider", 1000)