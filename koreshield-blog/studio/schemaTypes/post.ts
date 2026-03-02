import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'post',
	title: 'Blog Post',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: Rule => Rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: { source: 'title', maxLength: 96 },
			validation: Rule => Rule.required(),
		}),
		defineField({
			name: 'author',
			title: 'Author',
			type: 'reference',
			to: [{ type: 'author' }],
		}),
		defineField({
			name: 'coverImage',
			title: 'Cover Image',
			type: 'image',
			options: { hotspot: true },
			fields: [
				defineField({
					name: 'alt',
					title: 'Alt Text',
					type: 'string',
				}),
			],
		}),
		defineField({
			name: 'description',
			title: 'Description / Excerpt',
			type: 'text',
			rows: 3,
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'array',
			of: [
				{ type: 'block' },
				{
					type: 'image',
					options: { hotspot: true },
					fields: [
						defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
						defineField({ name: 'caption', title: 'Caption', type: 'string' }),
					],
				},
				{
					type: 'code',
					options: { withFilename: true },
				},
			],
		}),
		defineField({
			name: 'category',
			title: 'Category',
			type: 'string',
			options: {
				list: [
					{ title: 'Security', value: 'Security' },
					{ title: 'Engineering', value: 'Engineering' },
					{ title: 'Research', value: 'Research' },
					{ title: 'Product', value: 'Product' },
					{ title: 'News', value: 'News' },
					{ title: 'Tutorial', value: 'Tutorial' },
				],
			},
		}),
		defineField({
			name: 'tags',
			title: 'Tags',
			type: 'array',
			of: [{ type: 'string' }],
			options: { layout: 'tags' },
		}),
		defineField({
			name: 'published',
			title: 'Published At',
			type: 'datetime',
			validation: Rule => Rule.required(),
		}),
		defineField({
			name: 'updated',
			title: 'Last Updated',
			type: 'datetime',
		}),
		defineField({
			name: 'draft',
			title: 'Draft',
			type: 'boolean',
			initialValue: false,
		}),
		defineField({
			name: 'pinned',
			title: 'Pinned',
			type: 'boolean',
			initialValue: false,
		}),
		defineField({
			name: 'lang',
			title: 'Language',
			type: 'string',
			initialValue: 'en',
		}),
		defineField({
			name: 'licenseName',
			title: 'License Name',
			type: 'string',
		}),
		defineField({
			name: 'licenseUrl',
			title: 'License URL',
			type: 'url',
		}),
		defineField({
			name: 'sourceLink',
			title: 'Source Link',
			type: 'url',
		}),
	],
	preview: {
		select: {
			title: 'title',
			author: 'author.name',
			media: 'coverImage',
			draft: 'draft',
		},
		prepare({ title, author, media, draft }) {
			return {
				title: `${draft ? '[DRAFT] ' : ''}${title}`,
				subtitle: author ? `by ${author}` : 'No author',
				media,
			}
		},
	},
	orderings: [
		{
			title: 'Published At, Newest',
			name: 'publishedAtDesc',
			by: [{ field: 'published', direction: 'desc' }],
		},
	],
})
