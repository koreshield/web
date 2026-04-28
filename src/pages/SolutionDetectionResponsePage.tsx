import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Bell, Eye, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const howItWorks = [
	{
		icon: <Eye className="h-6 w-6 text-electric-green" />,
		title: 'Every request inspected in real time',
		body: 'Koreshield sits between your application and the LLM. Every prompt and every response passes through the detection engine before it completes, adding under 50ms of overhead.',
	},
	{
		icon: <AlertTriangle className="h-6 w-6 text-electric-green" />,
		title: 'Threat classification across 50+ patterns',
		body: 'Prompt injection, jailbreak framing, PII exfiltration, credential leakage, indirect RAG injection, tool abuse: all classified by type, severity, and confidence before the model ever sees them.',
	},
	{
		icon: <Shield className="h-6 w-6 text-electric-green" />,
		title: 'Block or allow with structured policy responses',
		body: 'Blocked requests return a structured policy violation response to your application with a reason code. No silent failures. Your application always knows what happened.',
	},
	{
		icon: <Bell className="h-6 w-6 text-electric-green" />,
		title: 'Alerts and audit logs',
		body: 'Every threat event is logged with type, severity, timestamp, and classification metadata. Alerts fire immediately. The audit trail is always there when you need it.',
	},
];

const useCases = [
	'Catching prompt injection before it reaches the model',
	'Detecting jailbreak attempts and policy-violating inputs',
	'Blocking credential and API key leakage in prompts',
	'Flagging PII entering or leaving the model',
	'Responding to indirect injection in RAG pipelines',
];

export default function SolutionDetectionResponsePage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="AI Detection & Response | Koreshield"
				description="Koreshield detects and blocks LLM threats in real time: prompt injection, jailbreaks, PII, and more, before they reach your model. Under 50ms overhead."
			/>

			{/* Hero */}
			<section className="relative px-6 py-24 overflow-hidden ambient-glow">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
				<div className="relative mx-auto max-w-4xl text-center">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<span className="inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green mb-6">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green animate-pulse" />
							AI Detection &amp; Response
						</span>
						<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
							Detect. Block. Move on.
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
							Koreshield inspects every LLM request and response in real time, classifies threats across 50+ attack patterns, and blocks them before the model ever sees them.
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

			{/* How it works */}
			<section className="px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
					<p className="text-muted-foreground mb-12 max-w-xl">One URL change. No code rewrite. Koreshield proxies your LLM traffic and handles the rest.</p>
					<div className="grid gap-8 md:grid-cols-2">
						{howItWorks.map((item, i) => (
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
				<div className="mx-auto max-w-4xl">
					<div className="grid gap-12 md:grid-cols-2 md:items-center">
						<div>
							<h2 className="text-3xl font-bold tracking-tight">What it catches</h2>
							<p className="mt-4 text-muted-foreground">Detection runs on every request and response, not just on inputs your app explicitly flags.</p>
							<ul className="mt-8 space-y-3">
								{useCases.map((item) => (
									<li key={item} className="flex items-start gap-3 text-sm">
										<Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-electric-green" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="rounded-2xl border border-border bg-card p-8">
							<div className="space-y-4">
								{[
									{ label: 'Threat type', value: 'Prompt injection', color: 'text-red-400' },
									{ label: 'Severity', value: 'High', color: 'text-orange-400' },
									{ label: 'Decision', value: 'Blocked', color: 'text-electric-green' },
									{ label: 'Latency added', value: '23ms', color: 'text-foreground' },
									{ label: 'Request ID', value: 'ks_req_7f2a9c...', color: 'text-muted-foreground' },
								].map(({ label, value, color }) => (
									<div key={label} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
										<span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
										<span className={`text-sm font-semibold ${color}`}>{value}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="px-6 py-20 border-t border-border text-center">
				<div className="mx-auto max-w-2xl">
					<h2 className="text-3xl font-bold">Ready to intercept your first attack?</h2>
					<p className="mt-4 text-muted-foreground">Start on the Free plan. Integration takes under 30 minutes.</p>
					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<Link to="/signup?plan=free" className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-semibold text-white transition-colors hover:bg-emerald-500">
							Start for free <ArrowRight className="h-4 w-4" />
						</Link>
						<Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 font-semibold transition-colors hover:bg-muted">
							View pricing
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
