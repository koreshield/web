import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Code2, PlugZap, Route, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const steps = [
	['01', 'Point', 'Change the LLM base URL to Koreshield.'],
	['02', 'Protect', 'Requests are scanned before provider delivery.'],
	['03', 'Prove', 'Decisions are logged with policy context.'],
];

const scenarios = [
	'Customer-facing AI assistants',
	'Internal copilots with business data',
	'Document analysis and summarisation',
	'Developer tools and code generation',
	'AI search and support automation',
];

export default function SolutionApplicationProtectionPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="AI Application Protection | Koreshield"
				description="Protect LLM-powered applications with a proxy security layer and no application rewrite."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(16,185,129,0.15),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.08),transparent_26%)]" />
				<div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<PlugZap className="h-3.5 w-3.5" />
							Application Protection
						</span>
						<h1 className="max-w-4xl text-5xl font-extrabold tracking-[-0.055em] md:text-7xl">
							Secure the app without rebuilding the app.
						</h1>
						<p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							Koreshield sits between your product and your LLM provider. One route change gives every prompt a security checkpoint.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link to="/signup?plan=free" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-bold text-white transition-colors hover:bg-emerald-bright">
								Start for free <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/docs" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3 font-bold text-foreground transition-colors hover:bg-muted">
								Read docs
							</Link>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, delay: 0.1 }}
						className="rounded-[2rem] border border-border bg-card/90 p-5 shadow-2xl shadow-emerald-900/10 dark:bg-card/75"
					>
						<div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-300">
							<p className="text-slate-500"># before</p>
							<p>base_url=<span className="text-red-300">"https://api.openai.com/v1"</span></p>
							<p className="mt-5 text-slate-500"># after</p>
							<p>base_url=<span className="text-electric-green">"https://api.koreshield.com/v1"</span></p>
						</div>
						<div className="mt-4 grid gap-3 sm:grid-cols-3">
							{steps.map(([number, title, body]) => (
								<div key={title} className="rounded-2xl border border-border bg-background/70 p-4">
									<p className="text-xs font-bold tracking-[0.22em] text-electric-green">{number}</p>
									<p className="mt-3 font-bold">{title}</p>
									<p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
								</div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
					<div>
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Where it works</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Any product that calls an LLM.</h2>
						<p className="mt-5 text-muted-foreground">Your application keeps its provider, model, and client code. Koreshield becomes the enforcement boundary.</p>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{scenarios.map((scenario) => (
							<div key={scenario} className="flex items-center gap-3 rounded-2xl border border-border bg-card/85 p-4 shadow-sm">
								<CheckCircle2 className="h-5 w-5 text-electric-green" />
								<span className="text-sm font-medium">{scenario}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
					{[
						{ icon: Route, title: 'Provider routing', body: 'OpenAI, Anthropic, Gemini, DeepSeek, or OpenAI-compatible endpoints.' },
						{ icon: ShieldCheck, title: 'Policy enforcement', body: 'Block, redact, log, or allow based on the risk profile of each request.' },
						{ icon: Code2, title: 'No migration drama', body: 'No full SDK rewrite. No model retraining. No brittle app-side filters.' },
					].map((item) => (
						<div key={item.title} className="rounded-[1.5rem] border border-border bg-card/85 p-6 shadow-sm">
							<item.icon className="mb-5 h-6 w-6 text-electric-green" />
							<h3 className="text-xl font-bold">{item.title}</h3>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
