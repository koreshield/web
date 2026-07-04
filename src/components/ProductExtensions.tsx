import { motion } from 'framer-motion';
import { ArrowRight, FileCheck2, Mic2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const extensions = [
	{
		icon: FileCheck2,
		label: 'Koreshield Pilot',
		status: 'Roadmap',
		title: 'Compliance evidence from real AI security data',
		description:
			'Koreshield Pilot is designed to turn Koreshield detection events, immutable audit logs, red-team results, and CI/CD gate outcomes into audit-ready SOC 2 and ISO 42001 evidence.',
		to: '/solutions/korepilot',
	},
	{
		icon: Mic2,
		label: 'Voice & Audio Protection',
		status: 'Available',
		title: 'Protection for speech prompts and voice agents',
		description:
			'Extend Koreshield beyond typed prompts by scanning transcripts, spoken intent, and downstream model calls before voice agents take sensitive actions.',
		to: '/solutions/voice-audio-protection',
	},
];

export function ProductExtensions() {
	return (
		<section className="relative overflow-hidden border-t border-border bg-muted/20 px-4 py-24 sm:px-6 md:py-28">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.12),transparent_24rem),radial-gradient(circle_at_82%_70%,rgba(59,130,246,0.08),transparent_24rem)]" />
			<div className="relative z-10 mx-auto max-w-7xl">
				<div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
					<motion.div
						initial={{ opacity: 0, y: 18 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						viewport={{ once: true }}
					>
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-electric-green">
							What comes next
						</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">
							The same engine, wider protection.
						</h2>
						<p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
							Koreshield starts with AI traffic protection. The roadmap extends that signal into compliance evidence and voice-agent security.
						</p>
					</motion.div>

					<div className="grid gap-4 md:grid-cols-2">
						{extensions.map((item, index) => (
							<motion.div
								key={item.label}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.08 }}
								viewport={{ once: true }}
								className="group relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-card/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-electric-green/30"
							>
								<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-green/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
								<div className="mb-6 flex items-center justify-between gap-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-electric-green/20 bg-electric-green/10">
										<item.icon className="h-6 w-6 text-electric-green" />
									</div>
									<span className="rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-electric-green">
										{item.status}
									</span>
								</div>
								<p className="mb-2 text-sm font-bold text-electric-green">{item.label}</p>
								<h3 className="mb-3 text-2xl font-black tracking-[-0.035em] text-foreground">
									{item.title}
								</h3>
								<p className="mb-6 text-sm leading-relaxed text-muted-foreground">
									{item.description}
								</p>
								<Link
									to={item.to}
									className="inline-flex items-center gap-2 text-sm font-bold text-foreground transition-colors hover:text-electric-green"
								>
									Explore solution <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Link>
							</motion.div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
