import { motion } from 'framer-motion';
import { ArrowRight, FileText, KeyRound, ListChecks, Settings2, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const policyRows = [
	['Customer support bot', 'Redact PII', 'Log evidence'],
	['Internal analyst', 'Allow summaries', 'Block secrets'],
	['Developer copilot', 'Block key leakage', 'Alert security'],
];

const controls = [
	{ icon: SlidersHorizontal, title: 'Policy profiles', body: 'Different teams and API keys can carry different enforcement rules.' },
	{ icon: KeyRound, title: 'Scoped keys', body: 'Separate customer-facing, internal, and testing traffic without branching app code.' },
	{ icon: FileText, title: 'Audit trail', body: 'Every policy decision keeps the reason, route, tenant, and outcome attached.' },
];

export default function SolutionUsageControlPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Usage Control"
				description="Define and enforce what your AI systems can and cannot do using scoped policies, logs, and alerts."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.08),transparent_24%)]" />
				<div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<Settings2 className="h-3.5 w-3.5" />
							AI Usage Control
						</span>
						<h1 className="max-w-4xl text-5xl font-extrabold tracking-[-0.055em] md:text-7xl">
							Define the rules your AI must follow.
						</h1>
						<p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							Control what models can receive, reveal, discuss, and do. Enforce it in the traffic path, not in a policy document nobody reads.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-bold text-white transition-colors hover:bg-emerald-bright">
								See plans <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3 font-bold text-foreground transition-colors hover:bg-muted">
								Book a demo
							</Link>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, delay: 0.1 }}
						className="rounded-[2rem] border border-border bg-card/90 p-5 shadow-2xl shadow-emerald-900/10 dark:bg-card/75"
					>
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">policy matrix</p>
						<div className="space-y-3">
							{policyRows.map(([profile, rule, outcome]) => (
								<div key={profile} className="grid gap-2 rounded-2xl border border-border bg-background/70 p-4 sm:grid-cols-3">
									<span className="font-semibold">{profile}</span>
									<span className="rounded-xl bg-electric-green/10 px-3 py-2 text-sm text-electric-green">{rule}</span>
									<span className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{outcome}</span>
								</div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-10 max-w-3xl">
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Governance layer</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Rules that execute.</h2>
					</div>
					<div className="grid gap-5 md:grid-cols-3">
						{controls.map((item, index) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: index * 0.07 }}
								className="rounded-[1.5rem] border border-border bg-card/85 p-6 shadow-sm"
							>
								<item.icon className="mb-5 h-6 w-6 text-electric-green" />
								<h3 className="text-xl font-bold">{item.title}</h3>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[2rem] border border-border bg-card/85 p-7 shadow-sm md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="text-3xl font-extrabold tracking-[-0.03em]">Give legal and security a real control surface.</h2>
						<p className="mt-2 text-sm text-muted-foreground">Policy, tenant context, and evidence all travel with the request.</p>
					</div>
					<Link to="/solutions/korepilot" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted">
						See KorePilot <ListChecks className="h-4 w-4" />
					</Link>
				</div>
			</section>
		</div>
	);
}
