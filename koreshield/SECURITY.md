# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email security concerns to: security@koreshield.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices

### API Keys

- **Never** commit API keys to the repository
- Use environment variables for all API keys
- The firewall requires `OPENAI_API_KEY` or other provider keys
- Never log API keys or sensitive credentials

### Configuration

- Keep `config/config.yaml` in `.gitignore` (only commit `config.example.yaml`)
- Review security settings before deployment
- Use appropriate sensitivity levels for your use case

### Deployment

- Run the firewall behind a reverse proxy in production
- Use HTTPS/TLS for all connections
- Regularly update dependencies
- Monitor logs for suspicious activity

## Known Security Considerations

1. **Prompt Injection Detection**: The firewall uses pattern matching and heuristics. It may have false positives or negatives. Always review blocked requests.

2. **API Key Handling**: API keys are passed through to providers. Ensure your firewall instance is secure and not exposed publicly without authentication.

3. **Logging**: By default, logs may contain user prompts. Configure logging appropriately for your privacy requirements.

4. **Rate Limiting**: Currently not implemented. Consider adding rate limiting for production use.

## Dependencies

We regularly update dependencies to address security vulnerabilities. Check `requirements.txt` for current versions.

To update dependencies:
```bash
pip install --upgrade -r requirements.txt
```

## Security Features

- Input sanitization
- Attack pattern detection
- Configurable security policies
- Request/response logging
- Error handling to prevent information leakage

