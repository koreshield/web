import { motion } from 'framer-motion';
import { ArrowRight, Bell, Fingerprint, Radar, ShieldCheck, Siren, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { RelatedSecurityTopics } from '../components/RelatedSecurityTopics';

const signals = [
	['prompt_injection', 'blocked'],
	['pii_exfiltration', 'redacted'],
	['jailbreak_attempt', 'quarantined'],
	['rag_poisoning', 'blocked'],
];

const responseLoop = [
	{ icon: Radar, title: 'Inspect', body: 'Requests, responses, retrieved context, and tool output are scored before they continue.' },
	{ icon: Fingerprint, title: 'Classify', body: 'Events keep threat type, confidence, tenant, provider, route, and request metadata attached.' },
	{ icon: ShieldCheck, title: 'Enforce', body: 'Policy decides whether traffic is allowed, blocked, redacted, or escalated.' },
	{ icon: Bell, title: 'Evidence', body: 'Alerts and audit records give security teams something concrete to investigate.' },
];

export default function SolutionDetectionResponsePage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Detection & Response"
				description="Detect, classify, block, and record LLM threats before they reach your model or users."
			/>

			<section className="relative overflow-hidden px-4 py-20 ambient-glow sm:px-6 md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(225,29,72,0.08),transparent_24%)]" />
				<div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<Siren className="h-3.5 w-3.5" />
							AI Detection
						</span>
						<h1 className="max-w-4xl text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl md:text-7xl">
							Stop bad AI traffic before it becomes an incident.
						</h1>
						<p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
							Koreshield turns every risky LLM interaction into a decision: allow, block, redact, alert, or log.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link to="/signup?plan=growth" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-bold text-white transition-colors hover:bg-emerald-bright">
								Choose a plan <ArrowRight className="h-4 w-4" />
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
						className="relative rounded-[1.75rem] border border-border bg-card/90 p-4 shadow-2xl shadow-emerald-900/10 dark:bg-card/75 sm:p-5 md:rounded-[2rem]"
					>
						<div className="absolute -inset-px -z-10 rounded-[2rem] bg-gradient-to-br from-electric-green/25 via-transparent to-ruby/15" />
						<div className="mb-4 flex items-center justify-between">
							<div className="min-w-0">
								<p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">live decision feed</p>
								<p className="mt-1 truncate text-sm text-muted-foreground">tenant: prod / route: chat.completions</p>
							</div>
							<span className="rounded-full border border-ruby/25 bg-ruby/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-ruby">
								4 active
							</span>
						</div>

						<div className="space-y-3">
							{signals.map(([threat, outcome], index) => (
								<div key={threat} className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-2xl border border-border bg-background/70 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
									<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ruby/10 text-ruby">
										<Zap className="h-4 w-4" />
									</span>
									<div className="min-w-0">
										<p className="break-words font-mono text-sm font-semibold text-foreground">{threat}</p>
										<p className="text-xs text-muted-foreground">confidence {(94 + index).toString()}%</p>
									</div>
									<span className="col-span-2 w-fit rounded-full bg-electric-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-electric-green sm:col-span-1">
										{outcome}
									</span>
								</div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-4 py-16 sm:px-6 md:py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-10 max-w-3xl">
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Response loop</p>
						<h2 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl md:text-5xl">Not a filter. A security workflow.</h2>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{responseLoop.map((item, index) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: index * 0.07 }}
								className="rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-sm md:p-6"
							>
								<item.icon className="mb-5 h-6 w-6 text-electric-green" />
								<h3 className="text-xl font-bold">{item.title}</h3>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="px-4 py-16 sm:px-6 md:py-20">
				<div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[1.75rem] border border-border bg-card/85 p-6 shadow-sm md:flex-row md:items-center md:justify-between md:rounded-[2rem] md:p-7">
					<div>
						<h2 className="text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">Put detection in the path of live AI traffic.</h2>
						<p className="mt-2 text-sm text-muted-foreground">Start with proxy enforcement, then expand into alerts, reports, and audit evidence.</p>
					</div>
					<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright">
						See it live <ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</section>
			<RelatedSecurityTopics currentPath="/solutions/ai-detection-response" />
		</div>
	);
}
