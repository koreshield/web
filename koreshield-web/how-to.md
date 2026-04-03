# KoreShield Web Platform Guide

This document explains what the web app is, who uses it, and how it fits with the backend proxy.

## What The Web App Is

KoreShield Web is the control plane for the KoreShield platform.

The backend proxy does the protection work:

- receives protected chat and RAG traffic
- scans for prompt injection and related threats
- applies policy
- logs decisions
- routes safe traffic to configured providers

The web app gives teams a way to operate that system:

- see threats and audit history
- manage policies, rules, alerts, and API keys
- monitor provider health and status
- run RAG security scans
- manage teams and billing

## How Clients Use KoreShield

The simplest client story is:

1. The client points their app traffic at KoreShield instead of calling a model provider directly.
2. KoreShield scans and routes the request.
3. The client team uses the dashboard to manage security and operations.

That means the web app is helpful, but not mandatory, for runtime protection. The proxy can still be used in API-first mode.

## Primary User Types

### Security engineers

Use the app to:

- review blocked threats
- tune policies and rules
- investigate suspicious RAG content

### Platform and DevOps engineers

Use the app to:

- check provider health
- understand routing state
- verify alerting and status behavior

### Engineering managers and product owners

Use the app to:

- manage teams and access
- track usage and billing state
- understand rollout readiness

### Compliance and audit stakeholders

Use the app to:

- review audit logs
- verify incident and status history
- support internal or external reporting

## Core App Areas

### Public pages

- `/`
- `/pricing`
- `/integrations`
- `/status`
- `/about`
- `/contact`

### Authenticated customer pages

- `/dashboard`
- `/getting-started`
- `/teams`
- `/api-keys`
- `/rag-security`
- `/alerts`
- `/audit-logs`
- `/providers`
- `/billing`
- `/profile`

### Admin and advanced surfaces

- `/rules`
- `/policies`
- `/analytics`
- `/reports`
- `/rbac`
- `/threats`

Some of these are intentionally role-gated or less prominent in the UI depending on the user account.

## Deployment Model

In the current repo, the common local and production-style layout is:

```text
Client App -> KoreShield API -> Provider
                  |
                  +-> PostgreSQL
                  +-> Redis
                  +-> Web dashboard
```

The root production compose file runs:

- API
- Web
- PostgreSQL
- Redis
- Caddy

## Customer Onboarding Flow

For a new customer, the practical sequence is:

1. create or receive an account
2. sign in to the dashboard
3. create or review a team
4. create an API key
5. point the client app to KoreShield
6. send the first protected request
7. verify threat visibility, audit logs, and provider health

That is why the most important dashboard pages for onboarding are:

- `Getting Started`
- `API Keys`
- `Teams`
- `RAG Security`
- `Providers`

## How To Explain It Quickly

Short version:

KoreShield is the security layer in front of model providers, and the web app is the place where customers operate that layer.

Longer version:

KoreShield lets a customer secure LLM and RAG traffic through a proxy, then use the dashboard to manage policies, monitor providers, inspect attacks, handle billing, and keep an audit trail of what happened.

## Related Docs

- [/Users/nsisong/projects/koreshield/koreshield/docs/CLIENT_ONBOARDING.md](/Users/nsisong/projects/koreshield/koreshield/docs/CLIENT_ONBOARDING.md)
- [/Users/nsisong/projects/koreshield/koreshield/docs/GETTING_STARTED.md](/Users/nsisong/projects/koreshield/koreshield/docs/GETTING_STARTED.md)
- [/Users/nsisong/projects/koreshield/koreshield/README.md](/Users/nsisong/projects/koreshield/koreshield/README.md)
