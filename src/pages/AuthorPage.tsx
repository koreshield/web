import { ArrowLeft, ArrowRight, Linkedin } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { listBlogPosts } from '../blog/loader';
import { SEOMeta } from '../components/SEOMeta';
import { getAuthorBySlug } from '../content/authors';

export default function AuthorPage() {
	const { slug } = useParams<{ slug: string }>();
	const author = slug ? getAuthorBySlug(slug) : undefined;
	if (!author) return <Navigate to="/about" replace />;

	const articles = listBlogPosts({ filters: { author: author.name }, sortBy: 'date-desc' });
	const canonical = `https://koreshield.ai/authors/${author.slug}`;

	return (
		<main className="min-h-screen bg-background px-6 py-20 text-foreground">
			<SEOMeta
				title={`${author.name}, ${author.role}`}
				description={`${author.bio} Read ${author.name}'s AI and LLM security articles for Koreshield.`}
				canonicalUrl={canonical}
				structuredData={{
					'@context': 'https://schema.org',
					'@type': 'Person',
					'@id': `${canonical}#person`,
					name: author.name,
					jobTitle: author.role,
					description: author.bio,
					image: `https://koreshield.ai${author.image}`,
					url: canonical,
					sameAs: [author.linkedin],
					worksFor: { '@id': 'https://koreshield.ai/#organization' },
				}}
			/>

			<div className="mx-auto max-w-5xl">
				<Link to="/about" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
					<ArrowLeft className="h-4 w-4" /> About Koreshield
				</Link>
				<section className="mt-8 grid gap-8 rounded-[2rem] border border-border bg-card/75 p-7 md:grid-cols-[180px_1fr] md:p-10">
					<img src={author.image} alt={author.name} width="180" height="180" className="aspect-square w-full max-w-[180px] rounded-2xl object-cover" />
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-electric-green">Koreshield author</p>
						<h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">{author.name}</h1>
						<p className="mt-2 font-semibold text-muted-foreground">{author.role}</p>
						<p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">{author.bio}</p>
						<a href={author.linkedin} target="_blank" rel="noreferrer noopener" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-electric-green">
							<Linkedin className="h-4 w-4" /> LinkedIn profile
						</a>
					</div>
				</section>

				<section className="py-16" aria-labelledby="author-articles">
					<h2 id="author-articles" className="text-3xl font-extrabold tracking-[-0.03em]">Articles by {author.name}</h2>
					<div className="mt-8 grid gap-5 md:grid-cols-2">
						{articles.map((article) => (
							<Link key={article.slug} to={article.path} className="group rounded-2xl border border-border bg-card/70 p-6 transition-colors hover:border-electric-green/35">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{article.date}</p>
								<h3 className="mt-3 text-xl font-bold group-hover:text-electric-green">{article.title}</h3>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
								<span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-electric-green">Read article <ArrowRight className="h-4 w-4" /></span>
							</Link>
						))}
					</div>
				</section>
			</div>
		</main>
	);
}
