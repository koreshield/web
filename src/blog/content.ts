/**
 * Auto-generated blog content configuration
 * This file is populated by generate-blog.cjs from /src/content/blog/*.md files
 * 
 * Format: Each blog post is stored with its metadata and content
 * Structure allows for:
 * - Multiple categories per post
 * - Multiple tags per post  
 * - Draft/published/scheduled status
 * - Publication date and optional scheduled publish date
 * - Cover image support
 * - Author attribution
 */

import type { BlogPost } from './loader';
import { addBlogPost } from './loader';

/**
 * Blog posts collection
 * Each entry contains full metadata and content needed for rendering
 */
const BLOG_POSTS: BlogPost[] = [

	{
		slug: 'getting-started-with-koreshield',
		title: 'Getting Started with KoreShield',
		excerpt: 'A comprehensive guide to integrating KoreShield into your application for AI security.',
		date: '2026-04-27',
		author: 'KoreShield Team',
		categories: ['Getting Started, Tutorials'],
		tags: ['integration, beginner, setup'],
		status: 'published',
		
		coverImage: '/images/blog/getting-started.png',
		readingTime: 1,
		path: '/blog/getting-started-with-koreshield',
		content: `# Getting Started with KoreShield

KoreShield is a comprehensive security platform designed to protect your AI applications from threats. This guide will walk you through the setup process.

## Installation

\`\`\`bash
npm install @koreshield/sdk
\`\`\`

## Quick Start

\`\`\`javascript
import { KoreShield } from '@koreshield/sdk';

const shield = new KoreShield({
  apiKey: 'your-api-key',
});
\`\`\`

## Key Features

- Real-time threat detection
- AI-powered response
- Comprehensive logging
- Easy integration

## Next Steps

- [Read the documentation](/docs/getting-started)
- [Check out examples](/docs/examples)
- [Join our community](https://discord.gg/koreshield)

For more information, visit our [documentation portal](/docs).`,
	},

	{
		slug: 'weekly-security-update-april-27',
		title: 'Weekly Security Update - April 27, 2026',
		excerpt: 'Latest security patches, threat intelligence, and feature updates for this week.',
		date: '2026-04-27',
		author: 'KoreShield Team',
		categories: ['Updates, Security'],
		tags: ['updates, security, weekly'],
		status: 'published',
		
		coverImage: '/images/blog/updates.png',
		readingTime: 1,
		path: '/blog/weekly-security-update-april-27',
		content: `# Weekly Security Update - April 27, 2026

## This Week's Highlights

### New Features
- Enhanced RAG security monitoring
- Improved threat detection accuracy (89% → 94%)
- New compliance report templates

### Security Patches
- Fixed edge case in input validation
- Updated threat patterns database
- Enhanced rate limiter efficiency

### Community Updates
- 1,000+ active deployments
- 500+ security incidents prevented
- 99.97% uptime achieved

## Upcoming

Next week we'll be launching:
- New dashboard analytics
- Advanced threat visualization
- Team collaboration features

## Stay Secure

Remember to keep your KoreShield SDK updated and enable all security features in your settings.

[Read full changelog](/changelog)`,
	},

	{
		slug: 'understanding-ai-threats',
		title: 'Understanding AI Threats: A Deep Dive',
		excerpt: 'Explore the landscape of threats targeting AI systems and how to mitigate them.',
		date: '2026-04-20',
		author: 'Security Research Team',
		categories: ['Security, Research'],
		tags: ['threats, ai, security, research'],
		status: 'published',
		
		coverImage: '/images/blog/ai-threats.png',
		readingTime: 1,
		path: '/blog/understanding-ai-threats',
		content: `# Understanding AI Threats: A Deep Dive

The AI landscape is rapidly evolving, and with it comes new security challenges. This article explores the major threat vectors targeting AI systems.

## Threat Categories

### 1. Prompt Injection
Attacks that manipulate AI model inputs to produce unintended outputs.

### 2. Model Extraction
Techniques to steal or reverse-engineer proprietary AI models.

### 3. Data Poisoning
Corrupting training data to compromise model integrity.

### 4. Adversarial Attacks
Carefully crafted inputs designed to fool AI systems.

## Mitigation Strategies

KoreShield provides comprehensive protection against these threats through:

- Input validation and filtering
- Model integrity monitoring
- Anomaly detection
- Rate limiting and throttling

## Best Practices

1. Keep your models updated
2. Monitor for suspicious patterns
3. Use rate limiting
4. Implement proper authentication
5. Regular security audits

## Resources

- [Threat Report 2026](/docs/threat-reports)
- [Security Best Practices](/docs/best-practices/security)
- [API Documentation](/docs/api)`,
	},

];

/**
 * Initialize blog with all posts
 */
export function initializeBlog() {
	for (const post of BLOG_POSTS) {
		addBlogPost(post);
	}
}

/**
 * Export blog data
 */
export { BLOG_POSTS };

// Initialize on load
initializeBlog();
