/**
 * BlogListPage - Main blog page with filtering, pagination, and search
 */

import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Calendar, Clock, User, Folder, Tag, ChevronRight, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import {
	listBlogPosts,
	getBlogCategories,
	getBlogTags,
	searchBlogPosts,
	toSlug,
	type BlogPost,
} from '../blog/loader';

export function BlogListPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [posts, setPosts] = useState<BlogPost[]>([]);
	const [categories] = useState(getBlogCategories());
	const [tags] = useState(getBlogTags());
	const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
	const [isSearching, setIsSearching] = useState(false);

	const category = searchParams.get('category');
	const tag = searchParams.get('tag');
	const page = parseInt(searchParams.get('page') || '1');
	const perPage = 10;

	// Fetch posts based on filters
	useEffect(() => {
		if (searchQuery) {
			setIsSearching(true);
			const results = searchBlogPosts(searchQuery);
			setPosts(results);
		} else {
			const filters: Record<string, unknown> = {};
			if (category) filters.category = category;
			if (tag) filters.tag = tag;

			const allPosts = listBlogPosts({
				filters: filters as any,
				sortBy: 'date-desc',
			});
			setPosts(allPosts);
		}
	}, [searchQuery, category, tag]);

	const paginatedPosts = useMemo(() => {
		const start = (page - 1) * perPage;
		return posts.slice(start, start + perPage);
	}, [posts, page]);

	const totalPages = Math.ceil(posts.length / perPage);

	const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			setSearchParams({ q: searchQuery });
		}
	};

	const handleCategoryClick = (cat: string) => {
		setSearchParams({ category: toSlug(cat) });
	};

	const handleTagClick = (t: string) => {
		setSearchParams({ tag: toSlug(t) });
	};

	const clearFilters = () => {
		setSearchQuery('');
		setSearchParams({});
	};

	const isFiltered = !!category || !!tag || isSearching;

	return (
		<>
			<Helmet>
				<title>Blog | KoreShield</title>
				<meta name="description" content="Stay updated with KoreShield blog - Security news, tutorials, and insights." />
				<meta property="og:title" content="Blog | KoreShield" />
				<meta property="og:description" content="Stay updated with KoreShield blog - Security news, tutorials, and insights." />
				<meta property="og:type" content="website" />
				<meta property="og:url" content="https://koreshield.ai/blog" />
			</Helmet>

			{/* Page hero */}
			<div className="border-b border-border pb-12 pt-12">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Blog</p>
					<h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">KoreShield Blog</h1>
					<p className="text-lg text-muted-foreground max-w-2xl">
						Stay informed about AI security, threat intelligence, and KoreShield updates
					</p>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Search and Filters */}
				<div className="mb-12">
					{/* Search Bar */}
					<form onSubmit={handleSearch} className="mb-8">
						<div className="relative">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search blog posts..."
								className="w-full px-6 py-3 pl-12 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
							/>
							<Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
							{searchQuery && (
								<button
									type="button"
									onClick={() => {
										setSearchQuery('');
										setSearchParams({});
									}}
									className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
								>
									✕
								</button>
							)}
						</div>
					</form>

					{/* Categories */}
					<div className="mb-6">
						<h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
							<Folder size={16} />
							Categories
						</h3>
						<div className="flex flex-wrap gap-2">
							{categories.map(cat => (
								<button
									key={cat.slug}
									onClick={() => handleCategoryClick(cat.name)}
									className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
										category === cat.slug
											? 'bg-primary text-primary-foreground'
											: 'bg-card border border-border text-foreground hover:border-primary/30 hover:bg-accent'
									}`}
								>
									{cat.name} ({cat.count})
								</button>
							))}
						</div>
					</div>

					{/* Tags */}
					<div className="mb-6">
						<h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
							<Tag size={16} />
							Popular Tags
						</h3>
						<div className="flex flex-wrap gap-2">
							{tags.slice(0, 12).map(t => (
								<button
									key={t.slug}
									onClick={() => handleTagClick(t.name)}
									className={`px-3 py-1 rounded text-sm transition-colors ${
										tag === t.slug
											? 'bg-primary text-primary-foreground'
											: 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
									}`}
								>
									{t.name}
								</button>
							))}
						</div>
					</div>

					{/* Filter Status and Clear */}
					{isFiltered && (
						<div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
							<span className="text-sm text-foreground">
								{posts.length} post{posts.length !== 1 ? 's' : ''} found
								{searchQuery && ` matching &ldquo;${searchQuery}&rdquo;`}
							</span>
							<button
								onClick={clearFilters}
								className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
							>
								Clear filters
							</button>
						</div>
					)}
				</div>

				{/* Posts Grid */}
				{paginatedPosts.length > 0 ? (
					<>
						<div className="grid grid-cols-1 gap-6 mb-12">
							{paginatedPosts.map(post => (
								<Link
									key={post.slug}
									to={`/blog/${post.slug}`}
									className="group p-6 bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-black/10 transition-all"
								>
									<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
										{/* Cover Image */}
										{post.coverImage && (
											<div className="md:col-span-1">
												<div className="w-full h-32 md:h-full bg-accent rounded overflow-hidden">
													<img
														src={post.coverImage}
														alt={post.title}
														className="w-full h-full object-cover group-hover:scale-105 transition-transform"
														onError={(e) => {
															e.currentTarget.style.display = 'none';
														}}
													/>
												</div>
											</div>
										)}

										{/* Content */}
										<div className={post.coverImage ? 'md:col-span-3' : 'md:col-span-4'}>
											{/* Categories */}
											<div className="flex flex-wrap gap-2 mb-3">
												{post.categories.map(cat => (
													<span
														key={cat}
														className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium"
													>
														{cat}
													</span>
												))}
											</div>

											{/* Title */}
											<h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
												{post.title}
											</h2>

											{/* Excerpt */}
											<p className="text-muted-foreground mb-4 line-clamp-2">
												{post.excerpt}
											</p>

											{/* Metadata */}
											<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
												<div className="flex items-center gap-1">
													<User size={16} />
													<span>{post.author}</span>
												</div>
												<div className="flex items-center gap-1">
													<Calendar size={16} />
													<time dateTime={post.date}>
														{new Date(post.date).toLocaleDateString('en-US', {
															year: 'numeric',
															month: 'short',
															day: 'numeric',
														})}
													</time>
												</div>
												<div className="flex items-center gap-1">
													<Clock size={16} />
													<span>{post.readingTime || 5} min read</span>
												</div>
												<div className="ml-auto flex items-center gap-1 text-primary group-hover:gap-2 transition-all">
													Read
													<ArrowRight size={16} />
												</div>
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex items-center justify-center gap-2 mb-12">
								{page > 1 && (
									<Link
										to={`?page=${page - 1}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}`}
										className="px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:border-primary/30 hover:bg-accent transition-colors"
									>
										Previous
									</Link>
								)}

								{Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
									<Link
										key={p}
										to={`?page=${p}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}`}
										className={`px-4 py-2 rounded-lg transition-colors ${
											p === page
												? 'bg-primary text-primary-foreground'
												: 'bg-card border border-border text-foreground hover:border-primary/30 hover:bg-accent'
										}`}
									>
										{p}
									</Link>
								))}

								{page < totalPages && (
									<Link
										to={`?page=${page + 1}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}`}
										className="px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:border-primary/30 hover:bg-accent transition-colors"
									>
										Next
									</Link>
								)}
							</div>
						)}
					</>
				) : (
					<div className="text-center py-12">
						<Search className="mx-auto text-muted-foreground mb-4" size={48} />
						<h2 className="text-2xl font-bold text-foreground mb-2">
							No posts found
						</h2>
						<p className="text-muted-foreground mb-6">
							{isSearching
								? "Try adjusting your search terms"
								: "Try selecting different filters or search terms"}
						</p>
						<button
							onClick={clearFilters}
							className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
						>
							<ChevronRight size={20} />
							Clear All Filters
						</button>
					</div>
				)}
			</div>
		</>
	);
}
