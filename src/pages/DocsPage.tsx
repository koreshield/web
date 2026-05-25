import { DocsLayout } from '../components/DocsLayout';
import { DocPage } from '../components/DocPage';
import { SEOMeta } from '../components/SEOMeta';

/**
 * DocsPage - Main documentation portal
 * Handles /docs and all /docs/* sub-paths
 */
export default function DocsPage() {
	return (
		<DocsLayout>
			<SEOMeta title="Docs" />
			<DocPage />
		</DocsLayout>
	);
}
