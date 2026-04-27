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

			<div className="min-h-screen bg-white dark:bg-gray-900">
				{/* Header */}
				<div className="bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-900 dark:to-emerald-800 text-white">
					<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
						<h1 className="text-4xl sm:text-5xl font-bold mb-4">KoreShield Blog</h1>
						<p className="text-lg text-emerald-100 max-w-2xl">
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
									className="w-full px-6 py-3 pl-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
								/>
								<Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
								{searchQuery && (
									<button
										type="button"
										onClick={() => {
											setSearchQuery('');
											setSearchParams({});
										}}
										className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
									>
										✕
									</button>
								)}
							</div>
						</form>

						{/* Categories */}
						<div className="mb-6">
							<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
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
												? 'bg-emerald-600 text-white'
												: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
										}`}
									>
										{cat.name} ({cat.count})
									</button>
								))}
							</div>
						</div>

						{/* Tags */}
						<div className="mb-6">
							<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
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
												? 'bg-emerald-600 text-white'
												: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
										}`}
									>
										{t.name}
									</button>
								))}
							</div>
						</div>

						{/* Filter Status and Clear */}
						{isFiltered && (
							<div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
								<span className="text-sm text-blue-900 dark:text-blue-200">
									{posts.length} post{posts.length !== 1 ? 's' : ''} found
									{searchQuery && ` matching "${searchQuery}"`}
								</span>
								<button
									onClick={clearFilters}
									className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
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
										className="group p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-all"
									>
										<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
											{/* Cover Image */}
											{post.coverImage && (
												<div className="md:col-span-1">
													<div className="w-full h-32 md:h-full bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
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
															className="inline-flex items-center px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium"
														>
															{cat}
														</span>
													))}
												</div>

												{/* Title */}
												<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
													{post.title}
												</h2>

												{/* Excerpt */}
												<p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
													{post.excerpt}
												</p>

												{/* Metadata */}
												<div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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
													<div className="ml-auto flex items-center gap-1 text-emerald-600 dark:text-emerald-400 group-hover:gap-2 transition-all">
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
											className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
													? 'bg-emerald-600 text-white'
													: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
											}`}
										>
											{p}
										</Link>
									))}

									{page < totalPages && (
										<Link
											to={`?page=${page + 1}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}`}
											className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
										>
											Next
										</Link>
									)}
								</div>
							)}
						</>
					) : (
						<div className="text-center py-12">
							<Search className="mx-auto text-gray-400 mb-4" size={48} />
							<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
								No posts found
							</h2>
							<p className="text-gray-600 dark:text-gray-400 mb-6">
								{isSearching
									? "Try adjusting your search terms"
									: "Try selecting different filters or search terms"}
							</p>
							<button
								onClick={clearFilters}
								className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
							>
								<ChevronRight size={20} />
								Clear All Filters
							</button>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
