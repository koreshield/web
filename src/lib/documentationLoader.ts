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
					title: 'Integration Guide',
					path: '/docs/client-integration/guide',
					slug: 'client-integration-guide',
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
			children: [
				{
					title: 'Caching',
					path: '/docs/best-practices/caching',
					slug: 'best-practices-caching',
				},
				{
					title: 'Error Handling',
					path: '/docs/best-practices/error-handling',
					slug: 'best-practices-error-handling',
				},
			],
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
			children: [
				{
					title: 'AI Agents',
					path: '/docs/case-studies/ai-agents',
					slug: 'case-studies-ai-agents',
				},
				{
					title: 'Customer Service',
					path: '/docs/case-studies/customer-service',
					slug: 'case-studies-customer-service',
				},
				{
					title: 'Financial Services',
					path: '/docs/case-studies/financial-services',
					slug: 'case-studies-financial-services',
				},
				{
					title: 'Healthcare',
					path: '/docs/case-studies/healthcare',
					slug: 'case-studies-healthcare',
				},
			],
		},
	];
}

/**
 * Re-export content loader functions
 * Direct imports for better performance and reliability
 */

import overviewContent from 'virtual:doc:overview';
import apiReferenceContent from 'virtual:doc:api-reference';

// Client Integration
import clientIntegrationContent from 'virtual:doc:client-integration/index';
import clientIntegrationGuideContent from 'virtual:doc:client-integration/guide';

// Getting Started
import gettingStartedQuickStartContent from 'virtual:doc:getting-started/quick-start';
import gettingStartedInstallationContent from 'virtual:doc:getting-started/installation';

// Configuration
import configurationIndexContent from 'virtual:doc:configuration/index';
import configurationSettingsContent from 'virtual:doc:configuration/settings';
import configurationPoliciesContent from 'virtual:doc:configuration/policies';
import configurationRateLimitingContent from 'virtual:doc:configuration/rate-limiting';
import configurationProductionChecklistContent from 'virtual:doc:configuration/production-checklist';

// API
import apiIndexContent from 'virtual:doc:api/index';
import apiRestContent from 'virtual:doc:api/rest-api';
import apiWebsocketContent from 'virtual:doc:api/websocket';

// Features
import featuresIndexContent from 'virtual:doc:features/index';
import featuresAttackDetectionContent from 'virtual:doc:features/attack-detection';
import featuresMonitoringContent from 'virtual:doc:features/monitoring';
import featuresRagDefenseContent from 'virtual:doc:features/rag-defense';
import featuresSecurityContent from 'virtual:doc:features/security';
import featuresRbacContent from 'virtual:doc:features/rbac';

// Integrations
import integrationsIndexContent from 'virtual:doc:integrations/index';

// Best Practices
import bestPracticesIndexContent from 'virtual:doc:best-practices/index';
import bestPracticesCachingContent from 'virtual:doc:best-practices/caching';
import bestPracticesErrorHandlingContent from 'virtual:doc:best-practices/error-handling';

// Compliance
import complianceIndexContent from 'virtual:doc:compliance/index';
import complianceGdprContent from 'virtual:doc:compliance/gdpr';
import complianceHipaaContent from 'virtual:doc:compliance/hipaa';
import complianceDpaContent from 'virtual:doc:compliance/dpa';

// Case Studies
import caseStudiesIndexContent from 'virtual:doc:case-studies/index';
import caseStudiesAiAgentsContent from 'virtual:doc:case-studies/ai-agents';
import caseStudiesCodeGenerationContent from 'virtual:doc:case-studies/code-generation';
import caseStudiesCustomerServiceContent from 'virtual:doc:case-studies/customer-service';
import caseStudiesEcommerceContent from 'virtual:doc:case-studies/ecommerce';
import caseStudiesFinancialServicesContent from 'virtual:doc:case-studies/financial-services';
import caseStudiesHealthcareContent from 'virtual:doc:case-studies/healthcare';
import caseStudiesLegalTechContent from 'virtual:doc:case-studies/legal-tech';

// Create a map of all documentation content
const docContentMap: Record<string, string> = {
  // Top-level
  'overview': overviewContent,
  'api-reference': apiReferenceContent,

  // Client Integration
  'client-integration': clientIntegrationContent,
  'client-integration/guide': clientIntegrationGuideContent,

  // Getting Started
  'getting-started/quick-start': gettingStartedQuickStartContent,
  'getting-started/installation': gettingStartedInstallationContent,

  // Configuration
  'configuration': configurationIndexContent,
  'configuration/index': configurationIndexContent,
  'configuration/settings': configurationSettingsContent,
  'configuration/policies': configurationPoliciesContent,
  'configuration/rate-limiting': configurationRateLimitingContent,
  'configuration/production-checklist': configurationProductionChecklistContent,

  // API
  'api': apiIndexContent,
  'api/index': apiIndexContent,
  'api/rest-api': apiRestContent,
  'api/websocket': apiWebsocketContent,

  // Features
  'features': featuresIndexContent,
  'features/index': featuresIndexContent,
  'features/attack-detection': featuresAttackDetectionContent,
  'features/monitoring': featuresMonitoringContent,
  'features/rag-defense': featuresRagDefenseContent,
  'features/security': featuresSecurityContent,
  'features/rbac': featuresRbacContent,

  // Integrations
  'integrations': integrationsIndexContent,

  // Best Practices
  'best-practices': bestPracticesIndexContent,
  'best-practices/index': bestPracticesIndexContent,
  'best-practices/caching': bestPracticesCachingContent,
  'best-practices/error-handling': bestPracticesErrorHandlingContent,

  // Compliance
  'compliance': complianceIndexContent,
  'compliance/index': complianceIndexContent,
  'compliance/gdpr': complianceGdprContent,
  'compliance/hipaa': complianceHipaaContent,
  'compliance/dpa': complianceDpaContent,

  // Case Studies
  'case-studies': caseStudiesIndexContent,
  'case-studies/index': caseStudiesIndexContent,
  'case-studies/ai-agents': caseStudiesAiAgentsContent,
  'case-studies/code-generation': caseStudiesCodeGenerationContent,
  'case-studies/customer-service': caseStudiesCustomerServiceContent,
  'case-studies/ecommerce': caseStudiesEcommerceContent,
  'case-studies/financial-services': caseStudiesFinancialServicesContent,
  'case-studies/healthcare': caseStudiesHealthcareContent,
  'case-studies/legal-tech': caseStudiesLegalTechContent,
};

/**
 * Get documentation content by path
 */
export function getDocContent(docPath: string): string | undefined {
  return docContentMap[docPath];
}

/**
 * Check if a documentation path exists
 */
export function docExists(docPath: string): boolean {
  return docPath in docContentMap;
}
