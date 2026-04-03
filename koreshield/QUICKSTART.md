# KoreShield Quickstart

This quickstart is for the backend proxy in [/Users/nsisong/projects/koreshield/koreshield](/Users/nsisong/projects/koreshield/koreshield).

KoreShield sits between your application and model providers, scans traffic for prompt injection and related threats, applies policy, logs events, and forwards safe requests to configured providers.

## Prerequisites

- Python 3.11 or newer
- PostgreSQL and Redis for the full app flow
- at least one provider API key if you want live model routing

## Local Python Setup

```bash
cd /Users/nsisong/projects/koreshield/koreshield
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## Configuration

Copy the example config if you need a starting point:

```bash
cp config/config.example.yaml config/config.local.yaml
```

The repo already ships with a working local `config/config.yaml`, so most day-to-day work uses environment variables rather than replacing the checked-in config.

Common env vars:

- `DEEPSEEK_API_KEY`
- `GEMINI_API_KEY` or `GOOGLE_API_KEY`
- `AZURE_OPENAI_API_KEY`
- `JWT_SECRET`
- `DATABASE_URL`
- `REDIS_URL`

## Run The Backend

```bash
uvicorn src.koreshield.main:app --reload --host 0.0.0.0 --port 8000
```

Health endpoints:

- `http://localhost:8000/health`
- `http://localhost:8000/status`
- `http://localhost:8000/health/providers`

## Run The Full Product With Docker

From the repo root:

```bash
cd /Users/nsisong/projects/koreshield
docker compose --env-file .env -f docker-compose.prod.yml up -d --build
```

That gives you:

- web: `http://localhost:3000`
- api: `http://localhost:8000`

## Run Tests

```bash
cd /Users/nsisong/projects/koreshield/koreshield
pytest -q
python -m build
```

## What Clients Actually Use

Clients typically do three things:

1. Point their app or SDK traffic at KoreShield instead of calling the model provider directly.
2. Use the dashboard to manage teams, API keys, policies, alerts, billing, and RAG scanning.
3. Review blocked threats, provider health, audit logs, and status data over time.

For the customer-facing explanation, use:

- [/Users/nsisong/projects/koreshield/koreshield/docs/CLIENT_ONBOARDING.md](/Users/nsisong/projects/koreshield/koreshield/docs/CLIENT_ONBOARDING.md)
- [/Users/nsisong/projects/koreshield/koreshield/docs/GETTING_STARTED.md](/Users/nsisong/projects/koreshield/koreshield/docs/GETTING_STARTED.md)
