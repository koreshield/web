# Contributing to KoreShield Python SDK

Thank you for your interest in contributing to the KoreShield Python SDK! We welcome contributions from the community.

## Development Setup

### Prerequisites
- Python 3.8 or higher
- pip
- git

### Setup
```bash
# Clone the repository
git clone https://github.com/koreshield/koreshield-python-sdk.git
cd koreshield-python-sdk

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run linting
ruff check src/
ruff format src/
```

## Development Workflow

### 1. Choose an Issue
- Check the [GitHub Issues](https://github.com/koreshield/koreshield-python-sdk/issues) for open tasks
- Comment on the issue to indicate you're working on it
- Create a new branch for your work

### 2. Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Write tests for new functionality
# Update documentation if needed

# Run tests
pytest

# Run linting and formatting
ruff check src/
ruff format src/
mypy src/
```

### 3. Testing
- Write comprehensive tests for new features
- Ensure all existing tests pass
- Test both sync and async functionality
- Test error conditions and edge cases

### 4. Documentation
- Update docstrings for new functions/classes
- Add examples for new features
- Update README.md if needed
- Update type hints

### 5. Pull Request
```bash
# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to your branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

## Code Style

### Python Style
- Follow PEP 8
- Use type hints for all function parameters and return values
- Write docstrings for all public functions and classes
- Use descriptive variable names

### Linting and Formatting
- Use `ruff` for linting and formatting
- Use `mypy` for type checking
- Fix all linting errors before submitting

### Testing
- Write unit tests for all new functionality
- Aim for high test coverage
- Use descriptive test names
- Test both success and failure cases

## Commit Messages

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

Examples:
```
feat: add async batch scanning support
fix: handle timeout errors in client
docs: update README with new examples
test: add integration tests for LangChain
```

## Pull Request Guidelines

### Before Submitting
- [ ] All tests pass
- [ ] Code is properly formatted and linted
- [ ] Type hints are correct
- [ ] Documentation is updated
- [ ] No breaking changes without discussion
- [ ] Commit messages follow conventional format

### PR Description
- Clearly describe what the PR does
- Reference any related issues
- Include screenshots for UI changes
- List any breaking changes

### Review Process
- At least one maintainer will review your PR
- Address review comments
- Once approved, a maintainer will merge your PR

## Issue Reporting

### Bug Reports
- Use the bug report template
- Include Python version, OS, and SDK version
- Provide a minimal reproducible example
- Include full error messages and stack traces

### Feature Requests
- Use the feature request template
- Clearly describe the proposed feature
- Explain why it's needed and how it would be used
- Consider if it fits within the project's scope

## Community

- Join our [Discord](https://discord.gg/koreshield) for discussions
- Follow [@koreshield](https://twitter.com/koreshield) on Twitter
- Read our [Blog](https://blog.koreshield.com) for updates

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.