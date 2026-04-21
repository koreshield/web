import { motion } from 'framer-motion';
import { ArrowRight, CheckSquare, FileText, Settings, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const capabilities = [
	{
		icon: <Settings className="h-6 w-6 text-electric-green" />,
		title: 'Configurable policy rules',
		body: 'Define what is and is not permitted through your LLM deployment. Block entire categories of output. Restrict the topics or data types a model can discuss. Enforce custom content policies at the proxy level without touching the model.',
	},
	{
		icon: <Users className="h-6 w-6 text-electric-green" />,
		title: 'Per-key and per-team policy scoping',
		body: 'Different API keys can carry different policy profiles. An internal engineering key and a customer-facing key can be governed by different rules — all enforced at the proxy, not in application code.',
	},
	{
		icon: <FileText className="h-6 w-6 text-electric-green" />,
		title: 'Audit trail and compliance evidence',
		body: 'Every policy decision is logged with timestamp, threat type, severity, and block reason. Growth and Scale tiers include structured audit logs and compliance-ready reporting.',
	},
	{
		icon: <CheckSquare className="h-6 w-6 text-electric-green" />,
		title: 'Alerts on policy violations',
		body: 'Get notified when usage patterns hit your configured thresholds. Real-time alerts give your security team visibility without having to query logs manually.',
	},
];

const useCases = [
	{
		title: 'Preventing data exfiltration',
		body: 'Block prompts that attempt to extract credentials, PII, or confidential business data through the LLM.',
	},
	{
		title: 'Topic and content restrictions',
		body: 'Enforce policies that prevent the model from producing content outside its intended use case.',
	},
	{
		title: 'Regulated industry compliance',
		body: 'Log every AI interaction for audit purposes and demonstrate active governance over your LLM deployments.',
	},
	{
		title: 'Shadow AI governance',
		body: 'Centralise all LLM traffic through one proxy to get visibility over how AI is being used across your organisation.',
	},
];

export default function SolutionUsageControlPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="AI Usage Control | Koreshield"
				description="Define and enforce policies over what your AI can and cannot do. Configurable rules, per-key scoping, and audit logs — without touching your model."
			/>

			{/* Hero */}
			<section className="relative px-6 py-24 overflow-hidden ambient-glow">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
				<div className="relative mx-auto max-w-4xl text-center">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<span className="inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green mb-6">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green animate-pulse" />
							AI Usage Control
						</span>
						<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
							Define what your AI can and cannot do.
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
							Policy enforcement without model retraining. Koreshield applies configurable rules to every LLM request and response — blocking, logging, and alerting based on what you define.
						</p>
						<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
							<Link to="/signup?plan=free" className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-semibold text-white transition-colors hover:bg-emerald-500">
								Start for free <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/demo" className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 font-semibold transition-colors hover:bg-muted">
								Book a demo
							</Link>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Capabilities */}
			<section className="px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold tracking-tight mb-12">What usage control covers</h2>
					<div className="grid gap-8 md:grid-cols-2">
						{capabilities.map((item, i) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: i * 0.07 }}
								className="flex gap-4 rounded-2xl border border-border bg-card p-6"
							>
								<div className="mt-0.5 flex-shrink-0 rounded-xl border border-electric-green/20 bg-electric-green/10 p-2.5">
									{item.icon}
								</div>
								<div>
									<p className="font-semibold">{item.title}</p>
									<p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Use cases */}
			<section className="bg-muted/30 px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold tracking-tight mb-10">Use cases</h2>
					<div className="grid gap-6 md:grid-cols-2">
						{useCases.map((item, i) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.35, delay: i * 0.06 }}
								className="rounded-2xl border border-border bg-card p-6"
							>
								<h3 className="font-semibold">{item.title}</h3>
								<p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Plan callout */}
			<section className="px-6 py-16 border-t border-border">
				<div className="mx-auto max-w-4xl rounded-2xl border border-primary/20 bg-primary/5 p-8">
					<div className="grid gap-8 md:grid-cols-2 md:items-center">
						<div>
							<h2 className="text-2xl font-bold">Governance on Growth and above</h2>
							<p className="mt-3 text-muted-foreground text-sm leading-relaxed">
								Basic policies and alerts are available on all paid plans. Advanced RBAC, audit logs, and compliance reporting are included on Scale and above. Enterprise plans include custom policy configurations, SIEM export, and dedicated governance review support.
							</p>
						</div>
						<div className="flex flex-col gap-3">
							<Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
								See all plan features <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 font-semibold transition-colors hover:bg-muted">
								Talk to us about Enterprise
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
