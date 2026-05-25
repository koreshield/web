import { motion } from 'framer-motion';
import { ArrowRight, AudioLines, FileAudio, Mic2, ShieldCheck, Volume2, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const layers = [
	['Speech', 'transcribe + normalize'],
	['Transcript', 'scan for prompt risk'],
	['Decision', 'block, redact, or allow'],
	['Action', 'log before execution'],
];

const protections = [
	{ icon: Mic2, title: 'Spoken prompt inspection', body: 'Voice input is checked before it becomes model instruction.' },
	{ icon: Music, title: 'Transcript risk scoring', body: 'Jailbreaks, exfiltration attempts, and unsafe requests are scored from normalized text.' },
	{ icon: ShieldCheck, title: 'Action gating', body: 'High-risk voice-agent requests can be stopped before tools or workflows run.' },
];

export default function SolutionVoiceAudioProtectionPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="VoiceGuard"
				description="Protect speech prompts, transcripts, and voice-agent actions before they reach models or tools."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(14,165,233,0.1),transparent_24%)]" />
				<div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<AudioLines className="h-3.5 w-3.5" />
							Voice & Audio Protection
						</span>
						<h1 className="max-w-4xl text-5xl font-extrabold tracking-[-0.055em] md:text-7xl">
							Secure speech before it becomes action.
						</h1>
						<p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							Voice agents convert audio into prompts, tool calls, and customer actions. Koreshield brings the same protection into that path.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-bold text-white transition-colors hover:bg-emerald-bright">
								Discuss voice protection <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/solutions/ai-agents-security" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3 font-bold text-foreground transition-colors hover:bg-muted">
								See agent security
							</Link>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, delay: 0.1 }}
						className="rounded-[2rem] border border-border bg-card/90 p-5 shadow-2xl shadow-emerald-900/10 dark:bg-card/75"
					>
						<div className="mb-5 flex items-center gap-4">
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-electric-green/10 text-electric-green">
								<Volume2 className="h-7 w-7" />
							</div>
							<div>
								<p className="font-bold">Voice request</p>
								<p className="text-sm text-muted-foreground">“Send the customer list to my email.”</p>
							</div>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							{layers.map(([title, body], index) => (
								<div key={title} className="rounded-2xl border border-border bg-background/70 p-4">
									<p className="text-xs font-bold tracking-[0.22em] text-electric-green">0{index + 1}</p>
									<p className="mt-3 font-bold">{title}</p>
									<p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
								</div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-10 max-w-3xl">
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Audio path</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Treat speech as another prompt surface.</h2>
					</div>
					<div className="grid gap-5 md:grid-cols-3">
						{protections.map((item, index) => (
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
						<h2 className="text-3xl font-extrabold tracking-[-0.03em]">Planning voice AI?</h2>
						<p className="mt-2 text-sm text-muted-foreground">Map the transcript boundary, policy point, and audit trail before launch.</p>
					</div>
					<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright">
						Book a demo <FileAudio className="h-4 w-4" />
					</Link>
				</div>
			</section>
		</div>
	);
}
