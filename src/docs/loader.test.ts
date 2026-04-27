import { describe, expect, it } from 'vitest';
import {
	buildDocsNavigation,
	buildDocsSearchIndex,
	getDocBreadcrumbs,
	getDocPageByRoute,
	getDocsLandingPage,
	isSectionIndexRoute,
} from './loader';

function flattenNavPaths(items: ReturnType<typeof buildDocsNavigation>): string[] {
	return items.flatMap((item) => [item.path, ...(item.children ? flattenNavPaths(item.children) : [])]);
}

function normalizeDocHref(currentPath: string, href: string): string {
	if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
		return href;
	}

	if (href.startsWith('/')) {
		return href.replace(/\.(md|mdx)$/i, '');
	}

	const cleaned = href.replace(/\.(md|mdx)$/i, '');
	const baseSegments = currentPath.replace(/^\/docs\/?/, '').split('/').filter(Boolean);
	if (!isSectionIndexRoute(currentPath)) {
		baseSegments.pop();
	}

	for (const segment of cleaned.split('/')) {
		if (!segment || segment === '.') continue;
		if (segment === '..') {
			baseSegments.pop();
			continue;
		}
		baseSegments.push(segment);
	}

	return `/docs/${baseSegments.join('/')}`.replace(/\/+/g, '/');
}

describe('docs loader', () => {
	it('loads the docs landing page from copied content', () => {
		const landingPage = getDocsLandingPage();
		expect(landingPage).not.toBeNull();
		expect(landingPage?.path).toBe('/docs');
		expect(landingPage?.title).toBeTruthy();
	});

	it('auto-discovers public sections for navigation', () => {
		const navigation = buildDocsNavigation();
		expect(navigation.length).toBeGreaterThan(0);
		expect(navigation.some((item) => item.path === '/docs/features')).toBe(true);
		expect(navigation.some((item) => item.path === '/docs/integrations')).toBe(true);
	});

	it('resolves nested doc pages by route path', () => {
		const page = getDocPageByRoute('/docs/integrations/frameworks/react-nextjs');
		expect(page).not.toBeNull();
		expect(page?.title).toBeTruthy();
		expect(page?.content.length).toBeGreaterThan(0);
	});

	it('builds breadcrumbs from the content tree', () => {
		const breadcrumbs = getDocBreadcrumbs('/docs/integrations/frameworks/react-nextjs');
		expect(breadcrumbs[0]?.path).toBe('/docs');
		expect(breadcrumbs.length).toBeGreaterThan(1);
	});

	it('indexes docs content for search', () => {
		const searchIndex = buildDocsSearchIndex();
		expect(searchIndex.length).toBeGreaterThan(20);
		expect(searchIndex.some((item) => item.path === '/docs')).toBe(true);
	});

	it('resolves every generated documentation route', () => {
		const paths = new Set<string>(['/docs', ...flattenNavPaths(buildDocsNavigation())]);
		for (const path of paths) {
			expect(getDocPageByRoute(path), `expected docs route ${path} to resolve`).not.toBeNull();
		}
	});

	it('keeps internal documentation links pointing at resolvable pages', () => {
		const pages = buildDocsSearchIndex()
			.filter((item) => item.path.startsWith('/docs'))
			.map((item) => item.path)
			.filter((value, index, array) => array.indexOf(value) === index)
			.map((path) => getDocPageByRoute(path))
			.filter((page): page is NonNullable<ReturnType<typeof getDocPageByRoute>> => Boolean(page));

		const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

		for (const page of pages) {
			for (const match of page.content.matchAll(markdownLinkPattern)) {
				const href = match[1];
				if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#') || href.startsWith('mailto:')) {
					continue;
				}

				const normalized = normalizeDocHref(page.path, href);
				expect(
					getDocPageByRoute(normalized),
					`expected link ${href} on ${page.path} to resolve as ${normalized}`
				).not.toBeNull();
			}
		}
	});
});
