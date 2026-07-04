/**
 * Koreshield robots.txt policy.
 *
 * Cloudflare prepends managed AI-crawler directives when
 * "Instruct AI bot traffic with robots.txt" is enabled on the zone.
 * This file is the site-specific section that follows that block.
 *
 * koreshield.ai is the canonical public website. Other public hostnames
 * permanently redirect to it at the edge.
 */

const SITE_ORIGINS = ['https://koreshield.ai'];

const PRIVATE_PATHS = [
	'/admin/',
	'/api/',
	'/private/',
	'/dashboard',
	'/profile',
	'/settings',
	'/settings/',
	'/billing',
	'/usage',
	'/policies',
	'/metrics',
	'/analytics',
	'/rules',
	'/alerts',
	'/cost-analytics',
	'/rbac',
	'/reports',
	'/teams/',
	'/api-key-management',
	'/rag-security',
	'/voice-security',
	'/threat-monitoring',
	'/threat-map',
	'/provider-health',
	'/advanced-analytics',
	'/founder',
	'/compliance-reports',
	'/audit-logs',
	'/login',
	'/signup',
	'/forgot-password',
	'/reset-password',
	'/verify-email',
	'/auth/',
	'/invites/',
];

const DISALLOW_LINES = PRIVATE_PATHS.map((path) => `Disallow: ${path}`).join('\n');

const BLOCKED_AGENTS = ['MJ12bot', 'DotBot', 'BLEXBot', 'PetalBot'];

const SITEMAP_BUNDLES = [{ origin: SITE_ORIGINS[0], basename: 'sitemap' }];

const SITEMAP_LINES = SITEMAP_BUNDLES
	.map(({ origin, basename }) => `Sitemap: ${origin}/${basename}-index.xml`)
	.join('\n');

const ROBOTS_TXT = `# Koreshield robots.txt
# Canonical public site: koreshield.ai.
# Cloudflare may prepend managed AI crawler directives above this file.

# Public marketing, docs, blog, research, careers, legal, and status pages.
User-agent: *
Allow: /
${DISALLOW_LINES}

# Aggressive SEO scrapers - no indexing value for a product site.
${BLOCKED_AGENTS.map((agent) => `User-agent: ${agent}\nDisallow: /`).join('\n\n')}

# Canonical sitemap
${SITEMAP_LINES}
`;

module.exports = { SITE_ORIGINS, ROBOTS_TXT, PRIVATE_PATHS };
