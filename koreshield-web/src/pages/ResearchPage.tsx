import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ExternalLink, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { publishedPapers, reportArticles, researchNotes } from '../content/research';

const researchAreas = [
	{
		icon: <Shield className="h-6 w-6 text-electric-green" />,
		title: 'Prompt Injection',
		body: 'Direct and indirect injection techniques, bypass methods, detection efficacy across model families, and the structural vulnerability created when data and instruction boundaries are not enforced at the architecture level.',
	},
	{
		icon: <FileText className="h-6 w-6 text-electric-green" />,
		title: 'RAG Pipeline Security',
		body: 'Document poisoning, context hijacking, cross-document fragmentation attacks, and the challenge of inspecting retrieved content before model inference without introducing latency that degrades production usability.',
	},
	{
		icon: <BookOpen className="h-6 w-6 text-electric-green" />,
		title: 'Agentic Threat Modelling',
		body: 'Tool call abuse, orchestration manipulation, and multi-step attack patterns unique to autonomous AI systems, where a single injection can redirect an entire pipeline rather than just a single response.',
	},
];

function PublishedPaperCard({
	item,
	index,
}: {
	item: (typeof publishedPapers)[number];
	index: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.4, delay: index * 0.07 }}
			className="rounded-2xl border border-border bg-card p-8"
		>
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<span className="rounded-full border border-electric-green/30 bg-electric-green/10 px-2.5 py-1 text-xs font-semibold text-electric-green">
					{item.type}
				</span>
				<span className="text-xs text-muted-foreground">{item.date}</span>
			</div>

			<h3 className="text-xl font-bold leading-snug">{item.title}</h3>

			<p className="mt-2 text-sm text-muted-foreground">
				{item.authors} &middot; {item.affiliation}
			</p>

			<p className="mt-5 text-sm leading-relaxed text-muted-foreground">{item.abstract}</p>

			<div className="mt-6 flex flex-wrap items-center gap-3">
				<div className="flex flex-wrap gap-2">
					{item.tags.map((tag) => (
						<span
							key={tag}
							className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
						>
							{tag}
						</span>
					))}
				</div>
				<a
					href={item.href}
					target="_blank"
					rel="noreferrer noopener"
					className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-electric-green hover:underline"
				>
					Read on Academia.edu <ExternalLink className="h-3.5 w-3.5" />
				</a>
			</div>
		</motion.div>
	);
}

function InternalResearchCard({
	item,
	index,
}: {
	item: (typeof reportArticles)[number];
	index: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.4, delay: index * 0.07 }}
			className="rounded-2xl border border-border bg-card p-8"
		>
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<span className="rounded-full border border-electric-green/30 bg-electric-green/10 px-2.5 py-1 text-xs font-semibold text-electric-green">
					{item.type}
				</span>
				<span className="text-xs text-muted-foreground">{item.date}</span>
				<span className="text-xs text-muted-foreground">{item.readTime}</span>
			</div>

			<h3 className="text-xl font-bold leading-snug">{item.title}</h3>

			<p className="mt-2 text-sm text-muted-foreground">
				{item.authors} &middot; {item.affiliation}
			</p>

			<p className="mt-5 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>

			<div className="mt-6 flex flex-wrap items-center gap-3">
				<div className="flex flex-wrap gap-2">
					{item.tags.map((tag) => (
						<span
							key={tag}
							className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
						>
							{tag}
						</span>
					))}
				</div>
				<Link
					to={`/research/${item.slug}`}
					className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-electric-green hover:underline"
				>
					Read article <ArrowRight className="h-3.5 w-3.5" />
				</Link>
			</div>
		</motion.div>
	);
}

export default function ResearchPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Research"
				description="Research from KoreShield on prompt injection, RAG pipeline security, agentic AI threats, and production attack patterns."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
				<div className="relative mx-auto max-w-5xl">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<div className="text-center">
							<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green">
								<span className="h-1.5 w-1.5 rounded-full bg-electric-green animate-pulse" />
								Research
							</span>
							<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
								Research on real attack behavior in production LLM systems
							</h1>
							<p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
								This page collects papers, technical reports, advisories, and research notes written from the perspective of applied LLM security engineering. The work focuses on prompt injection, retrieval-layer abuse, agentic failure modes, and the operational realities of defending production systems.
							</p>
						</div>
						<div className="mt-10 grid gap-4 md:grid-cols-3">
							<div className="rounded-2xl border border-border bg-card/80 p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Research Lead</p>
								<p className="mt-2 text-lg font-semibold">Isaac Emmanuel</p>
								<p className="mt-1 text-sm text-muted-foreground">CTO, KoreShield</p>
							</div>
							<div className="rounded-2xl border border-border bg-card/80 p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Focus</p>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									Prompt injection, retrieval security, agentic systems, and defensive architecture for enterprise AI.
								</p>
							</div>
							<div className="rounded-2xl border border-border bg-card/80 p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Method</p>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									Threat modelling, production telemetry, adversarial testing, and systems-oriented evaluation.
								</p>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			<section className="border-t border-border px-6 py-16">
				<div className="mx-auto max-w-5xl">
					<div className="grid gap-6 md:grid-cols-3">
						{researchAreas.map((area, index) => (
							<motion.div
								key={area.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: index * 0.07 }}
								className="flex gap-4 rounded-2xl border border-border bg-card p-6"
							>
								<div className="mt-0.5 flex-shrink-0 rounded-xl border border-electric-green/20 bg-electric-green/10 p-2.5">
									{area.icon}
								</div>
								<div>
									<p className="font-semibold">{area.title}</p>
									<p className="mt-1 text-sm leading-relaxed text-muted-foreground">{area.body}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="border-t border-border px-6 py-20">
				<div className="mx-auto max-w-5xl">
					<h2 className="mb-3 text-3xl font-bold tracking-tight">Published papers</h2>
					<p className="mb-12 max-w-xl text-muted-foreground">
						Published and preprint work from the KoreShield research program, with papers authored by Isaac Emmanuel and collaborators.
					</p>
					<div className="space-y-8">
						{publishedPapers.map((item, index) => (
							<PublishedPaperCard key={item.title} item={item} index={index} />
						))}
					</div>
				</div>
			</section>

			<section className="border-t border-border bg-muted/30 px-6 py-20">
				<div className="mx-auto max-w-5xl">
					<h2 className="mb-3 text-3xl font-bold tracking-tight">Reports &amp; advisories</h2>
					<p className="mb-12 max-w-xl text-muted-foreground">
						Technical reports and advisories written by Isaac Emmanuel on attack trends, defensive design, and practical failure modes in deployed AI systems.
					</p>
					<div className="space-y-8">
						{reportArticles.map((item, index) => (
							<InternalResearchCard key={item.slug} item={item} index={index} />
						))}
					</div>
				</div>
			</section>

			<section className="border-t border-border px-6 py-20">
				<div className="mx-auto max-w-5xl">
					<h2 className="mb-3 text-3xl font-bold tracking-tight">Research notes</h2>
					<p className="mb-10 max-w-xl text-muted-foreground">
						Short-form notes from ongoing investigation into classifier behavior, attack adaptation, and production telemetry.
					</p>
					<div className="grid gap-6 md:grid-cols-2">
						{researchNotes.map((item, index) => (
							<motion.div
								key={item.slug}
								initial={{ opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.35, delay: index * 0.05 }}
								className="rounded-2xl border border-border bg-card p-6"
							>
								<div className="mb-4 flex items-start gap-4">
									<div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-electric-green/20 bg-electric-green/10">
										<FileText className="h-4 w-4 text-electric-green" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold leading-snug">{item.title}</p>
										<span className="mt-1 inline-block text-xs font-medium text-electric-green/80">{item.type}</span>
									</div>
								</div>
								<p className="text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
								<Link
									to={`/research/${item.slug}`}
									className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-electric-green hover:underline"
								>
									Read note <ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="border-t border-border px-6 py-20">
				<div className="mx-auto max-w-4xl">
					<div className="grid gap-12 md:grid-cols-2 md:items-center">
						<div>
							<h2 className="text-3xl font-bold tracking-tight">Responsible disclosure</h2>
							<p className="mt-4 leading-relaxed text-muted-foreground">
								We follow coordinated disclosure for vulnerabilities discovered in third-party systems during research. If you have identified an issue related to LLM infrastructure or retrieval security, we are open to working through a responsible remediation path.
							</p>
							<a
								href="mailto:security@koreshield.com"
								className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-electric-green hover:underline"
							>
								Contact security@koreshield.com <ArrowRight className="h-4 w-4" />
							</a>
						</div>
						<div className="rounded-2xl border border-border bg-card p-8">
							<h3 className="text-lg font-bold">Stay updated</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								New papers, reports, and research notes are announced through the blog and the public GitHub organization.
							</p>
							<div className="mt-6 flex flex-col gap-3">
								<a
									href="https://blog.koreshield.com"
									target="_blank"
									rel="noreferrer noopener"
									className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
								>
									<BookOpen className="h-4 w-4" /> Read the blog
								</a>
								<a
									href="https://github.com/koreshield/"
									target="_blank"
									rel="noreferrer noopener"
									className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
								>
									<ExternalLink className="h-4 w-4" /> GitHub
								</a>
								<Link
									to="/contact"
									className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
								>
									Get in touch <ArrowRight className="h-4 w-4" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
