import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

const sanityProjectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'rdas6fhs'
const sanityDataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production'

export const sanityClient = createClient({
	projectId: sanityProjectId,
	dataset: sanityDataset,
	apiVersion: '2024-01-01',
	useCdn: true,
})

const builder = createImageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
	return builder.image(source)
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SanityAuthor {
	name: string
	slug: { current: string }
	role?: string
	bio?: string
	avatar?: SanityImageSource
	twitter?: string
	github?: string
	linkedin?: string
}

export interface SanityPost {
	_id: string
	title: string
	slug: { current: string }
	author?: SanityAuthor
	coverImage?: SanityImageSource & { alt?: string }
	description?: string
	body: unknown[]
	category?: string
	tags?: string[]
	published: string
	updated?: string
	draft?: boolean
	pinned?: boolean
	lang?: string
	licenseName?: string
	licenseUrl?: string
	sourceLink?: string
}

// ─── GROQ Queries ────────────────────────────────────────────────────────────

/** ALL published posts, newest first */
export const ALL_POSTS_QUERY = `*[_type == "post" && draft != true] | order(published desc) {
  _id,
  title,
  slug,
  "author": author->{ name, slug, role, avatar },
  coverImage,
  description,
  category,
  tags,
  published,
  updated,
  pinned,
  lang
}`

/** Single post by slug */
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  "author": author->{ name, slug, role, bio, avatar, twitter, github, linkedin },
  coverImage,
  description,
  body,
  category,
  tags,
  published,
  updated,
  draft,
  pinned,
  lang,
  licenseName,
  licenseUrl,
  sourceLink
}`

/** All slugs (for static generation) */
export const ALL_SLUGS_QUERY = `*[_type == "post" && draft != true].slug.current`

/** All authors */
export const ALL_AUTHORS_QUERY = `*[_type == "author"] | order(name asc) {
  _id, name, slug, role, bio, avatar, twitter, github, linkedin
}`

/** Posts by category */
export const POSTS_BY_CATEGORY_QUERY = `*[_type == "post" && draft != true && category == $category] | order(published desc) {
  _id, title, slug, "author": author->{ name, slug }, coverImage, description, category, tags, published
}`

/** Posts by tag */
export const POSTS_BY_TAG_QUERY = `*[_type == "post" && draft != true && $tag in tags] | order(published desc) {
  _id, title, slug, "author": author->{ name, slug }, coverImage, description, category, tags, published
}`
