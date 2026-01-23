# KoreShield Python SDK

[![PyPI version](https://badge.fury.io/py/koreshield-python-sdk.svg)](https://pypi.org/project/koreshield-python-sdk/)
[![Python versions](https://img.shields.io/pypi/pyversions/koreshield-python-sdk)](https://pypi.org/project/koreshield-python-sdk/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A comprehensive Python SDK for integrating KoreShield's LLM security features into your applications with ease.

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
pip install koreshield-python-sdk
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
from koreshield_sdk import KoreShieldClient

# Initialize client
client = KoreShieldClient(api_key="your-api-key")

# Scan a prompt
result = client.scan_prompt("Hello, how are you?")
print(f"Safe: {result.is_safe}, Threat Level: {result.threat_level}")
```

### Async Usage

```python
import asyncio
from koreshield_sdk import AsyncKoreShieldClient

async def main():
    async with AsyncKoreShieldClient(api_key="your-api-key") as client:
        result = await client.scan_prompt("Tell me a joke")
        print(f"Confidence: {result.confidence}")

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

#### Methods

- `scan_prompt(prompt: str, **kwargs) -> DetectionResult` (async)
- `scan_batch(prompts: List[str], parallel=True, max_concurrent=10) -> List[DetectionResult]` (async)
- `get_scan_history(limit=50, offset=0, **filters) -> Dict` (async)
- `get_scan_details(scan_id: str) -> Dict` (async)
- `health_check() -> Dict` (async)

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

### FastAPI Integration

```python
from fastapi import FastAPI, HTTPException
from koreshield_sdk import KoreShieldClient

app = FastAPI()
client = KoreShieldClient(api_key="your-api-key")

@app.post("/chat")
async def chat(message: str):
    # Scan user input
    result = client.scan_prompt(message)

    if not result.is_safe and result.threat_level in ["high", "critical"]:
        raise HTTPException(status_code=400, detail="Unsafe content detected")

    # Process with your LLM
    response = f"Processed: {message}"
    return {"response": response, "safety": result.dict()}
```

### Flask Integration

```python
from flask import Flask, request, jsonify
from koreshield_sdk import KoreShieldClient

app = Flask(__name__)
client = KoreShieldClient(api_key="your-api-key")

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")

    # Scan user input
    result = client.scan_prompt(message)

    if not result.is_safe:
        return jsonify({
            "error": "Unsafe content detected",
            "threat_level": result.threat_level,
            "confidence": result.confidence
        }), 400

    # Process with your LLM
    response = f"Echo: {message}"
    return jsonify({"response": response})
```

### Django Integration

```python
# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json
from koreshield_sdk import KoreShieldClient

client = KoreShieldClient(api_key="your-api-key")

@method_decorator(csrf_exempt, name='dispatch')
class ChatView(View):
    def post(self, request):
        data = json.loads(request.body)
        message = data.get("message", "")

        # Scan user input
        result = client.scan_prompt(message)

        if not result.is_safe and result.threat_level == "critical":
            return JsonResponse({
                "error": "Critical threat detected"
            }, status=400)

        # Process with your LLM
        response = f"Response to: {message}"
        return JsonResponse({
            "response": response,
            "safety_check": {
                "safe": result.is_safe,
                "threat_level": result.threat_level,
                "confidence": result.confidence
            }
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

- 📖 [Documentation](https://docs.koreshield.com)
- 🐛 [Issue Tracker](https://github.com/koreshield/koreshield-python-sdk/issues)
- 💬 [Discussions](https://github.com/koreshield/koreshield-python-sdk/discussions)
- 📧 [Email Support](mailto:support@koreshield.com)