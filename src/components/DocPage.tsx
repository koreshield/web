import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { DocBreadcrumb } from './DocBreadcrumb';
import { TableOfContents } from './TableOfContents';
import { extractNodeText, slugifyHeading } from './tableOfContentsUtils';
import { getDocPageByRoute, isSectionIndexRoute, type DocLink } from '../docs/loader';

interface CodeBlockProps {
	language: string;
	code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		void navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="relative group my-6">
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

function normalizeRelativeDocLink(currentPath: string, href: string) {
	if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
		return href;
	}

	if (href.startsWith('/')) {
		if (href.startsWith('/docs')) {
			return href.replace(/\.mdx?$/i, '');
		}
		return href;
	}

	const cleaned = href.replace(/\.mdx?$/i, '');
	const baseSegments = currentPath.replace(/^\/docs\/?/, '').split('/').filter(Boolean);
	if (!isSectionIndexRoute(currentPath)) {
		baseSegments.pop();
	}

	for (const segment of cleaned.split('/')) {
		if (!segment || segment === '.') continue;
		if (segment === '..') {
			baseSegments.pop();
			continue;
		}
		baseSegments.push(segment);
	}

	return `/docs/${baseSegments.join('/')}`.replace(/\/+/g, '/');
}

function transformDocContent(content: string) {
	return content
		.replace(/^import\s+.*$/gm, '')
		.replace(/<DocCardList\s*\/>/g, '')
		.replace(/^::::(note|info|tip|warning|danger)\s*$/gm, '> **$1**')
		.replace(/^::::\s*$/gm, '')
		.replace(/https:\/\/docs\.koreshield\.com\/docs\/?/g, '/docs/')
		.replace(/https:\/\/docs\.koreshield\.com/g, '/docs');
}

function ChildLinks({ links }: { links: DocLink[] }) {
	if (links.length === 0) {
		return null;
	}

	return (
		<div className="mt-10 grid gap-4 sm:grid-cols-2">
			{links.map((link) => (
				<Link
					key={link.path}
					to={link.path}
					className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 p-5 no-underline hover:border-emerald-400/50 hover:bg-white dark:hover:bg-gray-900 transition-colors"
				>
					<div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{link.title}</div>
					{link.description && (
						<div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{link.description}</div>
					)}
				</Link>
			))}
		</div>
	);
}

const markdownComponents: Components = {
	pre: ({ children }) => <>{children}</>,
	h1: ({ children }) => {
		const headingId = slugifyHeading(extractNodeText(children));
		return (
			<h1 id={headingId} data-heading-id={headingId} className="scroll-mt-24">
				{children}
			</h1>
		);
	},
	h2: ({ children }) => {
		const headingId = slugifyHeading(extractNodeText(children));
		return (
			<h2 id={headingId} data-heading-id={headingId} className="scroll-mt-24">
				{children}
			</h2>
		);
	},
	h3: ({ children }) => {
		const headingId = slugifyHeading(extractNodeText(children));
		return (
			<h3 id={headingId} data-heading-id={headingId} className="scroll-mt-24">
				{children}
			</h3>
		);
	},
	table: ({ children }) => (
		<div className="my-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
			<table className="min-w-full border-collapse text-sm">{children}</table>
		</div>
	),
	thead: ({ children }) => (
		<thead className="bg-gray-100 dark:bg-gray-900">{children}</thead>
	),
	th: ({ children }) => (
		<th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-900 dark:border-gray-800 dark:text-gray-100">
			{children}
		</th>
	),
	td: ({ children }) => (
		<td className="border-b border-gray-200 px-4 py-3 align-top text-gray-700 dark:border-gray-800 dark:text-gray-300">
			{children}
		</td>
	),
	blockquote: ({ children }) => (
		<blockquote className="my-6 border-l-4 border-emerald-500 bg-emerald-50/60 px-4 py-3 text-gray-800 dark:bg-emerald-950/20 dark:text-gray-200">
			{children}
		</blockquote>
	),
	code: ({ className, children, ...props }) => {
		const match = /language-(\w+)/.exec(className || '');
		const code = String(children).replace(/\n$/, '');
		if (match) {
			return <CodeBlock language={match[1]} code={code} />;
		}
		return (
			<code
				{...props}
				className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-emerald-600 dark:text-emerald-400"
			>
				{children}
			</code>
		);
	},
};

export function DocPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const page = getDocPageByRoute(location.pathname);

	const renderedContent = useMemo(
		() => (page ? transformDocContent(page.content) : ''),
		[page]
	);

	if (!page) {
		return (
			<div className="max-w-4xl mx-auto">
				<DocBreadcrumb />
				<div className="text-center py-12">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Page Not Found</h1>
					<p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
						The documentation page you&apos;re looking for doesn&apos;t exist.
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
			<div className="flex-1 min-w-0">
				<DocBreadcrumb />

				<header className="mb-12 pb-8 border-b border-gray-200 dark:border-gray-800">
					<h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
						{page.title}
					</h1>
					{page.description && (
						<p className="text-xl text-gray-600 dark:text-gray-400">
							{page.description}
						</p>
					)}
					{page.lastUpdated && (
						<p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
							Last updated {page.lastUpdated}
						</p>
					)}
				</header>

				<article className="prose prose-invert max-w-none prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none">
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							...markdownComponents,
							a: ({ href = '', children }) => {
								const normalized = normalizeRelativeDocLink(page.path, href);
								const external = normalized.startsWith('http://') || normalized.startsWith('https://');
								return (
									<a href={normalized} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
										{children}
									</a>
								);
							},
						}}
					>
						{renderedContent}
					</ReactMarkdown>
				</article>

				<ChildLinks links={page.childLinks} />

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

			<TableOfContents content={renderedContent} />
		</div>
	);
}
