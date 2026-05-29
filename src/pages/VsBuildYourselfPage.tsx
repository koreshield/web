import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Code2, DollarSign, Hammer, Shield, TimerReset, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const buildBurden = [
	'Threat research and red-team corpus maintenance',
	'Low-latency proxy or SDK enforcement',
	'RAG, tool-output, and agent-chain inspection',
	'Tenant isolation, audit logs, alerts, and reporting',
	'False-positive tuning and regression testing',
	'Documentation, support, and incident response',
];

const phases = [
	['Prototype', 'Can you detect the obvious attacks?'],
	['Production', 'Can you enforce safely at scale?'],
	['Operations', 'Can you maintain evidence, tests, alerts, and new attack coverage?'],
];

const yearOneBuild = [
	['Initial development (2 engineers x 6 months)', '$180,000'],
	['Ongoing maintenance (1 engineer)', '$120,000'],
	['Infrastructure and tools', '$24,000'],
	['Security research and updates', '$36,000'],
	['Opportunity cost from delayed features', '$100,000+'],
];

const yearOneKoreshield = [
	['Koreshield Enterprise license', '$50,000'],
	['Integration time (1 week)', '$3,500'],
	['Infrastructure', '$12,000'],
	['Maintenance', '$0'],
	['Opportunity cost', '$0'],
];

const buildTimeline = [
	['Month 1-2', 'Research attacks, design architecture'],
	['Month 3-4', 'Build detection engine, test patterns'],
	['Month 5-6', 'Add RBAC, tenant isolation, and policies'],
	['Month 7-8', 'Build monitoring, alerting, dashboards'],
	['Month 9-10', 'Security testing and performance tuning'],
	['Month 11-12', 'Documentation, training, deployment'],
];

const koreshieldTimeline = [
	['Day 1', 'Install and basic setup'],
	['Day 2-3', 'Configure policies and rules'],
	['Day 4-5', 'Integration and testing'],
	['Day 6-7', 'Deploy to production'],
];

const hiddenCosts = [
	{
		title: 'Ongoing maintenance',
		items: ['New attack vectors emerge weekly', 'LLM providers update APIs frequently', 'Bug fixes and performance optimization', 'Documentation and onboarding', 'Estimated: $120K/year ongoing'],
	},
	{
		title: 'Technical debt',
		items: ['Code becomes unmaintainable over time', 'Original developers leave the company', 'Refactoring required every 12-18 months', 'Testing and security audits', 'Estimated: $50K-100K/year'],
	},
	{
		title: 'Opportunity cost',
		items: ['Engineers not building product features', 'Delayed time-to-market', 'Lost competitive advantage', 'Potential customer churn during delays', 'Estimated: $100K-500K+'],
	},
	{
		title: 'Detection quality',
		items: ['Specialized security expertise required', 'Red-team corpus must stay current', 'False-positive tuning becomes permanent work', 'Regression suite needs constant updates', 'Risk: missed incidents or unusable controls'],
	},
];

const included = [
	['Core features', ['Prompt and response scanning', 'RAG/context inspection', 'Multi-provider support', 'Policy enforcement', 'Python and Node SDKs']],
	['Enterprise controls', ['Tenant-aware events', 'RBAC and scoped keys', 'Audit logs', 'Alerts', 'Compliance evidence']],
	['Support and updates', ['Detection updates', 'Red-team informed testing', 'Production support path', 'Documentation', 'Deployment guidance']],
] satisfies Array<[string, string[]]>;

function CostRows({ rows }: { rows: string[][] }) {
	return (
		<div className="space-y-3">
			{rows.map(([label, value]) => (
				<div key={label} className="flex items-start justify-between gap-4 text-sm">
					<span className="text-muted-foreground">{label}</span>
					<span className="whitespace-nowrap font-bold text-foreground">{value}</span>
				</div>
			))}
		</div>
	);
}

export default function VsBuildYourselfPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Koreshield vs Building Your Own"
				description="Compare building an internal LLM security layer with using Koreshield."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.08),transparent_24%)]" />
				<div className="relative mx-auto max-w-5xl text-center">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<Hammer className="h-3.5 w-3.5" />
							Build vs Buy
						</span>
						<h1 className="text-5xl font-extrabold tracking-[-0.055em] md:text-7xl">Building AI security is not one sprint.</h1>
						<p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							The first detector is the easy part. The hard part is operating a security layer as attacks, providers, models, and customer requirements keep changing.
						</p>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
					<div>
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Operating burden</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">What your team owns.</h2>
						<p className="mt-5 text-muted-foreground">If you build internally, these do not disappear after launch. They become part of your security roadmap.</p>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{buildBurden.map((item) => (
							<div key={item} className="flex gap-3 rounded-2xl border border-border bg-card/85 p-4 shadow-sm">
								<CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-electric-green" />
								<span className="text-sm">{item}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
					{phases.map(([title, body], index) => (
						<motion.div
							key={title}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4, delay: index * 0.07 }}
							className="rounded-[1.5rem] border border-border bg-card/85 p-6 shadow-sm"
						>
							<TimerReset className="mb-5 h-6 w-6 text-electric-green" />
							<h3 className="text-xl font-bold">{title}</h3>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
						</motion.div>
					))}
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-8 flex items-center gap-4">
						<DollarSign className="h-8 w-8 text-electric-green" />
						<div>
							<h2 className="text-4xl font-extrabold tracking-[-0.04em]">Total cost of ownership: year one</h2>
							<p className="mt-2 text-sm text-muted-foreground">Illustrative planning model for a production-grade internal LLM security layer.</p>
						</div>
					</div>
					<div className="grid gap-6 lg:grid-cols-2">
						<div className="rounded-[1.5rem] border border-red-500/35 bg-red-500/10 p-6">
							<h3 className="text-2xl font-extrabold text-red-400">Building in-house</h3>
							<div className="mt-6">
								<CostRows rows={yearOneBuild} />
							</div>
							<div className="mt-6 flex items-center justify-between border-t border-red-500/30 pt-5">
								<span className="text-lg font-bold">Total year 1</span>
								<span className="text-3xl font-black text-red-400">$460,000+</span>
							</div>
						</div>
						<div className="rounded-[1.5rem] border border-electric-green/35 bg-electric-green/10 p-6">
							<h3 className="text-2xl font-extrabold text-electric-green">Using Koreshield</h3>
							<div className="mt-6">
								<CostRows rows={yearOneKoreshield} />
							</div>
							<div className="mt-6 flex items-center justify-between border-t border-electric-green/30 pt-5">
								<span className="text-lg font-bold">Total year 1</span>
								<span className="text-3xl font-black text-electric-green">$65,500</span>
							</div>
							<div className="mt-6 rounded-2xl border border-electric-green/25 bg-background/55 p-5 text-center">
								<p className="text-4xl font-black text-electric-green">Save $394,500</p>
								<p className="mt-2 text-sm text-muted-foreground">85% cost reduction in year one</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto max-w-7xl rounded-[2rem] border border-border bg-card/85 p-7 shadow-sm">
					<div className="mb-8 flex items-center gap-4">
						<TimerReset className="h-8 w-8 text-electric-green" />
						<h2 className="text-4xl font-extrabold tracking-[-0.04em]">Time to production</h2>
					</div>
					<div className="grid gap-8 lg:grid-cols-2">
						<div>
							<h3 className="mb-5 text-2xl font-extrabold text-red-400">Building in-house: 6-12 months</h3>
							<div className="space-y-3">
								{buildTimeline.map(([period, item]) => (
									<div key={period} className="grid gap-2 rounded-2xl border border-border bg-background/60 p-4 sm:grid-cols-[110px_1fr]">
										<span className="font-bold text-red-400">{period}</span>
										<span className="text-sm text-muted-foreground">{item}</span>
									</div>
								))}
							</div>
						</div>
						<div>
							<h3 className="mb-5 text-2xl font-extrabold text-electric-green">Using Koreshield: 1 week</h3>
							<div className="space-y-3">
								{koreshieldTimeline.map(([period, item]) => (
									<div key={period} className="flex gap-3 rounded-2xl border border-border bg-background/60 p-4">
										<CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-electric-green" />
										<span className="text-sm text-muted-foreground"><strong className="text-foreground">{period}:</strong> {item}</span>
									</div>
								))}
							</div>
							<div className="mt-5 rounded-2xl border border-electric-green/25 bg-electric-green/10 p-5 text-center">
								<TrendingUp className="mx-auto mb-3 h-6 w-6 text-electric-green" />
								<p className="text-4xl font-black text-electric-green">48x faster</p>
								<p className="mt-2 text-sm text-muted-foreground">From 12 months to 1 week</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-8 flex items-center gap-4">
						<AlertTriangle className="h-8 w-8 text-amber-400" />
						<h2 className="text-4xl font-extrabold tracking-[-0.04em]">Hidden costs of building</h2>
					</div>
					<div className="grid gap-5 md:grid-cols-2">
						{hiddenCosts.map((group) => (
							<div key={group.title} className="rounded-[1.5rem] border border-amber-500/25 bg-amber-500/5 p-6">
								<h3 className="text-xl font-bold">{group.title}</h3>
								<ul className="mt-5 space-y-3">
									{group.items.map((item) => (
										<li key={item} className="flex gap-3 text-sm text-muted-foreground">
											<span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto max-w-7xl rounded-[2rem] border border-border bg-card/85 p-7 shadow-sm">
					<div className="mb-8 flex items-center gap-4">
						<Shield className="h-8 w-8 text-electric-green" />
						<h2 className="text-4xl font-extrabold tracking-[-0.04em]">What is included in Koreshield</h2>
					</div>
					<div className="grid gap-6 md:grid-cols-3">
							{included.map(([title, items]) => (
								<div key={title}>
									<h3 className="mb-4 text-xl font-bold">{title}</h3>
									<ul className="space-y-3">
										{items.map((item) => (
										<li key={item} className="flex gap-3 text-sm text-muted-foreground">
											<CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-electric-green" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto max-w-7xl rounded-[2rem] border border-border bg-card/85 p-7 shadow-sm">
					<h2 className="text-center text-4xl font-extrabold tracking-[-0.04em]">3-year total cost of ownership</h2>
					<div className="mt-10 grid gap-8 lg:grid-cols-2">
						<div className="rounded-[1.5rem] border border-red-500/25 bg-background/60 p-6">
							<h3 className="text-2xl font-extrabold text-red-400">Build in-house</h3>
							<div className="mt-5 space-y-3 text-sm text-muted-foreground">
								<div className="flex justify-between gap-4"><span>Year 1</span><strong>$460,000</strong></div>
								<div className="flex justify-between gap-4"><span>Year 2</span><strong>$220,000</strong></div>
								<div className="flex justify-between gap-4"><span>Year 3</span><strong>$250,000</strong></div>
							</div>
							<div className="mt-5 flex justify-between border-t border-border pt-5">
								<span className="font-bold">3-year total</span>
								<span className="text-3xl font-black text-red-400">$930,000</span>
							</div>
						</div>
						<div className="rounded-[1.5rem] border border-electric-green/25 bg-background/60 p-6">
							<h3 className="text-2xl font-extrabold text-electric-green">Use Koreshield</h3>
							<div className="mt-5 space-y-3 text-sm text-muted-foreground">
								<div className="flex justify-between gap-4"><span>Year 1</span><strong>$65,500</strong></div>
								<div className="flex justify-between gap-4"><span>Year 2</span><strong>$60,000</strong></div>
								<div className="flex justify-between gap-4"><span>Year 3</span><strong>$70,000</strong></div>
							</div>
							<div className="mt-5 flex justify-between border-t border-border pt-5">
								<span className="font-bold">3-year total</span>
								<span className="text-3xl font-black text-electric-green">$195,500</span>
							</div>
						</div>
					</div>
					<div className="mt-10 text-center">
						<p className="text-5xl font-black text-electric-green">Save $734,500</p>
						<p className="mt-2 text-sm text-muted-foreground">79% cost reduction over 3 years</p>
					</div>
				</div>
			</section>

			<section className="border-t border-border px-6 py-20">
				<div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[2rem] border border-border bg-card/85 p-7 shadow-sm md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="text-3xl font-extrabold tracking-[-0.03em]">Use your team for product, not permanent detector upkeep.</h2>
						<p className="mt-2 text-sm text-muted-foreground">Koreshield gives you a maintained runtime layer while your engineers keep shipping.</p>
					</div>
					<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright">
						Talk through the tradeoff <Code2 className="h-4 w-4" />
					</Link>
				</div>
			</section>
		</div>
	);
}
