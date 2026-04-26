import { docsConfig, type DocEntry } from './content';

export interface NavItem {
	title: string;
	path: string;
	children?: NavItem[];
	description?: string;
	order?: number;
}

export interface DocLink {
	title: string;
	path: string;
	description?: string;
}

export interface DocPageData {
	title: string;
	description: string;
	content: string;
	path: string;
	icon?: string;
	lastUpdated?: string;
	childLinks: DocLink[];
}

export interface BreadcrumbItem {
	title: string;
	path: string;
}

export interface SearchItem {
	title: string;
	path: string;
	content: string;
	category: string;
	tags?: string[];
	description?: string;
}

// Build a map of paths to documents for quick lookup
function buildDocPathMap(): Map<string, { section: string; docKey: string; entry: DocEntry }> {
	const map = new Map<string, { section: string; docKey: string; entry: DocEntry }>();

	for (const [sectionKey, section] of Object.entries(docsConfig)) {
		for (const [docKey, entry] of Object.entries(section.docs)) {
			const path = docKey === 'index' ? `/docs/${sectionKey}` : `/docs/${sectionKey}/${docKey}`;
			map.set(path, { section: sectionKey, docKey, entry });
		}
	}

	return map;
}

const docPathMap = buildDocPathMap();

// Build navigation structure
function buildNavigation(): NavItem[] {
	return Object.entries(docsConfig)
		.sort(([, a], [, b]) => (a.order || Number.MAX_SAFE_INTEGER) - (b.order || Number.MAX_SAFE_INTEGER))
		.map(([sectionKey, section]) => {
			const children: NavItem[] = Object.entries(section.docs)
				.sort(([, a], [, b]) => (a.order || Number.MAX_SAFE_INTEGER) - (b.order || Number.MAX_SAFE_INTEGER))
				.filter(([docKey]) => docKey !== 'index')
				.map(([docKey, entry]) => ({
					title: entry.title,
					path: `/docs/${sectionKey}/${docKey}`,
					description: entry.description,
				}));

			return {
				title: section.title,
				path: `/docs/${sectionKey}`,
				description: section.description,
				children: children.length > 0 ? children : undefined,
				order: section.order,
			};
		});
}

export function buildDocsNavigation(): NavItem[] {
	return buildNavigation();
}

export function getDocPageByRoute(routePath: string): DocPageData | null {
	// Normalize the route path
	const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;

	// Handle root docs path
	if (normalizedPath === '/docs' || normalizedPath === '/docs/') {
		const firstSection = Object.entries(docsConfig)[0];
		if (firstSection) {
			const [sectionKey, section] = firstSection;
			const indexDoc = section.docs['index'];
			if (indexDoc) {
				return {
					title: indexDoc.title,
					description: indexDoc.description || section.description || '',
					content: indexDoc.content,
					path: `/docs/${sectionKey}`,
					childLinks: buildChildLinks(sectionKey),
				};
			}
		}
		// Fallback to generic documentation landing page
		return {
			title: 'Documentation',
			description: 'KoreShield API Documentation',
			content: '# Welcome to KoreShield Documentation\n\nExplore guides, API references, and examples.',
			path: '/docs',
			childLinks: buildNavigation().map(nav => ({
				title: nav.title,
				path: nav.path,
				description: nav.description,
			})),
		};
	}

	// Look up the document
	const docData = docPathMap.get(normalizedPath);
	if (!docData) {
		return null;
	}

	const { section: sectionKey, entry } = docData;

	return {
		title: entry.title,
		description: entry.description || '',
		content: entry.content,
		path: normalizedPath,
		childLinks: buildChildLinks(sectionKey),
	};
}

function buildChildLinks(sectionKey: string): DocLink[] {
	const section = docsConfig[sectionKey];
	if (!section) {
		return [];
	}

	return Object.entries(section.docs)
		.sort(([, a], [, b]) => (a.order || Number.MAX_SAFE_INTEGER) - (b.order || Number.MAX_SAFE_INTEGER))
		.filter(([docKey]) => docKey !== 'index')
		.map(([docKey, entry]) => ({
			title: entry.title,
			path: `/docs/${sectionKey}/${docKey}`,
			description: entry.description,
		}));
}

export function getDocsLandingPage(): DocPageData | null {
	return getDocPageByRoute('/docs');
}

export function getDocBreadcrumbs(routePath: string): BreadcrumbItem[] {
	const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;

	if (normalizedPath === '/docs' || normalizedPath === '/docs/') {
		return [{ title: 'Docs', path: '/docs' }];
	}

	const crumbs: BreadcrumbItem[] = [{ title: 'Docs', path: '/docs' }];
	const docData = docPathMap.get(normalizedPath);

	if (docData) {
		const { section: sectionKey, docKey, entry } = docData;
		const section = docsConfig[sectionKey];

		if (section) {
			crumbs.push({
				title: section.title,
				path: `/docs/${sectionKey}`,
			});

			if (docKey !== 'index') {
				crumbs.push({
					title: entry.title,
					path: normalizedPath,
				});
			}
		}
	}

	return crumbs;
}

export function buildDocsSearchIndex(): SearchItem[] {
	const items: SearchItem[] = [];

	// Add documentation root
	items.push({
		title: 'Documentation',
		path: '/docs',
		content: 'KoreShield API Documentation',
		category: 'Documentation',
	});

	// Add all documents
	for (const [sectionKey, section] of Object.entries(docsConfig)) {
		// Add section landing page
		items.push({
			title: section.title,
			path: `/docs/${sectionKey}`,
			content: section.description || section.title,
			category: 'Documentation',
			description: section.description,
		});

		// Add documents in section
		for (const [docKey, entry] of Object.entries(section.docs)) {
			if (docKey !== 'index') {
				items.push({
					title: entry.title,
					path: `/docs/${sectionKey}/${docKey}`,
					content: entry.content,
					category: section.title,
					description: entry.description,
				});
			}
		}
	}

	return items;
}
