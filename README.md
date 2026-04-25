# KoreShield Web Properties

Unified web properties for KoreShield, serving all user-facing content from koreshield.ai

## 📁 Structure

```
web/
├── koreshield-web/        # Marketing site (root, Vite/React)
├── koreshield-blog/       # Blog content (/blog, Astro)
├── koreshield-docs/       # Documentation (/docs, Docusaurus)
├── package.json           # Unified build orchestration
├── scripts/               # Build utilities
├── wrangler.toml          # Cloudflare Pages config
└── README.md              # This file
```

## 🚀 Deployment

### Routes
- `koreshield.ai/` → Marketing site (koreshield-web)
- `koreshield.ai/blog/` → Blog (koreshield-blog)
- `koreshield.ai/docs/` → Documentation (koreshield-docs)
- `koreshield.ai/app/` → Dashboard (if needed)

### Build Output
```
dist/
├── index.html             # Marketing site root
├── blog/                  # Blog subdirectory
├── docs/                  # Docs subdirectory
└── _redirects             # Cloudflare routing rules
```

## 📦 Development

Each property can be developed independently:

```bash
# Marketing site (Vite/React)
cd koreshield-web && pnpm dev

# Blog (Astro)
cd koreshield-blog && pnpm dev

# Docs (Docusaurus)
cd koreshield-docs && pnpm start
```

## 🔨 Building

Build everything for production:

```bash
pnpm build
```

This runs:
1. Cleans previous build output
2. Builds marketing site → `dist/`
3. Builds blog → `dist/blog/`
4. Builds docs → `dist/docs/`
5. Post-processes for Cloudflare Pages

### Individual Builds

```bash
cd koreshield-web && pnpm build   # Marketing site
cd koreshield-blog && pnpm build  # Blog
cd koreshield-docs && pnpm build  # Docs
```

## 🔄 Monorepo Sync

Changes to `web/` folder automatically sync to separate GitHub repo: https://github.com/koreshield/web

This is handled by `.github/workflows/sync-to-opensource.yml`

## 📝 Configuration Files

- `astro.config.mjs` (blog) - Updated with `base: '/blog'`
- `docusaurus.config.ts` (docs) - Updated with `baseUrl: '/docs'`
- `wrangler.toml` - Cloudflare Pages configuration
- `scripts/post-build.mjs` - Post-build optimization

## 🚢 Deployment to Cloudflare Pages

Connected to: https://github.com/koreshield/web

Build settings:
- **Build command:** `pnpm build`
- **Build output directory:** `dist`
- **Root directory:** `/`

Environment variables (set in Cloudflare Pages):
- `PUBLIC_SANITY_PROJECT_ID`
- `PUBLIC_SANITY_DATASET`
- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_ID`
