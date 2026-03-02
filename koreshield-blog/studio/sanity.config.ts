import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { codeInput } from '@sanity/code-input'
import { schemaTypes } from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!
const dataset = process.env.SANITY_STUDIO_DATASET!

export default defineConfig({
	name: 'koreshield-blog-studio',
	title: 'KoreShield Blog Studio',

	projectId,
	dataset,

	plugins: [
		structureTool({
			structure: (S) =>
				S.list()
					.title('Content')
					.items([
						S.listItem()
							.title('Blog Posts')
							.child(
								S.documentList()
									.title('All Posts')
									.filter('_type == "post"')
									.defaultOrdering([{ field: 'published', direction: 'desc' }])
							),
						S.listItem()
							.title('Drafts')
							.child(
								S.documentList()
									.title('Draft Posts')
									.filter('_type == "post" && draft == true')
							),
						S.divider(),
						S.listItem()
							.title('Authors')
							.child(S.documentTypeList('author').title('Authors')),
					]),
		}),
		visionTool(),
		codeInput(),
	],

	schema: {
		types: schemaTypes,
	},
})
