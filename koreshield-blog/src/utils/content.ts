import { sanityClient } from "sanity:client";
import { getCategoryUrl } from "@utils/url";
import { i18n } from "@i18n/translation";
import I18nKey from "@i18n/i18nKey";

export type PostForList = {
	id: string;
	data: {
		title: string;
		slug: string;
		published: Date;
		updated?: Date;
		draft?: boolean;
		description?: string;
		cover?: any;
		tags?: string[];
		category?: any;
		lang?: string;
		pinned?: boolean;
		author?: any;
		sourceLink?: string;
		licenseName?: string;
		licenseUrl?: string;
		encrypted?: boolean;
		password?: string;
		routeName?: string;
		prevTitle?: string;
		prevSlug?: string;
		nextTitle?: string;
		nextSlug?: string;
	};
	body?: any;
	readingTime?: number;
};

// Retrieve posts and sort them by publication date
async function getRawSortedPosts(): Promise<PostForList[]> {
	const isProd = import.meta.env.PROD;

	// Fetch all posts from Sanity
	const query = `*[_type == "post" ${isProd ? '&& draft != true' : ''}] {
      _id,
      title,
      slug,
      published,
      updated,
      draft,
      description,
      cover,
      tags,
      category->,
      lang,
      pinned,
      author->,
      sourceLink,
      licenseName,
      licenseUrl,
      encrypted,
      password,
      routeName,
      body
    }`;

	const sanityPosts = await sanityClient.fetch(query);

	const mappedPosts = sanityPosts.map((post: any) => ({
		id: post.slug?.current || post._id,
		data: {
			...post,
			slug: post.slug?.current,
		},
		body: post.body
	}));

	const sorted = mappedPosts.sort((a, b) => {
		// 首先按置顶状态排序，置顶文章在前
		if (a.data.pinned && !b.data.pinned) return -1;
		if (!a.data.pinned && b.data.pinned) return 1;

		// 如果置顶状态相同，则按发布日期排序
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});

	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].id;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].id;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}

export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// Calculate reading time for each post
	const postsWithReadingTime = sortedFullPosts.map((post) => {
		// Simple heuristic for reading time based on block body size
		const wordCount = JSON.stringify(post.body || []).split(' ').length;
		const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute

		return {
			id: post.id,
			data: post.data,
			readingTime: readingTime > 0 ? readingTime : 1, // Minimum 1 minute
		};
	});

	return postsWithReadingTime;
}

export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getRawSortedPosts();

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post) => {
		if (post.data.tags) {
			post.data.tags.forEach((tag: string) => {
				if (!countMap[tag]) countMap[tag] = 0;
				countMap[tag]++;
			});
		}
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getRawSortedPosts();
	const count: { [key: string]: number } = {};

	allBlogPosts.forEach((post) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName = typeof post.data.category.title === "string"
			? post.data.category.title.trim()
			: String(post.data.category.title || post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}