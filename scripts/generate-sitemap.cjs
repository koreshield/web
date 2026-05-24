#!/usr/bin/env node

/**
 * Dynamic Sitemap Generator for KoreShield
 * Generates sitemap.xml with all public routes and pages
 * Run: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://koreshield.ai';
const CURRENT_DATE = new Date().toISOString().split('T')[0];
const publicDir = path.join(__dirname, '../public');
const contentDir = path.join(__dirname, '../src/content');

const CAREER_SLUGS = [
	'social-media-operator',
	'senior-backend-engineer',
	'ml-security-researcher',
	'product-designer',
	'enterprise-account-executive',
	'global-sales-manager',
	'ui-engineer',
	'security-engineer-red-team',
	'data-engineer-big-data',
	'ai-product-manager',
	'senior-devops-engineer',
];

const RESEARCH_SLUGS = [
	'state-of-prompt-injection-in-production-llm-systems',
	'indirect-prompt-injection-via-retrieved-documents',
	'tool-call-hijacking-in-agentic-pipelines',
	'jailbreak-technique-drift',
	'pii-exfiltration-via-llm-output',
	'evaluating-confidence-thresholds-for-prompt-injection-classifiers',
	'bypass-resistance-of-system-prompt-hardening-alone',
	'multi-turn-injection-building-attack-context-across-conversation-rounds',
	'false-positive-rates-semantic-vs-rule-based-detectors-at-scale',
];

function mdSlug(file) {
	return file.replace(/\.(md|mdx)$/i, '');
}

function readMarkdownRoutes(folder, prefix) {
	const dir = path.join(contentDir, folder);
	if (!fs.existsSync(dir)) {
		return [];
	}

	return fs
		.readdirSync(dir)
		.filter((file) => /\.(md|mdx)$/i.test(file) && file.toLowerCase() !== 'readme.md')
		.map((file) => ({ path: `${prefix}/${mdSlug(file)}`, priority: 0.55, changefreq: 'monthly' }));
}

function readDocsRoutes() {
	const dir = path.join(contentDir, 'docs');
	if (!fs.existsSync(dir)) {
		return [];
	}

	const routes = [];
	const stack = [dir];
	while (stack.length > 0) {
		const current = stack.pop();
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const fullPath = path.join(current, entry.name);
			if (entry.isDirectory()) {
				stack.push(fullPath);
				continue;
			}

			if (!/\.(md|mdx)$/i.test(entry.name)) {
				continue;
			}

			const content = fs.readFileSync(fullPath, 'utf-8');
			const slugMatch = content.match(/^slug:\s*(.+)$/m);
			if (slugMatch) {
				routes.push({ path: `/docs${slugMatch[1].trim()}`, priority: 0.5, changefreq: 'monthly' });
			}
		}
	}

	return routes.sort((a, b) => a.path.localeCompare(b.path));
}

// Define all public routes with metadata
const ROUTES = [
	// Homepage
	{ path: '/', priority: 1.0, changefreq: 'daily' },

	// Main pages
	{ path: '/features', priority: 0.9, changefreq: 'weekly' },
	{ path: '/pricing', priority: 0.9, changefreq: 'weekly' },
	{ path: '/docs', priority: 0.8, changefreq: 'daily' },
	{ path: '/blog', priority: 0.8, changefreq: 'daily' },
	{ path: '/status', priority: 0.7, changefreq: 'hourly' },
	{ path: '/about', priority: 0.7, changefreq: 'monthly' },
	{ path: '/contact', priority: 0.6, changefreq: 'yearly' },

	// Comparison pages (high SEO value)
	{ path: '/vs', priority: 0.8, changefreq: 'monthly' },
	{ path: '/vs/lakera-guard', priority: 0.8, changefreq: 'monthly' },
	{ path: '/vs/llm-guard', priority: 0.8, changefreq: 'monthly' },
	{ path: '/vs/build-yourself', priority: 0.8, changefreq: 'monthly' },

	// Solution pages
	{ path: '/solutions', priority: 0.85, changefreq: 'weekly' },
	{ path: '/solutions/ai-detection-response', priority: 0.7, changefreq: 'monthly' },
	{ path: '/solutions/ai-application-protection', priority: 0.7, changefreq: 'monthly' },
	{ path: '/solutions/ai-agents-security', priority: 0.7, changefreq: 'monthly' },
	{ path: '/solutions/ai-usage-control', priority: 0.7, changefreq: 'monthly' },
	{ path: '/solutions/rag-security', priority: 0.7, changefreq: 'monthly' },
	{ path: '/solutions/korepilot', priority: 0.7, changefreq: 'monthly' },
	{ path: '/solutions/voice-audio-protection', priority: 0.7, changefreq: 'monthly' },

	// Why KoreShield
	{ path: '/why-koreshield', priority: 0.7, changefreq: 'monthly' },

	// Additional pages
	{ path: '/integrations', priority: 0.6, changefreq: 'weekly' },
	{ path: '/changelog', priority: 0.6, changefreq: 'weekly' },
	{ path: '/research', priority: 0.6, changefreq: 'monthly' },
	{ path: '/careers', priority: 0.5, changefreq: 'monthly' },
	{ path: '/privacy-policy', priority: 0.4, changefreq: 'yearly' },
	{ path: '/terms-of-service', priority: 0.4, changefreq: 'yearly' },
	{ path: '/cookie-policy', priority: 0.4, changefreq: 'yearly' },
	{ path: '/dpa', priority: 0.4, changefreq: 'yearly' },
	{ path: '/legal/sub-processors', priority: 0.35, changefreq: 'yearly' },
	{ path: '/legal/transfer-policy', priority: 0.35, changefreq: 'yearly' },

	// Get Started
	{ path: '/getting-started', priority: 0.8, changefreq: 'weekly' },
	{ path: '/demo', priority: 0.8, changefreq: 'weekly' },
	...CAREER_SLUGS.map((slug) => ({ path: `/careers/${slug}`, priority: 0.45, changefreq: 'monthly' })),
	...RESEARCH_SLUGS.map((slug) => ({ path: `/research/${slug}`, priority: 0.55, changefreq: 'monthly' })),
];

/**
 * Generate sitemap XML
 */
function generateSitemap(routes = ROUTES) {
	const seen = new Set();
	const uniqueRoutes = routes.filter((route) => {
		if (seen.has(route.path)) {
			return false;
		}
		seen.add(route.path);
		return true;
	});

	const urls = uniqueRoutes.map((route) => `
	<url>
		<loc>${SITE_URL}${route.path}</loc>
		<lastmod>${CURRENT_DATE}</lastmod>
		<changefreq>${route.changefreq}</changefreq>
		<priority>${route.priority}</priority>
	</url>`).join('');

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
	xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
	xmlns:xhtml="http://www.w3.org/1999/xhtml"
	xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
	xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
	xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>`;

	return sitemap;
}

/**
 * Generate robots.txt
 */
function generateRobotsTxt() {
	const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /.well-known/

# Specific bot rules
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 2

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: Yandexbot
Allow: /

User-agent: MJ12bot
Allow: /

# Block bad bots
User-agent: MJ12bot
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10

# Sitemap
Sitemap: https://koreshield.ai/sitemap.xml
Sitemap: https://koreshield.ai/sitemap-blog.xml
Sitemap: https://koreshield.ai/sitemap-docs.xml
`;

	return robotsTxt;
}

/**
 * Write files
 */
function writeSitemaps() {
	const blogRoutes = readMarkdownRoutes('blog', '/blog');
	const docsRoutes = readDocsRoutes();

	// Create sitemap.xml
	const sitemapContent = generateSitemap();
	fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent, 'utf-8');
	console.log('[YES] Created: web/public/sitemap.xml');

	fs.writeFileSync(path.join(publicDir, 'sitemap-blog.xml'), generateSitemap(blogRoutes), 'utf-8');
	console.log('[YES] Created: web/public/sitemap-blog.xml');

	fs.writeFileSync(path.join(publicDir, 'sitemap-docs.xml'), generateSitemap(docsRoutes), 'utf-8');
	console.log('[YES] Created: web/public/sitemap-docs.xml');

	// Create robots.txt
	const robotsContent = generateRobotsTxt();
	fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf-8');
	console.log('[YES] Created: web/public/robots.txt');

	// Create sitemap index for large sites
	const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<sitemap>
		<loc>https://koreshield.ai/sitemap.xml</loc>
		<lastmod>${CURRENT_DATE}</lastmod>
	</sitemap>
	<sitemap>
		<loc>https://koreshield.ai/sitemap-blog.xml</loc>
		<lastmod>${CURRENT_DATE}</lastmod>
	</sitemap>
	<sitemap>
		<loc>https://koreshield.ai/sitemap-docs.xml</loc>
		<lastmod>${CURRENT_DATE}</lastmod>
	</sitemap>
</sitemapindex>`;

	fs.writeFileSync(path.join(publicDir, 'sitemap-index.xml'), sitemapIndex, 'utf-8');
	console.log('[YES] Created: web/public/sitemap-index.xml');

	console.log('\n[YES] All sitemaps generated successfully!');
}

// Run generator
if (require.main === module) {
	try {
		writeSitemaps();
	} catch (error) {
		console.error('[NO] Error generating sitemaps:', error);
		process.exit(1);
	}
}

module.exports = { generateSitemap, generateRobotsTxt };
