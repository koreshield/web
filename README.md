# KoreShield Web

Unified frontend for `koreshield.ai` — one Cloudflare Pages project, four concerns.

## URL Layout

| URL | What serves it | Source |
|-----|---------------|--------|
| `koreshield.ai/` | TanStack Start (marketing landing) | `web/app/` |
| `koreshield.ai/docs/*` | TanStack Start (Fumadocs) | `web/app/content/docs/` |
| `koreshield.ai/app/:org/*` | TanStack Start (customer dashboard) | `web/app/src/routes/app/` |
| `koreshield.ai/blog/*` | Astro static | `web/blog/` |
| `koreshield.ai/studio/*` | Sanity Studio static | `web/studio/` |
| `api.koreshield.com` | FastAPI backend (separate VPS) | `koreshield/` |

## Folder Structure

```
web/
├── app/        TanStack Start — marketing, /docs/*, /app/:org/*
├── blog/       Astro — /blog/* (static, base: '/blog')
├── studio/     Sanity Studio — /studio/* (static, basePath: '/studio')
├── dist/       Build output (git-ignored) — deployed as one Cloudflare Pages project
├── wrangler.toml
└── package.json
```

## How Cloudflare Pages Serves This

Cloudflare Pages checks for a static file first. If one exists it serves it
directly. If not it invokes the TanStack Start Worker. So:

- `/blog/...` → `dist/blog/index.html` (Astro, served statically — Worker never invoked)
- `/studio/...` → `dist/studio/index.html` (Sanity, served statically)
- Everything else → TanStack Worker (`dist/_worker.js`)

`app/public/_routes.json` declares this explicitly so Cloudflare skips the
Worker invocation for `/blog/*` and `/studio/*` entirely.

## Local Development

```bash
cd app && npm run dev      # → http://localhost:3000  (marketing + docs + dashboard)
cd blog && pnpm dev        # → http://localhost:4321/blog
cd studio && pnpm dev      # → http://localhost:3333
```

## Production Build

```bash
# From web/
npm run build
# Output: web/dist/
```

## Deploy Manually

```bash
cd web && npm run build
npx wrangler pages deploy dist --project-name=koreshield-web
```

CI runs automatically via `.github/workflows/web-deploy.yml` on every push to
`main` that touches `web/**`.

## Required Secrets (GitHub → Settings → Secrets)

| Secret | Used by |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Wrangler deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Wrangler deploy |
| `BETTER_AUTH_SECRET` | TanStack Start auth |
| `WEB_DATABASE_URL` | App database (Cloudflare D1 or Postgres) |
| `POLAR_ACCESS_TOKEN` | Billing |
| `SANITY_PROJECT_ID` | Blog + Studio |
| `SANITY_DATASET` | Blog + Studio |
