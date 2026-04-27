/**
 * Simple Markdown Parser - Converts markdown to HTML
 * Supports: headings, code blocks, bold, italic, inline code, links, paragraphs
 */

export function parseMarkdown(markdown: string): string {
	let html = markdown;

	// Escape HTML special characters first (but not in code blocks)
	// We'll handle this after code block preservation

	// Preserve code blocks
	const codeBlocks: string[] = [];
	html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
		const escaped = code
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
		const highlighted = `<pre class="bg-gray-950 text-gray-50 p-4 rounded-xl overflow-x-auto text-sm leading-relaxed border border-white/[0.08] my-6"><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
		codeBlocks.push(highlighted);
		return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
	});

	// Escape HTML in regular text
	html = html
		.replace(/&(?!amp;|lt;|gt;|quot;|&#39;)/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

	// Restore code blocks (they're already escaped)
	html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match) => {
		const index = parseInt(match.replace('__CODE_BLOCK_', '').replace('__', ''));
		return codeBlocks[index];
	});

	// Headings — strip leading h1 to avoid duplicate (BlogPostPage already renders title in header)
	html = html.replace(/^\s*# [^\n]+\n+/, '');
	html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xl font-bold mt-6 mb-3 text-[hsl(var(--foreground))] scroll-mt-24">$1</h3>');
	html = html.replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4 text-[hsl(var(--foreground))] border-b border-[hsl(var(--border))] pb-2 scroll-mt-24">$1</h2>');
	html = html.replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold mb-4 text-[hsl(var(--foreground))] scroll-mt-24">$1</h1>');

	// Bold and italic
	html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
	html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
	html = html.replace(/____(.*?)____/g, '<strong><em>$1</em></strong>');
	html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
	html = html.replace(/_(.*?)_/g, '<em>$1</em>');

	// Inline code
	html = html.replace(/`([^`]+)`/g, '<code class="bg-[hsl(var(--accent))] text-[hsl(var(--primary))] px-2 py-0.5 rounded text-sm font-mono">$1</code>');

	// Links
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[hsl(var(--primary))] underline hover:opacity-80 transition-opacity">$1</a>');

	// Unordered lists — collect consecutive <li> items into a single <ul>
	html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
	html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
	html = html.replace(/(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g, (match) => {
		return `<ul class="list-disc list-outside ml-6 mb-4 space-y-1">${match}</ul>`;
	});

	// Ordered lists
	html = html.replace(/((?:^\d+\. .*$\n?)+)/gm, (block) => {
		const items = block.trim().replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');
		return `<ol class="list-decimal list-outside ml-6 mb-4 space-y-1">${items}</ol>`;
	});

	// Blockquotes
	html = html.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] pl-4 py-2 my-4 italic text-[hsl(var(--muted-foreground))]">$1</blockquote>');

	// Horizontal rules
	html = html.replace(/^---$/gm, '<hr class="border-[hsl(var(--border))] my-6" />');

	// Line breaks — convert multiple newlines to paragraph breaks
	html = html.replace(/\n\n+/g, '</p><p class="mb-4 leading-relaxed text-[hsl(var(--foreground))]">');
	html = `<p class="mb-4 leading-relaxed text-[hsl(var(--foreground))]">${html}</p>`;

	// Clean up empty paragraphs
	html = html.replace(/<p[^>]*>\s*<\/p>/g, '');

	return html;
}

/**
 * Simple text truncation for excerpts
 */
export function truncateText(text: string, length = 200): string {
	if (text.length <= length) return text;
	return text.substring(0, length).trim() + '...';
}

/**
 * Strip markdown syntax from text (for plain text extraction)
 */
export function stripMarkdown(markdown: string): string {
	return markdown
		.replace(/^#+\s+/gm, '')
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/\*(.+?)\*/g, '$1')
		.replace(/`(.+?)`/g, '$1')
		.replace(/\[(.+?)\]\(.+?\)/g, '$1')
		.replace(/^[\s\-*]+/gm, '')
		.replace(/\n\n+/g, ' ')
		.trim();
}
