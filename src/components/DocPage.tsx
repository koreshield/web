import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarkdownRenderer } from './MarkdownRenderer';
import { parseFrontMatter, getDocContent, docExists } from '../lib/documentationLoader';
import type { DocFrontMatter } from '../lib/documentationLoader';
import { ArrowLeft, Calendar } from 'lucide-react';

interface DocPageProps {
	docPath: string;
}

export function DocPage({ docPath }: DocPageProps) {
	const [frontMatter, setFrontMatter] = useState<DocFrontMatter | null>(null);
	const [content, setContent] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const loadDoc = () => {
			try {
				setLoading(true);
				setError(null);

				if (!docExists(docPath)) {
					throw new Error(`Doc not found: ${docPath}`);
				}

				const rawContent = getDocContent(docPath);
				if (!rawContent) {
					throw new Error(`Could not load content for: ${docPath}`);
				}

				const { frontMatter: fm, body } = parseFrontMatter(rawContent);
				setFrontMatter(fm);
				setContent(body);
			} catch (err) {
				console.error('Error loading doc:', err);
				setError('Documentation page not found.');
			} finally {
				setLoading(false);
			}
		};

		loadDoc();
	}, [docPath]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="inline-block animate-spin">
						<div className="h-8 w-8 border-4 border-primary border-transparent border-t-primary rounded-full" />
					</div>
					<p className="mt-4 text-foreground/60">Loading documentation...</p>
				</div>
			</div>
		);
	}

	if (error || !frontMatter) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-foreground mb-2">Page Not Found</h1>
					<p className="text-foreground/60 mb-6">{error || 'The documentation page could not be found.'}</p>
					<button
						onClick={() => navigate('/docs')}
						className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
					>
						<ArrowLeft size={16} />
						Back to Documentation
					</button>
				</div>
			</div>
		);
	}

	return (
		<article className="prose prose-invert max-w-none">
			{/* Breadcrumb */}
			<button
				onClick={() => navigate('/docs')}
				className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors mb-6"
			>
				<ArrowLeft size={16} />
				Back to Documentation
			</button>

			{/* Header */}
			<header className="mb-8 border-b border-border/30 pb-8">
				<h1 className="text-4xl font-bold text-foreground mb-3">{frontMatter.title}</h1>
				{frontMatter.description && (
					<p className="text-lg text-foreground/70">{frontMatter.description}</p>
				)}
				{frontMatter.last_update?.date && (
					<div className="flex items-center gap-2 mt-4 text-sm text-foreground/50">
						<Calendar size={16} />
						<span>Last updated: {frontMatter.last_update.date}</span>
					</div>
				)}
			</header>

			{/* Content */}
			<div className="space-y-6">
				<MarkdownRenderer content={content} />
			</div>

			{/* Footer Navigation */}
			<footer className="mt-12 pt-8 border-t border-border/30">
				<button
					onClick={() => navigate('/docs')}
					className="inline-flex items-center gap-2 px-4 py-2 bg-card hover:bg-card/80 border border-border/50 rounded-lg transition-colors text-foreground/70 hover:text-foreground"
				>
					<ArrowLeft size={16} />
					Back to Documentation
				</button>
			</footer>
		</article>
	);
}
