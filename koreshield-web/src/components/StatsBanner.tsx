import { motion } from 'framer-motion';

const stats = [
	{
		value: '95%',
		label: 'Detection Accuracy',
		sub: '< 3% false positives',
	},
	{
		value: '< 30ms',
		label: 'Interception Latency',
		sub: 'No perceptible overhead',
	},
	{
		value: '50+',
		label: 'Attack Patterns',
		sub: 'Prompt injection to SQL injection',
	},
	{
		value: '1M+',
		label: 'Requests Secured Daily',
		sub: 'Across production deployments',
	},
];

export function StatsBanner() {
	return (
		<section className="py-14 border-y border-white/[0.06] bg-muted/20 dark:bg-white/[0.015]">
			<div className="max-w-7xl mx-auto px-6">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
					{stats.map((stat, i) => (
						<motion.div
							key={stat.label}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: i * 0.1 }}
							className="flex flex-col items-center text-center"
						>
							<span className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight tabular-nums">
								{stat.value}
							</span>
							<span className="text-sm font-semibold text-foreground/80 mt-1">
								{stat.label}
							</span>
							<span className="text-xs text-muted-foreground mt-0.5">
								{stat.sub}
							</span>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
