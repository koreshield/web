# KoreShield

A middleware proxy that protects enterprise LLM integrations from prompt injection attacks. This tool sits between your applications and LLM APIs (OpenAI, Anthropic, Google Gemini, etc.) to sanitize inputs, detect injection patterns, and block malicious prompts before they reach the model.

## Project Overview

This project is part of a research initiative on **Prompt Injection Defense in Enterprise RAG Systems**, combining:
- **Research Paper**: A comprehensive taxonomy of indirect prompt injection attacks in RAG systems
- **Open Source Tool**: This middleware solution for real-world protection

## Features

- **Real-time Prompt Sanitization**: Pattern-based filtering and heuristic detection
- **Attack Detection**: Known injection pattern matching and behavioral anomaly detection
- **Configurable Security Policies**: Customizable rules, whitelist/blacklist support
- **Multi-Provider Support**: OpenAI, Anthropic, Google Gemini, and more
- **Logging & Alerting**: Attack attempt logging, alert notifications, analytics dashboard
- **Easy Integration**: Drop-in proxy replacement with minimal code changes

## Status

**Early Development** - This project is currently in active development.

## Architecture

```
Application → KoreShield → LLM API Provider
                ↓
         [Sanitization Engine]
         [Pattern Matcher]
         [Policy Engine]
         [Logger/Alerting]
```

## Technology Stack

- **Backend**: Python 3.10+
- **Framework**: FastAPI (for async performance)
- **Pattern Matching**: Regex + custom heuristics
- **Configuration**: Pydantic models + YAML
- **Logging**: Structured logging (JSON)
- **Deployment**: Docker + Docker Compose

## Installation

### Prerequisites

- Python 3.10 or higher
- OpenAI API key (or other supported LLM provider API key)

### Quick Install

```bash
# Clone the repository
git clone https://github.com/koreshield/koreshield.git
cd koreshield

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up configuration
cp config/config.example.yaml config/config.yaml

# Set your API key
export OPENAI_API_KEY=your-api-key-here
```

### Running KoreShield

**Option 1: Using the CLI (Recommended)**
```bash
# Start with default settings
python -m src.koreshield.cli start

# Start on custom port
python -m src.koreshield.cli start --port 9000

# Start with debug logging
python -m src.koreshield.cli start --log-level DEBUG

# Check configuration
python -m src.koreshield.cli check-config

# Show version
python -m src.koreshield.cli version
```

**Option 2: Direct Python module**
```bash
# Start the KoreShield server
python -m src.koreshield.main
```

KoreShield will start on `http://localhost:8000` by default.

**Verify Installation**
```bash
# Run the verification script
python scripts/verify_installation.py
```

### Usage

Once running, use KoreShield as a proxy for your LLM API calls:

```python
import requests

response = requests.post(
    "http://localhost:8000/v1/chat/completions",
    json={
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "user", "content": "What is the weather today?"}
        ]
    }
)
```

**Check Status and Statistics**
```bash
curl http://localhost:8000/status
```

KoreShield will:
- Sanitize and analyze your prompts
- Block malicious injection attempts
- Forward safe requests to OpenAI
- Log all activity
- Track statistics (requests, blocks, attacks)

See [examples/](examples/) for more usage examples:
- `examples/basic_usage.py` - Basic usage examples
- `examples/advanced_usage.py` - Advanced testing and attack patterns

## Development Setup

```bash
# Clone the repository
git clone https://github.com/koreshield/koreshield.git
cd koreshield

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest
```

## Documentation

- [System Design](docs/SYSTEM_DESIGN.md) - Comprehensive system architecture and design
- [API Reference](docs/API.md) - API endpoints and usage
- [Getting Started Guide](docs/GETTING_STARTED.md) - Installation and quick start
- [Configuration Guide](config/config.example.yaml) - Configuration options
- [Examples](examples/) - Usage examples and test cases
- [Research Notes](research/) - Research materials and notes

## Contributing

Contributions are welcome! This project is in early development. Please check back soon for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Research

This tool is developed alongside research on "A Novel Taxonomy of Indirect Prompt Injection Attacks in Enterprise RAG Systems" (to be published on arXiv).

## Contact

For questions or feedback, please open an issue on GitHub.