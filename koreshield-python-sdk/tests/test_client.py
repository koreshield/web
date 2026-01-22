"""Tests for KoreShield SDK client."""

import pytest
from unittest.mock import Mock, patch
import httpx
import requests

from koreshield_sdk.client import KoreShieldClient
from koreshield_sdk.async_client import AsyncKoreShieldClient
from koreshield_sdk.exceptions import AuthenticationError, ValidationError, RateLimitError
from koreshield_sdk.types import DetectionResult, ThreatLevel, DetectionType, DetectionIndicator


class TestKoreShieldClient:
    """Test cases for KoreShieldClient."""

    @pytest.fixture
    def client(self):
        """Create a test client instance."""
        return KoreShieldClient(api_key="test-key", base_url="https://api.test.com")

    @pytest.fixture
    def mock_response(self):
        """Create a mock successful response."""
        return {
            "result": {
                "is_safe": True,
                "threat_level": "safe",
                "confidence": 0.95,
                "indicators": [],
                "processing_time_ms": 15.5,
                "scan_id": "test-scan-123",
            },
            "request_id": "req-123",
            "timestamp": "2024-01-01T00:00:00Z",
            "version": "1.0.0"
        }

    def test_init(self, client):
        """Test client initialization."""
        assert client.auth_config.api_key == "test-key"
        assert client.auth_config.base_url == "https://api.test.com"
        assert client.session.headers["Authorization"] == "Bearer test-key"

    @patch('koreshield_sdk.client.requests.Session.request')
    def test_scan_prompt_success(self, mock_request, client, mock_response):
        """Test successful prompt scanning."""
        mock_response_obj = Mock()
        mock_response_obj.status_code = 200
        mock_response_obj.json.return_value = mock_response
        mock_request.return_value = mock_response_obj

        result = client.scan_prompt("Test prompt")

        assert isinstance(result, DetectionResult)
        assert result.is_safe is True
        assert result.threat_level == ThreatLevel.SAFE
        assert result.confidence == 0.95
        assert result.processing_time_ms == 15.5

        mock_request.assert_called_once()
        call_args = mock_request.call_args
        assert call_args[1]["method"] == "POST"
        assert call_args[1]["url"] == "https://api.test.com/v1/scan"
        assert call_args[1]["json"]["prompt"] == "Test prompt"

    @patch('koreshield_sdk.client.requests.Session.request')
    def test_scan_prompt_with_context(self, mock_request, client, mock_response):
        """Test prompt scanning with additional context."""
        mock_response_obj = Mock()
        mock_response_obj.status_code = 200
        mock_response_obj.json.return_value = mock_response
        mock_request.return_value = mock_response_obj

        result = client.scan_prompt(
            "Test prompt",
            user_id="user123",
            session_id="session456",
            custom_field="value"
        )

        mock_request.assert_called_once()
        call_args = mock_request.call_args
        request_data = call_args[1]["json"]
        assert request_data["user_id"] == "user123"
        assert request_data["session_id"] == "session456"
        assert request_data["custom_field"] == "value"

    @patch('koreshield_sdk.client.requests.Session.request')
    def test_scan_prompt_authentication_error(self, mock_request, client):
        """Test authentication error handling."""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.json.return_value = {"message": "Invalid API key"}
        mock_request.return_value = mock_response

        with pytest.raises(AuthenticationError) as exc_info:
            client.scan_prompt("Test prompt")

        assert "Invalid API key" in str(exc_info.value)

    @patch('koreshield_sdk.client.requests.Session.request')
    def test_scan_prompt_rate_limit_error(self, mock_request, client):
        """Test rate limit error handling."""
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.json.return_value = {"message": "Rate limit exceeded"}
        mock_request.return_value = mock_response

        with pytest.raises(RateLimitError) as exc_info:
            client.scan_prompt("Test prompt")

        assert "Rate limit exceeded" in str(exc_info.value)

    @patch('koreshield_sdk.client.requests.Session.request')
    def test_scan_batch(self, mock_request, client, mock_response):
        """Test batch scanning."""
        # Mock batch response
        batch_response = {
            "results": [mock_response, mock_response],
            "total_processed": 2,
            "total_safe": 2,
            "total_unsafe": 0,
            "processing_time_ms": 25.0,
            "request_id": "batch-123",
            "timestamp": "2024-01-01T00:00:00Z"
        }
        mock_response_obj = Mock()
        mock_response_obj.status_code = 200
        mock_response_obj.json.return_value = batch_response
        mock_request.return_value = mock_response_obj

        prompts = ["Prompt 1", "Prompt 2"]
        results = client.scan_batch(prompts)

        assert len(results) == 2
        assert all(isinstance(r, DetectionResult) for r in results)
        assert all(r.is_safe for r in results)

        mock_request.assert_called_once()
        call_args = mock_request.call_args
        assert call_args[1]["url"] == "https://api.test.com/v1/scan/batch"

    @patch('koreshield_sdk.client.requests.Session.request')
    def test_health_check(self, mock_request, client):
        """Test health check endpoint."""
        health_response = {
            "status": "healthy",
            "version": "1.0.0",
            "uptime": 3600
        }
        mock_response_obj = Mock()
        mock_response_obj.status_code = 200
        mock_response_obj.json.return_value = health_response
        mock_request.return_value = mock_response_obj

        result = client.health_check()

        assert result["status"] == "healthy"
        assert result["version"] == "1.0.0"

        mock_request.assert_called_once()
        assert mock_request.call_args[1]["url"] == "https://api.test.com/health"


# TODO: Fix async test setup with pytest-asyncio
# class TestAsyncKoreShieldClient:
#     """Test cases for AsyncKoreShieldClient."""
#
#     @pytest.fixture
#     async def async_client(self):
#         """Create a test async client instance."""
#         client = AsyncKoreShieldClient(api_key="test-key", base_url="https://api.test.com")
#         yield client
#         await client.close()
#
#     @pytest.fixture
#     def mock_response(self):
#         """Create a mock successful response."""
#         return {
#             "result": {
#                 "is_safe": False,
#                 "threat_level": "high",
#                 "confidence": 0.89,
#                 "indicators": [
#                     {
#                         "type": "keyword",
#                         "severity": "high",
#                         "confidence": 0.9,
#                         "description": "Detected jailbreak attempt"
#                     }
#                 ],
#                 "processing_time_ms": 12.3,
#                 "scan_id": "test-scan-456",
#             },
#             "request_id": "req-456",
#             "timestamp": "2024-01-01T00:00:00Z",
#             "version": "1.0.0"
#         }
#
#     @pytest.mark.asyncio
#     @patch('koreshield_sdk.async_client.httpx.AsyncClient.request')
#     async def test_scan_prompt_success(self, mock_request, async_client, mock_response):
#         """Test successful async prompt scanning."""
#         mock_response_obj = Mock()
#         mock_response_obj.status_code = 200
#         mock_response_obj.json.return_value = mock_response
#         mock_request.return_value = mock_response_obj
#
#         result = await async_client.scan_prompt("Test prompt")
#
#         assert isinstance(result, DetectionResult)
#         assert result.is_safe is False
#         assert result.threat_level == ThreatLevel.HIGH
#         assert result.confidence == 0.89
#         assert len(result.indicators) == 1
#         assert result.indicators[0].type == DetectionType.KEYWORD
#
#     @pytest.mark.asyncio
#     @patch('koreshield_sdk.async_client.httpx.AsyncClient.request')
#     async def test_scan_batch_concurrent(self, mock_request, async_client, mock_response):
#         """Test async batch scanning with concurrency."""
#         batch_response = {
#             "results": [mock_response, mock_response],
#             "total_processed": 2,
#             "total_safe": 0,
#             "total_unsafe": 2,
#             "processing_time_ms": 20.0,
#             "request_id": "batch-456",
#             "timestamp": "2024-01-01T00:00:00Z"
#         }
#
#         mock_response_obj = Mock()
#         mock_response_obj.status_code = 200
#         mock_response_obj.json.return_value = batch_response
#         mock_request.return_value = mock_response_obj
#
#         prompts = ["Unsafe prompt 1", "Unsafe prompt 2"]
#         results = await async_client.scan_batch(
#             prompts=prompts,
#             parallel=True,
#             max_concurrent=2
#         )
#
#         assert len(results) == 2
#         assert all(not r.is_safe for r in results)
#         assert all(r.threat_level == ThreatLevel.HIGH for r in results)