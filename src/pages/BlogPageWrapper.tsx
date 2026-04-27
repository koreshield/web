/**
 * BlogPage - Wrapper component that handles both /blog (listing) and /blog/:slug (post detail)
 */

import { useParams } from 'react-router-dom';
import { BlogListPage } from '../components/BlogListPage';
import { BlogPostPage } from '../components/BlogPostPage';
// Import content to trigger blog initialization
import '../blog/content';

export function BlogPage() {
	const { slug } = useParams<{ slug?: string }>();

	// If there's a slug, show the post page
	if (slug && slug !== '') {
		return <BlogPostPage slug={slug} />;
	}

	// Otherwise, show the blog list page
	return <BlogListPage />;
}

export default BlogPage;
