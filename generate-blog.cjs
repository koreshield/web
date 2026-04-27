/**
 * generate-blog.cjs
 * Parses markdown blog posts and generates TypeScript configuration
 * Run with: node generate-blog.cjs
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, 'src/content/blog');
const OUTPUT_FILE = path.join(__dirname, 'src/blog/content.ts');

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) {
		throw new Error('Missing frontmatter');
	}

	const [, frontmatterText, body] = match;
	const metadata = {};
	const lines = frontmatterText.split('\n');

	for (const line of lines) {
		if (!line.trim() || line.startsWith('#')) continue;

		const [key, ...valueParts] = line.split(':');
		let value = valueParts.join(':').trim();

		// Remove quotes
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}

		// Handle arrays
		if (value.startsWith('[') && value.endsWith(']')) {
			value = value
				.slice(1, -1)
				.split(',')
				.map(v => v.trim())
				.filter(Boolean);
		}

		const keyLower = key.trim().toLowerCase();
		switch (keyLower) {
			case 'categories':
				metadata.categories = Array.isArray(value) ? value : [value];
				break;
			case 'tags':
				metadata.tags = Array.isArray(value) ? value : [value];
				break;
			default:
				metadata[keyLower] = value;
		}
	}

	return { metadata, body: body.trim() };
}

/**
 * Generate slug from filename or title
 */
function generateSlug(filename, title) {
	const baseName = path.basename(filename, path.extname(filename));
	return baseName
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Calculate reading time (approx 200 words per minute)
 */
function calculateReadingTime(content) {
	const words = content.trim().split(/\s+/).length;
	return Math.ceil(words / 200);
}

/**
 * Find all blog markdown files
 */
function findBlogFiles(dir) {
	const files = [];

	function walk(currentPath) {
		const entries = fs.readdirSync(currentPath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(currentPath, entry.name);

			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
				files.push(fullPath);
			}
		}
	}

	walk(dir);
	return files.sort();
}

/**
 * Main generation logic
 */
function generateBlogContent() {
	if (!fs.existsSync(BLOG_DIR)) {
		console.log(`📁 Blog directory not found at ${BLOG_DIR}`);
		console.log('ℹ️  Create blog posts in src/content/blog/ with .md or .mdx extension');
		console.log('📝 Example frontmatter:');
		console.log(`
---
title: My Blog Post
excerpt: A short description
date: 2026-04-27
author: Your Name
categories: [Security, Updates]
tags: [ai, threats]
status: published
coverImage: /images/my-image.png
---

# Content starts here
`);
		return;
	}

	const blogFiles = findBlogFiles(BLOG_DIR);

	if (blogFiles.length === 0) {
		console.log('⚠️  No blog posts found in', BLOG_DIR);
		return;
	}

	const posts = [];

	for (const filePath of blogFiles) {
		try {
			const content = fs.readFileSync(filePath, 'utf-8');
			const { metadata, body } = parseFrontmatter(content);

			const slug = generateSlug(filePath, metadata.title);

			// Validate required fields
			if (!metadata.title || !metadata.excerpt || !metadata.date || !metadata.author) {
				console.warn(`⚠️  Skipping ${filePath}: Missing required fields`);
				continue;
			}

			const post = {
				slug,
				title: metadata.title,
				excerpt: metadata.excerpt,
				date: metadata.date,
				author: metadata.author,
				categories: metadata.categories || [],
				tags: metadata.tags || [],
				status: metadata.status || 'published',
				publishDate: metadata.publishdate,
				coverImage: metadata.coverimage,
				readingTime: calculateReadingTime(body),
				path: `/blog/${slug}`,
				content: body,
			};

			posts.push(post);
			console.log(`✅ ${post.slug}`);
		} catch (error) {
			console.error(`❌ Error processing ${filePath}:`, error.message);
		}
	}

	// Sort by date (newest first)
	posts.sort((a, b) => new Date(b.date) - new Date(a.date));

	// Generate TypeScript file
	const tsContent = `/**
 * Auto-generated blog content configuration
 * This file is populated by generate-blog.cjs from /src/content/blog/*.md files
 * 
 * Format: Each blog post is stored with its metadata and content
 * Structure allows for:
 * - Multiple categories per post
 * - Multiple tags per post  
 * - Draft/published/scheduled status
 * - Publication date and optional scheduled publish date
 * - Cover image support
 * - Author attribution
 */

import { BlogPost, addBlogPost } from './loader';

/**
 * Blog posts collection
 * Each entry contains full metadata and content needed for rendering
 */
const BLOG_POSTS: BlogPost[] = [
${posts
	.map(
		post => `
	{
		slug: '${post.slug}',
		title: '${post.title.replace(/'/g, "\\'")}',
		excerpt: '${post.excerpt.replace(/'/g, "\\'")}',
		date: '${post.date}',
		author: '${post.author.replace(/'/g, "\\'")}',
		categories: [${post.categories.map(c => `'${c.replace(/'/g, "\\'")}'`).join(', ')}],
		tags: [${post.tags.map(t => `'${t.replace(/'/g, "\\'")}'`).join(', ')}],
		status: '${post.status}',
		${post.publishDate ? `publishDate: '${post.publishDate}',` : ''}
		${post.coverImage ? `coverImage: '${post.coverImage}',` : ''}
		readingTime: ${post.readingTime},
		path: '${post.path}',
		content: \`${post.content.replace(/\`/g, '\\`')}\`,
	},
`
	)
	.join('')}
];

/**
 * Initialize blog with all posts
 */
export function initializeBlog() {
	for (const post of BLOG_POSTS) {
		addBlogPost(post);
	}
}

/**
 * Export blog data
 */
export { BLOG_POSTS };

// Initialize on load
initializeBlog();
`;

	fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');
	console.log(`\n✨ Generated ${OUTPUT_FILE}`);
	console.log(`📝 Total blog posts: ${posts.length}`);
}

// Run generation
try {
	generateBlogContent();
} catch (error) {
	console.error('Error generating blog content:', error);
	process.exit(1);
}
