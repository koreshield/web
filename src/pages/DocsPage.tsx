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

	// If no path, show the index page
	if (pathParts.length === 0) {
		return (
			<DocsLayout>
				<DocsIndexPage />
			</DocsLayout>
		);
	}

	// Otherwise show the specific doc page
	return (
		<DocsLayout>
			<DocPage />
		</DocsLayout>
	);
}
