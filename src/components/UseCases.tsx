import { motion } from 'framer-motion';
import { Building2, PoundSterling, HeartPulse, Scale } from 'lucide-react';

const useCases = [
	{
		icon: PoundSterling,
		title: 'Financial Services',
		description: 'Detect payment data, account identifiers, and social-engineering prompts before they pass through customer-facing AI workflows.',
		tag: 'PCI data',
		tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
	},
	{
		icon: HeartPulse,
		title: 'Healthcare',
		description: 'Reduce PHI exposure by scanning prompts, retrieved context, and responses for sensitive patient details before model output is shown.',
		tag: 'PHI',
		tagColor: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
	},
	{
		icon: Building2,
		title: 'Enterprise SaaS',
		description: 'Keep tenant context, policy decisions, and audit records attached to each request so AI features stay governable at scale.',
		tag: 'Multi-tenant AI',
		tagColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
	},
	{
		icon: Scale,
		title: 'Legal services',
		description: 'Flag confidential-client data, privileged material, and unsafe document instructions before AI assistants act on sensitive work.',
		tag: 'Confidentiality',
		tagColor: 'text-amber-300 bg-amber-300/10 border-amber-300/20',
	},
];

function UseCases() {
	return (
		<section className="relative overflow-hidden bg-muted/30 px-6 py-28 transition-colors dark:bg-muted/20 md:py-36">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
			<div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-electric-green/5 blur-3xl" />
			<div className="max-w-7xl mx-auto relative">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					viewport={{ once: true }}
					className="text-center mb-16"
				>
					<p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-electric-green">
						Where it fits
					</p>
					<h2 className="text-4xl md:text-6xl font-extrabold mb-5 text-foreground tracking-[-0.045em]">
						For AI Apps With Real Liability
					</h2>
					<p className="text-muted-foreground text-lg max-w-2xl mx-auto">
						Use Koreshield where model mistakes can expose regulated data, cross tenant boundaries, or create audit questions your team has to answer later.
					</p>
				</motion.div>

				<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
					{useCases.map((useCase, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: index * 0.15 }}
							viewport={{ once: true }}
							whileHover={{ y: -4 }}
							className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-card/80 p-7 shadow-sm transition-all duration-300 hover:border-electric-green/30 hover:shadow-lg hover:shadow-emerald-500/5"
						>
							<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
							<div className="flex items-start justify-between">
								<div className="bg-electric-green/10 w-14 h-14 rounded-xl flex items-center justify-center group-hover:bg-electric-green/20 transition-colors shrink-0">
									<useCase.icon className="w-7 h-7 text-electric-green" />
								</div>
								<span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${useCase.tagColor}`}>
									{useCase.tag}
								</span>
							</div>
							<div>
								<h3 className="text-2xl font-bold mb-3 text-foreground tracking-tight">{useCase.title}</h3>
								<p className="text-muted-foreground leading-relaxed">{useCase.description}</p>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}

export default UseCases;
