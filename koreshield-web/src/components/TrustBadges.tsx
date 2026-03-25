import { motion } from 'framer-motion';
import { CheckCircle, FileCheck, Lock, ShieldCheck } from 'lucide-react';

const badges = [
	{
		icon: ShieldCheck,
		title: 'SOC 2 Type II',
		description: 'Audit-ready',
		detail: 'Full access controls, logging, and incident response policies in place.',
	},
	{
		icon: Lock,
		title: 'GDPR / CCPA',
		description: 'Compliant',
		detail: 'Zero prompt data stored. No third-party data sharing. Right-to-deletion supported.',
	},
	{
		icon: FileCheck,
		title: 'ISO 27001',
		description: 'Aligned',
		detail: 'Information security management controls aligned to the standard.',
	},
	{
		icon: CheckCircle,
		title: 'Zero Retention',
		description: 'Privacy first',
		detail: '0 bytes of prompt or response content written to persistent storage.',
	},
];

export function TrustBadges() {
	return (
		<section className="py-20 md:py-28 border-t border-white/[0.06] bg-muted/30 dark:bg-white/[0.02] transition-colors">
			<div className="max-w-7xl mx-auto px-6">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					className="text-center mb-12"
				>
					<h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-[-0.03em] mb-3">
						Security You Can Show to Legal
					</h2>
					<p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
						Built for regulated environments where compliance isn't optional.
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
							className="flex flex-col gap-4 p-5 bg-card border border-white/[0.08] rounded-xl group hover:border-electric-green/30 transition-all duration-300 shadow-sm"
						>
							<div className="flex items-center gap-3">
								<div className="p-2.5 rounded-lg bg-electric-green/10 group-hover:bg-electric-green/20 transition-colors shrink-0">
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
