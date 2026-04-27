type RawDocModules = Record<string, string>;
type RawMetaModules = Record<string, CategoryMeta>;

const DOCS_ROOT = '../content/docs/';

const rawDocModules = import.meta.glob(
	'../content/docs/**/*.{md,mdx}',
	{ eager: true, query: '?raw', import: 'default' }
) as RawDocModules;

const rawMetaModules = import.meta.glob(
	'../content/docs/**/{meta.json,_category_.json}',
	{ eager: true, import: 'default' }
) as RawMetaModules;

interface CategoryMeta {
	label?: string;
	position?: number;
	collapsed?: boolean;
	pages?: string[];
	link?: {
		type?: string;
		id?: string;
	};
}

interface Frontmatter {
	title?: string;
	description?: string;
	icon?: string;
	slug?: string;
	published?: boolean;
	sidebar_label?: string;
	sidebar_position?: number;
	last_update?: {
		date?: string | Date;
	};
}

interface DocFile {
	fragment: string;
	path: string;
	sourcePath: string;
	dir: string;
	title: string;
	sidebarLabel?: string;
	description: string;
	content: string;
	icon?: string;
	lastUpdated?: string;
	order?: number;
	isIndex: boolean;
	basename: string;
}

interface DirectoryNode {
	fragment: string;
	segment: string;
	path: string;
	meta?: CategoryMeta;
	indexDoc?: DocFile;
	docs: DocFile[];
	children: DirectoryNode[];
}

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

const docFiles = buildDocFiles();
const directories = buildDirectoryTree(docFiles);
const docsByPath = new Map(docFiles.map((doc) => [doc.path, doc]));
const directoriesByPath = new Map<string, DirectoryNode>();

indexDirectories(directoriesByPath, directories.root);

function normalizeModulePath(modulePath: string): string {
	return modulePath.replace(DOCS_ROOT, '');
}

function stripExtension(path: string): string {
	return path.replace(/\.(md|mdx)$/i, '');
}

function stripLeadingOrderPrefix(value: string): string {
	return value.replace(/^\d+[-_]/, '');
}

function toRouteFragment(relativePath: string): string {
	const withoutExtension = stripExtension(relativePath);

	if (withoutExtension === 'overview') {
		return '';
	}

	if (withoutExtension.endsWith('/index')) {
		return withoutExtension.replace(/\/index$/, '');
	}

	return withoutExtension;
}

function slugToRouteFragment(slug?: string): string | null {
	if (!slug) {
		return null;
	}

	const normalized = slug.trim().replace(/^\/+|\/+$/g, '');
	return normalized;
}

function toRoutePath(fragment: string): string {
	return fragment ? `/docs/${fragment}` : '/docs';
}

function titleFromFragment(fragment: string): string {
	const leaf = stripLeadingOrderPrefix(fragment.split('/').filter(Boolean).at(-1) ?? 'documentation');
	return leaf
		.split(/[-_]/g)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function categoryTitleFromFragment(fragment: string): string {
	return titleFromFragment(fragment) || 'Documentation';
}

function pageIdForDoc(doc: DocFile): string {
	return doc.isIndex ? 'index' : doc.basename;
}

function getMetaPageOrder(node: DirectoryNode, pageId: string): number | undefined {
	if (!node.meta?.pages) {
		return undefined;
	}
	const index = node.meta.pages.findIndex((entry) => {
		const normalized = entry
			.replace(/^---.*---$/, '')
			.replace(/\.(md|mdx)$/i, '')
			.trim();
		return normalized === pageId;
	});
	return index >= 0 ? index : undefined;
}

function stripWrappingQuotes(value: string): string {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

function parseFrontmatterValue(rawValue: string): string | number | boolean {
	const trimmed = stripWrappingQuotes(rawValue.trim());

	if (trimmed === 'true') {
		return true;
	}

	if (trimmed === 'false') {
		return false;
	}

	if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
		return Number(trimmed);
	}

	return trimmed;
}

function parseFrontmatter(rawContent: string): { data: Frontmatter; content: string } {
	const normalized = rawContent.replace(/\r\n/g, '\n');
	if (!normalized.startsWith('---\n')) {
		return { data: {}, content: normalized.trim() };
	}

	const closingMarkerIndex = normalized.indexOf('\n---\n', 4);
	if (closingMarkerIndex === -1) {
		return { data: {}, content: normalized.trim() };
	}

	const frontmatterBlock = normalized.slice(4, closingMarkerIndex);
	const content = normalized.slice(closingMarkerIndex + 5).trim();
	const data: Frontmatter = {};
	let activeObjectKey: keyof Frontmatter | null = null;

	for (const line of frontmatterBlock.split('\n')) {
		if (!line.trim() || line.trim().startsWith('#')) {
			continue;
		}

		const isNestedLine = /^\s+/.test(line);
		const separatorIndex = line.indexOf(':');
		if (separatorIndex === -1) {
			continue;
		}

		const key = line.slice(0, separatorIndex).trim();
		const rawValue = line.slice(separatorIndex + 1);

		if (isNestedLine) {
			if (!activeObjectKey) {
				continue;
			}

			const parent = data[activeObjectKey];
			if (parent && typeof parent === 'object') {
				(parent as Record<string, string | number | boolean>)[key] = parseFrontmatterValue(rawValue);
			}
			continue;
		}

		activeObjectKey = null;
		if (!rawValue.trim()) {
			activeObjectKey = key as keyof Frontmatter;
			(data as Record<string, unknown>)[key] = {};
			continue;
		}

		(data as Record<string, unknown>)[key] = parseFrontmatterValue(rawValue);
	}

	return { data, content };
}

function buildDocFiles(): DocFile[] {
	return Object.entries(rawDocModules)
		.map(([modulePath, rawContent]) => {
			const relativePath = normalizeModulePath(modulePath);
			const { data, content } = parseFrontmatter(rawContent);
			const frontmatter = data as Frontmatter;
			const fragment = slugToRouteFragment(frontmatter.slug) ?? toRouteFragment(relativePath);
			const dir = fragment.includes('/') ? fragment.split('/').slice(0, -1).join('/') : '';
			const basename = stripLeadingOrderPrefix(fragment.split('/').filter(Boolean).at(-1) ?? 'overview');
			const isIndex = relativePath === 'overview.mdx' || stripExtension(relativePath).endsWith('/index');
			const lastUpdated = frontmatter.last_update?.date;

			return {
				fragment,
				path: toRoutePath(fragment),
				sourcePath: relativePath,
				dir,
				title: frontmatter.title?.trim() || titleFromFragment(fragment),
				sidebarLabel: frontmatter.sidebar_label?.trim(),
				description: frontmatter.description?.trim() || '',
				content: content.trim(),
				icon: frontmatter.icon,
				lastUpdated: lastUpdated instanceof Date ? lastUpdated.toISOString().slice(0, 10) : lastUpdated,
				order: frontmatter.sidebar_position,
				isIndex,
				basename,
			};
		})
		.filter((doc) => doc.path === '/docs' || doc.content || doc.title)
		.sort((a, b) => a.path.localeCompare(b.path));
}

function directoryFragmentFromMetaPath(modulePath: string): string {
	const relativePath = normalizeModulePath(modulePath);
	const segments = relativePath.split('/');
	segments.pop();
	return segments.join('/');
}

function buildDirectoryTree(docs: DocFile[]) {
	const root: DirectoryNode = {
		fragment: '',
		segment: '',
		path: '/docs',
		meta: undefined,
		docs: [],
		children: [],
	};

	const dirMap = new Map<string, DirectoryNode>([['', root]]);

	const ensureNode = (fragment: string): DirectoryNode => {
		if (dirMap.has(fragment)) {
			return dirMap.get(fragment)!;
		}

		const segments = fragment.split('/').filter(Boolean);
		const parentFragment = segments.slice(0, -1).join('/');
		const parent = ensureNode(parentFragment);
		const node: DirectoryNode = {
			fragment,
			segment: stripLeadingOrderPrefix(segments.at(-1) ?? ''),
			path: toRoutePath(fragment),
			meta: undefined,
			docs: [],
			children: [],
		};

		parent.children.push(node);
		dirMap.set(fragment, node);
		return node;
	};

	for (const [modulePath, meta] of Object.entries(rawMetaModules)) {
		const fragment = directoryFragmentFromMetaPath(modulePath);
		const node = ensureNode(fragment);
		node.meta = meta;
	}

	for (const doc of docs) {
		const node = ensureNode(doc.dir);
		if (doc.isIndex && doc.fragment === doc.dir) {
			node.indexDoc = doc;
		} else if (doc.fragment === '' && doc.sourcePath === 'overview.mdx') {
			root.indexDoc = doc;
		} else {
			node.docs.push(doc);
		}
	}

	const sortNode = (node: DirectoryNode) => {
		node.children.sort((a, b) => compareEntries(node, a, b));
		node.docs.sort((a, b) => compareDocs(node, a, b));
		node.children.forEach(sortNode);
	};

	sortNode(root);

	return { root, map: dirMap };
}

function compareEntries(parent: DirectoryNode, a: DirectoryNode, b: DirectoryNode): number {
	const aOrder =
		getMetaPageOrder(parent, a.segment) ?? a.meta?.position ?? a.indexDoc?.order ?? Number.MAX_SAFE_INTEGER;
	const bOrder =
		getMetaPageOrder(parent, b.segment) ?? b.meta?.position ?? b.indexDoc?.order ?? Number.MAX_SAFE_INTEGER;
	if (aOrder !== bOrder) {
		return aOrder - bOrder;
	}
	return getNodeTitle(a).localeCompare(getNodeTitle(b));
}

function compareDocs(parent: DirectoryNode, a: DocFile, b: DocFile): number {
	const aOrder = getMetaPageOrder(parent, pageIdForDoc(a)) ?? a.order ?? Number.MAX_SAFE_INTEGER;
	const bOrder = getMetaPageOrder(parent, pageIdForDoc(b)) ?? b.order ?? Number.MAX_SAFE_INTEGER;
	if (aOrder !== bOrder) {
		return aOrder - bOrder;
	}
	return a.title.localeCompare(b.title);
}

function getNodeTitle(node: DirectoryNode): string {
	return node.meta?.label || node.indexDoc?.sidebarLabel || node.indexDoc?.title || categoryTitleFromFragment(node.fragment);
}

function getNodeDescription(node: DirectoryNode): string {
	return node.indexDoc?.description || '';
}

function indexDirectories(map: Map<string, DirectoryNode>, node: DirectoryNode) {
	map.set(node.path, node);
	node.children.forEach((child) => indexDirectories(map, child));
}

function dedupeByPath<T extends { path: string }>(items: T[]): T[] {
	const seen = new Set<string>();
	return items.filter((item) => {
		if (seen.has(item.path)) {
			return false;
		}
		seen.add(item.path);
		return true;
	});
}

function buildNavItems(node: DirectoryNode): NavItem[] {
	const childSections = node.children.map((child) => ({
		title: getNodeTitle(child),
		path: child.path,
		description: getNodeDescription(child),
		order: child.meta?.position,
		children: buildNavItems(child),
	}));

	const childDocs = node.docs.map((doc) => ({
		title: doc.sidebarLabel || doc.title,
		path: doc.path,
		description: doc.description,
		order: getMetaPageOrder(node, pageIdForDoc(doc)) ?? doc.order,
	}));

	return dedupeByPath([...childSections, ...childDocs]);
}

function getChildLinks(node: DirectoryNode): DocLink[] {
	return buildNavItems(node).map(({ title, path, description }) => ({
		title,
		path,
		description,
	}));
}

function flattenNavigation(items: NavItem[], category = 'Documentation'): SearchItem[] {
	return items.flatMap((item) => {
		const entry: SearchItem = {
			title: item.title,
			path: item.path,
			content: item.description || item.title,
			description: item.description,
			category,
		};
		const nextCategory = item.title;
		return [entry, ...(item.children ? flattenNavigation(item.children, nextCategory) : [])];
	});
}

export function buildDocsNavigation(): NavItem[] {
	return buildNavItems(directories.root);
}

export function getDocPageByRoute(routePath: string): DocPageData | null {
	const doc = docsByPath.get(routePath);
	if (doc) {
		const node = directoriesByPath.get(doc.isIndex ? doc.path : toRoutePath(doc.dir));
		return {
			title: doc.title,
			description: doc.description,
			content: doc.content,
			path: doc.path,
			icon: doc.icon,
			lastUpdated: doc.lastUpdated,
			childLinks: node ? getChildLinks(node) : [],
		};
	}

	const node = directoriesByPath.get(routePath);
	if (!node) {
		return null;
	}

	return {
		title: getNodeTitle(node),
		description: getNodeDescription(node),
		content: node.indexDoc?.content || '',
		path: node.path,
		icon: node.indexDoc?.icon,
		lastUpdated: node.indexDoc?.lastUpdated,
		childLinks: getChildLinks(node),
	};
}

export function getDocsLandingPage(): DocPageData | null {
	return getDocPageByRoute('/docs');
}

export function isSectionIndexRoute(routePath: string): boolean {
	const doc = docsByPath.get(routePath);
	if (doc?.isIndex && doc.sourcePath !== 'overview.mdx') {
		return true;
	}

	const directory = directoriesByPath.get(routePath);
	return Boolean(directory?.indexDoc && directory.indexDoc.path === routePath);
}

export function getDocBreadcrumbs(routePath: string): BreadcrumbItem[] {
	if (routePath === '/docs') {
		return [{ title: 'Docs', path: '/docs' }];
	}

	const crumbs: BreadcrumbItem[] = [{ title: 'Docs', path: '/docs' }];
	const segments = routePath.replace(/^\/docs\/?/, '').split('/').filter(Boolean);
	let currentPath = '/docs';

	for (const segment of segments) {
		currentPath = `${currentPath}/${segment}`;
		const doc = docsByPath.get(currentPath);
		const directory = directoriesByPath.get(currentPath);
		const title = doc?.title || (directory ? getNodeTitle(directory) : titleFromFragment(segment));
		crumbs.push({ title, path: currentPath });
	}

	return crumbs;
}

export function buildDocsSearchIndex(): SearchItem[] {
	const docs = docFiles.map((doc) => ({
		title: doc.title,
		path: doc.path,
		content: doc.content,
		description: doc.description,
		category: doc.dir ? categoryTitleFromFragment(doc.dir.split('/')[0] ?? 'Documentation') : 'Documentation',
	}));

	return dedupeByPath([
		{
			title: 'Documentation',
			path: '/docs',
			content: directories.root.indexDoc?.content || 'KoreShield documentation overview',
			description: directories.root.indexDoc?.description,
			category: 'Documentation',
		},
		...docs,
		...flattenNavigation(buildDocsNavigation()),
	]);
}
