import { motion } from 'framer-motion';
import {
	ArrowRight,
	AudioLines,
	Route,
	FileSearch,
	Gauge,
	Radar,
	ShieldCheck,
	Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const solutions = [
	{
		title: 'AI Detection & Response',
		to: '/solutions/ai-detection-response',
		icon: Radar,
		body: 'Detect, classify, block, alert, and record risky AI traffic.',
		label: 'Runtime defense',
	},
	{
		title: 'Application Protection',
		to: '/solutions/ai-application-protection',
		icon: ShieldCheck,
		body: 'Put Koreshield in front of production LLM calls without a rebuild.',
		label: 'Proxy layer',
	},
	{
		title: 'AI Agents Security',
		to: '/solutions/ai-agents-security',
		icon: Route,
		body: 'Gate tool calls, session state, and agent actions before they execute.',
		label: 'Tool control',
	},
	{
		title: 'AI Usage Control',
		to: '/solutions/ai-usage-control',
		icon: Gauge,
		body: 'Set policy around what AI can do, where, and for whom.',
		label: 'Policy',
	},
	{
		title: 'RAG Security',
		to: '/solutions/rag-security',
		icon: FileSearch,
		body: 'Scan retrieved context before poisoned documents reach the model.',
		label: 'Context safety',
	},
	{
		title: 'Koreshield Pilot',
		to: '/solutions/korepilot',
		icon: Workflow,
		body: 'Turn Koreshield events into compliance evidence and risk posture.',
		label: 'Evidence',
	},
	{
		title: 'Voice & Audio Protection',
		to: '/solutions/voice-audio-protection',
		icon: AudioLines,
		body: 'Inspect speech prompts before voice agents respond or take action.',
		label: 'VoiceGuard',
	},
];

const flow = ['Prompt', 'Context', 'Speech', 'Provider', 'Tool call', 'Audit log'];

export default function SolutionsPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Solutions"
					description="Explore Koreshield solutions for AI detection, application protection, RAG security, agent security, VoiceGuard, usage control, and Koreshield Pilot evidence."
				/>
			<section className="relative overflow-hidden px-4 py-20 ambient-glow sm:px-6 md:py-28">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_78%_14%,rgba(59,130,246,0.08),transparent_24%)]" />
				<div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-5 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-electric-green sm:text-xs">
							<ShieldCheck className="h-3.5 w-3.5" />
							Solutions
						</span>
						<h1 className="max-w-4xl text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl md:text-7xl">
							One security layer for live AI systems.
						</h1>
						<p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
							Koreshield protects prompts, retrieved context, speech, provider calls, tool actions, and audit evidence from the same runtime path.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link to="/signup?plan=growth" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright sm:px-7">
								Choose a plan <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted sm:px-7">
								Book a demo
							</Link>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, delay: 0.08 }}
						className="rounded-[1.75rem] border border-border bg-card/85 p-4 shadow-2xl shadow-emerald-900/10 sm:p-5 md:rounded-[2rem]"
					>
						<div className="mb-4 flex items-center justify-between gap-4">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Protected path</p>
								<p className="mt-1 text-sm text-muted-foreground">before AI reaches customers</p>
							</div>
							<img src="/logo/dark/SVG/Black.svg" alt="" className="h-8 w-8 dark:hidden" />
							<img src="/logo/light/SVG/White.svg" alt="" className="hidden h-8 w-8 dark:block" />
						</div>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{flow.map((item, index) => (
								<div key={item} className="rounded-2xl border border-border bg-background/70 p-4">
									<p className="text-[10px] font-black uppercase tracking-[0.24em] text-electric-green">0{index + 1}</p>
									<p className="mt-3 text-sm font-bold">{item}</p>
								</div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/30 px-4 py-16 sm:px-6 md:py-20">
				<div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{solutions.map((solution, index) => (
						<motion.article
							key={solution.title}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4, delay: index * 0.04 }}
							className="group rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-electric-green/30 md:rounded-[2rem] md:p-6"
						>
							<div className="mb-6 flex items-start justify-between gap-4">
								<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-green/10 text-electric-green">
									<solution.icon className="h-6 w-6" />
								</span>
								<span className="rounded-full border border-border bg-background/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
									{solution.label}
								</span>
							</div>
							<h2 className="text-2xl font-extrabold tracking-[-0.035em]">{solution.title}</h2>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{solution.body}</p>
							<Link to={solution.to} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-electric-green hover:underline">
								Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>
						</motion.article>
					))}
				</div>
			</section>

			<section className="px-4 py-16 sm:px-6 md:py-20">
				<div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[1.75rem] border border-border bg-card/85 p-6 shadow-sm md:flex-row md:items-center md:justify-between md:rounded-[2rem] md:p-8">
					<div>
						<p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-electric-green">Not sure where to start?</p>
						<h2 className="text-3xl font-extrabold tracking-[-0.04em] md:text-4xl">Start with the proxy. Expand as the risk becomes real.</h2>
					</div>
					<Link to="/solutions/ai-application-protection" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright">
						See application protection <ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</section>
		</div>
	);
}
