import { DocsLayout } from '../components/DocsLayout';
import { DocPage } from '../components/DocPage';

/**
 * DocsPage - Main documentation portal
 * Handles /docs and all /docs/* sub-paths
 */
export default function DocsPage() {
	return (
		<DocsLayout>
			<DocPage />
		</DocsLayout>
	);
}
