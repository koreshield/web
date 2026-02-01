"""Tests for framework integrations."""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from koreshield_sdk.integrations import (
    create_fastapi_middleware,
    create_flask_middleware,
    create_django_middleware
)
from koreshield_sdk import AsyncKoreShieldClient
from koreshield_sdk.types import ThreatLevel

# Check for optional dependencies
fastapi_available = True
flask_available = True
django_available = True

try:
    import fastapi
except ImportError:
    fastapi_available = False

try:
    import flask
except ImportError:
    flask_available = False

try:
    import django
except ImportError:
    django_available = False


class TestFrameworkIntegrations:
    """Test framework integration helpers."""

    @pytest.fixture
    def mock_client(self):
        """Create mock async client."""
        client = AsyncMock(spec=AsyncKoreShieldClient)
        client.scan_prompt.return_value = Mock(
            is_safe=True,
            threat_level=ThreatLevel.SAFE,
            confidence=0.95
        )
        return client

    def test_create_fastapi_middleware(self, mock_client):
        """Test FastAPI middleware creation."""
        middleware = create_fastapi_middleware(
            client=mock_client,
            scan_request_body=True,
            threat_threshold="medium",
            block_on_threat=False,
            exclude_paths=["/health"]
        )

        assert callable(middleware)
        # Middleware should be a callable that returns a callable
        assert middleware is not None

    def test_create_flask_middleware(self, mock_client):
        """Test Flask middleware creation."""
        middleware = create_flask_middleware(
            client=mock_client,
            scan_request_body=True,
            threat_threshold="high",
            block_on_threat=True,
            exclude_paths=["/health", "/docs"]
        )

        assert callable(middleware)

    @pytest.mark.skipif(not django_available, reason="Django not installed")
    def test_create_django_middleware(self, mock_client):
        """Test Django middleware creation."""
        middleware_class = create_django_middleware(
            client=mock_client,
            scan_request_body=True,
            threat_threshold="medium",
            block_on_threat=False,
            exclude_paths=["/admin/"]
        )

        assert middleware_class is not None
        # Should be a class with process_view method
        assert hasattr(middleware_class, 'process_view')

    @pytest.mark.asyncio
    async def test_fastapi_middleware_scanning(self, mock_client):
        """Test FastAPI middleware request scanning."""
        middleware = create_fastapi_middleware(
            client=mock_client,
            scan_request_body=True,
            threat_threshold="medium",
            block_on_threat=False
        )

        # Mock request
        request = Mock()
        request.method = "POST"
        request.url.path = "/api/chat"
        request.headers = {"content-type": "application/json"}

        # Mock call_next
        async def call_next():
            return Mock(status_code=200)

        # Call middleware
        response = await middleware(request, call_next)

        # Should have scanned the request
        mock_client.scan_prompt.assert_called_once()

        # Should return the response
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_fastapi_middleware_exclusion(self, mock_client):
        """Test FastAPI middleware path exclusion."""
        middleware = create_fastapi_middleware(
            client=mock_client,
            scan_request_body=True,
            exclude_paths=["/health", "/docs"]
        )

        # Mock excluded request
        request = Mock()
        request.method = "GET"
        request.url.path = "/health"

        async def call_next():
            return Mock(status_code=200)

        response = await middleware(request, call_next)

        # Should not have scanned
        mock_client.scan_prompt.assert_not_called()
        assert response.status_code == 200

    def test_flask_middleware_scanning(self, mock_client):
        """Test Flask middleware request scanning."""
        middleware = create_flask_middleware(
            client=mock_client,
            scan_request_body=True,
            threat_threshold="high",
            block_on_threat=False
        )

        # Mock Flask app context
        with patch('koreshield_sdk.integrations.frameworks.g') as mock_g:
            # Mock request
            request = Mock()
            request.method = "POST"
            request.path = "/api/chat"
            request.content_type = "application/json"

            # Call middleware
            middleware()

            # Should have scanned (this would be called before request)
            # In real Flask, this would set attributes on g

    @pytest.mark.skipif(not django_available, reason="Django not installed")
    def test_django_middleware_scanning(self, mock_client):
        """Test Django middleware request scanning."""
        middleware_class = create_django_middleware(
            client=mock_client,
            scan_request_body=True,
            threat_threshold="medium",
            block_on_threat=False
        )

        middleware = middleware_class()

        # Mock Django request
        request = Mock()
        request.method = "POST"
        request.path = "/api/chat"
        request.META = {"CONTENT_TYPE": "application/json"}

        # Mock view function
        view_func = Mock()
        view_func.__name__ = "chat_view"

        # Call process_view
        response = middleware.process_view(request, view_func, (), {})

        # Should return None (continue processing)
        assert response is None

        # Should have scanned the request
        mock_client.scan_prompt.assert_called_once()

    @pytest.mark.skipif(not django_available, reason="Django not installed")
    def test_django_middleware_exclusion(self, mock_client):
        """Test Django middleware path exclusion."""
        middleware_class = create_django_middleware(
            client=mock_client,
            exclude_paths=["/admin/"]
        )

        middleware = middleware_class()

        # Mock excluded request
        request = Mock()
        request.method = "GET"
        request.path = "/admin/users/"

        view_func = Mock()
        response = middleware.process_view(request, view_func, (), {})

        # Should return None but not scan
        assert response is None
        mock_client.scan_prompt.assert_not_called()

    @pytest.mark.asyncio
    async def test_fastapi_middleware_blocking(self, mock_client):
        """Test FastAPI middleware threat blocking."""
        # Configure client to return unsafe result
        mock_client.scan_prompt.return_value = Mock(
            is_safe=False,
            threat_level=ThreatLevel.HIGH,
            confidence=0.9
        )

        middleware = create_fastapi_middleware(
            client=mock_client,
            scan_request_body=True,
            threat_threshold="medium",
            block_on_threat=True
        )

        request = Mock()
        request.method = "POST"
        request.url.path = "/api/chat"

        async def call_next():
            return Mock(status_code=200)

        response = await middleware(request, call_next)

        # Should block the request
        assert response.status_code == 403
        assert "blocked" in response.body.decode().lower()

    def test_flask_middleware_blocking(self, mock_client):
        """Test Flask middleware threat blocking."""
        # Configure client to return unsafe result
        mock_client.scan_prompt.return_value = Mock(
            is_safe=False,
            threat_level=ThreatLevel.CRITICAL,
            confidence=0.95
        )

        middleware = create_flask_middleware(
            client=mock_client,
            scan_request_body=True,
            threat_threshold="high",
            block_on_threat=True
        )

        with patch('koreshield_sdk.integrations.frameworks.g') as mock_g:
            # Mock request
            request = Mock()
            request.method = "POST"
            request.path = "/api/chat"

            # Call middleware
            middleware()

            # Should have set blocked flag on g
            # In real Flask, this would cause the route to return early