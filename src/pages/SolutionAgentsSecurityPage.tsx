import { motion } from 'framer-motion';
import { ArrowRight, Bot, Braces, GitBranch, MousePointerClick, ShieldAlert, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const agentRisks = [
	{ icon: Braces, title: 'Tool output becomes instruction', body: 'A web page, API response, or retrieved file can smuggle a command back into the chain.' },
	{ icon: Wrench, title: 'Tools expand blast radius', body: 'The model is not just talking. It can search, email, update records, or call internal systems.' },
	{ icon: GitBranch, title: 'Attacks span multiple turns', body: 'The unsafe intent may only become obvious after several observations and actions.' },
];

const chain = ['User goal', 'Agent plan', 'Tool call', 'Koreshield check', 'Allowed action'];

export default function SolutionAgentsSecurityPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Agent Security"
				description="Secure agentic AI pipelines against tool abuse, indirect prompt injection, and autonomous action escalation."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(168,85,247,0.1),transparent_24%)]" />
				<div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<Bot className="h-3.5 w-3.5" />
							AI Agents Security
						</span>
						<h1 className="max-w-4xl text-5xl font-extrabold tracking-[-0.055em] md:text-7xl">
							Agents need guardrails where they act.
						</h1>
						<p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							Koreshield checks retrieved content, tool output, and planned actions before autonomous systems do something expensive.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link to="/signup?plan=growth" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-bold text-white transition-colors hover:bg-emerald-bright">
								Get started <ArrowRight className="h-4 w-4" />
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
						<div className="mb-4 flex items-center justify-between">
							<p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">agent chain</p>
							<span className="rounded-full bg-electric-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-electric-green">policy enforced</span>
						</div>
						<div className="space-y-3">
							{chain.map((step, index) => (
								<div key={step} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border bg-background/70 p-4">
									<span className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-green/10 text-xs font-black text-electric-green">
										{index + 1}
									</span>
									<span className="font-semibold">{step}</span>
									{index === 3 ? <ShieldAlert className="h-5 w-5 text-electric-green" /> : <MousePointerClick className="h-5 w-5 text-muted-foreground" />}
								</div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-10 max-w-3xl">
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Why agents are different</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">They read, decide, and execute.</h2>
					</div>
					<div className="grid gap-5 md:grid-cols-3">
						{agentRisks.map((item, index) => (
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
						<h2 className="text-3xl font-extrabold tracking-[-0.03em]">Secure the action boundary, not only the chat box.</h2>
						<p className="mt-2 text-sm text-muted-foreground">Use Koreshield before tool calls, after retrieval, and before provider execution.</p>
					</div>
					<Link to="/solutions/rag-security" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted">
						See RAG security <ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</section>
		</div>
	);
}
