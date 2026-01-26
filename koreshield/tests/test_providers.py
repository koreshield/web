"""
Tests for LLM provider integrations.
"""

import pytest
from unittest.mock import AsyncMock, patch, Mock

from src.providers import (
    AnthropicProvider,
    AzureOpenAIProvider,
    BaseProvider,
    DeepSeekProvider,
    GeminiProvider,
    OpenAIProvider,
)


class TestBaseProvider:
    """Test the base provider class."""

    def test_base_provider_is_abstract(self):
        """Test that BaseProvider cannot be instantiated directly."""
        with pytest.raises(TypeError):
            BaseProvider(api_key="test")

    @pytest.mark.asyncio
    async def test_health_check_success(self):
        """Test successful health check."""
        # Create a concrete subclass for testing
        class TestProvider(BaseProvider):
            def _get_default_url(self) -> str:
                return "https://test.api.com"

            async def chat_completion(self, messages, **kwargs):
                return {"success": True}

        provider = TestProvider(api_key="test-key")

        # Mock successful chat completion
        with patch.object(provider, 'chat_completion', new_callable=AsyncMock) as mock_chat:
            mock_chat.return_value = {"success": True}
            result = await provider.health_check()
            assert result is True
            mock_chat.assert_called_once_with([{"role": "user", "content": "Hello"}], max_tokens=1)

    @pytest.mark.asyncio
    async def test_health_check_failure(self):
        """Test health check failure."""
        # Create a concrete subclass for testing
        class TestProvider(BaseProvider):
            def _get_default_url(self) -> str:
                return "https://test.api.com"

            async def chat_completion(self, messages, **kwargs):
                raise Exception("API error")

        provider = TestProvider(api_key="test-key")

        result = await provider.health_check()
        assert result is False

    @pytest.mark.asyncio
    async def test_close(self):
        """Test closing the HTTP client."""
        # Create a concrete subclass for testing
        class TestProvider(BaseProvider):
            def _get_default_url(self) -> str:
                return "https://test.api.com"

            async def chat_completion(self, messages, **kwargs):
                return {"success": True}

        provider = TestProvider(api_key="test-key")

        # Mock the client's aclose method
        with patch.object(provider.client, 'aclose', new_callable=AsyncMock) as mock_aclose:
            await provider.close()
            mock_aclose.assert_called_once()


class TestOpenAIProvider:
    """Test OpenAI provider."""

    @pytest.fixture
    def provider(self):
        """Create OpenAI provider instance."""
        return OpenAIProvider(api_key="test-key")

    def test_initialization(self, provider):
        """Test provider initialization."""
        assert provider.api_key == "test-key"
        assert provider.base_url == "https://api.openai.com/v1"

    def test_custom_base_url(self):
        """Test provider with custom base URL."""
        provider = OpenAIProvider(api_key="test-key", base_url="https://custom.openai.com")
        assert provider.base_url == "https://custom.openai.com"

    @pytest.mark.asyncio
    async def test_chat_completion(self, provider):
        """Test chat completion request."""
        mock_response = {
            "id": "test-id",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-3.5-turbo",
            "choices": [{"message": {"role": "assistant", "content": "Hello!"}}],
        }

        # Mock the httpx response (httpx response is synchronous)
        mock_http_response = Mock()
        mock_http_response.json.return_value = mock_response
        mock_http_response.raise_for_status = Mock()

        with patch.object(provider.client, 'post', return_value=mock_http_response):
            messages = [{"role": "user", "content": "Hello"}]
            result = await provider.chat_completion(messages)

            assert result == mock_response


class TestDeepSeekProvider:
    """Test DeepSeek provider."""

    @pytest.fixture
    def provider(self):
        """Create DeepSeek provider instance."""
        return DeepSeekProvider(api_key="test-key")

    def test_initialization(self, provider):
        """Test provider initialization."""
        assert provider.api_key == "test-key"
        assert provider.base_url == "https://api.deepseek.com/v1"


class TestAnthropicProvider:
    """Test Anthropic provider."""

    @pytest.fixture
    def provider(self):
        """Create Anthropic provider instance."""
        return AnthropicProvider(api_key="test-key")

    def test_initialization(self, provider):
        """Test provider initialization."""
        assert provider.api_key == "test-key"
        assert provider.base_url == "https://api.anthropic.com/v1"


class TestGeminiProvider:
    """Test Google Gemini provider."""

    @pytest.fixture
    def provider(self):
        """Create Gemini provider instance."""
        return GeminiProvider(api_key="test-key")

    def test_initialization(self, provider):
        """Test provider initialization."""
        assert provider.api_key == "test-key"
        assert provider.base_url == "https://generativelanguage.googleapis.com/v1beta"

    def test_openai_to_gemini_conversion(self, provider):
        """Test message format conversion from OpenAI to Gemini."""
        openai_messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello!"},
        ]

        gemini_contents = provider._convert_messages_to_gemini(openai_messages)
        assert len(gemini_contents) == 2
        assert gemini_contents[0]["role"] == "model"  # system becomes model
        assert gemini_contents[0]["parts"][0]["text"] == "You are a helpful assistant."
        assert gemini_contents[1]["role"] == "user"
        assert gemini_contents[1]["parts"][0]["text"] == "Hello!"


class TestAzureOpenAIProvider:
    """Test Azure OpenAI provider."""

    @pytest.fixture
    def provider(self):
        """Create Azure OpenAI provider instance."""
        return AzureOpenAIProvider(api_key="test-key", base_url="https://test.openai.azure.com")

    def test_initialization(self, provider):
        """Test provider initialization."""
        assert provider.api_key == "test-key"
        assert provider.base_url == "https://test.openai.azure.com"

    @pytest.mark.asyncio
    async def test_chat_completion(self, provider):
        """Test chat completion request with Azure-specific URL."""
        mock_response = {
            "id": "test-id",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-35-turbo",
            "choices": [{"message": {"role": "assistant", "content": "Hello!"}}],
        }

        # Mock the httpx response
        mock_http_response = Mock()
        mock_http_response.json.return_value = mock_response
        mock_http_response.raise_for_status = Mock()

        with patch.object(provider.client, 'post', return_value=mock_http_response) as mock_post:
            messages = [{"role": "user", "content": "Hello"}]
            result = await provider.chat_completion(messages, model="gpt-35-turbo")

            assert result == mock_response
            # Check that the URL includes the Azure deployment path
            call_args = mock_post.call_args
            assert "deployments/gpt-35-turbo/chat/completions" in call_args[0][0]