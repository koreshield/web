import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'post',
	title: 'Post',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {
				source: 'title',
				maxLength: 96,
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'published',
			title: 'Published Date',
			type: 'datetime',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'updated',
			title: 'Updated Date',
			type: 'datetime',
		}),
		defineField({
			name: 'draft',
			title: 'Is Draft?',
			type: 'boolean',
			initialValue: false,
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'text',
		}),
		defineField({
			name: 'cover',
			title: 'Cover Image',
			type: 'image',
			options: {
				hotspot: true,
			},
			fields: [
				{
					name: 'alt',
					type: 'string',
					title: 'Alternative text',
				}
			]
		}),
		defineField({
			name: 'tags',
			title: 'Tags',
			type: 'array',
			of: [{ type: 'string' }],
		}),
		defineField({
			name: 'category',
			title: 'Category',
			type: 'reference',
			to: { type: 'category' },
		}),
		defineField({
			name: 'lang',
			title: 'Language',
			type: 'string',
		}),
		defineField({
			name: 'pinned',
			title: 'Is Pinned?',
			type: 'boolean',
			initialValue: false,
		}),
		defineField({
			name: 'author',
			title: 'Author',
			type: 'reference',
			to: { type: 'author' },
		}),
		defineField({
			name: 'sourceLink',
			title: 'Source Link',
			type: 'url',
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
			name: 'encrypted',
			title: 'Is Encrypted?',
			type: 'boolean',
			initialValue: false,
		}),
		defineField({
			name: 'password',
			title: 'Password',
			type: 'string',
		}),
		defineField({
			name: 'routeName',
			title: 'Custom Route Name',
			type: 'string',
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'blockContent',
		}),
	],
	preview: {
		select: {
			title: 'title',
			author: 'author.name',
			media: 'cover',
		},
		prepare(selection) {
			const { author } = selection
			return { ...selection, subtitle: author && `by ${author}` }
		},
	},
})
