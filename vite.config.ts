import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import rehypeHighlight from 'rehype-highlight'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Custom plugin for handling ?raw MDX imports
    {
      name: 'raw-mdx-loader',
      resolveId(id) {
        if (id.includes('.mdx?raw')) {
          return id
        }
      },
      load(id) {
        if (id.includes('.mdx?raw')) {
          const path = id.replace('?raw', '')
          try {
            const content = readFileSync(resolve(__dirname, path), 'utf-8')
            return `export default ${JSON.stringify(content)}`
          } catch (err) {
            console.warn(`Failed to load raw MDX: ${path}`, err)
            return 'export default ""'
          }
        }
      }
    },
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        rehypePlugins: [rehypeHighlight],
        providerImportSource: "@mdx-js/react"
      })
    },
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'framer-motion': ['framer-motion'],
          'prismjs': ['prismjs'],
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  }
})

