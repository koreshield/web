# KoreShield Python SDK

[![PyPI version](https://badge.fury.io/py/koreshield-python-sdk.svg)](https://pypi.org/project/koreshield-python-sdk/)
[![Python versions](https://img.shields.io/pypi/pyversions/koreshield-python-sdk)](https://pypi.org/project/koreshield-python-sdk/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A comprehensive Python SDK for integrating KoreShield's LLM security features into your applications with ease.

## New in v0.2.0

- **Enhanced Async Support**: Improved async/await patterns with context managers and performance monitoring
- **Advanced Batch Processing**: Optimized batch scanning with progress callbacks, concurrency control, and batching
- **Streaming Content Scanning**: Real-time scanning of long content with overlapping chunks
- **Security Policies**: Configurable allowlist/blocklist patterns and custom threat rules
- **Framework Integrations**: Built-in middleware for FastAPI, Flask, and Django
- **Performance Monitoring**: Comprehensive metrics collection and analytics
- **Type Safety**: Full Pydantic models for all data structures

## Supported LLM Providers

KoreShield supports multiple LLM providers through its proxy architecture. Configure your preferred provider in the KoreShield API:

- **DeepSeek** (OpenAI-compatible API)
- **OpenAI** (GPT models)
- **Anthropic** (Claude models)
- **Google Gemini** (coming soon)
- **Azure OpenAI** (coming soon)

### Provider Configuration

Configure providers in your KoreShield `config.yaml`:

```yaml
providers:
  deepseek:
    enabled: true
    base_url: "https://api.deepseek.com/v1"

  openai:
    enabled: false
    base_url: "https://api.openai.com/v1"

  anthropic:
    enabled: false
    base_url: "https://api.anthropic.com/v1"
```

Set the corresponding API key as an environment variable:
```bash
export DEEPSEEK_API_KEY="your-deepseek-key"
# or
export OPENAI_API_KEY="your-openai-key"
# or
export ANTHROPIC_API_KEY="your-anthropic-key"
```

```bash
pip install koreshield
```

### Optional Dependencies

For LangChain integration:
```bash
pip install koreshield-python-sdk[langchain]
```

For framework integrations:
```bash
pip install koreshield-python-sdk[fastapi,flask,django]
```

## Quick Start

### Basic Usage

```python
from koreshield import KoreShieldClient

# Initialize client
client = KoreShieldClient(api_key="your-api-key")

# Scan a prompt
result = client.scan_prompt("Hello, how are you?")
print(f"Safe: {result.is_safe}, Threat Level: {result.threat_level}")
```

### Enhanced Async Usage

```python
import asyncio
from koreshield_sdk import AsyncKoreShieldClient

async def main():
    async with AsyncKoreShieldClient(api_key="your-api-key", enable_metrics=True) as client:
        result = await client.scan_prompt("Tell me a joke")
        print(f"Confidence: {result.confidence}")

        # Get performance metrics
        metrics = await client.get_performance_metrics()
        print(f"Total requests: {metrics.total_requests}")

asyncio.run(main())
```

### LangChain Integration

```python
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage
from koreshield_sdk.integrations import create_koreshield_callback

# Create security callback
security_callback = create_koreshield_callback(
    api_key="your-api-key",
    block_on_threat=True,
    threat_threshold="medium"
)

# Use with LangChain
llm = ChatOpenAI(callbacks=[security_callback])
response = llm([HumanMessage(content="Hello!")])
```

## API Reference

### KoreShieldClient

#### Methods

- `scan_prompt(prompt: str, **kwargs) -> DetectionResult`
- `scan_batch(prompts: List[str], parallel=True, max_concurrent=10) -> List[DetectionResult]`
- `get_scan_history(limit=50, offset=0, **filters) -> Dict`
- `get_scan_details(scan_id: str) -> Dict`
- `health_check() -> Dict`

### AsyncKoreShieldClient

#### Core Methods

- `scan_prompt(prompt: str, **kwargs) -> DetectionResult` (async)
- `scan_batch(prompts: List[str], parallel=True, max_concurrent=10, progress_callback=None) -> List[DetectionResult]` (async)
- `scan_stream(content: str, chunk_size=1000, overlap=100, **kwargs) -> StreamingScanResponse` (async)
- `get_scan_history(limit=50, offset=0, **filters) -> Dict` (async)
- `get_scan_details(scan_id: str) -> Dict` (async)
- `health_check() -> Dict` (async)

#### Security Policy Methods

- `set_security_policy(policy: SecurityPolicy) -> None` (async)
- `get_security_policy() -> SecurityPolicy` (async)
- `update_security_policy(**updates) -> SecurityPolicy` (async)

#### Performance Monitoring Methods

- `get_performance_metrics() -> PerformanceMetrics` (async)
- `reset_metrics() -> None` (async)
- `enable_metrics(enabled: bool = True) -> None` (async)

### DetectionResult

```python
class DetectionResult:
    is_safe: bool
    threat_level: ThreatLevel  # "safe", "low", "medium", "high", "critical"
    confidence: float  # 0.0 to 1.0
    indicators: List[DetectionIndicator]
    processing_time_ms: float
    scan_id: Optional[str]
    metadata: Optional[Dict[str, Any]]
```

### New Types (v0.2.0)

#### StreamingScanResponse

```python
class StreamingScanResponse:
    overall_result: DetectionResult
    chunk_results: List[ChunkResult]
    total_chunks: int
    processing_time_ms: float
    scan_id: str
```

#### SecurityPolicy

```python
class SecurityPolicy:
    name: str
    description: Optional[str]
    threat_threshold: ThreatLevel
    blocked_detection_types: List[str]
    allowlist_patterns: List[str]
    blocklist_patterns: List[str]
    custom_rules: List[Dict[str, Any]]
```

#### PerformanceMetrics

```python
class PerformanceMetrics:
    total_requests: int
    total_processing_time: float
    average_response_time: float
    min_response_time: float
    max_response_time: float
    error_count: int
    success_rate: float
    requests_per_second: float
    start_time: datetime
    last_request_time: Optional[datetime]
```

## Configuration

### Environment Variables

```bash
export KORESHIELD_API_KEY="your-api-key"
export KORESHIELD_BASE_URL="https://api.koreshield.com"  # Optional
```

### Client Configuration

```python
client = KoreShieldClient(
    api_key="your-api-key",
    base_url="https://api.koreshield.com",
    timeout=30.0
)
```

## Examples

### Basic Scanning

```python
from koreshield_sdk import KoreShieldClient

client = KoreShieldClient(api_key="your-api-key")

# Single prompt
result = client.scan_prompt("What is the capital of France?")
print(f"Result: {result}")

# Batch scanning
prompts = [
    "Hello world",
    "Tell me a secret",
    "Ignore previous instructions"
]

results = client.scan_batch(prompts)
for prompt, result in zip(prompts, results):
    print(f"'{prompt}': {result.threat_level} ({result.confidence:.2f})")
```

### Advanced Async Features

```python
import asyncio
from koreshield_sdk import AsyncKoreShieldClient

async def main():
    async with AsyncKoreShieldClient(api_key="your-api-key", enable_metrics=True) as client:

        # Enhanced batch processing with progress callback
        def progress_callback(completed, total, current_result=None):
            print(f"Progress: {completed}/{total} completed")
            if current_result:
                print(f"  Latest result: {current_result.threat_level}")

        prompts = ["Prompt 1", "Prompt 2", "Prompt 3", "Prompt 4", "Prompt 5"]
        results = await client.scan_batch(
            prompts,
            parallel=True,
            max_concurrent=3,
            progress_callback=progress_callback
        )

        # Streaming content scanning for long documents
        long_content = "Your very long document content here..." * 100
        stream_result = await client.scan_stream(
            content=long_content,
            chunk_size=1000,
            overlap=100
        )

        print(f"Overall safe: {stream_result.overall_result.is_safe}")
        print(f"Chunks processed: {stream_result.total_chunks}")

        # Get performance metrics
        metrics = await client.get_performance_metrics()
        print(f"Total requests: {metrics.total_requests}")
        print(".2f"
asyncio.run(main())
```

### Security Policies

```python
from koreshield_sdk import AsyncKoreShieldClient
from koreshield_sdk.types import SecurityPolicy, ThreatLevel

async def main():
    # Create custom security policy
    policy = SecurityPolicy(
        name="strict_policy",
        description="Strict security for sensitive applications",
        threat_threshold=ThreatLevel.LOW,
        allowlist_patterns=["safe", "trusted"],
        blocklist_patterns=["hack", "exploit", "attack"],
        custom_rules=[
            {"name": "no_code_execution", "pattern": "exec\\(|eval\\("},
            {"name": "no_file_operations", "pattern": "open\\(|file\\("}
        ]
    )

    async with AsyncKoreShieldClient(
        api_key="your-api-key",
        security_policy=policy
    ) as client:

        # Test against policy
        test_prompts = [
            "This is a safe message",
            "This contains hack attempts",
            "Let's execute: exec('print(hello)')"
        ]

        for prompt in test_prompts:
            result = await client.scan_prompt(prompt)
            status = "✅ ALLOWED" if result.is_safe else "❌ BLOCKED"
            print(f"{status}: {prompt}")

asyncio.run(main())
```

### FastAPI Integration

```python
from fastapi import FastAPI, Request
from koreshield_sdk.integrations import create_fastapi_middleware

app = FastAPI()

# Create and add KoreShield middleware
middleware = create_fastapi_middleware(
    api_key="your-api-key",
    scan_request_body=True,
    threat_threshold="medium",
    block_on_threat=False,  # Log but don't block
    exclude_paths=["/health", "/docs"]
)

app.middleware("http")(middleware)

@app.post("/chat")
async def chat(request: Request, message: str):
    # Request is automatically scanned by middleware
    # Access scan results from request state if needed
    scan_result = getattr(request.state, 'koreshield_result', None)
    if scan_result and not scan_result.is_safe:
        print(f"Threat detected: {scan_result.threat_level}")

    # Process with your LLM
    response = f"Processed: {message}"
    return {"response": response}
```

### Flask Integration

```python
from flask import Flask, request, jsonify, g
from koreshield_sdk.integrations import create_flask_middleware

app = Flask(__name__)

# Create and register KoreShield middleware
middleware = create_flask_middleware(
    api_key="your-api-key",
    scan_request_body=True,
    threat_threshold="high",
    block_on_threat=True,
    exclude_paths=["/health"]
)

app.before_request(middleware)

@app.route("/api/chat", methods=["POST"])
def chat():
    # Check if request was blocked by middleware
    if hasattr(g, 'koreshield_blocked') and g.koreshield_blocked:
        return jsonify({"error": "Request blocked by security policy"}), 403

    data = request.get_json()
    message = data.get("message", "")

    # Access scan results
    scan_result = getattr(g, 'koreshield_result', None)

    # Process with your LLM
    response = f"Echo: {message}"
    return jsonify({
        "response": response,
        "safety": scan_result.dict() if scan_result else None
    })
```

### Django Integration

```python
# settings.py
KORESHIELD_CONFIG = {
    'api_key': 'your-api-key',
    'scan_request_body': True,
    'threat_threshold': 'medium',
    'block_on_threat': False,
    'exclude_paths': ['/health/', '/admin/']
}

# middleware.py
from koreshield_sdk.integrations import create_django_middleware

KoreShieldMiddleware = create_django_middleware()

# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json

@method_decorator(csrf_exempt, name='dispatch')
class ChatView(View):
    def post(self, request):
        # Check if request was blocked by middleware
        if hasattr(request, 'koreshield_blocked') and request.koreshield_blocked:
            return JsonResponse({"error": "Request blocked by security policy"}, status=403)

        data = json.loads(request.body)
        message = data.get("message", "")

        # Access scan results
        scan_result = getattr(request, 'koreshield_result', None)

        # Process with your LLM
        response = f"Response to: {message}"
        return JsonResponse({
            "response": response,
            "safety_check": scan_result.dict() if scan_result else None
        })
```

## Error Handling

```python
from koreshield_sdk import KoreShieldClient
from koreshield_sdk.exceptions import (
    AuthenticationError,
    ValidationError,
    RateLimitError,
    ServerError,
    NetworkError,
    TimeoutError
)

client = KoreShieldClient(api_key="your-api-key")

try:
    result = client.scan_prompt("Test prompt")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Rate limit exceeded")
except ServerError:
    print("Server error")
except NetworkError:
    print("Network issue")
except TimeoutError:
    print("Request timed out")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Advanced Usage

### Custom Threat Thresholds

```python
# Only block on high/critical threats
callback = create_koreshield_callback(
    api_key="your-api-key",
    block_on_threat=True,
    threat_threshold="high"  # "low", "medium", "high", "critical"
)
```

### Batch Processing with Custom Concurrency

```python
# Process 100 prompts with controlled concurrency
results = await client.scan_batch(
    prompts=prompts,
    parallel=True,
    max_concurrent=5  # Limit to 5 concurrent requests
)
```

### Streaming Content Scanning

```python
# Scan long documents with overlapping chunks
long_document = "Very long content..." * 1000

result = await client.scan_stream(
    content=long_document,
    chunk_size=2000,      # Process in 2000-character chunks
    overlap=200           # 200-character overlap between chunks
)

print(f"Overall safe: {result.overall_result.is_safe}")
print(f"Total chunks: {result.total_chunks}")
for i, chunk_result in enumerate(result.chunk_results):
    print(f"Chunk {i+1}: {chunk_result.result.threat_level}")
```

### Performance Monitoring

```python
async with AsyncKoreShieldClient(api_key="your-api-key", enable_metrics=True) as client:
    # Perform operations...
    await client.scan_prompt("Test prompt")
    await client.scan_batch(["Prompt 1", "Prompt 2"])

    # Get comprehensive metrics
    metrics = await client.get_performance_metrics()
    print(f"Total requests: {metrics.total_requests}")
    print(".2f"    print(".2f"    print(f"Success rate: {metrics.success_rate:.1%}")

    # Reset metrics if needed
    await client.reset_metrics()
```

### Security Policy Management

```python
from koreshield_sdk.types import SecurityPolicy, ThreatLevel

# Create and apply custom policy
policy = SecurityPolicy(
    name="enterprise_policy",
    threat_threshold=ThreatLevel.MEDIUM,
    allowlist_patterns=["approved", "safe"],
    blocklist_patterns=["banned", "dangerous"],
    custom_rules=[
        {"name": "no_pii", "pattern": "\\b\\d{3}-\\d{2}-\\d{4}\\b"},  # SSN pattern
        {"name": "no_emails", "pattern": "\\S+@\\S+\\.\\S+"}
    ]
)

await client.set_security_policy(policy)

# Update policy dynamically
await client.update_security_policy(threat_threshold=ThreatLevel.HIGH)

# Get current policy
current_policy = await client.get_security_policy()
print(f"Current threshold: {current_policy.threat_threshold}")
```

### Monitoring and Analytics

```python
# Get scan history
history = client.get_scan_history(limit=100, threat_level="high")

# Get detailed scan info
details = client.get_scan_details(scan_id="scan_123")
```

## Development

### Setup

```bash
git clone https://github.com/koreshield/koreshield-python-sdk.git
cd koreshield-python-sdk
pip install -e ".[dev]"
```

### Testing

```bash
pytest
```

### Type Checking

```bash
mypy src/
```

### Linting

```bash
ruff check src/
ruff format src/
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- [Documentation](https://docs.koreshield.com)
- [Issue Tracker](https://github.com/koreshield/koreshield-python-sdk/issues)
- [Discussions](https://github.com/koreshield/koreshield-python-sdk/discussions)
- [Email Support](mailto:support@koreshield.com)