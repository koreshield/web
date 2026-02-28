import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'author',
	title: 'Author',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'role',
			title: 'Role',
			type: 'string',
		}),
		defineField({
			name: 'bio',
			title: 'Bio',
			type: 'text',
		}),
		defineField({
			name: 'avatar',
			title: 'Avatar',
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
			name: 'twitter',
			title: 'Twitter Handle / URL',
			type: 'string',
		}),
		defineField({
			name: 'github',
			title: 'GitHub URL',
			type: 'url',
		}),
		defineField({
			name: 'linkedin',
			title: 'LinkedIn URL',
			type: 'url',
		}),
	],
	preview: {
		select: {
			title: 'name',
			subtitle: 'role',
			media: 'avatar',
		},
	},
})
