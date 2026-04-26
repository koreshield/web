/**
 * Documentation loader utilities
 */

export interface DocFrontMatter {
	title: string;
	description?: string;
	sidebar_position?: number;
	last_update?: { date: string };
	icon?: string;
}

export interface DocMetadata {
	frontMatter: DocFrontMatter;
	content: string;
	slug: string;
}

export interface DocsNavItem {
	title: string;
	path: string;
	slug: string;
	children?: DocsNavItem[];
	description?: string;
}

/**
 * Parse frontmatter from markdown content
 */
export function parseFrontMatter(content: string): { frontMatter: DocFrontMatter; body: string } {
	const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
	const match = content.match(frontMatterRegex);

	if (!match) {
		return { frontMatter: { title: 'Untitled' }, body: content };
	}

	const frontMatterStr = match[1];
	const body = match[2];

	const frontMatter: DocFrontMatter = { title: 'Untitled' };

	// Simple YAML parser for common fields
	const lines = frontMatterStr.split('\n');
	for (const line of lines) {
		const [key, ...valueParts] = line.split(':');
		const value = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '');

		switch (key.trim().toLowerCase()) {
			case 'title':
				frontMatter.title = value;
				break;
			case 'description':
				frontMatter.description = value;
				break;
			case 'sidebar_position':
				frontMatter.sidebar_position = parseInt(value, 10);
				break;
			case 'icon':
				frontMatter.icon = value;
				break;
		}
	}

	return { frontMatter, body };
}

/**
 * Extract slug from file path
 */
export function getSlugFromPath(filePath: string): string {
	return filePath
		.replace(/^docs\//, '')
		.replace(/\.(md|mdx)$/, '')
		.replace(/\/index$/, '')
		.replace(/\//g, '-');
}

/**
 * Get breadcrumb path from slug
 */
export function getBreadcrumbs(slug: string): Array<{ label: string; path: string }> {
	const parts = slug.split('-');
	const breadcrumbs: Array<{ label: string; path: string }> = [
		{ label: 'Docs', path: '/docs' },
	];

	let currentPath = '/docs';
	for (const part of parts) {
		currentPath += `/${part}`;
		breadcrumbs.push({
			label: part.charAt(0).toUpperCase() + part.slice(1),
			path: currentPath,
		});
	}

	return breadcrumbs;
}

/**
 * Build documentation navigation structure
 */
export function buildDocsNavigation(): DocsNavItem[] {
	return [
		{
			title: 'Overview',
			path: '/docs',
			slug: 'overview',
			description: 'Welcome to KoreShield documentation',
		},
		{
			title: 'Client Integration Guide',
			path: '/docs/client-integration',
			slug: 'client-integration',
			description: 'How to integrate KoreShield into your application',
			children: [
				{
					title: 'Quick Start',
					path: '/docs/client-integration/quick-start',
					slug: 'client-integration-quick-start',
				},
				{
					title: 'Installation',
					path: '/docs/client-integration/installation',
					slug: 'client-integration-installation',
				},
			],
		},
		{
			title: 'Getting Started',
			path: '/docs/getting-started',
			slug: 'getting-started',
			description: 'Get up and running quickly',
			children: [
				{
					title: 'Quick Start',
					path: '/docs/getting-started/quick-start',
					slug: 'getting-started-quick-start',
				},
				{
					title: 'Installation',
					path: '/docs/getting-started/installation',
					slug: 'getting-started-installation',
				},
			],
		},
		{
			title: 'Settings & Policies',
			path: '/docs/configuration',
			slug: 'configuration',
			description: 'Configure policies and settings',
			children: [
				{
					title: 'Settings',
					path: '/docs/configuration/settings',
					slug: 'configuration-settings',
				},
				{
					title: 'Policies',
					path: '/docs/configuration/policies',
					slug: 'configuration-policies',
				},
				{
					title: 'Rate Limiting',
					path: '/docs/configuration/rate-limiting',
					slug: 'configuration-rate-limiting',
				},
				{
					title: 'Production Checklist',
					path: '/docs/configuration/production-checklist',
					slug: 'configuration-production-checklist',
				},
			],
		},
		{
			title: 'API',
			path: '/docs/api',
			slug: 'api',
			description: 'API reference and endpoints',
			children: [
				{
					title: 'REST API',
					path: '/docs/api/rest-api',
					slug: 'api-rest-api',
				},
				{
					title: 'WebSocket',
					path: '/docs/api/websocket',
					slug: 'api-websocket',
				},
			],
		},
		{
			title: 'API Reference',
			path: '/docs/api-reference',
			slug: 'api-reference',
			description: 'Complete API reference',
		},
		{
			title: 'Features',
			path: '/docs/features',
			slug: 'features',
			description: 'Explore KoreShield features',
			children: [
				{
					title: 'Attack Detection',
					path: '/docs/features/attack-detection',
					slug: 'features-attack-detection',
				},
				{
					title: 'Monitoring',
					path: '/docs/features/monitoring',
					slug: 'features-monitoring',
				},
				{
					title: 'RAG Defense',
					path: '/docs/features/rag-defense',
					slug: 'features-rag-defense',
				},
				{
					title: 'Security',
					path: '/docs/features/security',
					slug: 'features-security',
				},
				{
					title: 'RBAC',
					path: '/docs/features/rbac',
					slug: 'features-rbac',
				},
			],
		},
		{
			title: 'Integrations',
			path: '/docs/integrations',
			slug: 'integrations',
			description: 'Integrate with your systems',
		},
		{
			title: 'Best Practices',
			path: '/docs/best-practices',
			slug: 'best-practices',
			description: 'Tips and best practices',
		},
		{
			title: 'Compliance',
			path: '/docs/compliance',
			slug: 'compliance',
			description: 'Compliance and security',
			children: [
				{
					title: 'GDPR',
					path: '/docs/compliance/gdpr',
					slug: 'compliance-gdpr',
				},
				{
					title: 'HIPAA',
					path: '/docs/compliance/hipaa',
					slug: 'compliance-hipaa',
				},
				{
					title: 'DPA',
					path: '/docs/compliance/dpa',
					slug: 'compliance-dpa',
				},
			],
		},
		{
			title: 'Case Studies',
			path: '/docs/case-studies',
			slug: 'case-studies',
			description: 'Real-world implementations',
		},
	];
}
