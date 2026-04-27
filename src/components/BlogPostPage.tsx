/**
 * BlogPostPage - Renders individual blog posts with metadata, related posts, and navigation
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, User, Tag, Folder, Share2 } from 'lucide-react';
import { getBlogPost, getRelatedBlogPosts, toSlug } from '../blog/loader';
import type { BlogPost } from '../blog/loader';
import { Helmet } from 'react-helmet-async';
import { parseMarkdown } from '../utils/markdownParser';

interface BlogPostPageProps {
	slug?: string;
}

export function BlogPostPage({ slug: propSlug }: BlogPostPageProps) {
	const { slug: paramSlug } = useParams<{ slug: string }>();
	const slug = propSlug || paramSlug;
	const post = useMemo<BlogPost | null>(() => (slug ? getBlogPost(slug) : null), [slug]);
	const relatedPosts = useMemo(() => {
		if (!slug || !post) {
			return [];
		}

		return getRelatedBlogPosts(slug, 3);
	}, [post, slug]);
	const parsedContent = useMemo(() => (post ? parseMarkdown(post.content) : ''), [post]);

	if (!post) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Post Not Found</h1>
					<p className="text-gray-600 dark:text-gray-400 mb-8">
						The blog post you're looking for doesn't exist or has been removed.
					</p>
					<Link
						to="/blog"
						className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
					>
						<ChevronLeft size={20} />
						Back to Blog
					</Link>
				</div>
			</div>
		);
	}

	const readTime = post.readingTime || 5;
	const publishDate = new Date(post.date);
	const formattedDate = publishDate.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return (
		<>
			<Helmet>
				<title>{post.title} | KoreShield Blog</title>
				<meta name="description" content={post.excerpt} />
				<meta property="og:title" content={post.title} />
				<meta property="og:description" content={post.excerpt} />
				{post.coverImage && <meta property="og:image" content={post.coverImage} />}
				<meta property="og:type" content="article" />
				<meta property="og:url" content={`https://koreshield.ai${post.path}`} />
				<meta name="author" content={post.author} />
				<link rel="canonical" href={`https://koreshield.ai${post.path}`} />
			</Helmet>

			<div className="min-h-screen bg-white dark:bg-gray-900">
				{/* Header Navigation */}
				<div className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
					<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
						<Link
							to="/blog"
							className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
						>
							<ChevronLeft size={20} />
							<span>Back to Blog</span>
						</Link>
					</div>
				</div>

				{/* Hero / Cover Image */}
				{post.coverImage && (
					<div className="w-full h-96 bg-gray-200 dark:bg-gray-800 overflow-hidden">
						<img
							src={post.coverImage}
							alt={post.title}
							className="w-full h-full object-cover"
							onError={(e) => {
								e.currentTarget.style.display = 'none';
							}}
						/>
					</div>
				)}

				{/* Content */}
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					{/* Header */}
					<header className="mb-12 pb-8 border-b border-gray-200 dark:border-gray-800">
						{/* Categories */}
						<div className="flex flex-wrap gap-2 mb-4">
							{post.categories.map(category => (
								<Link
									key={category}
									to={`/blog?category=${toSlug(category)}`}
									className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
								>
									<Folder size={14} />
									{category}
								</Link>
							))}
						</div>

						{/* Title */}
						<h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
							{post.title}
						</h1>

						{/* Excerpt */}
						<p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
							{post.excerpt}
						</p>

						{/* Metadata */}
						<div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
							<div className="flex items-center gap-2">
								<User size={16} />
								<span>{post.author}</span>
							</div>
							<div className="flex items-center gap-2">
								<Calendar size={16} />
								<time dateTime={post.date}>{formattedDate}</time>
							</div>
							<div className="flex items-center gap-2">
								<Clock size={16} />
								<span>{readTime} min read</span>
							</div>
						</div>
					</header>

					{/* Main Content */}
					<div className="prose prose-lg dark:prose-invert max-w-none mb-12">
						<div dangerouslySetInnerHTML={{ __html: parsedContent }} />
					</div>

					{/* Tags */}
					{post.tags.length > 0 && (
						<div className="mb-12 pb-8 border-t border-b border-gray-200 dark:border-gray-800">
							<div className="flex flex-wrap gap-2">
								{post.tags.map(tag => (
									<Link
										key={tag}
										to={`/blog?tag=${toSlug(tag)}`}
										className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
									>
										<Tag size={16} />
										{tag}
									</Link>
								))}
							</div>
						</div>
					)}

					{/* Author Info */}
					<div className="mb-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
								<User size={24} className="text-white" />
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 dark:text-white">{post.author}</h3>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									KoreShield Security Team
								</p>
							</div>
						</div>
					</div>

					{/* Share */}
					<div className="flex items-center gap-4 mb-12">
						<span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Share:</span>
						<a
							href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://koreshield.ai${post.path}`)}&text=${encodeURIComponent(post.title)}`}
							target="_blank"
							rel="noopener noreferrer"
							className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
							title="Share on Twitter"
						>
							<Share2 size={20} />
						</a>
						<a
							href={`https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://koreshield.ai${post.path}`)}`}
							target="_blank"
							rel="noopener noreferrer"
							className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
							title="Share on LinkedIn"
						>
							<Share2 size={20} />
						</a>
					</div>

					{/* Related Posts */}
					{relatedPosts.length > 0 && (
						<div className="pt-8 border-t border-gray-200 dark:border-gray-800">
							<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
								Related Articles
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{relatedPosts.map(relatedPost => (
									<Link
										key={relatedPost.slug}
										to={relatedPost.path}
										className="group p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all hover:shadow-md"
									>
										<h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
											{relatedPost.title}
										</h3>
										<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
											{relatedPost.excerpt}
										</p>
										<div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
											<Calendar size={14} />
											{new Date(relatedPost.date).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
											})}
										</div>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
}

export default BlogPostPage;
