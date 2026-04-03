# KoreShield Web

KoreShield Web is the customer-facing dashboard and public site for the KoreShield platform.

It serves two jobs:

- public product marketing pages such as pricing, integrations, status, and company pages
- authenticated operational pages for customers managing teams, API keys, policies, RAG scans, alerts, billing, provider health, and audit activity

## Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS

## Important Routes

- `/` public landing page
- `/status` public system status page
- `/pricing` public pricing page
- `/integrations` public integrations page
- `/about` public team and company page
- `/dashboard` authenticated customer overview
- `/getting-started` authenticated onboarding guide
- `/teams` team management
- `/api-keys` API key management
- `/rag-security` RAG security scanner
- `/alerts` alert rules and channels
- `/audit-logs` audit and runtime review history
- `/billing` billing and Polar checkout flow

## Local Development

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` by default in Vite dev mode.

If you want the full Docker stack instead, run from the repo root:

```bash
docker compose --env-file .env -f docker-compose.prod.yml up -d --build
```

That serves the production-style web container on `http://localhost:3000`.

## Quality Checks

```bash
npm run lint
npm test
npm run build
```

## Environment Notes

The production build reads these values at build time when present:

- `VITE_API_BASE_URL`
- `VITE_POLAR_STARTUP_PRODUCT_ID`
- `VITE_POLAR_STARTUP_ANNUAL_PRODUCT_ID`
- `VITE_POLAR_GROWTH_PRODUCT_ID`
- `VITE_POLAR_GROWTH_ANNUAL_PRODUCT_ID`

If `VITE_API_BASE_URL` is not set, the frontend falls back to the current-origin deployment assumptions used by the Docker and Caddy setup.

## Related Docs

- [/Users/nsisong/projects/koreshield/koreshield/docs/GETTING_STARTED.md](/Users/nsisong/projects/koreshield/koreshield/docs/GETTING_STARTED.md)
- [/Users/nsisong/projects/koreshield/koreshield/docs/CLIENT_ONBOARDING.md](/Users/nsisong/projects/koreshield/koreshield/docs/CLIENT_ONBOARDING.md)
- [/Users/nsisong/projects/koreshield/koreshield-web/how-to.md](/Users/nsisong/projects/koreshield/koreshield-web/how-to.md)
