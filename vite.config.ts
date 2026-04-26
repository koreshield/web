import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import rehypeHighlight from 'rehype-highlight'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { globSync } from 'glob'

// Pre-load all MDX files at build time
const mdxFiles: Record<string, string> = {}
const srcDir = resolve(__dirname, 'src')
const contentDir = resolve(srcDir, 'content/docs')

// Scan for all .mdx files
const files = globSync('**/*.mdx', { cwd: contentDir })
files.forEach((file: string) => {
  const key = `virtual:doc:${file.replace(/\.mdx$/, '')}`
  const fullPath = resolve(contentDir, file)
  try {
    mdxFiles[key] = readFileSync(fullPath, 'utf-8')
  } catch (err) {
    console.warn(`Failed to read: ${file}`)
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Virtual module loader for documentation files
    {
      name: 'virtual-docs',
      resolveId(id) {
        if (id.startsWith('virtual:doc:')) {
          return id
        }
      },
      load(id) {
        if (id.startsWith('virtual:doc:')) {
          const content = mdxFiles[id]
          if (content) {
            return `export default ${JSON.stringify(content)}`
          }
          return 'export default ""'
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

