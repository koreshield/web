import { motion } from 'framer-motion';
import { Building2, DollarSign, HeartPulse } from 'lucide-react';

const useCases = [
	{
		icon: DollarSign,
		title: 'Fintech',
		description: 'A single exfiltrated account number is a compliance violation. KoreShield scans every prompt and response for PCI-DSS sensitive data  -  blocking unauthorized extraction before it leaves your stack.',
		tag: 'PCI-DSS',
		tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
	},
	{
		icon: HeartPulse,
		title: 'Healthcare',
		description: 'PHI leaking through an LLM isn\'t just a breach  -  it\'s a HIPAA notification. KoreShield automatically redacts patient identifiers from prompts and responses, with full audit logs for your compliance team.',
		tag: 'HIPAA',
		tagColor: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
	},
	{
		icon: Building2,
		title: 'Enterprise SaaS',
		description: 'In multi-tenant AI applications, user A\'s data is always one bad prompt away from user B\'s screen. KoreShield enforces tenant isolation at the inference layer, before any leakage can occur.',
		tag: 'Multi-tenant',
		tagColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
	},
];

function UseCases() {
	return (
		<section className="py-28 md:py-36 px-6 bg-muted/30 dark:bg-muted/20 transition-colors">
			<div className="max-w-7xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					viewport={{ once: true }}
					className="text-center mb-16"
				>
					<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground tracking-[-0.04em]">
						Where a Breach Means More Than Downtime
					</h2>
					<p className="text-muted-foreground text-lg max-w-2xl mx-auto">
						KoreShield is built for environments where AI errors have regulatory and financial consequences  -  not just bad press.
					</p>
				</motion.div>

				<div className="grid md:grid-cols-3 gap-6">
					{useCases.map((useCase, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: index * 0.15 }}
							viewport={{ once: true }}
							whileHover={{ y: -4 }}
							className="bg-card border border-white/[0.08] rounded-2xl p-8 hover:border-electric-green/30 transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col gap-5"
						>
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
