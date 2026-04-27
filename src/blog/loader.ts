/**
 * Blog Loader - Manages blog posts with categories, tags, scheduling, and drafts
 */

export interface BlogPostMetadata {
	title: string;
	excerpt: string;
	date: string; // ISO format: 2026-04-27
	author: string;
	categories: string[];
	tags: string[];
	status: 'draft' | 'published' | 'scheduled'; // draft, published, or scheduled
	publishDate?: string; // For scheduled posts
	coverImage?: string;
	readingTime?: number; // minutes
}

export interface BlogPost extends BlogPostMetadata {
	slug: string;
	content: string;
	path: string;
}

export interface BlogCategory {
	name: string;
	count: number;
	slug: string;
}

export interface BlogTag {
	name: string;
	count: number;
	slug: string;
}

export interface BlogFilterOptions {
	category?: string;
	tag?: string;
	year?: number;
	month?: number;
	author?: string;
	status?: 'draft' | 'published' | 'scheduled';
}

export interface BlogListOptions {
	filters?: BlogFilterOptions;
	limit?: number;
	offset?: number;
	sortBy?: 'date-desc' | 'date-asc' | 'title';
}

/**
 * Parse frontmatter from markdown content
 * Frontmatter format:
 * ---
 * title: Post Title
 * excerpt: Short excerpt
 * date: 2026-04-27
 * author: Author Name
 * categories: [Security, Updates]
 * tags: [ai, threats]
 * status: published
 * coverImage: /images/cover.png
 * ---
 */
function parseFrontmatter(content: string): { metadata: BlogPostMetadata; body: string } {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		throw new Error('Invalid frontmatter format');
	}

	const frontmatterText = match[1];
	const body = match[2];

	// Parse YAML-like frontmatter
	const metadata: Partial<BlogPostMetadata> = {};
	const lines = frontmatterText.split('\n');

	for (const line of lines) {
		if (!line.trim() || line.startsWith('#')) continue;

		const [key, ...valueParts] = line.split(':');
		let value = valueParts.join(':').trim();

		// Remove quotes
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}

		// Handle arrays (e.g., [tag1, tag2])
		if (value.startsWith('[') && value.endsWith(']')) {
			value = value.slice(1, -1).split(',').map(v => v.trim()).filter(Boolean).join(',');
		}

		switch (key.trim().toLowerCase()) {
			case 'title':
				metadata.title = value;
				break;
			case 'excerpt':
				metadata.excerpt = value;
				break;
			case 'date':
				metadata.date = value;
				break;
			case 'author':
				metadata.author = value;
				break;
			case 'categories':
				metadata.categories = value.split(',').map(c => c.trim()).filter(Boolean);
				break;
			case 'tags':
				metadata.tags = value.split(',').map(t => t.trim()).filter(Boolean);
				break;
			case 'status':
				metadata.status = value as 'draft' | 'published' | 'scheduled';
				break;
			case 'publishdate':
				metadata.publishDate = value;
				break;
			case 'coverimage':
				metadata.coverImage = value;
				break;
			case 'readingtime':
				metadata.readingTime = parseInt(value);
				break;
		}
	}

	// Validate required fields
	if (!metadata.title || !metadata.excerpt || !metadata.date || !metadata.author) {
		throw new Error('Missing required frontmatter fields: title, excerpt, date, author');
	}

	metadata.categories = metadata.categories || [];
	metadata.tags = metadata.tags || [];
	metadata.status = metadata.status || 'published';

	return {
		metadata: metadata as BlogPostMetadata,
		body: body.trim(),
	};
}

/**
 * Convert slug to title (e.g., "my-post-title" -> "My Post Title")
 */
function slugToTitle(slug: string): string {
	return slug
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Convert title or string to slug (e.g., "My Post Title" -> "my-post-title")
 */
function toSlug(str: string): string {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Calculate reading time in minutes (approximately 200 words per minute)
 */
function calculateReadingTime(content: string): number {
	const wordsPerMinute = 200;
	const words = content.trim().split(/\s+/).length;
	return Math.ceil(words / wordsPerMinute);
}

/**
 * Check if a post should be displayed (not draft, not in future if scheduled)
 */
function isPostVisible(post: BlogPost, includeScheduled = true): boolean {
	if (post.status === 'draft') {
		return false;
	}

	if (post.status === 'scheduled') {
		if (!includeScheduled) {
			return false;
		}
		if (post.publishDate) {
			const publishDate = new Date(post.publishDate);
			return publishDate <= new Date();
		}
	}

	return true;
}

/**
 * Blog Data Store (in production, this would be fetched from CMS/API)
 * For now, we'll use a simple in-memory store populated from markdown files
 */
class BlogStore {
	private posts: Map<string, BlogPost> = new Map();
	private categories: Map<string, BlogCategory> = new Map();
	private tags: Map<string, BlogTag> = new Map();

	constructor() {
		this.initializeFromConfig();
	}

	private initializeFromConfig() {
		// This will be populated from the auto-generated blog config
		// See src/blog/content.ts
	}

	addPost(post: BlogPost) {
		this.posts.set(post.slug, post);

		// Update categories
		for (const category of post.categories) {
			const slug = toSlug(category);
			this.categories.set(slug, {
				name: category,
				slug,
				count: (this.categories.get(slug)?.count || 0) + 1,
			});
		}

		// Update tags
		for (const tag of post.tags) {
			const slug = toSlug(tag);
			this.tags.set(slug, {
				name: tag,
				slug,
				count: (this.tags.get(slug)?.count || 0) + 1,
			});
		}
	}

	getPost(slug: string): BlogPost | null {
		return this.posts.get(slug) || null;
	}

	getPostByPath(path: string): BlogPost | null {
		for (const post of this.posts.values()) {
			if (post.path === path) {
				return post;
			}
		}
		return null;
	}

	listPosts(options: BlogListOptions = {}): BlogPost[] {
		const { filters = {}, limit = 10, offset = 0, sortBy = 'date-desc' } = options;

		let posts = Array.from(this.posts.values()).filter(post => isPostVisible(post));

		// Apply filters
		if (filters.category) {
			posts = posts.filter(post => post.categories.some(c => toSlug(c) === filters.category));
		}

		if (filters.tag) {
			posts = posts.filter(post => post.tags.some(t => toSlug(t) === filters.tag));
		}

		if (filters.year) {
			posts = posts.filter(post => new Date(post.date).getFullYear() === filters.year);
		}

		if (filters.month) {
			posts = posts.filter(post => new Date(post.date).getMonth() + 1 === filters.month);
		}

		if (filters.author) {
			posts = posts.filter(post => toSlug(post.author) === filters.author);
		}

		// Sort
		switch (sortBy) {
			case 'date-asc':
				posts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
				break;
			case 'date-desc':
				posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
				break;
			case 'title':
				posts.sort((a, b) => a.title.localeCompare(b.title));
				break;
		}

		// Paginate
		return posts.slice(offset, offset + limit);
	}

	getCategories(): BlogCategory[] {
		return Array.from(this.categories.values())
			.filter(cat => cat.count > 0)
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	getTags(): BlogTag[] {
		return Array.from(this.tags.values())
			.filter(tag => tag.count > 0)
			.sort((a, b) => b.count - a.count); // Sort by count descending
	}

	getRelatedPosts(slug: string, limit = 3): BlogPost[] {
		const post = this.getPost(slug);
		if (!post) return [];

		const related = Array.from(this.posts.values())
			.filter(p => p.slug !== slug && isPostVisible(p))
			.map(p => ({
				post: p,
				score: [...p.categories, ...p.tags].filter(
					c => post.categories.includes(c) || post.tags.includes(c)
				).length,
			}))
			.sort((a, b) => b.score - a.score)
			.filter(({ score }) => score > 0)
			.slice(0, limit)
			.map(({ post }) => post);

		return related;
	}

	getRecentPosts(limit = 5): BlogPost[] {
		return this.listPosts({ limit, sortBy: 'date-desc' });
	}

	searchPosts(query: string): BlogPost[] {
		const lowerQuery = query.toLowerCase();
		return Array.from(this.posts.values()).filter(post =>
			isPostVisible(post) &&
			(post.title.toLowerCase().includes(lowerQuery) ||
				post.excerpt.toLowerCase().includes(lowerQuery) ||
				post.content.toLowerCase().includes(lowerQuery) ||
				post.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
				post.author.toLowerCase().includes(lowerQuery))
		);
	}

	getArchiveYears(): number[] {
		const years = new Set(
			Array.from(this.posts.values())
				.filter(post => isPostVisible(post))
				.map(post => new Date(post.date).getFullYear())
		);
		return Array.from(years).sort().reverse();
	}

	getPostsByYearMonth(year: number, month: number): BlogPost[] {
		return this.listPosts({
			filters: { year, month },
			sortBy: 'date-desc',
		});
	}
}

// Initialize the store
const blogStore = new BlogStore();

/**
 * Public API
 */
export function addBlogPost(post: BlogPost) {
	blogStore.addPost(post);
}

export function getBlogPost(slug: string): BlogPost | null {
	return blogStore.getPost(slug);
}

export function listBlogPosts(options?: BlogListOptions): BlogPost[] {
	return blogStore.listPosts(options);
}

export function getBlogCategories(): BlogCategory[] {
	return blogStore.getCategories();
}

export function getBlogTags(): BlogTag[] {
	return blogStore.getTags();
}

export function getRelatedBlogPosts(slug: string, limit?: number): BlogPost[] {
	return blogStore.getRelatedPosts(slug, limit);
}

export function getRecentBlogPosts(limit?: number): BlogPost[] {
	return blogStore.getRecentPosts(limit);
}

export function searchBlogPosts(query: string): BlogPost[] {
	return blogStore.searchPosts(query);
}

export function getBlogArchiveYears(): number[] {
	return blogStore.getArchiveYears();
}

export function getBlogPostsByYearMonth(year: number, month: number): BlogPost[] {
	return blogStore.getPostsByYearMonth(year, month);
}

/**
 * Utility exports
 */
export { parseFrontmatter, calculateReadingTime, toSlug, slugToTitle };
