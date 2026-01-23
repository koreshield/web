# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-22

### Added
- Initial release of KoreShield Python SDK
- Synchronous and asynchronous API clients
- Comprehensive type hints and Pydantic models
- LangChain integration with callback handlers
- Batch scanning capabilities
- Comprehensive error handling and retry logic
- FastAPI, Flask, and Django integration examples
- Full test suite with pytest
- Complete documentation and examples
- MIT license

### Features
- **Security Scanning**: Scan prompts for LLM security threats
- **Async Support**: High-performance async operations
- **Batch Processing**: Concurrent batch scanning
- **Framework Integration**: LangChain, FastAPI, Flask, Django
- **Type Safety**: Full type hints and validation
- **Error Handling**: Comprehensive exception hierarchy
- **Monitoring**: Scan history and health checks

### Technical Details
- Python 3.8+ support
- httpx for async HTTP client
- requests for sync HTTP client
- Pydantic for data validation
- Comprehensive test coverage
- Ruff for linting and formatting