/**
 * BlogPostPage - Renders individual blog posts with metadata, related posts, and navigation
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, User, Tag, Folder, Twitter, Linkedin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPost, getRelatedBlogPosts, toSlug } from '../blog/loader';
import type { BlogPost } from '../blog/loader';
import { Helmet } from 'react-helmet-async';
import { CodeBlock } from './CodeBlock';

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
	// Strip leading h1 — BlogPostPage renders the title in <header> already
	const strippedContent = useMemo(() => (post ? post.content.replace(/^\s*#\s+[^\n]+\n+/, '') : ''), [post]);

	if (!post) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<div className="text-center">
					<h1 className="text-4xl font-bold text-foreground mb-4">Post Not Found</h1>
					<p className="text-muted-foreground mb-8">
						The blog post you&apos;re looking for doesn&apos;t exist or has been removed.
					</p>
					<Link
						to="/blog"
						className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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

			{/* Back link */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
				<Link
					to="/blog"
					className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
				>
					<ChevronLeft size={18} />
					<span>Back to Blog</span>
				</Link>
			</div>

			{/* Hero / Cover Image */}
			{post.coverImage && (
				<div className="w-full h-80 bg-accent overflow-hidden mt-6">
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
				<header className="mb-12 pb-8 border-b border-border">
					{/* Categories */}
					<div className="flex flex-wrap gap-2 mb-4">
						{post.categories.map(category => (
							<Link
								key={category}
								to={`/blog?category=${toSlug(category)}`}
								className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
							>
								<Folder size={14} />
								{category}
							</Link>
						))}
					</div>

					{/* Title */}
					<h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
						{post.title}
					</h1>

					{/* Excerpt */}
					<p className="text-xl text-muted-foreground mb-6">
						{post.excerpt}
					</p>

					{/* Metadata */}
					<div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
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
				<article className="prose dark:prose-invert max-w-none prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none mb-12">
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							pre: ({ children }) => <>{children}</>,
							code: ({ className, children }) => {
								const match = /language-(\w+)/.exec(className || '');
								const code = String(children).replace(/\n$/, '');
								if (match) {
									return <CodeBlock language={match[1]} code={code} />;
								}
								return (
									<code className="bg-[hsl(var(--accent))] text-[hsl(var(--primary))] px-2 py-0.5 rounded text-sm font-mono">
										{children}
									</code>
								);
							},
							a: ({ href = '', children }) => {
								const external = href.startsWith('http://') || href.startsWith('https://');
								return (
									<a
										href={href}
										target={external ? '_blank' : undefined}
										rel={external ? 'noreferrer' : undefined}
									>
										{children}
									</a>
								);
							},
						}}
					>
						{strippedContent}
					</ReactMarkdown>
				</article>

				{/* Tags */}
				{post.tags.length > 0 && (
					<div className="mb-12 pb-8 border-t border-b border-border py-6">
						<div className="flex flex-wrap gap-2">
							{post.tags.map(tag => (
								<Link
									key={tag}
									to={`/blog?tag=${toSlug(tag)}`}
									className="inline-flex items-center gap-2 px-3 py-2 bg-card border border-border text-muted-foreground rounded-lg hover:text-foreground hover:border-primary/30 hover:bg-accent transition-colors"
								>
									<Tag size={16} />
									{tag}
								</Link>
							))}
						</div>
					</div>
				)}

				{/* Author Info */}
				<div className="mb-12 p-6 bg-card rounded-xl border border-border">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-gradient-to-br from-primary/40 to-primary rounded-full flex items-center justify-center flex-shrink-0">
							<User size={24} className="text-primary-foreground" />
						</div>
						<div>
							<h3 className="font-semibold text-foreground">{post.author}</h3>
							<p className="text-sm text-muted-foreground">
								KoreShield Security Team
							</p>
						</div>
					</div>
				</div>

				{/* Share */}
				<div className="flex items-center gap-4 mb-12">
					<span className="text-sm font-semibold text-foreground">Share:</span>
					<a
						href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://koreshield.ai${post.path}`)}&text=${encodeURIComponent(post.title)}`}
						target="_blank"
						rel="noopener noreferrer"
						className="p-2 text-muted-foreground hover:text-primary transition-colors"
						title="Share on X / Twitter"
					>
						<Twitter size={20} />
					</a>
					<a
						href={`https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://koreshield.ai${post.path}`)}`}
						target="_blank"
						rel="noopener noreferrer"
						className="p-2 text-muted-foreground hover:text-primary transition-colors"
						title="Share on LinkedIn"
					>
						<Linkedin size={20} />
					</a>
				</div>

				{/* Related Posts */}
				{relatedPosts.length > 0 && (
					<div className="pt-8 border-t border-border">
						<h2 className="text-2xl font-bold text-foreground mb-6">
							Related Articles
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{relatedPosts.map(relatedPost => (
								<Link
									key={relatedPost.slug}
									to={relatedPost.path}
									className="group p-5 bg-card rounded-xl border border-border hover:border-primary/40 transition-all hover:shadow-md hover:shadow-black/10"
								>
									<h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
										{relatedPost.title}
									</h3>
									<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
										{relatedPost.excerpt}
									</p>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
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
		</>
	);
}

export default BlogPostPage;
