import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Code2, ExternalLink, GitBranch, Scale, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const comparisonRows = [
	['Deployment model', 'Managed cloud, self-hosted, or air-gapped', 'Open-source scanner toolkit'],
	['Best fit', 'Production teams needing enforcement, evidence, and support', 'Teams that want to self-host and assemble controls'],
	['Request path', 'Designed to sit between app and provider', 'Usually embedded inside application code'],
	['Governance', 'Tenant context, audit logs, policy decisions, alerts', 'Depends on your implementation'],
	['Operations', 'Hosted service, product roadmap, support path', 'Community/project maintenance model'],
];

const koreshieldWins = [
	'You need runtime enforcement, not only scanner functions.',
	'You need audit evidence and compliance reporting.',
	'You want one layer across providers, teams, and applications.',
	'You need self-hosted or air-gapped deployment with data residency guarantees.',
	'You need a commercial support path for production incidents.',
];

const llmGuardFits = [
	'You prefer open-source components inside your own stack.',
	'You have engineering time to operate and tune the scanners.',
	'You are building a prototype or internal evaluation harness.',
	'You do not need managed multi-tenant governance yet.',
];

export default function VsLLMGuardPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="vs LLM Guard"
				description="A practical comparison of Koreshield and LLM Guard for teams choosing an LLM security layer."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.08),transparent_24%)]" />
				<div className="relative mx-auto max-w-5xl text-center">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<Scale className="h-3.5 w-3.5" />
							Comparison
						</span>
						<h1 className="text-5xl font-extrabold tracking-[-0.055em] md:text-7xl">
							Koreshield vs LLM Guard
						</h1>
						<p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							LLM Guard is useful when you want open-source scanners. Koreshield is built for teams that need a managed security layer in the live AI traffic path.
						</p>
						<p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
							Last reviewed May 2026
						</p>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
					<div className="rounded-[2rem] border border-electric-green/25 bg-electric-green/10 p-7 shadow-sm">
						<ShieldCheck className="mb-5 h-8 w-8 text-electric-green" />
						<h2 className="text-3xl font-extrabold tracking-[-0.04em]">Koreshield</h2>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							A runtime security layer for prompts, retrieved context, provider calls, policy decisions, alerts, and audit evidence.
						</p>
						<Link to="/demo" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-electric-green px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright">
							See Koreshield <ArrowRight className="h-4 w-4" />
						</Link>
					</div>
					<div className="rounded-[2rem] border border-border bg-card/90 p-7 shadow-sm">
						<GitBranch className="mb-5 h-8 w-8 text-electric-green" />
						<h2 className="text-3xl font-extrabold tracking-[-0.04em]">LLM Guard</h2>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							An open-source scanner toolkit from Protect AI for detecting and sanitizing risky LLM inputs and outputs.
						</p>
						<a href="https://github.com/protectai/llm-guard" target="_blank" rel="noreferrer noopener" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold transition-colors hover:bg-muted">
							View project <ExternalLink className="h-4 w-4" />
						</a>
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-10">
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Practical difference</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Toolkit vs security layer.</h2>
					</div>
					<div className="overflow-hidden rounded-[2rem] border border-border bg-card/90 shadow-sm">
						{comparisonRows.map(([label, koreshield, llmGuard]) => (
							<div key={label} className="grid gap-4 border-b border-border p-5 last:border-b-0 md:grid-cols-[0.75fr_1fr_1fr] md:items-center">
								<p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
								<p className="rounded-2xl bg-electric-green/10 px-4 py-3 text-sm font-semibold text-foreground">{koreshield}</p>
								<p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{llmGuard}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
					<div className="rounded-[2rem] border border-border bg-card/90 p-7 shadow-sm">
						<h2 className="text-3xl font-extrabold tracking-[-0.04em]">Choose Koreshield when...</h2>
						<div className="mt-6 space-y-3">
							{koreshieldWins.map((item) => (
								<div key={item} className="flex gap-3 rounded-2xl border border-border bg-background/70 p-4 text-sm">
									<CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-electric-green" />
									<span>{item}</span>
								</div>
							))}
						</div>
					</div>
					<div className="rounded-[2rem] border border-border bg-card/90 p-7 shadow-sm">
						<h2 className="text-3xl font-extrabold tracking-[-0.04em]">LLM Guard may fit when...</h2>
						<div className="mt-6 space-y-3">
							{llmGuardFits.map((item) => (
								<div key={item} className="flex gap-3 rounded-2xl border border-border bg-background/70 p-4 text-sm">
									<Code2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-electric-green" />
									<span>{item}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] border border-border bg-card/90 p-7 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
					<div>
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Migration thinking</p>
						<h2 className="text-3xl font-extrabold tracking-[-0.04em]">If scanners are not enough, move enforcement to the path.</h2>
						<p className="mt-4 text-sm leading-relaxed text-muted-foreground">
							The clean migration is not replacing one function call with another. It is deciding where enforcement should live: inside each app, or once at the AI traffic boundary.
						</p>
					</div>
					<div className="grid gap-3 sm:grid-cols-3">
						{['Route traffic', 'Attach policy', 'Record evidence'].map((item, index) => (
							<div key={item} className="rounded-2xl border border-border bg-background/70 p-4">
								<p className="text-xs font-bold tracking-[0.22em] text-electric-green">0{index + 1}</p>
								<p className="mt-3 font-bold">{item}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto max-w-5xl rounded-[2rem] border border-border bg-card/90 p-8 md:p-10 text-center shadow-sm">
					<h2 className="text-3xl font-extrabold tracking-[-0.04em] mb-4">Ready to choose Koreshield?</h2>
					<p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
						Start with a free evaluation or compare with other solutions to find the right fit for your team.
					</p>
					<div className="flex flex-wrap justify-center gap-4">
						<Link
							to="/demo"
							className="inline-flex items-center gap-2 px-6 py-3 bg-electric-green hover:bg-emerald-bright text-black rounded-lg font-semibold transition-colors"
						>
							Request Demo
							<ArrowRight className="w-5 h-5" />
						</Link>
						<Link
							to="/vs"
							className="inline-flex items-center gap-2 px-6 py-3 border border-border hover:border-primary/40 bg-background text-foreground rounded-lg font-semibold transition-colors"
						>
							Compare All Options
							<ArrowRight className="w-5 h-5" />
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
