import { useLocation } from 'react-router-dom';
import { DocsLayout } from '../components/DocsLayout';
import { DocPage } from '../components/DocPage';
import { DocsIndexPage } from './DocsIndexPage';

/**
 * DocsPage - Main documentation portal
 * Handles /docs and all /docs/* sub-paths
 */
export default function DocsPage() {
	const location = useLocation();

	// Extract the doc path from the URL
	const pathParts = location.pathname
		.replace(/^\/docs\/?/, '')
		.split('/')
		.filter(Boolean);

	// Normalize path for doc loading
	const docPath = pathParts.length > 0 ? pathParts.join('/') : null;

	// Categories that have an index.mdx inside them
	const CATEGORIES_WITH_INDEX = new Set([
		'getting-started',
		'client-integration',
		'configuration',
		'api',
		'features',
		'integrations',
		'compliance',
		'case-studies',
		'best-practices',
	]);

	// Top-level standalone files (no subdirectory)
	const STANDALONE_DOCS = new Set(['overview', 'api-reference']);

	// Map documentation URL paths to content file paths
	const getDocFilePath = (path: string | null): string | null => {
		if (!path) return null;

		// Standalone top-level files
		if (STANDALONE_DOCS.has(path)) return path;

		const parts = path.split('/');

		// Multi-segment path: category/page (e.g. "getting-started/quick-start")
		if (parts.length >= 2) {
			// Pass through as-is — the file must exist at this exact path
			return path;
		}

		// Single segment — it's a category root; resolve to its index file
		if (CATEGORIES_WITH_INDEX.has(path)) {
			return `${path}/index`;
		}

		// Fallback: try as-is
		return path;
	};

	const docFilePath = getDocFilePath(docPath);

	return (
		<DocsLayout>
			{docFilePath ? (
				<DocPage docPath={docFilePath} />
			) : (
				<DocsIndexPage />
			)}
		</DocsLayout>
	);
}
