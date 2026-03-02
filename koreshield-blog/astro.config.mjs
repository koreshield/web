// @ts-check
// Force reload
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

import markdoc from '@astrojs/markdoc';

import svelte from '@astrojs/svelte';

import icon from 'astro-icon';

import remarkDirective from 'remark-directive';
import rehypeComponents from 'rehype-components';
import { parseDirectiveNode } from './src/plugins/remark-directive-rehype.js';
import { AdmonitionComponent } from './src/plugins/rehype-component-admonition.mjs';

import expressiveCode from 'astro-expressive-code';
import { pluginCopyButton } from './src/plugins/expressive-code/copy-button';
import { pluginCollapseButton } from './src/plugins/expressive-code/collapse-button';
import { pluginLanguageBadge } from './src/plugins/expressive-code/language-badge';

import sanity from '@sanity/astro';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.koreshield.com',
	output: 'static',

	integrations: [
		expressiveCode({
			themes: ['github-dark', 'github-light'],
			plugins: [pluginCopyButton(), pluginCollapseButton(), pluginLanguageBadge()],
			defaultProps: {
				// showLineNumbers: false,
			},
		}),
		react(),
		markdoc(),
		svelte(),
		icon(),
		sanity({
			projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'rdas6fhs',
			dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
			useCdn: false,
		}),
	],

	// adapter: cloudflare(),

	markdown: {
		remarkPlugins: [remarkDirective, parseDirectiveNode],
		rehypePlugins: [
			[rehypeComponents, {
				components: {
					note: (/** @type {any} */ properties, /** @type {any} */ children) => AdmonitionComponent(properties, children, "note"),
					tip: (/** @type {any} */ properties, /** @type {any} */ children) => AdmonitionComponent(properties, children, "tip"),
					warning: (/** @type {any} */ properties, /** @type {any} */ children) => AdmonitionComponent(properties, children, "warning"),
					caution: (/** @type {any} */ properties, /** @type {any} */ children) => AdmonitionComponent(properties, children, "caution"),
					important: (/** @type {any} */ properties, /** @type {any} */ children) => AdmonitionComponent(properties, children, "important"),
					danger: (/** @type {any} */ properties, /** @type {any} */ children) => AdmonitionComponent(properties, children, "warning"),
				}
			}]
		]
	}
});