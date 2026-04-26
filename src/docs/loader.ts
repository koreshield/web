/**
 * Simple documentation utilities
 * No complex parsing or virtual modules - just TypeScript
 */

import { docsConfig } from './content';

export interface NavItem {
	title: string;
	path: string;
	children?: NavItem[];
	description?: string;
}

/**
 * Build navigation structure from docs config
 */
export function buildDocsNavigation(): NavItem[] {
	return Object.entries(docsConfig)
		.sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
		.map(([key, section]) => ({
			title: section.title,
			path: `/docs/${key}`,
			description: section.description,
			children: Object.keys(section.docs).map(docKey => ({
				title: section.docs[docKey].title,
				path: `/docs/${key}/${docKey}`,
			})),
		}));
}

/**
 * Get documentation content by path
 */
export function getDocByPath(section: string, doc: string) {
	const sectionConfig = docsConfig[section];
	if (!sectionConfig) return null;
	return sectionConfig.docs[doc] || null;
}

/**
 * Check if doc exists
 */
export function docExists(section: string, doc: string): boolean {
	return !!getDocByPath(section, doc);
}

/**
 * Get all section titles
 */
export function getAllSections() {
	return Object.keys(docsConfig).sort(
		(a, b) => (docsConfig[a].order || 0) - (docsConfig[b].order || 0)
	);
}
