"""
Provider health monitoring and automated checks.
"""

import asyncio
import time
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from enum import Enum

from .base import BaseProvider


class HealthStatus(Enum):
    """Health status levels."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class HealthCheckResult:
    """Result of a health check."""
    status: HealthStatus
    response_time: Optional[float] = None
    error_message: Optional[str] = None
    timestamp: float = 0.0

    def __post_init__(self):
        if self.timestamp == 0.0:
            self.timestamp = time.time()


class HealthMonitor:
    """
    Monitors provider health with automated checks and alerts.

    Features:
    - Automated health checks at configurable intervals
    - Health status tracking and history
    - Configurable health check strategies
    - Alert callbacks for status changes
    - Health-based provider recommendations
    """

    def __init__(
        self,
        providers: List[BaseProvider],
        check_interval: int = 60,
        health_history_size: int = 10,
        degraded_threshold: int = 2,
        unhealthy_threshold: int = 3
    ):
        """
        Initialize health monitor.

        Args:
            providers: List of providers to monitor
            check_interval: Seconds between health checks
            health_history_size: Number of health checks to keep in history
            degraded_threshold: Consecutive failures to mark as degraded
            unhealthy_threshold: Consecutive failures to mark as unhealthy
        """
        self.providers = providers
        self.check_interval = check_interval
        self.health_history_size = health_history_size
        self.degraded_threshold = degraded_threshold
        self.unhealthy_threshold = unhealthy_threshold

        # Health tracking
        self.health_status: Dict[str, HealthStatus] = {}
        self.health_history: Dict[str, List[HealthCheckResult]] = {}
        self.consecutive_failures: Dict[str, int] = {}
        self.last_check: Dict[str, float] = {}

        # Alert callbacks
        self.status_change_callbacks: List[Callable[[str, HealthStatus, HealthStatus], None]] = []

        # Background monitoring
        self._monitor_task: Optional[asyncio.Task] = None
        self._running = False

        self._initialize_tracking()

    def _initialize_tracking(self):
        """Initialize health tracking for all providers."""
        for provider in self.providers:
            provider_name = self._get_provider_name(provider)
            self.health_status[provider_name] = HealthStatus.UNKNOWN
            self.health_history[provider_name] = []
            self.consecutive_failures[provider_name] = 0
            self.last_check[provider_name] = 0.0

    def _get_provider_name(self, provider: BaseProvider) -> str:
        """Get provider name for tracking."""
        return provider.__class__.__name__

    def add_status_change_callback(self, callback: Callable[[str, HealthStatus, HealthStatus], None]):
        """
        Add a callback for health status changes.

        Args:
            callback: Function called with (provider_name, old_status, new_status)
        """
        self.status_change_callbacks.append(callback)

    def _notify_status_change(self, provider_name: str, old_status: HealthStatus, new_status: HealthStatus):
        """Notify all callbacks of status change."""
        for callback in self.status_change_callbacks:
            try:
                callback(provider_name, old_status, new_status)
            except Exception as e:
                print(f"Error in health status callback: {e}")

    async def start_monitoring(self):
        """Start background health monitoring."""
        if self._monitor_task is None:
            self._running = True
            self._monitor_task = asyncio.create_task(self._monitoring_loop())

    async def stop_monitoring(self):
        """Stop background health monitoring."""
        self._running = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
            self._monitor_task = None

    async def _monitoring_loop(self):
        """Background monitoring loop."""
        while self._running:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Health monitoring error: {e}")
                await asyncio.sleep(self.check_interval)

    async def _perform_health_checks(self):
        """Perform health checks on all providers."""
        tasks = []
        for provider in self.providers:
            tasks.append(self._check_provider_health(provider))

        await asyncio.gather(*tasks, return_exceptions=True)

    async def _check_provider_health(self, provider: BaseProvider):
        """Check health of a single provider."""
        provider_name = self._get_provider_name(provider)
        start_time = time.time()

        try:
            # Perform health check
            is_healthy = await asyncio.wait_for(
                provider.health_check(),
                timeout=10.0  # 10 second timeout for health checks
            )

            response_time = time.time() - start_time

            if is_healthy:
                result = HealthCheckResult(
                    status=HealthStatus.HEALTHY,
                    response_time=response_time
                )
                self.consecutive_failures[provider_name] = 0
            else:
                result = HealthCheckResult(
                    status=HealthStatus.UNHEALTHY,
                    response_time=response_time,
                    error_message="Health check returned False"
                )
                self.consecutive_failures[provider_name] += 1

        except asyncio.TimeoutError:
            response_time = time.time() - start_time
            result = HealthCheckResult(
                status=HealthStatus.UNHEALTHY,
                response_time=response_time,
                error_message="Health check timed out"
            )
            self.consecutive_failures[provider_name] += 1

        except Exception as e:
            response_time = time.time() - start_time
            result = HealthCheckResult(
                status=HealthStatus.UNHEALTHY,
                response_time=response_time,
                error_message=str(e)
            )
            self.consecutive_failures[provider_name] += 1

        # Update health status based on consecutive failures
        old_status = self.health_status[provider_name]

        if self.consecutive_failures[provider_name] >= self.unhealthy_threshold:
            new_status = HealthStatus.UNHEALTHY
        elif self.consecutive_failures[provider_name] >= self.degraded_threshold:
            new_status = HealthStatus.DEGRADED
        else:
            new_status = result.status

        self.health_status[provider_name] = new_status
        self.last_check[provider_name] = result.timestamp

        # Add to history
        history = self.health_history[provider_name]
        history.append(result)
        if len(history) > self.health_history_size:
            history.pop(0)

        # Notify if status changed
        if old_status != new_status:
            self._notify_status_change(provider_name, old_status, new_status)

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

    def get_health_status(self, provider_name: str) -> Dict[str, any]:
        """
        Get current health status for a provider.

        Args:
            provider_name: Name of the provider

        Returns:
            Dictionary with health status information
        """
        if provider_name not in self.health_status:
            return {"status": "unknown"}

        history = self.health_history[provider_name]
        recent_results = history[-5:] if history else []  # Last 5 checks

        return {
            "status": self.health_status[provider_name].value,
            "consecutive_failures": self.consecutive_failures[provider_name],
            "last_check": self.last_check[provider_name],
            "recent_checks": [
                {
                    "status": result.status.value,
                    "response_time": result.response_time,
                    "error_message": result.error_message,
                    "timestamp": result.timestamp
                }
                for result in recent_results
            ]
        }

    def get_healthy_providers(self) -> List[str]:
        """
        Get list of currently healthy provider names.

        Returns:
            List of healthy provider names
        """
        return [
            name for name, status in self.health_status.items()
            if status == HealthStatus.HEALTHY
        ]

    def get_provider_health_summary(self) -> Dict[str, Dict[str, any]]:
        """
        Get health summary for all providers.

        Returns:
            Dictionary with health status for all providers
        """
        summary = {}
        for provider in self.providers:
            provider_name = self._get_provider_name(provider)
            summary[provider_name] = self.get_health_status(provider_name)

        return summary

    def is_provider_healthy(self, provider_name: str) -> bool:
        """
        Check if a provider is currently healthy.

        Args:
            provider_name: Name of the provider

        Returns:
            True if healthy, False otherwise
        """
        return self.health_status.get(provider_name) == HealthStatus.HEALTHY
