import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
    // type: 'content',
    loader: glob({ pattern: "**/*.mdoc", base: "./src/content/posts" }),
    schema: z.object({
        title: z.string(),
        slug: z.string().optional(),
        description: z.string().optional(),
        published: z.date(),
        updated: z.date().optional(),
        cover: z.string().optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        draft: z.boolean().default(false),
        author: z.string().optional(), // Reference to author slug
        encrypted: z.boolean().optional(),
        password: z.string().optional(),
        lang: z.string().optional(),
        prevSlug: z.string().optional(),
        prevTitle: z.string().optional(),
        nextSlug: z.string().optional(),
        nextTitle: z.string().optional(),
        routeName: z.string().optional(),
    }),
});

const authors = defineCollection({
    type: 'data', // Authors are data-only (no markdown content usually, or Keystatic uses yaml)
    schema: z.object({
        name: z.string(),
        role: z.string().optional(),
        bio: z.string().optional(),
        avatar: z.string().optional(),
        twitter: z.string().optional(),
        github: z.string().optional(),
        linkedin: z.string().optional(),
    }),
});

export const collections = {
    posts,
    authors,
};
