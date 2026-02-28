import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
	api: {
		projectId: process.env.SANITY_STUDIO_PROJECT_ID as string,
		dataset: process.env.SANITY_STUDIO_DATASET as string
	},
	deployment: {
		/**
		 * Enable auto-updates for studios.
		 * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
		 */
		autoUpdates: true,
	},
	vite: (config) => ({
		...config,
		base: '/studio/',
	}),
})
