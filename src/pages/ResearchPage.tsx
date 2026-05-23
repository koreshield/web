import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ExternalLink, FileText, Microscope, Shield, Waypoints } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { publishedPapers, reportArticles, researchNotes } from '../content/research';

const researchLanes = [
	{ icon: Shield, title: 'Prompt injection', body: 'Direct override, indirect injection, jailbreak drift, and policy bypass attempts.' },
	{ icon: Waypoints, title: 'RAG and agents', body: 'Document poisoning, tool-output hijacking, cross-document attacks, and action boundaries.' },
	{ icon: Microscope, title: 'Production signals', body: 'Classifier behavior, false positives, latency, auditability, and tenant-aware evidence.' },
];

function Tag({ children }: { children: React.ReactNode }) {
	return <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-xs text-muted-foreground">{children}</span>;
}

function PaperCard({ item, index }: { item: (typeof publishedPapers)[number]; index: number }) {
	return (
		<motion.article
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.4, delay: index * 0.07 }}
			className="group rounded-[1.75rem] border border-border bg-card/90 p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-electric-green/30 hover:shadow-xl hover:shadow-emerald-900/5"
		>
			<div className="mb-5 flex flex-wrap items-center gap-3">
				<span className="rounded-full border border-electric-green/30 bg-electric-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-electric-green">{item.type}</span>
				<span className="text-xs text-muted-foreground">{item.date}</span>
			</div>
			<h3 className="text-2xl font-extrabold leading-tight tracking-[-0.03em]">{item.title}</h3>
			<p className="mt-3 text-sm text-muted-foreground">{item.authors} · {item.affiliation}</p>
			<p className="mt-5 text-sm leading-relaxed text-muted-foreground">{item.abstract}</p>
			<div className="mt-6 flex flex-wrap gap-2">
				{item.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
			</div>
			<a href={item.href} target="_blank" rel="noreferrer noopener" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-electric-green hover:underline">
				Read paper <ExternalLink className="h-4 w-4" />
			</a>
		</motion.article>
	);
}

function ReportCard({ item, index }: { item: (typeof reportArticles)[number]; index: number }) {
	return (
		<motion.article
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.4, delay: index * 0.07 }}
			className="rounded-[1.75rem] border border-border bg-card/90 p-7 shadow-sm"
		>
			<div className="mb-5 flex flex-wrap items-center gap-3">
				<span className="rounded-full border border-electric-green/30 bg-electric-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-electric-green">{item.type}</span>
				<span className="text-xs text-muted-foreground">{item.date}</span>
				<span className="text-xs text-muted-foreground">{item.readTime}</span>
			</div>
			<h3 className="text-2xl font-extrabold leading-tight tracking-[-0.03em]">{item.title}</h3>
			<p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
			<Link to={`/research/${item.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-electric-green hover:underline">
				Read report <ArrowRight className="h-4 w-4" />
			</Link>
		</motion.article>
	);
}

export default function ResearchPage() {
	const featured = reportArticles[0];

	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Research"
				description="Applied LLM security research from Koreshield on prompt injection, RAG pipelines, agents, and production attack patterns."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_78%_14%,rgba(59,130,246,0.08),transparent_24%)]" />
				<div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<Microscope className="h-3.5 w-3.5" />
							Research
						</span>
						<h1 className="max-w-4xl text-5xl font-extrabold tracking-[-0.055em] md:text-7xl">
							Research that ships into the security layer.
						</h1>
						<p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							Our research focuses on the messy parts of production AI: retrieved context, tool calls, policy evidence, and attacks that do not stay inside one prompt.
						</p>
					</motion.div>

					{featured ? (
						<motion.div
							initial={{ opacity: 0, y: 18 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.55, delay: 0.1 }}
							className="rounded-[2rem] border border-border bg-card/90 p-7 shadow-2xl shadow-emerald-900/10 dark:bg-card/75"
						>
							<p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">Featured report</p>
							<h2 className="text-3xl font-extrabold tracking-[-0.04em]">{featured.title}</h2>
							<p className="mt-4 text-sm leading-relaxed text-muted-foreground">{featured.description}</p>
							<div className="mt-6 flex flex-wrap gap-2">
								{featured.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
							</div>
							<Link to={`/research/${featured.slug}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-electric-green px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright">
								Read featured report <ArrowRight className="h-4 w-4" />
							</Link>
						</motion.div>
					) : null}
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
					{researchLanes.map((lane, index) => (
						<motion.div
							key={lane.title}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4, delay: index * 0.07 }}
							className="rounded-[1.5rem] border border-border bg-card/85 p-6 shadow-sm"
						>
							<lane.icon className="mb-5 h-6 w-6 text-electric-green" />
							<h3 className="text-xl font-bold">{lane.title}</h3>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{lane.body}</p>
						</motion.div>
					))}
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
						<div>
							<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Papers</p>
							<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Published work.</h2>
						</div>
						<p className="max-w-xl text-sm leading-relaxed text-muted-foreground">Architecture papers and preprints behind Koreshield's RAG and prompt-injection threat model.</p>
					</div>
					<div className="grid gap-6 lg:grid-cols-2">
						{publishedPapers.map((item, index) => <PaperCard key={item.title} item={item} index={index} />)}
					</div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-10">
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Reports & advisories</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Operational findings.</h2>
					</div>
					<div className="grid gap-6 lg:grid-cols-2">
						{reportArticles.map((item, index) => <ReportCard key={item.slug} item={item} index={index} />)}
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-10">
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Research notes</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Short notes from the lab.</h2>
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{researchNotes.map((item, index) => (
							<motion.article
								key={item.slug}
								initial={{ opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.35, delay: index * 0.05 }}
								className="rounded-[1.35rem] border border-border bg-card/85 p-5 shadow-sm"
							>
								<FileText className="mb-4 h-5 w-5 text-electric-green" />
								<h3 className="font-bold leading-snug">{item.title}</h3>
								<p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
								<Link to={`/research/${item.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-electric-green hover:underline">
									Read note <ArrowRight className="h-4 w-4" />
								</Link>
							</motion.article>
						))}
					</div>
				</div>
			</section>

			<section className="border-t border-border px-6 py-20">
				<div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[2rem] border border-border bg-card/85 p-7 shadow-sm md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="text-3xl font-extrabold tracking-[-0.03em]">Responsible disclosure</h2>
						<p className="mt-2 text-sm text-muted-foreground">If you have found an LLM infrastructure issue, we can coordinate a remediation path.</p>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row">
						<a href="mailto:hello@koreshield.com" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright">
							Contact us <ArrowRight className="h-4 w-4" />
						</a>
						<Link to="/blog" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted">
							Blog <BookOpen className="h-4 w-4" />
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
