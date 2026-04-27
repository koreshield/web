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
		const highlighted = `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
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

	// Headings
	html = html.replace(/^### (.*?)$/gm, '<h3 className="text-2xl font-bold mt-6 mb-3">$1</h3>');
	html = html.replace(/^## (.*?)$/gm, '<h2 className="text-3xl font-bold mt-8 mb-4">$1</h2>');
	html = html.replace(/^# (.*?)$/gm, '<h1 className="text-4xl font-bold mb-4">$1</h1>');

	// Bold and italic
	html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
	html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
	html = html.replace(/____(.*?)____/g, '<strong><em>$1</em></strong>');
	html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
	html = html.replace(/_(.*?)_/g, '<em>$1</em>');

	// Inline code (backticks - not in code blocks)
	html = html.replace(/`([^`]+)`/g, '<code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>');

	// Links
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" className="text-emerald-600 dark:text-emerald-400 hover:underline">$1</a>');

	// Unordered lists
	html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
	html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
	html = html.replace(/(<li>.*?<\/li>)/s, (match) => {
		return `<ul className="list-disc list-inside ml-4 mb-4">\n${match}\n</ul>`;
	});

	// Ordered lists
	html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');

	// Blockquotes
	html = html.replace(/^> (.*?)$/gm, '<blockquote className="border-l-4 border-emerald-500 pl-4 italic text-gray-600 dark:text-gray-400">$1</blockquote>');

	// Line breaks - convert multiple newlines to paragraphs
	html = html.replace(/\n\n+/g, '</p><p className="mb-4">');
	html = `<p className="mb-4">${html}</p>`;

	// Clean up empty paragraphs
	html = html.replace(/<p[^>]*><\/p>/g, '');

	// Remove extra className attributes for proper JSX rendering
	// Actually, we need to convert these to proper HTML attributes
	html = html.replace(/className="/g, 'class="');

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
