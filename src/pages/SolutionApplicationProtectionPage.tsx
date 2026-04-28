import { motion } from 'framer-motion';
import { ArrowRight, Code2, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const features = [
	{
		icon: <Lock className="h-6 w-6 text-electric-green" />,
		title: 'Protection without touching your code',
		body: 'Change one URL in your LLM client. Koreshield intercepts every request before it reaches the model. No SDK migration, no architectural changes, no refactoring.',
	},
	{
		icon: <ShieldCheck className="h-6 w-6 text-electric-green" />,
		title: 'Request and response inspection',
		body: 'Both sides of the LLM interaction are scanned. Inputs are checked for injection and policy violations. Outputs are checked for PII leakage and data exfiltration before they reach your users.',
	},
	{
		icon: <Code2 className="h-6 w-6 text-electric-green" />,
		title: 'Works with every major provider',
		body: 'OpenAI, Anthropic, Gemini, DeepSeek, and any OpenAI-compatible endpoint. Same integration. Same protection. Regardless of which model you use.',
	},
	{
		icon: <RefreshCw className="h-6 w-6 text-electric-green" />,
		title: 'Zero-log by default',
		body: 'Prompts and responses are processed in memory and discarded. Nothing is retained unless you explicitly configure a retention policy. Your users\' data stays private.',
	},
];

const protectedScenarios = [
	'Customer-facing chatbots and AI assistants',
	'Internal LLM tools handling sensitive business data',
	'AI-powered search and retrieval systems',
	'Code generation and developer tools',
	'Document analysis and summarisation workflows',
];

export default function SolutionApplicationProtectionPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="AI Application Protection | Koreshield"
				description="Protect any LLM-powered application with one URL change. Koreshield inspects every request and response: zero-log, zero code rewrite."
			/>

			{/* Hero */}
			<section className="relative px-6 py-24 overflow-hidden ambient-glow">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
				<div className="relative mx-auto max-w-4xl text-center">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<span className="inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green mb-6">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green animate-pulse" />
							AI Application Protection
						</span>
						<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
							Protect your AI app. No rewrite required.
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
							One URL change is all it takes. Koreshield becomes the security layer between your application and any LLM provider, inspecting every interaction before it completes.
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

			{/* Features */}
			<section className="px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold tracking-tight mb-12">How Koreshield protects your application</h2>
					<div className="grid gap-8 md:grid-cols-2">
						{features.map((item, i) => (
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

			{/* Scenarios */}
			<section className="bg-muted/30 px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-4xl">
					<div className="grid gap-12 md:grid-cols-2 md:items-center">
						<div>
							<h2 className="text-3xl font-bold tracking-tight">Works for any AI application</h2>
							<p className="mt-4 text-muted-foreground">If it calls an LLM, Koreshield can protect it. The proxy is provider-agnostic and integration-agnostic.</p>
							<ul className="mt-8 space-y-3">
								{protectedScenarios.map((item) => (
									<li key={item} className="flex items-start gap-3 text-sm">
										<ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-electric-green" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="rounded-2xl border border-border bg-card p-8 space-y-5">
							<div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Before Koreshield</div>
							<code className="block text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
								client = OpenAI(base_url="https://api.openai.com/v1")
							</code>
							<div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">After Koreshield</div>
							<code className="block text-sm text-electric-green bg-electric-green/5 border border-electric-green/20 rounded-lg p-3">
								client = OpenAI(base_url="https://api.koreshield.com/v1")
							</code>
							<p className="text-xs text-muted-foreground">That is the entire integration. Your existing code, your existing model, protected.</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="px-6 py-20 border-t border-border text-center">
				<div className="mx-auto max-w-2xl">
					<h2 className="text-3xl font-bold">Protect your application in under 30 minutes.</h2>
					<p className="mt-4 text-muted-foreground">Start on the Free plan. No credit card required.</p>
					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<Link to="/signup?plan=free" className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-semibold text-white transition-colors hover:bg-emerald-500">
							Start for free <ArrowRight className="h-4 w-4" />
						</Link>
						<Link to="/docs" className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 font-semibold transition-colors hover:bg-muted">
							Read the docs
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
