/**
 * BlogPage - Wrapper component that handles both /blog (listing) and /blog/:slug (post detail)
 */

import { useParams } from 'react-router-dom';
import { BlogListPage } from '../components/BlogListPage';
import { BlogPostPage } from '../components/BlogPostPage';

export function BlogPage() {
	const { slug } = useParams<{ slug?: string }>();
	const paths = slug?.split('/').filter(Boolean);
	const postSlug = paths?.[0];

	// If there's a slug, show the post page
	if (postSlug && postSlug !== '') {
		return <BlogPostPage slug={postSlug} />;
	}

	// Otherwise, show the blog list page
	return <BlogListPage />;
}

export default BlogPage;
