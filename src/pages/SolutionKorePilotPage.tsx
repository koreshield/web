import { motion } from 'framer-motion';
import { ArrowRight, Bell, Database, FileCheck2, GitBranch, LockKeyhole, ShieldCheck, Target, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const evidenceFeeds = [
	{
		icon: Target,
		title: 'Detection events',
		body: 'Structured records of what came in, what was detected, the threat class, and the final policy outcome.',
		highlight: true,
	},
	{
		icon: ShieldCheck,
		title: 'Risk scores',
		body: 'Aggregated posture views by tenant, integration, and time window, grounded in real Koreshield request scoring.',
		highlight: false,
	},
	{
		icon: LockKeyhole,
		title: 'Immutable audit logs',
		body: 'Audit evidence designed to be verified, tenant-scoped, and resistant to after-the-fact modification.',
		highlight: true,
	},
	{
		icon: Database,
		title: 'Tenant context',
		body: 'Isolation metadata keeps every event mapped to the right customer, report, and compliance boundary.',
		highlight: false,
	},
	{
		icon: GitBranch,
		title: 'Red-team and CI/CD gates',
		body: 'KS-10 attack-suite results and KS-11 gate outcomes become continuous control validation evidence.',
		highlight: true,
	},
	{
		icon: Bell,
		title: 'Alert records',
		body: 'Alert activity shows monitoring and incident-response controls are active, not just documented.',
		highlight: false,
	},
];

const controlFramework = [
	{ label: 'Tenant isolation', icon: LockKeyhole },
	{ label: 'Immutable audit logs', icon: FileCheck2 },
	{ label: 'Real-time alerting', icon: Bell },
	{ label: 'Red-team validation', icon: Target },
	{ label: 'CI/CD security gate', icon: GitBranch },
];

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5 },
	},
};

export default function SolutionKorePilotPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="KorePilot"
				description="KorePilot is Koreshield's planned compliance evidence layer, designed to map detection events, audit logs, red-team results, and CI/CD gates to SOC 2 and ISO 42001 controls."
			/>

			{/* Hero Section */}
			<section className="relative overflow-hidden px-6 py-32 md:py-40">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
				
				{/* Animated gradient orb */}
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-electric-green/10 rounded-full blur-3xl pointer-events-none" />
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

				<div className="relative mx-auto max-w-5xl">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="text-center"
					>
						<div className="inline-flex items-center gap-2 rounded-full border border-electric-green/30 bg-electric-green/5 px-4 py-2 mb-8 backdrop-blur-sm">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green" />
							<span className="text-xs font-semibold uppercase tracking-widest text-electric-green/90">KorePilot roadmap</span>
						</div>

						<h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
							Live compliance evidence
							<span className="block bg-gradient-to-r from-electric-green via-emerald-400 to-electric-green bg-clip-text text-transparent">
								from real detection data
							</span>
						</h1>

						<p className="mx-auto max-w-3xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-12">
							KorePilot maps Koreshield's security detection layer directly to compliance frameworks. No translation layers, no guesswork—just audit-ready evidence derived from the same controls protecting your production traffic.
						</p>

						<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
							<Link
								to="/demo"
								className="inline-flex items-center gap-2 rounded-lg bg-electric-green px-8 py-3.5 font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-electric-green/20 active:scale-95 group"
							>
								Discuss KorePilot
								<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
							</Link>
							<Link
								to="/solutions/ai-detection-response"
								className="inline-flex items-center gap-2 rounded-lg border border-electric-green/30 bg-electric-green/5 px-8 py-3.5 font-semibold text-foreground transition-all hover:bg-electric-green/10 hover:border-electric-green/50 active:scale-95 backdrop-blur-sm"
							>
								Explore detection layer
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Evidence Feeds Section */}
			<section className="relative px-6 py-24 border-t border-border">
				<div className="mx-auto max-w-6xl">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: '-100px' }}
						transition={{ duration: 0.6 }}
						className="mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">How KorePilot fits with Koreshield</h2>
						<p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
							Koreshield already emits structured security data on every request. KorePilot ingests it, maps it to controls, and surfaces audit-ready evidence.
						</p>
					</motion.div>

					<motion.div
						variants={containerVariants}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: '-100px' }}
						className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
					>
						{evidenceFeeds.map((item) => (
							<motion.div
								key={item.title}
								variants={itemVariants}
								className={`group relative rounded-2xl border transition-all duration-300 p-8 ${
									item.highlight
										? 'border-electric-green/30 bg-gradient-to-br from-electric-green/10 to-emerald-500/5 hover:border-electric-green/60 hover:shadow-lg hover:shadow-electric-green/10'
										: 'border-border bg-card hover:border-electric-green/20 hover:bg-card/80'
								}`}
							>
								{/* Subtle gradient glow on hover */}
								<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-electric-green/0 to-emerald-500/0 group-hover:from-electric-green/5 group-hover:to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

								<div className="relative">
									<div className={`inline-flex rounded-xl p-3 mb-4 border ${
										item.highlight
											? 'border-electric-green/40 bg-electric-green/15'
											: 'border-electric-green/20 bg-electric-green/10'
									}`}>
										<item.icon className="h-6 w-6 text-electric-green" />
									</div>

									<h3 className="text-lg font-semibold mb-2 group-hover:text-electric-green transition-colors">{item.title}</h3>
									<p className="text-sm leading-relaxed text-muted-foreground group-hover:text-muted-foreground/90 transition-colors">{item.body}</p>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Control Framework Section */}
			<section className="relative px-6 py-24 border-t border-border bg-muted/40">
				<div className="mx-auto max-w-6xl">
					<div className="grid gap-16 md:gap-20 md:grid-cols-[1fr_1.2fr] md:items-center">
						<motion.div
							initial={{ opacity: 0, x: -30 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true, margin: '-100px' }}
							transition={{ duration: 0.6 }}
						>
							<h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Built on the KS framework</h2>
							<p className="text-lg text-muted-foreground leading-relaxed mb-6">
								The real advantage isn't another checklist. It's live control evidence generated from the exact security layer protecting your production traffic.
							</p>
							<div className="flex items-center gap-3 p-4 rounded-xl border border-electric-green/20 bg-electric-green/5 backdrop-blur-sm">
								<Zap className="h-5 w-5 text-electric-green flex-shrink-0" />
								<span className="text-sm font-medium text-electric-green/90">Evidence stays fresh as threats evolve</span>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 30 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true, margin: '-100px' }}
							transition={{ duration: 0.6, delay: 0.1 }}
							className="space-y-3"
						>
							{controlFramework.map((item, index) => (
								<div
									key={item.label}
									className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] bg-background/60 hover:bg-background/100 hover:border-electric-green/30 transition-all duration-300 cursor-pointer"
									style={{
										animationDelay: `${index * 50}ms`,
									}}
								>
									<div className="inline-flex p-2.5 rounded-lg border border-electric-green/20 bg-electric-green/10 group-hover:bg-electric-green/20 transition-colors">
										<item.icon className="h-5 w-5 text-electric-green" />
									</div>
									<span className="font-medium text-sm group-hover:text-electric-green transition-colors">{item.label}</span>
									<ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-electric-green group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
								</div>
							))}
						</motion.div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative px-6 py-28 border-t border-border overflow-hidden">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: '-100px' }}
					transition={{ duration: 0.6 }}
					className="relative mx-auto max-w-3xl text-center"
				>
					<h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Plan your evidence pipeline early</h2>
					<p className="text-lg text-muted-foreground leading-relaxed mb-10">
						The architecture decision matters: does KorePilot ingest through webhooks for real-time evidence, or batch pulls for control? We can align that before the build hardens.
					</p>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							to="/demo"
							className="inline-flex items-center gap-2 rounded-lg bg-electric-green px-8 py-3.5 font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-electric-green/20 active:scale-95 group w-full sm:w-auto justify-center"
						>
							Book a technical discussion
							<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
						</Link>
						<Link
							to="/docs"
							className="inline-flex items-center gap-2 rounded-lg border border-electric-green/30 bg-electric-green/5 px-8 py-3.5 font-semibold text-foreground transition-all hover:bg-electric-green/10 hover:border-electric-green/50 active:scale-95 backdrop-blur-sm w-full sm:w-auto justify-center"
						>
							View technical docs
						</Link>
					</div>
				</motion.div>
			</section>
		</div>
	);
}
