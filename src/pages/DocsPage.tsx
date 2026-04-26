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

	// Map documentation paths to actual file paths
	const getDocFilePath = (path: string | null): string | null => {
		if (!path) return null;

		// Handle overview path
		if (path === 'overview') return 'overview';

		// Handle nested paths like "getting-started/quick-start"
		const parts = path.split('/');

		// Map category shortcuts to actual paths
		const categoryMap: Record<string, string> = {
			'getting-started': 'getting-started',
			'client-integration': 'client-integration',
			'quick-start': 'getting-started/quick-start',
			'installation': 'getting-started/installation',
			'configuration': 'configuration',
			'api': 'api',
			'features': 'features',
			'integrations': 'integrations',
			'compliance': 'compliance',
			'case-studies': 'case-studies',
			'best-practices': 'best-practices',
		};

		// Check if it's a direct category with a sub-page
		if (parts.length === 2) {
			const category = parts[0];
			const page = parts[1];
			const categoryPath = categoryMap[category] || category;
			return `${categoryPath}/${page}`;
		}

		// Check direct mapping
		if (categoryMap[path]) {
			return categoryMap[path];
		}

		// Return as-is (might be an index file for a category)
		if (categoryMap[parts[0]]) {
			return `${categoryMap[parts[0]]}/index`;
		}

		// Last resort - treat the path as a file path within docs
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
