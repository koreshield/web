import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ExternalLink, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const featuredResearch = [
	{
		type: 'Threat Report',
		title: 'The State of Prompt Injection in Production LLM Systems',
		date: 'April 2025',
		summary:
			'An analysis of over 2 million LLM requests processed through Koreshield in Q1 2025. We categorise the most common attack patterns, their detection rates, and how indirect injection via RAG pipelines has overtaken direct user-input injection as the dominant threat vector.',
		tags: ['Prompt Injection', 'RAG', 'Production Data'],
		href: null, // internal — PDF or future post
	},
	{
		type: 'Technical Paper',
		title: 'Indirect Prompt Injection via Retrieved Documents: Attack Taxonomy and Mitigations',
		date: 'March 2025',
		summary:
			'We introduce a taxonomy of indirect injection attacks targeting RAG pipelines: instruction embedding, role impersonation, context poisoning, and cross-document chaining. We evaluate detection efficacy across each class and propose a proxy-layer mitigation architecture.',
		tags: ['RAG Security', 'Taxonomy', 'Mitigations'],
		href: null,
	},
	{
		type: 'Security Advisory',
		title: 'Tool Call Hijacking in Agentic Pipelines: A Practical Demonstration',
		date: 'February 2025',
		summary:
			'A demonstration of how malicious instructions embedded in tool outputs can redirect an autonomous agent to execute out-of-scope actions. Includes proof-of-concept scenarios across LangChain, AutoGen, and Claude Tools, and discusses proxy-layer enforcement as a defence.',
		tags: ['AI Agents', 'Tool Abuse', 'PoC'],
		href: null,
	},
];

const shortReports = [
	{
		title: 'Jailbreak Technique Drift: How Attack Patterns Evolve Month-Over-Month',
		date: 'April 2025',
		type: 'Dataset Note',
	},
	{
		title: 'PII Exfiltration via LLM Output: Common Patterns and Detection Signals',
		date: 'March 2025',
		type: 'Technical Note',
	},
	{
		title: 'Evaluating Confidence Thresholds for Prompt Injection Classifiers',
		date: 'March 2025',
		type: 'Evaluation',
	},
	{
		title: 'Bypass Resistance of System-Prompt Hardening Alone',
		date: 'February 2025',
		type: 'Analysis',
	},
	{
		title: 'Multi-Turn Injection: Building Attack Context Across Conversation Rounds',
		date: 'January 2025',
		type: 'Technical Note',
	},
	{
		title: 'False Positive Rates in Semantic vs. Rule-Based Detectors at Scale',
		date: 'January 2025',
		type: 'Benchmark',
	},
];

const researchAreas = [
	{
		icon: <Shield className="h-6 w-6 text-electric-green" />,
		title: 'Prompt Injection',
		body: 'Direct and indirect injection techniques, bypass methods, and detection efficacy across model families.',
	},
	{
		icon: <FileText className="h-6 w-6 text-electric-green" />,
		title: 'RAG Pipeline Security',
		body: 'Document poisoning, context hijacking, and the challenge of scanning retrieved content before model inference.',
	},
	{
		icon: <BookOpen className="h-6 w-6 text-electric-green" />,
		title: 'Agentic Threat Modelling',
		body: 'Tool call abuse, orchestration manipulation, and multi-step attack patterns unique to autonomous AI systems.',
	},
];

export default function ResearchPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Research | Koreshield"
				description="KoreShield's AI security research — threat reports, technical papers, and advisories on prompt injection, RAG security, and agentic AI attacks."
			/>

			{/* Hero */}
			<section className="relative px-6 py-24 overflow-hidden ambient-glow">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
				<div className="relative mx-auto max-w-4xl text-center">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<span className="inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green mb-6">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green animate-pulse" />
							Research
						</span>
						<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
							We study the attacks. So you don't have to.
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
							KoreShield publishes ongoing research into LLM attack techniques, threat trends in production systems, and the security properties of agentic AI pipelines.
						</p>
					</motion.div>
				</div>
			</section>

			{/* Research areas */}
			<section className="px-6 py-16 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<div className="grid gap-6 md:grid-cols-3">
						{researchAreas.map((area, i) => (
							<motion.div
								key={area.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: i * 0.07 }}
								className="flex gap-4 rounded-2xl border border-border bg-card p-6"
							>
								<div className="mt-0.5 flex-shrink-0 rounded-xl border border-electric-green/20 bg-electric-green/10 p-2.5">
									{area.icon}
								</div>
								<div>
									<p className="font-semibold">{area.title}</p>
									<p className="mt-1 text-sm text-muted-foreground leading-relaxed">{area.body}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Featured research */}
			<section className="px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold tracking-tight mb-3">Featured publications</h2>
					<p className="text-muted-foreground mb-12 max-w-xl">In-depth reports and technical papers from the KoreShield research team.</p>

					<div className="space-y-8">
						{featuredResearch.map((item, i) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: i * 0.07 }}
								className="rounded-2xl border border-border bg-card p-8"
							>
								<div className="flex flex-wrap items-center gap-3 mb-4">
									<span className="rounded-full border border-electric-green/30 bg-electric-green/10 px-2.5 py-1 text-xs font-semibold text-electric-green">
										{item.type}
									</span>
									<span className="text-xs text-muted-foreground">{item.date}</span>
								</div>

								<h3 className="text-xl font-bold leading-snug">{item.title}</h3>
								<p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.summary}</p>

								<div className="mt-5 flex flex-wrap items-center gap-3">
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
									{item.href ? (
										<a
											href={item.href}
											target="_blank"
											rel="noreferrer noopener"
											className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-electric-green hover:underline"
										>
											Read paper <ExternalLink className="h-3.5 w-3.5" />
										</a>
									) : (
										<span className="ml-auto text-xs text-muted-foreground italic">Full paper coming soon</span>
									)}
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Short reports / notes */}
			<section className="bg-muted/30 px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold tracking-tight mb-3">Technical notes & advisories</h2>
					<p className="text-muted-foreground mb-10 max-w-xl">Shorter-form analysis, benchmark results, and dataset observations from ongoing research.</p>

					<div className="grid gap-4 md:grid-cols-2">
						{shortReports.map((item, i) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.35, delay: i * 0.05 }}
								className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
							>
								<div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg bg-electric-green/10 border border-electric-green/20 flex items-center justify-center">
									<FileText className="h-4 w-4 text-electric-green" />
								</div>
								<div className="min-w-0">
									<p className="text-sm font-semibold leading-snug">{item.title}</p>
									<div className="mt-1.5 flex items-center gap-2">
										<span className="text-xs text-electric-green/80 font-medium">{item.type}</span>
										<span className="text-xs text-muted-foreground">· {item.date}</span>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Subscribe / disclosure */}
			<section className="px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-4xl">
					<div className="grid gap-12 md:grid-cols-2 md:items-center">
						<div>
							<h2 className="text-3xl font-bold tracking-tight">Responsible disclosure</h2>
							<p className="mt-4 text-muted-foreground leading-relaxed">
								We follow coordinated disclosure for any vulnerabilities discovered in third-party systems during our research. If you have discovered a security issue related to LLM infrastructure, we are happy to collaborate.
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
								New research, threat advisories, and dataset releases are announced via our blog and GitHub.
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
									<ExternalLink className="h-4 w-4" /> GitHub — datasets & tools
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
