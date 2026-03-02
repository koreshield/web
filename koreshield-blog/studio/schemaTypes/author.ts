import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'author',
	title: 'Author',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Full Name',
			type: 'string',
			validation: Rule => Rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Slug (ID)',
			type: 'slug',
			options: { source: 'name' },
			validation: Rule => Rule.required(),
		}),
		defineField({
			name: 'role',
			title: 'Role / Title',
			type: 'string',
		}),
		defineField({
			name: 'bio',
			title: 'Bio',
			type: 'text',
			rows: 4,
		}),
		defineField({
			name: 'avatar',
			title: 'Avatar',
			type: 'image',
			options: { hotspot: true },
		}),
		defineField({
			name: 'twitter',
			title: 'Twitter Handle',
			type: 'string',
		}),
		defineField({
			name: 'github',
			title: 'GitHub Username',
			type: 'string',
		}),
		defineField({
			name: 'linkedin',
			title: 'LinkedIn URL',
			type: 'url',
		}),
		defineField({
			name: 'website',
			title: 'Website',
			type: 'url',
		}),
	],
	preview: {
		select: { title: 'name', subtitle: 'role', media: 'avatar' },
	},
})
