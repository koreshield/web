# Blog Posts Directory

## Quick Start

Create new blog posts as markdown files in this directory.

### Template

```markdown
---
title: Your Blog Post Title
excerpt: A short summary that appears in listings (1-2 sentences)
date: 2026-04-27
author: Your Name
categories: Category1, Category2
tags: tag1, tag2, tag3
status: published
coverImage: /images/blog/my-image.png
---

# Your Blog Post Title

Start your content here. Write in markdown.

## Section Heading

- Bullet list
- More bullets

**Bold text** and *italic text*

\`\`\`javascript
const code = 'here';
\`\`\`
```

## Required Fields

- **title** - Blog post title
- **excerpt** - Short description (50-150 characters)
- **date** - Publication date (YYYY-MM-DD format)
- **author** - Author name
- **categories** - Comma-separated list (e.g., "Security, Updates")
- **tags** - Comma-separated tags (e.g., "ai, threats, security")

## Optional Fields

- **status** - `published` (default), `draft`, or `scheduled`
- **publishDate** - For scheduled posts (YYYY-MM-DD)
- **coverImage** - Featured image URL or path
- **readingTime** - Manually override reading time in minutes

## Naming Convention

Use kebab-case for file names:
- ✅ `my-blog-post-title.md`
- ✅ `weekly-update-april-27.md`
- ❌ `My Blog Post Title.md`
- ❌ `MyBlogPostTitle.md`

## Post Status

| Status | Visible | Use Case |
|--------|---------|----------|
| `published` | Yes | Live posts (default) |
| `draft` | No | Work in progress |
| `scheduled` | Depends on publishDate | Future posts |

Example scheduled post:
```yaml
status: scheduled
publishDate: 2026-05-01
```

## Categories vs Tags

**Categories** (use 1-3):
- Main topics
- Used for filtering
- Examples: "Security", "Updates", "Tutorials", "Research"

**Tags** (use 2-5):
- Specific keywords
- Help with discovery
- Examples: "ai", "threats", "llm", "rag", "integration"

## Markdown Features Supported

- Headings: `# H1`, `## H2`, `### H3`
- **Bold**: `**text**`
- *Italic*: `*text*`
- [Links](https://example.com): `[text](url)`
- `Inline code`: `` `code` ``
- Code blocks with syntax highlighting:
  \`\`\`language
  code here
  \`\`\`
- Lists: `- item` or `* item`
- Blockquotes: `> quote`

## Cover Images

Place images in `/public/images/blog/` and reference:
```yaml
coverImage: /images/blog/my-post.png
```

## File Generation

After creating/editing posts, regenerate the config:

```bash
cd ../.. # Go to web directory
node generate-blog.cjs
npm run build
```

This creates/updates `src/blog/content.ts`

## Examples

See these files for examples:
- `getting-started-with-koreshield.md` - Tutorial style
- `understanding-ai-threats.md` - Educational content
- `weekly-security-update-april-27.md` - News format

## Tips

1. **Excerpt**: Write it last, after you know the full content
2. **Length**: Aim for 800-2000 words (5-15 min read)
3. **Links**: Use relative paths where possible: `/docs/api`
4. **Code**: Always specify language for syntax highlighting
5. **Meta tags**: Headers already include SEO metadata automatically
6. **Preview**: Build locally and test before committing

## Troubleshooting

### Posts not appearing

1. Check YAML frontmatter syntax
2. Verify all required fields present
3. Run `node generate-blog.cjs` and check output
4. Rebuild: `npm run build`

### Markdown looks wrong

1. Verify correct syntax
2. Check for special character escaping
3. Ensure proper spacing in lists/blockquotes

## Questions?

See `BLOG_SYSTEM.md` in the parent directory for full documentation.
