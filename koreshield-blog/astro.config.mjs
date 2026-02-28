// @ts-check
// Force reload
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import vercel from '@astrojs/vercel';

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

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.koreshield.com',
	output: 'server',

	integrations: [
		expressiveCode({
			themes: ['github-dark', 'github-light'],
			plugins: [pluginCopyButton(), pluginCollapseButton(), pluginLanguageBadge()],
			defaultProps: {
				showLineNumbers: false,
			},
		}),
		react(),
		markdoc(),
		svelte(),
		icon(),
	],

	adapter: vercel({
		webAnalytics: {
			enabled: true
		}
	}),

	markdown: {
		remarkPlugins: [remarkDirective, parseDirectiveNode],
		rehypePlugins: [
			[rehypeComponents, {
				components: {
					note: (properties, children) => AdmonitionComponent(properties, children, "note"),
					tip: (properties, children) => AdmonitionComponent(properties, children, "tip"),
					warning: (properties, children) => AdmonitionComponent(properties, children, "warning"),
					caution: (properties, children) => AdmonitionComponent(properties, children, "caution"),
					important: (properties, children) => AdmonitionComponent(properties, children, "important"),
					danger: (properties, children) => AdmonitionComponent(properties, children, "danger"),
				}
			}]
		]
	}
});