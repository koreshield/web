# Quick Start Guide

## Getting Started

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- Git

### Installation

1. **Clone the repository** (or work in the current directory):
   ```bash
   git clone https://github.com/koreshield/koreshield.git
   cd koreshield/llm-firewall
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   ```
   
   On Windows:
   ```powershell
   venv\Scripts\activate
   ```
   
   On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up configuration**:
   ```bash
   # Copy the example config
   cp config/config.example.yaml config/config.yaml
   # Edit config.yaml with your settings
   ```

5. **Run tests** (optional):
   ```bash
   pip install -r requirements-dev.txt
   pytest
   ```

### Running the Firewall

```bash
# From the project root
python -m src.firewall.main
```

Or using uvicorn directly:
```bash
uvicorn src.firewall.proxy:app --reload
```

The firewall will start on `http://localhost:8000`

### Health Check

Visit `http://localhost:8000/health` to verify the service is running.

## Next Steps

1. **Begin Literature Review** (Week 1-2):
   - Start researching prompt injection attacks
   - Review RAG system security papers
   - Document findings in `research/literature/`

2. **Develop MVP** (Weeks 5-8):
   - Implement basic proxy functionality
   - Add OpenAI API integration
   - Create simple pattern matching
   - Set up basic logging

3. **Start Research** (Weeks 5-6):
   - Build test RAG systems
   - Conduct attack experiments
   - Document attack vectors

## Development

### Project Structure

```
llm-firewall/
├── src/
│   ├── firewall/          # Core firewall modules
│   └── providers/         # LLM provider integrations
├── tests/                 # Test files
├── research/              # Research notes and materials
├── config/                # Configuration files
├── docker/                # Docker setup
└── docs/                  # Documentation (coming soon)
```

### Running Tests

```bash
pytest
```

With coverage:
```bash
pytest --cov=src --cov-report=html
```

### Code Quality

```bash
# Format code
black src/ tests/

# Lint
ruff check src/ tests/

# Type check
mypy src/
```

## Resources

- [Research Notes](research/README.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Getting Started Guide](docs/GETTING_STARTED.md)

## Current Phase

**Phase 1: Research & Planning (Weeks 1-4)**

- ✅ Project structure set up
- ✅ Development environment configured
- ⏳ Literature review (next step)
- ⏳ Research methodology design

