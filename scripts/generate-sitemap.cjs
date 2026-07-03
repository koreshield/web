#!/usr/bin/env node

/**
 * Dynamic Sitemap Generator for KoreShield
 * Generates sitemap.xml with all public routes and pages
 * Run: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const { SITE_ORIGINS } = require('./robots-policy.cjs');
const PRIMARY_SITE_URL = SITE_ORIGINS[0];
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

const CORE_METADATA = {
	'/': ['AI Security Firewall | Koreshield', 'Koreshield is a runtime AI security firewall that blocks prompt injection, jailbreaks, unsafe RAG context, and data exfiltration before traffic reaches the model.'],
	'/pricing': ['LLM Security Pricing | Koreshield', 'Compare Koreshield plans for production AI security, protected requests, governance controls, self-hosting, and air-gapped deployment.'],
	'/docs': ['LLM Security Documentation | Koreshield', 'Koreshield API, SDK, deployment, configuration, integration, and production LLM security documentation.'],
	'/blog': ['AI Security Blog | Koreshield', 'Technical articles about LLM security, prompt injection, RAG attacks, AI agents, and production defenses.'],
	'/status': ['System Status | Koreshield', 'Current availability, incidents, maintenance, and service health for the Koreshield AI security platform.'],
	'/about': ['About Koreshield | AI Security Company', 'Learn how Koreshield Labs Ltd is building the runtime security layer for production AI applications.'],
	'/contact': ['Contact Koreshield | AI Security Support and Sales', 'Contact Koreshield for technical support, enterprise AI security, partnerships, or product questions.'],
	'/faq': ['LLM Security FAQ | Koreshield', 'Answers about Koreshield security, privacy, deployment, pricing, compliance, integrations, and troubleshooting.'],
	'/vs': ['Compare LLM Security Solutions | Koreshield', 'Compare Koreshield with LLM Guard, Lakera Guard, and building an internal AI security layer.'],
	'/vs/lakera-guard': ['Koreshield vs Lakera Guard', 'Compare Koreshield and Lakera Guard by deployment model, operating model, RAG coverage, and governance needs.'],
	'/vs/llm-guard': ['Koreshield vs LLM Guard', 'A practical comparison of Koreshield and LLM Guard for teams choosing an LLM security layer.'],
	'/vs/build-yourself': ['Koreshield vs Building an LLM Security Layer', 'Compare building an internal LLM security layer with deploying Koreshield.'],
	'/solutions': ['AI Security Solutions | Koreshield', 'Explore Koreshield solutions for AI detection, application protection, RAG security, agent security, usage control, and audit evidence.'],
	'/solutions/ai-detection-response': ['AI Detection and Response | Koreshield', 'Detect, classify, block, and record LLM threats before they reach models, tools, or users.'],
	'/solutions/ai-application-protection': ['AI Application Protection | Koreshield', 'Protect LLM-powered applications with a runtime proxy security layer and no application rewrite.'],
	'/solutions/ai-agents-security': ['AI Agent Security | Koreshield', 'Secure agentic AI pipelines against tool abuse, indirect prompt injection, data exfiltration, and autonomous action escalation.'],
	'/solutions/ai-usage-control': ['AI Usage Control and Governance | Koreshield', 'Define and enforce what AI systems can and cannot do using scoped policies, logs, limits, and alerts.'],
	'/solutions/rag-security': ['RAG Security and Indirect Prompt Injection | Koreshield', 'Protect RAG pipelines from poisoned documents and indirect prompt injection by scanning retrieved context before inference.'],
	'/solutions/korepilot': ['KorePilot AI Security Evidence | Koreshield', 'Explore the planned Koreshield compliance evidence layer for detection events, audit logs, red-team results, and delivery gates.'],
	'/solutions/voice-audio-protection': ['Voice and Audio AI Protection | Koreshield', 'Protect speech prompts, transcripts, and voice-agent actions before they reach models or tools.'],
	'/why-koreshield': ['Why Koreshield | Runtime LLM Security', 'See how Koreshield combines runtime LLM inspection, flexible deployment, policy controls, and audit evidence.'],
	'/integrations': ['AI Security Integrations | Koreshield', 'Connect Koreshield with model providers, LLM frameworks, application stacks, monitoring tools, and deployment platforms.'],
	'/changelog': ['Changelog | Koreshield', 'Koreshield release notes covering platform updates, security improvements, product changes, and operational milestones.'],
	'/research': ['AI Security Research | Koreshield', 'Applied Koreshield research on prompt injection, RAG pipelines, AI agents, jailbreaks, and production attack patterns.'],
	'/careers': ['AI Security Careers | Koreshield', 'Explore open roles at Koreshield across security, research, engineering, product, growth, and sales.'],
	'/privacy-policy': ['Privacy Policy | Koreshield', 'Read the Koreshield privacy policy and how Koreshield Labs Ltd handles personal data.'],
	'/terms-of-service': ['Terms of Service | Koreshield', 'Read the terms governing access to and use of Koreshield services, software, APIs, and websites.'],
	'/cookie-policy': ['Cookie Policy | Koreshield', 'Read how Koreshield uses essential and optional cookies and how visitors can control consent.'],
	'/dpa': ['Data Processing Agreement | Koreshield', 'Read the Koreshield Data Processing Agreement for customers using Koreshield as a data processor.'],
	'/legal/sub-processors': ['Sub-processors | Koreshield', 'Review the service providers that may process customer data on behalf of Koreshield.'],
	'/legal/transfer-policy': ['International Data Transfer Policy | Koreshield', 'Read the safeguards Koreshield uses for international transfers of personal data.'],
	'/demo': ['Book an AI Security Demo | Koreshield', 'See Koreshield intercept LLM attacks and book a guided demo tailored to your AI stack and use case.'],
	'/authors/isaac-emmanuel': ['Isaac Emmanuel, Koreshield CTO and Engineering Lead', 'Read about Isaac Emmanuel and his work on Koreshield runtime AI security, SDKs, detection systems, and infrastructure.'],
	'/authors/teslim-kazeem': ['Teslim O. Kazeem, Koreshield CEO and Product Lead', 'Read about Teslim O. Kazeem and his work on Koreshield product direction, customer discovery, and practical AI security.'],
};

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
		.map((file) => {
			const content = fs.readFileSync(path.join(dir, file), 'utf-8');
			const status = content.match(/^status:\s*(.+)$/m)?.[1]?.trim();
			if (status && status !== 'published') {
				return null;
			}
			return {
				path: `${prefix}/${mdSlug(file)}`,
				title: content.match(/^title:\s*(.+)$/m)?.[1]?.trim() || mdSlug(file),
				description: content.match(/^excerpt:\s*(.+)$/m)?.[1]?.trim() || 'Koreshield AI security article.',
				lastmod: content.match(/^date:\s*(\d{4}-\d{2}-\d{2})$/m)?.[1],
			};
		})
		.filter(Boolean);
}

function docRouteFromFile(fullPath, dir) {
	const content = fs.readFileSync(fullPath, 'utf-8');
	const relative = path.relative(dir, fullPath).replace(/\\/g, '/');
	const slug = content.match(/^slug:\s*(.+)$/m)?.[1]?.trim().replace(/^\/+|\/+$/g, '');
	let fragment = slug || relative.replace(/\.(md|mdx)$/i, '');
	if (fragment === 'overview') {
		fragment = '';
	} else {
		fragment = fragment.replace(/\/index$/, '');
	}
	const lastmod = content.match(/^last_update:\s*\n\s+date:\s*(\d{4}-\d{2}-\d{2})$/m)?.[1];
	return {
		path: fragment ? `/docs/${fragment}` : '/docs',
		title: content.match(/^title:\s*(.+)$/m)?.[1]?.trim() || fragment.split('/').at(-1) || 'Documentation',
		description: content.match(/^description:\s*(.+)$/m)?.[1]?.trim() || 'Koreshield technical documentation.',
		lastmod,
	};
}

function readTypedContentRoutes(filename, prefix, descriptionFallback) {
	const fullPath = path.join(contentDir, filename);
	if (!fs.existsSync(fullPath)) return [];
	const content = fs.readFileSync(fullPath, 'utf-8');
	const slugMatches = [...content.matchAll(/\bslug:\s*'([^']+)'/g)];
	return slugMatches.map((match, index) => {
		const start = match.index || 0;
		const end = slugMatches[index + 1]?.index || content.length;
		const block = content.slice(start, end);
		const title = block.match(/\btitle:\s*'([^']+)'/)?.[1] || match[1];
		const summary = block.match(/\b(?:summary|description):\s*\n?\s*'([^']+)'/)?.[1] || descriptionFallback;
		const dateText = block.match(/\bdate:\s*'([^']+)'/)?.[1];
		const lastmod = dateText?.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/)?.[0];
		return { path: `${prefix}/${match[1]}`, title, description: summary, lastmod };
	});
}

function titleFromPath(routePath) {
	if (routePath === '/') return 'Koreshield | AI Security Firewall';
	return routePath
		.split('/')
		.filter(Boolean)
		.at(-1)
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
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

			routes.push(docRouteFromFile(fullPath, dir));
		}
	}

	const seen = new Set();
	return routes
		.filter((route) => route.path !== '/docs')
		.filter((route) => {
			if (seen.has(route.path)) return false;
			seen.add(route.path);
			return true;
		})
		.sort((a, b) => a.path.localeCompare(b.path));
}

// Define all public routes with metadata
const ROUTES = [
	// Homepage
	{ path: '/', priority: 1.0, changefreq: 'daily' },

	// Main pages
	{ path: '/pricing', priority: 0.9, changefreq: 'weekly' },
	{ path: '/docs', priority: 0.8, changefreq: 'daily' },
	{ path: '/blog', priority: 0.8, changefreq: 'daily' },
	{ path: '/status', priority: 0.7, changefreq: 'hourly' },
	{ path: '/about', priority: 0.7, changefreq: 'monthly' },
	{ path: '/contact', priority: 0.6, changefreq: 'yearly' },
	{ path: '/faq', priority: 0.7, changefreq: 'monthly' },

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
	{ path: '/demo', priority: 0.8, changefreq: 'weekly' },
	{ path: '/authors/isaac-emmanuel' },
	{ path: '/authors/teslim-kazeem' },
];

/**
 * Generate sitemap XML
 */
function generateSitemap(routes = ROUTES, siteUrl = PRIMARY_SITE_URL) {
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
		<loc>${siteUrl}${route.path}</loc>${route.lastmod ? `
		<lastmod>${route.lastmod}</lastmod>` : ''}
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

function generateRobotsTxt() {
	const { ROBOTS_TXT } = require('./robots-policy.cjs');
	return ROBOTS_TXT;
}

function writeSitemapBundle(siteUrl, basename) {
	const blogRoutes = readMarkdownRoutes('blog', '/blog');
	const docsRoutes = readDocsRoutes();
	const researchRoutes = readTypedContentRoutes(
		'research.ts',
		'/research',
		'Koreshield research on production AI and LLM security.',
	).filter((route) => RESEARCH_SLUGS.includes(route.path.split('/').at(-1)));
	const careerRoutes = readTypedContentRoutes(
		'careers.ts',
		'/careers',
		'Join Koreshield and help secure production AI systems.',
	).filter((route) => CAREER_SLUGS.includes(route.path.split('/').at(-1)));

	fs.writeFileSync(path.join(publicDir, `${basename}.xml`), generateSitemap(ROUTES, siteUrl), 'utf-8');
	console.log(`[YES] Created: web/public/${basename}.xml`);

	fs.writeFileSync(
		path.join(publicDir, `${basename}-blog.xml`),
		generateSitemap(blogRoutes, siteUrl),
		'utf-8',
	);
	console.log(`[YES] Created: web/public/${basename}-blog.xml`);

	fs.writeFileSync(
		path.join(publicDir, `${basename}-docs.xml`),
		generateSitemap(docsRoutes, siteUrl),
		'utf-8',
	);
	console.log(`[YES] Created: web/public/${basename}-docs.xml`);

	fs.writeFileSync(
		path.join(publicDir, `${basename}-research.xml`),
		generateSitemap(researchRoutes, siteUrl),
		'utf-8',
	);
	console.log(`[YES] Created: web/public/${basename}-research.xml`);

	fs.writeFileSync(
		path.join(publicDir, `${basename}-careers.xml`),
		generateSitemap(careerRoutes, siteUrl),
		'utf-8',
	);
	console.log(`[YES] Created: web/public/${basename}-careers.xml`);

	const manifestRoutes = [...ROUTES, ...blogRoutes, ...docsRoutes, ...researchRoutes, ...careerRoutes]
		.reduce((result, route) => {
			const configured = CORE_METADATA[route.path];
			const contentTitle = route.path.startsWith('/docs/')
				? `${route.title} Documentation | Koreshield`
				: route.title ? `${route.title} | Koreshield` : titleFromPath(route.path);
			result[route.path] = {
				title: configured?.[0] || contentTitle,
				description: configured?.[1] || route.description || 'Koreshield runtime security for production AI applications.',
			};
			return result;
		}, {});
	fs.writeFileSync(
		path.join(publicDir, 'seo-routes.json'),
		`${JSON.stringify({ origin: siteUrl, routes: manifestRoutes }, null, 2)}\n`,
		'utf-8',
	);
	console.log('[YES] Created: web/public/seo-routes.json');

	fs.writeFileSync(path.join(publicDir, `${basename}-index.xml`), writeSitemapIndex(siteUrl, basename), 'utf-8');
	console.log(`[YES] Created: web/public/${basename}-index.xml`);
}

function writeSitemapIndex(siteUrl, basename = 'sitemap') {
	return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<sitemap>
		<loc>${siteUrl}/${basename}.xml</loc>
	</sitemap>
	<sitemap>
		<loc>${siteUrl}/${basename}-blog.xml</loc>
	</sitemap>
	<sitemap>
		<loc>${siteUrl}/${basename}-docs.xml</loc>
	</sitemap>
	<sitemap>
		<loc>${siteUrl}/${basename}-research.xml</loc>
	</sitemap>
	<sitemap>
		<loc>${siteUrl}/${basename}-careers.xml</loc>
	</sitemap>
</sitemapindex>`;
}

function writeSitemaps() {
	writeSitemapBundle(PRIMARY_SITE_URL, 'sitemap');

	const robotsContent = generateRobotsTxt();
	fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf-8');
	console.log('[YES] Created: web/public/robots.txt');

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
