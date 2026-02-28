import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
	name: 'default',
	title: 'koreshield-blog',
	basePath: '/studio',

	projectId: 'rdas6fhs',
	dataset: 'production',

	plugins: [structureTool(), visionTool()],

	schema: {
		types: schemaTypes,
	},
})
