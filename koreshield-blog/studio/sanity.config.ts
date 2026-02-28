import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
	name: 'default',
	title: 'koreshield-blog',
	basePath: '/studio',

	projectId: process.env.SANITY_STUDIO_PROJECT_ID as string,
	dataset: process.env.SANITY_STUDIO_DATASET as string,

	plugins: [structureTool(), visionTool()],

	schema: {
		types: schemaTypes,
	},
})
