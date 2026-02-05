"""
Tests for provider manager with failover functionality.
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.providers import BaseProvider
from src.providers.manager import ProviderManager, ProviderStatus


class MockProviderA(BaseProvider):
    """Mock provider A for testing."""

    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail
        super().__init__("mock_key")

    def _get_default_url(self) -> str:
        return "https://mock.api"

    async def chat_completion(self, messages, model="", **kwargs):
        if self.should_fail:
            raise Exception("Mock ProviderA failure")
        return {
            "id": "mock-ProviderA",
            "object": "chat.completion",
            "choices": [{"message": {"content": "Response from ProviderA"}}],
            "usage": {"total_tokens": 10}
        }

    async def health_check(self) -> bool:
        return not self.should_fail


class MockProviderB(BaseProvider):
    """Mock provider B for testing."""

    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail
        super().__init__("mock_key")

    def _get_default_url(self) -> str:
        return "https://mock.api"

    async def chat_completion(self, messages, model="", **kwargs):
        if self.should_fail:
            raise Exception("Mock ProviderB failure")
        return {
            "id": "mock-ProviderB",
            "object": "chat.completion",
            "choices": [{"message": {"content": "Response from ProviderB"}}],
            "usage": {"total_tokens": 10}
        }

    async def health_check(self) -> bool:
        return not self.should_fail


class MockProviderC(BaseProvider):
    """Mock provider C for testing."""

    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail
        super().__init__("mock_key")

    def _get_default_url(self) -> str:
        return "https://mock.api"

    async def chat_completion(self, messages, model="", **kwargs):
        if self.should_fail:
            raise Exception("Mock ProviderC failure")
        return {
            "id": "mock-ProviderC",
            "object": "chat.completion",
            "choices": [{"message": {"content": "Response from ProviderC"}}],
            "usage": {"total_tokens": 10}
        }

    async def health_check(self) -> bool:
        return not self.should_fail


@pytest.fixture
def healthy_providers():
    """Create healthy mock providers."""
    return [
        MockProviderA(),
        MockProviderB(),
        MockProviderC()
    ]


@pytest.fixture
def failing_providers():
    """Create providers where some fail."""
    return [
        MockProviderA(should_fail=True),
        MockProviderB(),
        MockProviderC(should_fail=True)
    ]


@pytest.fixture
def manager(healthy_providers):
    """Create provider manager with healthy providers."""
    return ProviderManager(healthy_providers)


class TestProviderManager:
    """Test provider manager functionality."""

    @pytest.mark.asyncio
    async def test_initialization(self, manager):
        """Test manager initialization."""
        assert len(manager.providers) == 3
        assert len(manager.provider_health) == 3

        for provider in manager.providers:
            name = manager._get_provider_name(provider)
            health = manager.provider_health[name]
            assert health.status == ProviderStatus.HEALTHY
            assert health.consecutive_failures == 0

    @pytest.mark.asyncio
    async def test_get_healthy_providers(self, manager):
        """Test getting healthy providers."""
        healthy = manager.get_healthy_providers()
        assert len(healthy) == 3

    @pytest.mark.asyncio
    async def test_get_best_provider(self, manager):
        """Test getting best provider."""
        best = manager.get_best_provider()
        assert best is not None
        assert isinstance(best, (MockProviderA, MockProviderB, MockProviderC))

    @pytest.mark.asyncio
    async def test_chat_completion_success(self, manager):
        """Test successful chat completion."""
        messages = [{"role": "user", "content": "Hello"}]

        result = await manager.chat_completion_with_failover(messages)

        assert "id" in result
        assert "choices" in result
        assert len(result["choices"]) > 0

    @pytest.mark.asyncio
    async def test_failover_on_failure(self, failing_providers):
        """Test failover when first provider fails."""
        manager = ProviderManager(failing_providers)
        messages = [{"role": "user", "content": "Hello"}]

        result = await manager.chat_completion_with_failover(messages)

        # Should succeed with ProviderB
        assert "ProviderB" in result["id"]

    @pytest.mark.asyncio
    async def test_all_providers_fail(self):
        """Test when all providers fail."""
        failing_providers = [
            MockProviderA(should_fail=True),
            MockProviderB(should_fail=True),
            MockProviderC(should_fail=True)
        ]

        manager = ProviderManager(failing_providers)
        messages = [{"role": "user", "content": "Hello"}]

        with pytest.raises(Exception, match="All providers failed"):
            await manager.chat_completion_with_failover(messages)

    @pytest.mark.asyncio
    async def test_health_check_updates_status(self, manager):
        """Test health check updates provider status."""
        # Make one provider fail health check
        manager.providers[0].should_fail = True

        await manager._check_provider_health(manager.providers[0])

        provider_name = manager._get_provider_name(manager.providers[0])
        health = manager.provider_health[provider_name]

        assert health.consecutive_failures == 1
        assert health.status == ProviderStatus.DEGRADED

    @pytest.mark.asyncio
    async def test_provider_marked_unhealthy_after_failures(self, manager):
        """Test provider marked unhealthy after consecutive failures."""
        provider = manager.providers[0]
        provider_name = manager._get_provider_name(provider)

        # Simulate multiple failures
        for _ in range(manager.max_consecutive_failures):
            manager._mark_provider_failure(provider_name, "Test failure")

        health = manager.provider_health[provider_name]
        assert health.status == ProviderStatus.UNHEALTHY

    @pytest.mark.asyncio
    async def test_get_provider_status(self, manager):
        """Test getting provider status information."""
        status = await manager.get_provider_status()

        assert len(status) == 3
        for provider in manager.providers:
            name = manager._get_provider_name(provider)
            assert name in status
            assert "status" in status[name]
            assert "consecutive_failures" in status[name]

    @pytest.mark.asyncio
    async def test_force_health_check(self, manager):
        """Test forcing health check."""
        await manager.force_health_check()

        # All providers should have been checked
        for provider in manager.providers:
            name = manager._get_provider_name(provider)
            health = manager.provider_health[name]
            assert health.last_check > 0

    @pytest.mark.asyncio
    async def test_force_health_check_specific_provider(self, manager):
        """Test forcing health check for specific provider."""
        provider_name = manager._get_provider_name(manager.providers[0])

        await manager.force_health_check(provider_name)

        # Only the specified provider should have been checked
        health = manager.provider_health[provider_name]
        assert health.last_check > 0

    @pytest.mark.asyncio
    async def test_timeout_handling(self, manager):
        """Test timeout handling in failover."""
        # Mock a provider that takes too long
        original_chat_completion = manager.providers[0].chat_completion

        async def slow_completion(*args, **kwargs):
            await asyncio.sleep(2)  # Longer than failover_timeout
            return await original_chat_completion(*args, **kwargs)

        manager.providers[0].chat_completion = slow_completion
        manager.failover_timeout = 1.0  # Short timeout

        messages = [{"role": "user", "content": "Hello"}]

        # Should failover to next provider
        result = await manager.chat_completion_with_failover(messages)
        assert result is not None

    @pytest.mark.asyncio
    async def test_health_monitoring_start_stop(self, manager):
        """Test starting and stopping health monitoring."""
        await manager.start_health_monitoring()
        assert manager._health_task is not None
        assert not manager._health_task.done()

        await manager.stop_health_monitoring()
        assert manager._health_task is None or manager._health_task.done()