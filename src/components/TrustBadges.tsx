import { motion } from 'framer-motion';
import { CheckCircle, FileCheck, Lock, ShieldCheck } from 'lucide-react';

const badges = [
	{
		icon: ShieldCheck,
		title: 'SOC 2 Evidence',
		description: 'Audit trail ready',
		detail: 'Structured logs, access controls, and incident-response evidence teams can map into SOC 2 readiness work.',
	},
	{
		icon: Lock,
		title: 'GDPR / CCPA Support',
		description: 'Data minimised',
		detail: 'Zero-retention defaults, configurable retention, and DPA-oriented processing language for privacy reviews.',
	},
	{
		icon: FileCheck,
		title: 'ISO 27001 Mapping',
		description: 'Controls aligned',
		detail: 'Security logging, tenant boundaries, and operational controls designed to support ISO 27001-aligned programs.',
	},
	{
		icon: CheckCircle,
		title: 'Zero Retention',
		description: 'Default posture',
		detail: 'Prompt and response content is processed transiently unless a customer explicitly enables a retention policy.',
	},
];

export function TrustBadges() {
	return (
		<section className="relative overflow-hidden border-t border-white/[0.06] bg-muted/30 py-20 transition-colors dark:bg-white/[0.02] md:py-28">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-green/50 to-transparent" />
			<div className="pointer-events-none absolute left-1/2 top-10 h-56 w-56 -translate-x-1/2 rounded-full bg-electric-green/10 blur-3xl" />
			<div className="max-w-7xl mx-auto px-6">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					className="text-center mb-12"
				>
					<p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-electric-green">
						Compliance posture
					</p>
					<h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-[-0.04em] mb-4">
						Evidence Your Legal Team Can Review
					</h2>
					<p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-lg">
						Koreshield does not replace your audit, but it gives regulated teams cleaner logs, clearer controls, and less sensitive data to defend.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
					{badges.map((badge, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: index * 0.1 }}
							className="group relative flex min-h-[190px] flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-card/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-electric-green/30 hover:shadow-lg hover:shadow-emerald-500/10"
						>
							<div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-electric-green/0 blur-2xl transition-colors duration-300 group-hover:bg-electric-green/10" />
							<div className="flex items-center gap-3">
								<div className="p-2.5 rounded-xl bg-electric-green/10 group-hover:bg-electric-green/20 transition-colors shrink-0">
									<badge.icon className="w-5 h-5 text-electric-green" />
								</div>
								<div>
									<p className="font-bold text-foreground text-sm leading-tight">{badge.title}</p>
									<p className="text-xs text-electric-green font-semibold uppercase tracking-widest mt-0.5">{badge.description}</p>
								</div>
							</div>
							<p className="text-xs text-muted-foreground leading-relaxed">{badge.detail}</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
