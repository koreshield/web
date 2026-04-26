import { motion } from 'framer-motion';
import { ArrowRight, Bot, GitBranch, Network, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const challenges = [
	{
		icon: <Network className="h-6 w-6 text-electric-green" />,
		title: 'Tool call policy enforcement',
		body: 'Koreshield inspects every tool call an agent attempts before execution. If an agent tries to invoke a tool outside its permitted scope, the call is blocked before it runs.',
	},
	{
		icon: <GitBranch className="h-6 w-6 text-electric-green" />,
		title: 'Indirect injection via retrieved content',
		body: 'Agents retrieve documents, call APIs, and consume external data mid-chain. Any of that content can carry injected instructions. Koreshield scans tool outputs and retrieved content before the agent acts on them.',
	},
	{
		icon: <ShieldAlert className="h-6 w-6 text-electric-green" />,
		title: 'Chain-level threat detection',
		body: 'A single-turn jailbreak is easy to catch. Multi-step attacks that build across an agent chain are harder. Koreshield monitors for escalating patterns that only become visible across multiple interactions.',
	},
	{
		icon: <Bot className="h-6 w-6 text-electric-green" />,
		title: 'Autonomous action guardrails',
		body: 'The more autonomous the agent, the larger the blast radius of a successful attack. Koreshield applies configurable policy rules that cap what an agent can do, enforced at the proxy level.',
	},
];

const riskPatterns = [
	'Injected instructions hidden inside retrieved documents',
	'Tool calls to external APIs outside permitted scope',
	'Agents exfiltrating data via allowed-looking outputs',
	'Cascading injection across multi-agent pipelines',
	'Privilege escalation through orchestrator manipulation',
];

export default function SolutionAgentsSecurityPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="AI Agents Security | Koreshield"
				description="Secure agentic AI pipelines against indirect injection, tool abuse, and autonomous action escalation. Koreshield enforces policy at the proxy level."
			/>

			{/* Hero */}
			<section className="relative px-6 py-24 overflow-hidden ambient-glow">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
				<div className="relative mx-auto max-w-4xl text-center">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<span className="inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green mb-6">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green animate-pulse" />
							AI Agents Security
						</span>
						<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
							Agentic AI expands the attack surface. We close it.
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
							Agents that browse, execute, and retrieve are exposed to every piece of content they touch. Koreshield enforces policy at the proxy level (tool calls, retrieved content, and outputs) before the agent acts.
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

			{/* Why agents are different */}
			<section className="px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-4xl">
					<div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 mb-12">
						<h2 className="text-xl font-bold text-foreground">Why agentic AI is a different threat model</h2>
						<p className="mt-3 text-muted-foreground leading-relaxed">
							Traditional LLM security focuses on what users send to the model. Agents also consume outputs from external systems (retrieved documents, API responses, web pages) and act on them autonomously. An attacker who plants a malicious instruction in a document your agent retrieves can hijack the entire chain without ever interacting with your application directly.
						</p>
					</div>
					<div className="grid gap-8 md:grid-cols-2">
						{challenges.map((item, i) => (
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

			{/* Risk patterns */}
			<section className="bg-muted/30 px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-3xl">
					<h2 className="text-3xl font-bold tracking-tight">Attack patterns Koreshield addresses</h2>
					<p className="mt-4 text-muted-foreground mb-10">These are the patterns that emerge specifically in agentic systems. Many are invisible to traditional security tooling.</p>
					<div className="space-y-4">
						{riskPatterns.map((item, i) => (
							<motion.div
								key={item}
								initial={{ opacity: 0, x: -12 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.35, delay: i * 0.06 }}
								className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
							>
								<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-electric-green/10 text-xs font-bold text-electric-green">
									{i + 1}
								</div>
								<span className="text-sm leading-relaxed">{item}</span>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="px-6 py-20 border-t border-border text-center">
				<div className="mx-auto max-w-2xl">
					<h2 className="text-3xl font-bold">Ready to secure your agents?</h2>
					<p className="mt-4 text-muted-foreground">Koreshield works with any agentic framework. One URL change. Under 30 minutes to deploy.</p>
					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<Link to="/signup?plan=free" className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-semibold text-white transition-colors hover:bg-emerald-500">
							Start for free <ArrowRight className="h-4 w-4" />
						</Link>
						<Link to="/demo" className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 font-semibold transition-colors hover:bg-muted">
							Book a demo
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
