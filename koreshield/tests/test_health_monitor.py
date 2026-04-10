"""
Tests for provider health monitoring.
"""

import asyncio
import pytest
from unittest.mock import AsyncMock

from koreshield.providers.health_monitor import HealthMonitor, HealthStatus
from koreshield.providers.base import BaseProvider


class MockProviderA(BaseProvider):
    """Mock provider A for testing."""

    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail
        super().__init__("mock_key")

    def _get_default_url(self) -> str:
        return "https://mock.api"

    async def chat_completion(self, messages, model="", **kwargs):
        return {"result": "mock"}

    async def health_check(self) -> bool:
        if self.should_fail:
            raise Exception("Mock health check failure")
        return True


class MockProviderB(BaseProvider):
    """Mock provider B for testing."""

    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail
        super().__init__("mock_key")

    def _get_default_url(self) -> str:
        return "https://mock.api"

    async def chat_completion(self, messages, model="", **kwargs):
        return {"result": "mock"}

    async def health_check(self) -> bool:
        if self.should_fail:
            raise Exception("Mock health check failure")
        return True


class MockProviderC(BaseProvider):
    """Mock provider C for testing."""

    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail
        super().__init__("mock_key")

    def _get_default_url(self) -> str:
        return "https://mock.api"

    async def chat_completion(self, messages, model="", **kwargs):
        return {"result": "mock"}

    async def health_check(self) -> bool:
        if self.should_fail:
            raise Exception("Mock health check failure")
        return True


@pytest.fixture
def healthy_providers():
    """Create healthy mock providers."""
    return [
        MockProviderA(),
        MockProviderB(),
        MockProviderC()
    ]


@pytest.fixture
def monitor(healthy_providers):
    """Create health monitor with healthy providers."""
    return HealthMonitor(healthy_providers, check_interval=1)  # Fast checks for testing


class TestHealthMonitor:
    """Test health monitoring functionality."""

    @pytest.mark.asyncio
    async def test_initialization(self, monitor):
        """Test monitor initialization."""
        assert len(monitor.providers) == 3
        assert len(monitor.health_status) == 3
        assert all(status == HealthStatus.UNKNOWN for status in monitor.health_status.values())

    @pytest.mark.asyncio
    async def test_force_health_check_healthy(self, monitor):
        """Test health check on healthy providers."""
        await monitor.force_health_check()

        # All providers should be healthy
        for provider in monitor.providers:
            name = monitor._get_provider_name(provider)
            assert monitor.health_status[name] == HealthStatus.HEALTHY
            assert monitor.consecutive_failures[name] == 0

    @pytest.mark.asyncio
    async def test_force_health_check_failing_provider(self):
        """Test health check on failing provider."""
        failing_provider = MockProviderA(should_fail=True)
        monitor = HealthMonitor([failing_provider])

        await monitor.force_health_check()

        # Provider should be unhealthy after one failure
        assert monitor.health_status["MockProviderA"] == HealthStatus.UNHEALTHY
        assert monitor.consecutive_failures["MockProviderA"] == 1

    @pytest.mark.asyncio
    async def test_consecutive_failures_thresholds(self):
        """Test degraded and unhealthy thresholds."""
        failing_provider = MockProviderA(should_fail=True)
        monitor = HealthMonitor([failing_provider], degraded_threshold=2, unhealthy_threshold=3)

        # First failure
        await monitor.force_health_check()
        assert monitor.health_status["MockProviderA"] == HealthStatus.UNHEALTHY
        assert monitor.consecutive_failures["MockProviderA"] == 1

        # Second failure - should be degraded
        await monitor.force_health_check()
        assert monitor.health_status["MockProviderA"] == HealthStatus.DEGRADED
        assert monitor.consecutive_failures["MockProviderA"] == 2

        # Third failure - should be unhealthy
        await monitor.force_health_check()
        assert monitor.health_status["MockProviderA"] == HealthStatus.UNHEALTHY
        assert monitor.consecutive_failures["MockProviderA"] == 3

    @pytest.mark.asyncio
    async def test_recovery_after_failure(self):
        """Test provider recovery after failures."""
        provider = MockProviderA(should_fail=True)
        monitor = HealthMonitor([provider])

        # Make it fail
        await monitor.force_health_check()
        assert monitor.health_status["MockProviderA"] == HealthStatus.UNHEALTHY

        # Make it healthy again
        provider.should_fail = False
        await monitor.force_health_check()

        assert monitor.health_status["MockProviderA"] == HealthStatus.HEALTHY
        assert monitor.consecutive_failures["MockProviderA"] == 0

    @pytest.mark.asyncio
    async def test_get_health_status(self, monitor):
        """Test getting health status information."""
        await monitor.force_health_check()

        status = monitor.get_health_status("MockProviderA")

        assert status["status"] == "healthy"
        assert status["consecutive_failures"] == 0
        assert "last_check" in status
        assert "recent_checks" in status
        assert len(status["recent_checks"]) == 1

    @pytest.mark.asyncio
    async def test_get_healthy_providers(self, monitor):
        """Test getting list of healthy providers."""
        await monitor.force_health_check()

        healthy = monitor.get_healthy_providers()
        assert len(healthy) == 3
        assert "MockProviderA" in healthy
        assert "MockProviderB" in healthy
        assert "MockProviderC" in healthy

    @pytest.mark.asyncio
    async def test_is_provider_healthy(self, monitor):
        """Test checking if provider is healthy."""
        await monitor.force_health_check()

        assert monitor.is_provider_healthy("MockProviderA") is True
        assert monitor.is_provider_healthy("NonExistent") is False

    @pytest.mark.asyncio
    async def test_status_change_callback(self, monitor):
        """Test status change callbacks."""
        callback_calls = []

        def test_callback(provider_name, old_status, new_status):
            callback_calls.append((provider_name, old_status, new_status))

        monitor.add_status_change_callback(test_callback)

        # Trigger health check - should change from UNKNOWN to HEALTHY
        await monitor.force_health_check()

        assert len(callback_calls) == 3  # One for each provider
        for call in callback_calls:
            assert call[1] == HealthStatus.UNKNOWN  # old status
            assert call[2] == HealthStatus.HEALTHY  # new status

    @pytest.mark.asyncio
    async def test_health_history_size(self):
        """Test health history size limiting."""
        provider = MockProviderA()
        monitor = HealthMonitor([provider], health_history_size=3)

        # Perform multiple health checks
        for _ in range(5):
            await monitor.force_health_check()

        history = monitor.health_history["MockProviderA"]
        assert len(history) == 3  # Should be limited to 3

    @pytest.mark.asyncio
    async def test_monitoring_loop(self, monitor):
        """Test background monitoring loop."""
        await monitor.start_monitoring()
        assert monitor._monitor_task is not None
        assert not monitor._monitor_task.done()

        # Let it run for a short time
        await asyncio.sleep(0.1)

        # Stop monitoring
        await monitor.stop_monitoring()
        assert monitor._monitor_task is None or monitor._monitor_task.done()

    @pytest.mark.asyncio
    async def test_timeout_handling(self):
        """Test timeout handling in health checks."""
        class SlowProvider(MockProviderA):
            def __init__(self):
                super().__init__(should_fail=False)

            async def health_check(self) -> bool:
                await asyncio.sleep(15)  # Longer than timeout
                return True

        slow_provider = SlowProvider()
        monitor = HealthMonitor([slow_provider])

        await monitor.force_health_check()

        # Should be marked as unhealthy due to timeout
        # The key should be the class name of SlowProvider
        assert monitor.health_status["SlowProvider"] == HealthStatus.UNHEALTHY