import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { getResearchArticleBySlug } from '../content/research';

export default function ResearchArticlePage() {
	const { slug } = useParams<{ slug: string }>();
	const article = slug ? getResearchArticleBySlug(slug) : null;

	if (!article) {
		return <Navigate to="/research" replace />;
	}

	const canonicalUrl = `https://koreshield.ai/research/${article.slug}`;
	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: article.title,
		description: article.description,
		author: { '@type': 'Person', name: article.authors },
		publisher: { '@type': 'Organization', name: 'Koreshield', url: 'https://koreshield.ai' },
		datePublished: article.date,
		mainEntityOfPage: canonicalUrl,
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title={article.title}
				description={article.description}
				author={article.authors}
				ogType="article"
				canonicalUrl={canonicalUrl}
				section="Research"
				structuredData={structuredData}
			/>

			<section className="relative overflow-hidden border-b border-border px-6 py-20 ambient-glow">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.14),transparent_28%)]" />
				<div className="relative mx-auto max-w-4xl">
					<Link to="/research" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground">
						<ArrowLeft className="h-4 w-4" />
						Back to research
					</Link>
					<div className="mt-8 flex flex-wrap items-center gap-3">
						<span className="rounded-full border border-electric-green/30 bg-electric-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-electric-green">
							{article.type}
						</span>
						<span className="text-sm text-muted-foreground">{article.date}</span>
						<span className="text-sm text-muted-foreground">{article.readTime}</span>
					</div>
					<h1 className="mt-6 text-4xl font-extrabold tracking-[-0.045em] md:text-6xl">{article.title}</h1>
					<p className="mt-6 text-lg leading-8 text-muted-foreground">{article.summary}</p>
					<div className="mt-8 flex flex-wrap gap-2">
						{article.tags.map((tag) => (
							<span key={tag} className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground">
								{tag}
							</span>
						))}
					</div>
				</div>
			</section>

			<section className="px-6 py-16">
				<div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
					<article className="min-w-0 rounded-[2rem] border border-border bg-card/80 p-7 shadow-sm md:p-10">
						<div className="space-y-12">
							{article.sections.map((section, index) => (
								<motion.section
									key={section.heading}
									initial={{ opacity: 0, y: 16 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.35, delay: index * 0.04 }}
									className="space-y-5"
								>
									<h2 className="text-2xl font-extrabold tracking-[-0.03em]">{section.heading}</h2>
									<div className="space-y-5">
										{section.paragraphs.map((paragraph) => (
											<p key={paragraph} className="text-base leading-8 text-muted-foreground">
												{paragraph}
											</p>
										))}
									</div>
								</motion.section>
							))}
						</div>
					</article>

					<aside className="lg:sticky lg:top-24 lg:self-start">
						<div className="rounded-[1.5rem] border border-border bg-card/90 p-6 shadow-sm">
							<FileText className="mb-5 h-6 w-6 text-electric-green" />
							<p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Research entry</p>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								{article.authors} · {article.affiliation}
							</p>
							<div className="mt-6 space-y-3">
								<Link to="/research" className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
									Browse research
								</Link>
								<a href="mailto:hello@koreshield.com" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold transition-colors hover:bg-muted">
									Contact research <ExternalLink className="h-4 w-4" />
								</a>
							</div>
						</div>
					</aside>
				</div>
			</section>
		</div>
	);
}
