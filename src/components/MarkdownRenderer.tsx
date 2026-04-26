import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
	content: string;
}

/**
 * Simple markdown to React renderer
 * Handles common markdown syntax and adds syntax highlighting for code blocks
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
	const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

	// Split content into blocks
	const blocks = content.split(/\n(?=#+\s|```|>\s|-\s|\*\s|\d+\.|$)/);

	return (
		<div className="prose prose-invert max-w-none dark:prose-invert">
			{blocks.map((block, idx) => {
				block = block.trim();
				if (!block) return null;

				// Code blocks
				if (block.startsWith('```')) {
					const match = block.match(/```(\w+)?\n([\s\S]*?)\n```/);
					if (match) {
						const [, lang, code] = match;
						return (
							<CodeBlock key={idx} code={code} language={lang} blockIdx={idx} copiedBlock={copiedBlock} setCopiedBlock={setCopiedBlock} />
						);
					}
				}

				// Headings
				if (block.startsWith('#')) {
					const match = block.match(/^(#{1,6})\s+(.+)$/m);
					if (match) {
						const [, hashes, text] = match;
						const level = hashes.length as 1 | 2 | 3 | 4 | 5 | 6;
						const classMap: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
							1: 'text-4xl font-bold mt-8 mb-4 text-foreground',
							2: 'text-3xl font-bold mt-6 mb-3 text-foreground',
							3: 'text-2xl font-bold mt-5 mb-2 text-foreground',
							4: 'text-xl font-bold mt-4 mb-2 text-foreground',
							5: 'text-lg font-bold mt-3 mb-1 text-foreground',
							6: 'text-base font-bold mt-2 mb-1 text-foreground',
						};
						const classes = classMap[level];

						if (level === 1) return <h1 key={idx} className={classes}>{parseInlineMarkdown(text)}</h1>;
						if (level === 2) return <h2 key={idx} className={classes}>{parseInlineMarkdown(text)}</h2>;
						if (level === 3) return <h3 key={idx} className={classes}>{parseInlineMarkdown(text)}</h3>;
						if (level === 4) return <h4 key={idx} className={classes}>{parseInlineMarkdown(text)}</h4>;
						if (level === 5) return <h5 key={idx} className={classes}>{parseInlineMarkdown(text)}</h5>;
						if (level === 6) return <h6 key={idx} className={classes}>{parseInlineMarkdown(text)}</h6>;
					}
				}

				// Blockquotes
				if (block.startsWith('>')) {
					const quoteText = block
						.split('\n')
						.map((line) => line.replace(/^>\s?/, ''))
						.join('\n');
					return (
						<blockquote key={idx} className="border-l-4 border-primary pl-4 py-2 text-gray-300 italic">
							{parseInlineMarkdown(quoteText)}
						</blockquote>
					);
				}

				// Lists
				if (block.startsWith('-') || block.startsWith('*') || /^\d+\./.test(block)) {
					const isOrdered = /^\d+\./.test(block);
					const ListTag = isOrdered ? 'ol' : 'ul';
					const items = block
						.split('\n')
						.filter((line) => line.trim())
						.map((line) => line.replace(/^[-*]\s|\d+\.\s/, ''));

					return React.createElement(
						ListTag,
						{ key: idx, className: `list-${isOrdered ? 'decimal' : 'disc'} pl-6 space-y-2 text-foreground/90` },
						items.map((item, itemIdx) =>
							React.createElement('li', { key: itemIdx }, parseInlineMarkdown(item))
						)
					);
				}

				// Paragraphs
				if (block) {
					return (
						<p key={idx} className="mb-4 leading-relaxed text-foreground/90">
							{parseInlineMarkdown(block)}
						</p>
					);
				}

				return null;
			})}
		</div>
	);
}

interface CodeBlockProps {
	code: string;
	language?: string;
	blockIdx: number;
	copiedBlock: number | null;
	setCopiedBlock: (idx: number | null) => void;
}

function CodeBlock({ code, language, blockIdx, copiedBlock, setCopiedBlock }: CodeBlockProps) {
	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopiedBlock(blockIdx);
		setTimeout(() => setCopiedBlock(null), 2000);
	};

	const displayLang = language || 'code';

	return (
		<div key={blockIdx} className="relative my-6 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
			<div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
				<span className="text-sm text-slate-400 font-mono">{displayLang}</span>
				<button
					onClick={handleCopy}
					className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
					title="Copy code"
				>
					{copiedBlock === blockIdx ? (
						<Check size={16} className="text-green-500" />
					) : (
						<Copy size={16} />
					)}
				</button>
			</div>
			<pre className="px-4 py-3 text-sm text-slate-100 font-mono overflow-auto max-h-96">
				<code>{code}</code>
			</pre>
		</div>
	);
}

/**
 * Parse inline markdown (bold, italic, links, code)
 */
function parseInlineMarkdown(text: string): React.ReactNode {
	const elements: React.ReactNode[] = [];
	let lastIndex = 0;

	// Regex for inline elements: **bold**, *italic*, `code`, [link](url)
	const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g;
	let match;

	while ((match = regex.exec(text)) !== null) {
		// Add text before match
		if (match.index > lastIndex) {
			elements.push(text.substring(lastIndex, match.index));
		}

		// Add matched element
		if (match[1]) {
			// Bold
			elements.push(
				<strong key={`bold-${match.index}`} className="font-bold text-foreground">
					{match[1]}
				</strong>
			);
		} else if (match[2]) {
			// Italic
			elements.push(
				<em key={`italic-${match.index}`} className="italic text-foreground/90">
					{match[2]}
				</em>
			);
		} else if (match[3]) {
			// Code
			elements.push(
				<code key={`code-${match.index}`} className="bg-slate-900 text-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">
					{match[3]}
				</code>
			);
		} else if (match[4] && match[5]) {
			// Link
			elements.push(
				<a
					key={`link-${match.index}`}
					href={match[5]}
					className="text-primary hover:underline"
					target={match[5].startsWith('http') ? '_blank' : undefined}
					rel={match[5].startsWith('http') ? 'noopener noreferrer' : undefined}
				>
					{match[4]}
				</a>
			);
		}

		lastIndex = regex.lastIndex;
	}

	// Add remaining text
	if (lastIndex < text.length) {
		elements.push(text.substring(lastIndex));
	}

	return elements.length > 0 ? elements : text;
}
