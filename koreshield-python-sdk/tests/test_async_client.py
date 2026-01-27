"""Tests for enhanced async client features."""

import pytest
from koreshield_sdk import AsyncKoreShieldClient
from koreshield_sdk.types import SecurityPolicy, ThreatLevel, PerformanceMetrics


class TestAsyncKoreShieldClient:
    """Test enhanced async client functionality."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return AsyncKoreShieldClient(
            api_key="test-key",
            base_url="https://api.test.com",
            enable_metrics=True
        )

    @pytest.mark.asyncio
    async def test_init_with_metrics(self, client):
        """Test client initialization with metrics enabled."""
        assert client.auth_config.api_key == "test-key"
        assert client.auth_config.base_url == "https://api.test.com"
        assert client.enable_metrics is True

        # Check initial metrics
        metrics = await client.get_performance_metrics()
        assert isinstance(metrics, PerformanceMetrics)
        assert metrics.total_requests == 0

    @pytest.mark.asyncio
    async def test_context_manager(self, client):
        """Test async context manager usage."""
        async with client:
            # Client should be usable within context
            assert client.client is not None

        # Client should be closed after context
        assert client.client.is_closed

    @pytest.mark.asyncio
    async def test_security_policy_management(self, client):
        """Test security policy management."""
        policy = SecurityPolicy(
            name="test_policy",
            threat_threshold=ThreatLevel.LOW,
            allowlist_patterns=["safe"],
            blocklist_patterns=["unsafe"]
        )

        async with client:
            # Apply policy
            await client.apply_security_policy(policy)

            # Get policy
            retrieved_policy = await client.get_security_policy()
            assert retrieved_policy.name == "test_policy"
            assert retrieved_policy.threat_threshold == ThreatLevel.LOW

    @pytest.mark.asyncio
    async def test_performance_metrics(self, client):
        """Test performance metrics functionality."""
        async with client:
            # Initial metrics
            metrics = await client.get_performance_metrics()
            assert metrics.total_requests == 0

            # Reset metrics
            await client.reset_metrics()
            reset_metrics = await client.get_performance_metrics()
            assert reset_metrics.total_requests == 0

    @pytest.mark.asyncio
    async def test_passes_security_policy(self, client):
        """Test security policy filtering."""
        # Set up policy
        policy = SecurityPolicy(
            name="strict",
            threat_threshold=ThreatLevel.MEDIUM,
            allowlist_patterns=["safe content"],
            blocklist_patterns=["unsafe", "hack"]
        )

        async with client:
            await client.apply_security_policy(policy)

            # Verify policy was applied
            current_policy = await client.get_security_policy()
            assert current_policy.allowlist_patterns == ["safe content"]
            assert current_policy.blocklist_patterns == ["unsafe", "hack"]

            # Test allowlist pattern
            assert client._passes_security_policy("This is safe content") is True

            # Test blocklist pattern - should fail
            result = client._passes_security_policy("This contains unsafe content")
            print(f"Blocklist test result: {result}")  # Debug print
            print(f"Blocklist patterns: {client.security_policy.blocklist_patterns}")  # Debug print
            assert result is False

            # Test neutral content (no patterns match)
            assert client._passes_security_policy("This is neutral content") is True

    @pytest.mark.asyncio
    async def test_create_overlapping_chunks(self, client):
        """Test chunk creation for streaming."""
        content = "This is a test content for chunking purposes."
        chunks = client._create_overlapping_chunks(content, chunk_size=10, overlap=3)

        assert len(chunks) > 1
        # First chunk should be content[:10]
        assert chunks[0] == content[:10]
        # Second chunk should overlap with first
        assert chunks[1].startswith(content[7:10])  # 10-3=7