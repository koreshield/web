import { motion } from 'framer-motion';

const ecosystemItems = [
	{
		name: 'NVIDIA Inception',
		label: 'Startup program',
		description: 'Part of NVIDIA Inception for AI startups building advanced infrastructure and applied AI systems.',
		logo: '/logos/ecosystem/nvidia-logo.png',
		logoClassName: 'h-11 w-auto object-contain',
		accent: 'from-[#76B900]/20 to-electric-green/10',
	},
	{
		name: 'AWS',
		label: 'Cloud ecosystem',
		description: 'Designed for teams deploying AI security controls across modern AWS-hosted workloads.',
		logo: '/logos/ecosystem/powered-by-aws-white.png',
		logoClassName: 'h-8 w-auto object-contain',
		accent: 'from-[#FF9900]/20 to-amber-500/10',
	},
	{
		name: 'Nebius Cloud',
		label: 'GPU cloud ecosystem',
		description: 'Aligned with high-performance AI infrastructure for model-serving and security workloads.',
		logo: '/logos/ecosystem/nebius-outline-white.svg',
		logoClassName: 'h-8 w-auto object-contain',
		accent: 'from-sky-500/20 to-cyan-500/10',
	},
	// Prepared but intentionally hidden until we can make a precise public claim without implying endorsement.
	// {
	// 	name: 'OVHcloud',
	// 	label: 'Cloud ecosystem',
	// 	description: 'Prepared for teams deploying Koreshield on OVHcloud infrastructure.',
	// 	logo: '/logos/ecosystem/ovhcloud-logo.svg',
	// 	logoClassName: 'h-8 w-auto object-contain',
	// 	accent: 'from-blue-600/20 to-cyan-500/10',
	// },
	// {
	// 	name: 'Cloudflare',
	// 	label: 'Edge ecosystem',
	// 	description: 'Prepared for edge routing and Worker-based Koreshield deployments.',
	// 	logo: '/logos/ecosystem/cloudflare-logo.svg',
	// 	logoClassName: 'h-8 w-auto object-contain',
	// 	accent: 'from-orange-500/20 to-amber-400/10',
	// },
];

export function EcosystemProof() {
	return (
		<section className="relative border-y border-white/[0.06] bg-muted/20 px-4 py-12 overflow-hidden sm:px-6">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_36rem)] pointer-events-none" />
			<div className="max-w-7xl mx-auto relative z-10">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45 }}
					className="flex flex-col gap-8 lg:flex-row lg:items-center"
				>
					<div className="text-center lg:w-[30%] lg:text-left">
						<p className="text-xs font-bold uppercase tracking-[0.28em] text-electric-green mb-3">
							Ecosystem Signal
						</p>
						<h2 className="text-2xl md:text-3xl font-extrabold tracking-[-0.035em] text-foreground">
							Building with serious AI infrastructure behind us.
						</h2>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:flex-1">
						{ecosystemItems.map((item, index) => (
							<motion.div
								key={item.name}
								initial={{ opacity: 0, y: 14 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.45, delay: index * 0.08 }}
								className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-electric-green/30 hover:shadow-lg hover:shadow-emerald-500/10"
							>
								<div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-80 transition-opacity group-hover:opacity-100`} />
								<div className="relative z-10">
									<div className="mb-5 flex flex-col items-start gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
										<div className="flex h-16 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-slate-950/80 px-4 min-[380px]:w-32">
											<img src={item.logo} alt={`${item.name} logo`} className={item.logoClassName} loading="lazy" />
										</div>
										<span className="w-full rounded-full border border-white/[0.08] bg-background/70 px-3 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground min-[380px]:w-auto">
											{item.label}
										</span>
									</div>
									<p className="text-xl font-black tracking-[-0.03em] text-foreground">{item.name}</p>
									<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
								</div>
							</motion.div>
						))}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
