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
	{ path: '/vs/lakera', priority: 0.8, changefreq: 'monthly' },
	{ path: '/vs/llm-guard', priority: 0.8, changefreq: 'monthly' },
	{ path: '/vs/build-yourself', priority: 0.8, changefreq: 'monthly' },

	// Solution pages
	{ path: '/solutions/detection-response', priority: 0.7, changefreq: 'monthly' },
	{ path: '/solutions/application-protection', priority: 0.7, changefreq: 'monthly' },
	{ path: '/solutions/agents-security', priority: 0.7, changefreq: 'monthly' },
	{ path: '/solutions/usage-control', priority: 0.7, changefreq: 'monthly' },
	{ path: '/solutions/rag-security', priority: 0.7, changefreq: 'monthly' },

	// Why KoreShield
	{ path: '/why-koreshield', priority: 0.7, changefreq: 'monthly' },

	// Additional pages
	{ path: '/integrations', priority: 0.6, changefreq: 'weekly' },
	{ path: '/changelog', priority: 0.6, changefreq: 'weekly' },
	{ path: '/research', priority: 0.6, changefreq: 'monthly' },
	{ path: '/careers', priority: 0.5, changefreq: 'monthly' },
	{ path: '/legal', priority: 0.5, changefreq: 'yearly' },

	// Get Started
	{ path: '/getting-started', priority: 0.8, changefreq: 'weekly' },
	{ path: '/demo', priority: 0.8, changefreq: 'weekly' },
];

/**
 * Generate sitemap XML
 */
function generateSitemap() {
	const urls = ROUTES.map((route) => `
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
	const outputDir = path.join(__dirname, '../public');

	// Create sitemap.xml
	const sitemapContent = generateSitemap();
	fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemapContent, 'utf-8');
	console.log('✅ Created: web/public/sitemap.xml');

	// Create robots.txt
	const robotsContent = generateRobotsTxt();
	fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsContent, 'utf-8');
	console.log('✅ Created: web/public/robots.txt');

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

	fs.writeFileSync(path.join(outputDir, 'sitemap-index.xml'), sitemapIndex, 'utf-8');
	console.log('✅ Created: web/public/sitemap-index.xml');

	console.log('\n✅ All sitemaps generated successfully!');
}

// Run generator
if (require.main === module) {
	try {
		writeSitemaps();
	} catch (error) {
		console.error('❌ Error generating sitemaps:', error);
		process.exit(1);
	}
}

module.exports = { generateSitemap, generateRobotsTxt };
