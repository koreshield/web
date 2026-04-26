import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { getDocByPath } from '../docs/loader';
import { DocBreadcrumb } from './DocBreadcrumb';
import { TableOfContents } from './TableOfContents';
import { useState } from 'react';

// Simple code display (no special highlighting needed)

interface CodeBlockProps {
	language: string;
	code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="relative group">
			<pre className="bg-gray-900 dark:bg-gray-950 text-gray-50 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed border border-gray-800 dark:border-gray-700">
				<code className={`language-${language}`}>{code}</code>
			</pre>
			<button
				onClick={handleCopy}
				className="absolute top-3 right-3 p-2 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100"
				title="Copy code"
			>
				{copied ? (
					<Check size={16} className="text-green-400" />
				) : (
					<Copy size={16} className="text-gray-400" />
				)}
			</button>
		</div>
	);
}

export function DocPage() {
	const location = useLocation();
	const navigate = useNavigate();

	// Extract section and doc from URL path
	const pathParts = location.pathname
		.replace(/^\/docs\/?/, '')
		.split('/')
		.filter(Boolean);

	const section = pathParts[0] || '';
	const doc = pathParts[1] || '';

	const docContent = getDocByPath(section, doc);

	if (!docContent) {
		return (
			<div className="max-w-4xl mx-auto">
				<DocBreadcrumb />
				<div className="text-center py-12">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Page Not Found</h1>
					<p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
						The documentation page you're looking for doesn't exist.
					</p>
					<button
						onClick={() => navigate('/docs')}
						className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Documentation
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex gap-8">
			{/* Main content */}
			<div className="flex-1 min-w-0">
				<DocBreadcrumb />

				{/* Article header */}
				<header className="mb-12 pb-8 border-b border-gray-200 dark:border-gray-800">
					<h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
						{docContent.title}
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-400">
						{docContent.description}
					</p>
				</header>

				{/* Content */}
				<article className="prose dark:prose-invert max-w-none">
					<div className="space-y-6">
						{docContent.content.split('\n\n').map((paragraph, idx) => {
							// Handle headings
							if (paragraph.startsWith('# ')) {
								return (
									<h1
										key={idx}
										data-heading-id={`heading-${idx}`}
										className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-12 mb-6 scroll-mt-20"
									>
										{paragraph.slice(2).trim()}
									</h1>
								);
							}

							if (paragraph.startsWith('## ')) {
								return (
									<h2
										key={idx}
										data-heading-id={`heading-${idx}`}
										className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-10 mb-4 scroll-mt-20"
									>
										{paragraph.slice(3).trim()}
									</h2>
								);
							}

							if (paragraph.startsWith('### ')) {
								return (
									<h3
										key={idx}
										data-heading-id={`heading-${idx}`}
										className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-3 scroll-mt-20"
									>
										{paragraph.slice(4).trim()}
									</h3>
								);
							}

							// Handle code blocks
							if (paragraph.startsWith('```')) {
								const lines = paragraph.split('\n');
								const lang = lines[0].slice(3) || 'bash';
								const code = lines.slice(1, -1).join('\n');

								return (
									<div key={idx} className="my-6">
										<CodeBlock language={lang} code={code} />
									</div>
								);
							}

							// Handle lists
							if (paragraph.startsWith('- ')) {
								return (
									<ul key={idx} className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
										{paragraph.split('\n').map((item, i) => {
											const text = item.slice(2).trim();
											// Handle bold text
											const parts = text.split(/\*\*(.*?)\*\*/g);
											return (
												<li key={i}>
													{parts.map((part, j) =>
														j % 2 === 1 ? (
															<strong key={j}>{part}</strong>
														) : (
															<span key={j}>{part}</span>
														)
													)}
												</li>
											);
										})}
									</ul>
								);
							}

							// Handle regular paragraphs with formatting
							const parts = paragraph.split(/(\*\*.*?\*\*|`.*?`)/g);
							return (
								<p key={idx} className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
									{parts.map((part, i) => {
										if (part.startsWith('**') && part.endsWith('**')) {
											return <strong key={i}>{part.slice(2, -2)}</strong>;
										}
										if (part.startsWith('`') && part.endsWith('`')) {
											return (
												<code
													key={i}
													className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-emerald-600 dark:text-emerald-400"
												>
													{part.slice(1, -1)}
												</code>
											);
										}
										return part;
									})}
								</p>
							);
						})}
					</div>
				</article>

				{/* Navigation */}
				<div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
					<button
						onClick={() => navigate(-1)}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
					>
						<ArrowLeft size={18} />
						Back
					</button>
				</div>
			</div>

			{/* Table of Contents */}
			<TableOfContents content={docContent.content} />
		</div>
	);
}
