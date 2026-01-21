# KoreShield

[![CI](https://github.com/koreshield/koreshield/actions/workflows/test.yml/badge.svg)](https://github.com/koreshield/koreshield/actions/workflows/test.yml)
[![Lint](https://github.com/koreshield/koreshield/actions/workflows/lint.yml/badge.svg)](https://github.com/koreshield/koreshield/actions/workflows/lint.yml)
[![Docker](https://github.com/koreshield/koreshield/actions/workflows/docker.yml/badge.svg)](https://github.com/koreshield/koreshield/actions/workflows/docker.yml)
[![PyPI](https://img.shields.io/pypi/v/koreshield)](https://pypi.org/project/koreshield/)
[![License](https://img.shields.io/github/license/koreshield/koreshield)](https://github.com/koreshield/koreshield/blob/main/LICENSE)

## About

KoreShield is an open-source security platform designed to protect enterprise applications that use Large Language Models (LLMs) from prompt injection attacks. It sits transparently between your application and LLM API providers (OpenAI, Anthropic, Google Gemini, etc.), sanitizing inputs, detecting threats, and enforcing security policies before requests reach the model.

This project is unified under the KoreShield brand, with all resources, SDKs, and documentation available at [koreshield.com](https://koreshield.com).

The goal is for KoreShield to be the "security layer" for any LLM-powered enterprise system—easy to integrate, highly configurable, and always up-to-date with the latest defenses and best practices.

### Related Research

- [Preprint: LLM Firewall – A Novel Taxonomy of Indirect Prompt Injection Attacks in Enterprise RAG Systems](https://www.academia.edu/145685538/_Preprint_LLM_Firewall_A_Novel_Taxonomy_of_Indirect_Prompt_Injection_Attacks_in_Enterprise_RAG_Systems)

## Why KoreShield?

Prompt injection is a critical security risk for LLM-integrated systems. Attackers can:
- Override system instructions
- Extract sensitive data
- Bypass controls
- Manipulate AI behavior
- Exfiltrate proprietary information

KoreShield provides defense-in-depth:
- **Sanitization**: Cleans and normalizes inputs
- **Detection**: Heuristic and behavioral analysis for attacks
- **Policy Enforcement**: Configurable rules and sensitivity levels
- **Comprehensive Logging**: Audit trail for all events

## Features

- Real-time prompt sanitization
- Multi-layered attack detection
- Configurable security policies (sensitivity, actions)
- Provider-agnostic (OpenAI, Anthropic, Gemini, etc.)
- Structured logging and alerting
- Easy integration (OpenAI-compatible API)
- Extensible plugin architecture
- Unified under the KoreShield brand ([koreshield.com](https://koreshield.com))

## Architecture

```
Application → KoreShield → LLM API Provider
                ↓
         [Sanitization Engine]
         [Attack Detector]
         [Policy Engine]
         [Logger/Alerting]
```

### Component Overview
- **KoreShield Proxy**: Orchestrates security pipeline, handles HTTP requests, tracks metrics
- **Sanitization Engine**: Cleans and normalizes prompts, detects basic threats
- **Attack Detector**: Heuristic and behavioral analysis for prompt injection
- **Policy Engine**: Enforces rules, sensitivity, blocklist/whitelist
- **Logger/Alerting**: Logs requests, attacks, blocks, and sends alerts
- **Provider Layer**: Forwards safe requests to OpenAI, Anthropic, Gemini, etc.

## API Reference (KoreShield)

### Health Check
`GET /health`
Returns status and version.

### Chat Completions (OpenAI Compatible)
`POST /v1/chat/completions`
Proxy endpoint for OpenAI chat completions with security checks.
- Sanitizes and analyzes prompts
- Blocks malicious requests (403)
- Forwards safe requests

### Status
`GET /status`
Returns firewall statistics and health.

## Configuration

Configuration is managed via YAML (`config/config.yaml`). Key options:

```yaml
server:
  host: "0.0.0.0"
  port: 8000
logging:
  level: INFO
  json_logs: false
security:
  sensitivity: medium
  default_action: block
  features:
    sanitization: true
    detection: true
    policy_enforcement: true
providers:
  openai:
    enabled: true
    base_url: "https://api.openai.com/v1"
alerting:
  enabled: false
```

API keys are set via environment variables (e.g., `OPENAI_API_KEY`).

## Usage

### Quick Start
```bash
# Clone the repository
git clone https://github.com/koreshield/koreshield.git
cd llm-firewall

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up configuration
cp config/config.example.yaml config/config.yaml
export OPENAI_API_KEY=your-api-key-here

# Start KoreShield
python -m src.firewall.cli start
```

### Example Request
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

## Security Model (KoreShield)

- **Input Sanitization**: Pattern matching, normalization
- **Attack Detection**: Heuristics for prompt injection, role manipulation, code block injection
- **Policy Enforcement**: Sensitivity levels, block/warn/allow actions
- **Logging & Alerting**: Structured logs, optional alerting via webhooks/email/slack

## Monitoring & Observability

- Request and attack event logging
- Statistics tracking (requests, blocks, attacks)
- Health and status endpoints

## Extensibility

- Add custom detection rules via plugins
- Support for new LLM providers
- Extend policy engine for advanced rules

## Development & Testing

```bash
# Run tests
pytest
```

## Documentation
- Configuration Guide: config/config.example.yaml
- Examples: examples/
- Research Notes: research/
- Official website: [koreshield.com](https://koreshield.com)

## License
MIT License

## Contact
For questions or feedback, visit [koreshield.com](https://koreshield.com) or open an issue on GitHub.
