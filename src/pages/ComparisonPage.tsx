import { motion } from 'framer-motion';
import { ArrowRight, Code2, GitBranch, Layers3, Scale, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const comparisons = [
	{
		name: 'LLM Guard',
		path: '/vs/llm-guard',
		type: 'Open-source scanner toolkit',
		icon: GitBranch,
		bestFor: 'Teams that want to assemble and operate scanners inside their own application code.',
		koreshieldAngle: 'Koreshield is the managed enforcement layer that sits in the live AI traffic path.',
	},
	{
		name: 'Lakera Guard',
		path: '/vs/lakera-guard',
		type: 'Commercial AI security API',
		icon: ShieldCheck,
		bestFor: 'Teams evaluating a managed API-first prompt-security product.',
		koreshieldAngle: 'Koreshield emphasizes runtime proxy control, audit evidence, RAG security, and product-roadmap transparency.',
	},
	{
		name: 'Build yourself',
		path: '/vs/build-yourself',
		type: 'Internal security project',
		icon: Code2,
		bestFor: 'Teams with security engineering capacity and appetite to own detection, policy, QA, and operations.',
		koreshieldAngle: 'Koreshield compresses that work into a maintained security layer your team can deploy now.',
	},
];

const criteria = ['Deployment model', 'Evidence and auditability', 'Operating burden', 'RAG and agent coverage', 'Support path'];

export default function ComparisonPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Koreshield vs Alternatives"
				description="Compare Koreshield with LLM Guard, Lakera Guard, and building your own AI security layer."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_80%_16%,rgba(59,130,246,0.08),transparent_24%)]" />
				<div className="relative mx-auto max-w-5xl text-center">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<Scale className="h-3.5 w-3.5" />
							Compare
						</span>
						<h1 className="text-5xl font-extrabold tracking-[-0.055em] md:text-7xl">
							Choose the right AI security layer.
						</h1>
						<p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							This is not a scoreboard. It is a practical buyer guide: where each option fits, what your team has to operate, and where enforcement actually happens.
						</p>
						<p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Last reviewed May 2026</p>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
					{comparisons.map((item, index) => (
						<motion.article
							key={item.name}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4, delay: index * 0.07 }}
							className="group rounded-[2rem] border border-border bg-card/90 p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-electric-green/30"
						>
							<item.icon className="mb-6 h-8 w-8 text-electric-green" />
							<p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{item.type}</p>
							<h2 className="text-3xl font-extrabold tracking-[-0.04em]">{item.name}</h2>
							<p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.bestFor}</p>
							<p className="mt-4 rounded-2xl border border-electric-green/20 bg-electric-green/10 p-4 text-sm leading-relaxed text-foreground/85">{item.koreshieldAngle}</p>
							<Link to={item.path} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-electric-green hover:underline">
								Compare details <ArrowRight className="h-4 w-4" />
							</Link>
						</motion.article>
					))}
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
					<div>
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">How we compare</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">The real questions are operational.</h2>
						<p className="mt-5 text-muted-foreground">
							A security product can look strong in a feature list but still fail if it lands in the wrong place in your architecture.
						</p>
					</div>
					<div className="grid gap-3">
						{criteria.map((item, index) => (
							<div key={item} className="flex items-center gap-4 rounded-2xl border border-border bg-card/85 p-4 shadow-sm">
								<span className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-green/10 text-xs font-black text-electric-green">0{index + 1}</span>
								<span className="font-semibold">{item}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="border-t border-border px-6 py-20">
				<div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[2rem] border border-border bg-card/85 p-7 shadow-sm md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="text-3xl font-extrabold tracking-[-0.03em]">Want a side-by-side for your stack?</h2>
						<p className="mt-2 text-sm text-muted-foreground">Bring your providers, RAG flow, agent framework, and compliance requirements.</p>
					</div>
					<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright">
						Book a demo <Layers3 className="h-4 w-4" />
					</Link>
				</div>
			</section>
		</div>
	);
}
