import { motion } from 'framer-motion';
import { ArrowRight, AudioLines, Bot, FileAudio, Mic2, Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const protections = [
	{
		icon: Mic2,
		title: 'Speech prompt inspection',
		body: 'Voice input is transcribed, normalized, and scanned before it becomes a prompt or agent instruction.',
	},
	{
		icon: AudioLines,
		title: 'Intent and transcript risk',
		body: 'The transcript and inferred intent can be scored for jailbreaks, exfiltration, unsafe actions, and policy violations.',
	},
	{
		icon: Bot,
		title: 'Voice-agent action control',
		body: 'High-risk spoken requests can be blocked before they trigger tools, workflows, customer data access, or external calls.',
	},
	{
		icon: Route,
		title: 'Same downstream policy layer',
		body: 'After audio becomes text, Koreshield applies the same provider routing, logging, and policy decisions used for typed prompts.',
	},
];

const flow = ['Audio input', 'Transcription', 'Koreshield scan', 'Policy decision', 'Model or agent action'];

export default function SolutionVoiceAudioProtectionPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Voice & Audio AI Protection | Koreshield"
				description="Koreshield's planned voice and audio protection layer scans speech prompts, transcripts, and downstream model calls before voice agents take sensitive actions."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
				<div className="relative mx-auto max-w-4xl text-center">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green" />
							Voice &amp; audio protection
						</span>
						<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
							Secure speech before it becomes an AI action.
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
							Voice agents turn spoken requests into model instructions and tool calls. Koreshield's planned audio layer brings prompt security into that path.
						</p>
						<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
							<Link to="/demo" className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-semibold text-white transition-colors hover:bg-emerald-500">
								Discuss voice protection <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/solutions/ai-agents-security" className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 font-semibold transition-colors hover:bg-muted">
								See agent security
							</Link>
						</div>
					</motion.div>
				</div>
			</section>

			<section className="border-t border-border px-6 py-20">
				<div className="mx-auto max-w-5xl">
					<h2 className="mb-3 text-3xl font-bold tracking-tight">How audio protection works</h2>
					<p className="mb-12 max-w-2xl text-muted-foreground">
						The core logic is simple: treat speech as an input channel into the same AI security layer, then enforce policy before risky downstream actions happen.
					</p>
					<div className="grid gap-8 md:grid-cols-2">
						{protections.map((item, index) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: index * 0.07 }}
								className="flex gap-4 rounded-2xl border border-border bg-card p-6"
							>
								<div className="mt-0.5 flex-shrink-0 rounded-xl border border-electric-green/20 bg-electric-green/10 p-2.5">
									<item.icon className="h-6 w-6 text-electric-green" />
								</div>
								<div>
									<p className="font-semibold">{item.title}</p>
									<p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="border-t border-border bg-muted/30 px-6 py-20">
				<div className="mx-auto max-w-5xl">
					<div className="grid gap-10 md:grid-cols-[0.95fr_1.05fr] md:items-center">
						<div>
							<h2 className="text-3xl font-bold tracking-tight">Designed for voice agents, call workflows, and spoken prompts</h2>
							<p className="mt-4 text-muted-foreground">
								The risk is not only what a user says. It is what the agent does next: retrieve data, call tools, update records, or forward instructions to another model.
							</p>
						</div>
						<div className="rounded-2xl border border-border bg-card p-6">
							<div className="space-y-3">
								{flow.map((step, index) => (
									<div key={step} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-background/60 px-4 py-3 text-sm">
										<span className="flex h-7 w-7 items-center justify-center rounded-full bg-electric-green/10 text-xs font-black text-electric-green">
											{index + 1}
										</span>
										<span className="font-medium">{step}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="border-t border-border px-6 py-20 text-center">
				<div className="mx-auto max-w-2xl">
					<div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-electric-green/20 bg-electric-green/10">
						<FileAudio className="h-6 w-6 text-electric-green" />
					</div>
					<h2 className="text-3xl font-bold">Planning voice AI security?</h2>
					<p className="mt-4 text-muted-foreground">
						We can map the audio path, transcript boundary, policy decision point, and audit trail before your voice agent reaches production.
					</p>
					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<Link to="/demo" className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-semibold text-white transition-colors hover:bg-emerald-500">
							Book a demo <ArrowRight className="h-4 w-4" />
						</Link>
						<Link to="/solutions/rag-security" className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 font-semibold transition-colors hover:bg-muted">
							Explore RAG security
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
