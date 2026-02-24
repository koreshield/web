# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`main`) | :white_check_mark: |
| Older releases | X |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in KoreShield, please report it responsibly:

**Email:** security@koreshield.com  
**Subject line:** `[SECURITY] Brief description`

Please include:
- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix (optional)

We will acknowledge your report within **48 hours** and aim to release a fix within **14 days** for critical issues.

We do not currently offer a bug bounty program, but we will publicly credit responsible disclosers in our release notes (unless you prefer to remain anonymous).

## Security Practices

- All dependencies are scanned by Dependabot
- Code is scanned on every push with CodeQL and Bandit
- Secrets scanning is enabled on this repository
- All changes to `main` require a passing CI pipeline and peer review
