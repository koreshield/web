import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import { DocBreadcrumb } from './DocBreadcrumb';
import { TableOfContents } from './TableOfContents';
import { CodeBlock } from './CodeBlock';
import { extractNodeText, slugifyHeading } from './tableOfContentsUtils';
import { getDocPageByRoute, isSectionIndexRoute, type DocLink } from '../docs/loader';
import { SEOMeta } from './SEOMeta';

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
		// Strip leading h1 - the page title is already rendered in the <header>
		// above the article, so the "# Title" at the top of each MDX file would
		// create a duplicate. Remove the very first h1 line (and the blank line
		// that typically follows it) if it appears before any real content.
		.replace(/^\s*#\s+[^\n]+\n+/, '')
		.replace(/^import\s+.*$/gm, '')
		.replace(/<DocCardList\s*\/>/g, '')
		.replace(/^:::(note|info|tip|warning|caution|danger)([^\n]*)\n([\s\S]*?)^:::\s*$/gm, (_match, type, titleText, body) => {
			const title = titleText.trim();
			const typeLabels: Record<string, string> = {
				note: 'Note', info: 'Note', tip: 'Tip',
				warning: 'Warning', caution: 'Important', danger: 'Important',
			};
			const label = title || typeLabels[type] || type;
			const lines = body.trimEnd().split('\n').map((l: string) => `> ${l}`).join('\n');
			return `> **${label}**\n>\n${lines}`;
		})
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
					className="block rounded-xl border border-border bg-card/60 p-5 no-underline hover:border-primary/40 hover:bg-card transition-colors"
				>
					<div className="text-lg font-semibold text-foreground">{link.title}</div>
					{link.description && (
						<div className="mt-2 text-sm text-muted-foreground">{link.description}</div>
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
		<div className="my-6 overflow-x-auto rounded-xl border border-border">
			<table className="min-w-full border-collapse text-sm">{children}</table>
		</div>
	),
	thead: ({ children }) => (
		<thead className="bg-accent/60">{children}</thead>
	),
	th: ({ children }) => (
		<th className="border-b border-border px-4 py-3 text-left font-semibold text-foreground">
			{children}
		</th>
	),
	td: ({ children }) => (
		<td className="border-b border-border px-4 py-3 align-top text-muted-foreground">
			{children}
		</td>
	),
	blockquote: ({ children }) => (
		<blockquote className="my-6 border-l-4 border-primary bg-primary/5 px-4 py-3 text-foreground">
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
				className="bg-accent px-2 py-0.5 rounded text-sm font-mono text-primary"
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
				<SEOMeta title="Documentation Page Not Found" noindex />
				<DocBreadcrumb />
				<div className="text-center py-12">
					<h1 className="text-4xl font-bold text-foreground mb-4">Page Not Found</h1>
					<p className="text-lg text-muted-foreground mb-6">
						The documentation page you&apos;re looking for doesn&apos;t exist.
					</p>
					<button
						onClick={() => navigate('/docs')}
						className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Documentation
					</button>
				</div>
			</div>
		);
	}

	const breadcrumbs = page.path
		.split('/')
		.filter(Boolean)
		.map((segment, index, segments) => ({
			name: segment === 'docs'
				? 'Documentation'
				: segment.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
			url: `https://koreshield.ai/${segments.slice(0, index + 1).join('/')}`,
		}));

	return (
		<div className="flex gap-8">
			<SEOMeta
				title={page.title === 'Documentation' ? 'Documentation' : `${page.title} Documentation`}
				description={page.description || `Learn how to configure and use ${page.title} with Koreshield.`}
				canonicalUrl={`https://koreshield.ai${page.path}`}
				breadcrumbs={breadcrumbs}
				structuredData={{
					'@context': 'https://schema.org',
					'@type': 'TechArticle',
					headline: page.title,
					description: page.description || `Koreshield documentation for ${page.title}.`,
					url: `https://koreshield.ai${page.path}`,
					dateModified: page.lastUpdated,
					publisher: { '@type': 'Organization', name: 'Koreshield', url: 'https://koreshield.ai' },
				}}
			/>
			<div className="flex-1 min-w-0">
				<DocBreadcrumb />

				<header className="mb-12 pb-8 border-b border-border">
					<h1 className="text-5xl font-bold text-foreground mb-4 leading-tight">
						{page.title}
					</h1>
					{page.description && (
						<p className="text-xl text-muted-foreground">
							{page.description}
						</p>
					)}
					{page.lastUpdated && (
						<p className="mt-4 text-sm text-muted-foreground/60">
							Last updated {page.lastUpdated}
						</p>
					)}
				</header>

				<article className="prose dark:prose-invert max-w-none prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none">
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

				<div className="mt-12 pt-8 border-t border-border">
					<button
						onClick={() => navigate(-1)}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
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
