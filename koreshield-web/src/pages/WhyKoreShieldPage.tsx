import { motion } from 'framer-motion';
import {
	Shield, Zap, Code, Users, TrendingUp, Lock,
	Globe, Cloud, Building2, Wrench, Check, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const differentiators = [
	{
		icon: <Shield className="w-6 h-6" />,
		title: '95%+ Accuracy',
		description: 'Industry-leading detection with 96.55% true positive rate and only 3.03% false positives.',
		color: 'text-electric-green',
		bg: 'bg-electric-green/10',
	},
	{
		icon: <Code className="w-6 h-6" />,
		title: 'Open SDKs & Docs',
		description: 'SDKs and documentation are MIT-licensed for clear integrations and auditability.',
		color: 'text-blue-400',
		bg: 'bg-blue-400/10',
	},
	{
		icon: <Zap className="w-6 h-6" />,
		title: 'Lightning Fast',
		description: 'Low latency overhead designed for production deployments and fast request paths.',
		color: 'text-yellow-400',
		bg: 'bg-yellow-400/10',
	},
	{
		icon: <Users className="w-6 h-6" />,
		title: 'Enterprise Ready',
		description: 'Multi-tenancy, RBAC, audit logs, SOC2-ready, and compliance features out of the box.',
		color: 'text-purple-400',
		bg: 'bg-purple-400/10',
	},
];

const advantages = [
	{
		icon: <Lock className="w-7 h-7" />,
		title: 'Defense in Depth',
		description: 'We don\'t rely on a single detection method. KoreShield uses 8 layers of security: sanitization, heuristic detection, ML-based analysis, custom rules, blocklists/allowlists, policy enforcement, RBAC, and provider validation.',
		bullets: [
			'Pattern matching with 50+ attack signatures',
			'ML-based anomaly detection',
			'Custom DSL for flexible rules',
			'RAG-specific protections',
		],
	},
	{
		icon: <Globe className="w-7 h-7" />,
		title: 'Multi-Provider Excellence',
		description: 'Unlike competitors locked to specific providers, KoreShield works seamlessly with OpenAI, Anthropic, Google Gemini, DeepSeek, Azure OpenAI, and any OpenAI-compatible API.',
		bullets: [
			'Unified security across all LLM providers',
			'No vendor lock-in',
			'Easy provider switching',
			'Multi-provider routing and failover',
		],
	},
	{
		icon: <TrendingUp className="w-7 h-7" />,
		title: 'Research-Driven Innovation',
		description: 'We evolve the threat model with research, production telemetry, and customer feedback to keep defences current, not just reactive.',
		bullets: [
			'Continuous pattern updates',
			'Dedicated research pipeline',
			'Feedback-driven improvements',
			'Real-world threat intelligence',
		],
	},
];

const deploymentOptions = [
	{
		icon: <Cloud className="w-5 h-5 text-blue-400" />,
		title: 'Managed Cloud',
		description: 'Let us handle infrastructure, scaling, and updates. Focus on your product.',
		bullets: ['Managed reliability', 'Automatic scaling', 'Zero maintenance', 'Global edge deployment'],
		border: 'border-blue-400/20',
		bg: 'bg-blue-400/5',
	},
	{
		icon: <Building2 className="w-5 h-5 text-electric-green" />,
		title: 'Self-Hosted',
		description: 'Deploy on your own infrastructure for complete control and data sovereignty.',
		bullets: ['Full data control', 'VPC / on-premise', 'Air-gapped options', 'Custom compliance'],
		border: 'border-electric-green/20',
		bg: 'bg-electric-green/5',
	},
	{
		icon: <Wrench className="w-5 h-5 text-purple-400" />,
		title: 'Hybrid',
		description: 'Mix cloud and self-hosted for the best of both worlds.',
		bullets: ['Sensitive data on-prem', 'Public data in cloud', 'Flexible architecture', 'Cost optimisation'],
		border: 'border-purple-400/20',
		bg: 'bg-purple-400/5',
	},
];

const stats = [
	{ value: '95%+', label: 'Detection Accuracy' },
	{ value: '<30ms', label: 'Latency Overhead' },
	{ value: '50+', label: 'Attack Patterns' },
	{ value: '5+', label: 'LLM Providers' },
];

const comparisons = [
	{ to: '/vs/lakera-guard', title: 'KoreShield vs Lakera Guard', description: 'See why KoreShield is the enterprise-grade alternative to legacy solutions.' },
	{ to: '/vs/llm-guard', title: 'KoreShield vs LLM Guard', description: 'Compare features, ease of use, and enterprise readiness.' },
	{ to: '/vs/build-yourself', title: 'KoreShield vs Building In-House', description: 'Understand the hidden costs of maintenance and custom training.' },
];

export default function WhyKoreShieldPage() {
	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<SEOMeta
				title="Why KoreShield"
				description="Discover what makes KoreShield the best LLM security solution: 95% detection accuracy, enterprise-ready features, and flexible deployment."
			/>

			{/* Hero */}
			<section className="py-24 px-6 relative ambient-glow">
				<div className="max-w-4xl mx-auto text-center relative z-10">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<div className="inline-flex items-center gap-2 bg-electric-green/10 border border-electric-green/20 text-electric-green text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
							<span className="w-1.5 h-1.5 rounded-full bg-electric-green" />
							Why KoreShield
						</div>
						<h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-[-0.04em] text-foreground">
							Enterprise-grade LLM security.<br className="hidden md:block" /> Without the enterprise wait.
						</h1>
						<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
							Proven accuracy, flexible deployment, and a security model that evolves as fast as the threats do.
						</p>
					</motion.div>
				</div>
			</section>

			<div className="max-w-7xl mx-auto px-6 py-12 space-y-20">

				{/* Core Differentiators */}
				<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
					<h2 className="text-3xl font-bold text-foreground mb-3 text-center tracking-tight">Core Differentiators</h2>
					<p className="text-center text-muted-foreground mb-10">What sets KoreShield apart from every other option.</p>
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
						{differentiators.map((d) => (
							<div key={d.title} className="bg-card border border-border rounded-xl p-6">
								<div className={`${d.bg} w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${d.color}`}>
									{d.icon}
								</div>
								<h3 className="text-base font-bold text-foreground mb-2">{d.title}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
							</div>
						))}
					</div>
				</motion.div>

				{/* The KoreShield Advantage */}
				<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
					<h2 className="text-3xl font-bold text-foreground mb-3 text-center tracking-tight">The KoreShield Advantage</h2>
					<p className="text-center text-muted-foreground mb-10">Layers of security working together, not just pattern matching.</p>
					<div className="bg-card border border-border rounded-2xl divide-y divide-border">
						{advantages.map((adv) => (
							<div key={adv.title} className="p-8 flex gap-6">
								<div className="bg-electric-green/10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-electric-green">
									{adv.icon}
								</div>
								<div>
									<h3 className="text-xl font-bold text-foreground mb-2">{adv.title}</h3>
									<p className="text-muted-foreground mb-4 leading-relaxed text-sm">{adv.description}</p>
									<ul className="space-y-1.5">
										{adv.bullets.map((b) => (
											<li key={b} className="flex items-center gap-2 text-sm text-foreground/80">
												<Check className="w-4 h-4 text-electric-green shrink-0" />
												{b}
											</li>
										))}
									</ul>
								</div>
							</div>
						))}
					</div>
				</motion.div>

				{/* Deploy Your Way */}
				<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
					<h2 className="text-3xl font-bold text-foreground mb-3 text-center tracking-tight">Deploy Your Way</h2>
					<p className="text-center text-muted-foreground mb-10">On our infrastructure, yours, or both. No architecture changes required.</p>
					<div className="grid md:grid-cols-3 gap-5">
						{deploymentOptions.map((opt) => (
							<div key={opt.title} className={`bg-card border ${opt.border} rounded-xl p-6`}>
								<div className={`${opt.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
									{opt.icon}
								</div>
								<h3 className="text-base font-bold text-foreground mb-2">{opt.title}</h3>
								<p className="text-sm text-muted-foreground mb-4 leading-relaxed">{opt.description}</p>
								<ul className="space-y-1.5">
									{opt.bullets.map((b) => (
										<li key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
											{b}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</motion.div>

				{/* By the Numbers */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="bg-card border border-white/[0.08] rounded-2xl p-12 relative overflow-hidden"
				>
					<div className="absolute inset-0 bg-gradient-to-br from-electric-green/[0.04] via-transparent to-transparent pointer-events-none" />
					<h2 className="text-3xl font-bold text-center text-foreground mb-12 tracking-tight relative z-10">KoreShield by the Numbers</h2>
					<div className="grid md:grid-cols-4 gap-8 text-center relative z-10">
						{stats.map((s) => (
							<div key={s.label}>
								<div className="text-5xl font-extrabold text-electric-green mb-2 tracking-tight">{s.value}</div>
								<div className="text-sm text-muted-foreground">{s.label}</div>
							</div>
						))}
					</div>
				</motion.div>

				{/* See How We Compare */}
				<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
					<h2 className="text-3xl font-bold text-foreground mb-3 text-center tracking-tight">See How We Compare</h2>
					<p className="text-center text-muted-foreground mb-10">Honest, detailed comparisons against the alternatives.</p>
					<div className="grid md:grid-cols-3 gap-5">
						{comparisons.map((c) => (
							<Link
								key={c.to}
								to={c.to}
								className="group bg-card border border-border hover:border-primary/40 rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5 block"
							>
								<h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{c.title}</h3>
								<p className="text-sm text-muted-foreground mb-4 leading-relaxed">{c.description}</p>
								<span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
									Read comparison <ArrowRight className="w-3.5 h-3.5" />
								</span>
							</Link>
						))}
					</div>
				</motion.div>

				{/* Final CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="bg-card border border-white/[0.08] rounded-2xl p-12 text-center relative overflow-hidden"
				>
					<div className="absolute inset-0 bg-gradient-to-b from-transparent via-electric-green/[0.02] to-transparent pointer-events-none" />
					<h2 className="text-4xl font-extrabold text-foreground mb-4 tracking-[-0.03em] relative z-10">
						Ready to Secure Your LLM?
					</h2>
					<p className="text-muted-foreground mb-8 max-w-lg mx-auto relative z-10">
						Join teams protecting their AI with KoreShield, from early-stage startups to enterprise deployments.
					</p>
					<div className="flex flex-wrap justify-center gap-4 relative z-10">
						<Link
							to="/signup"
							className="inline-flex items-center gap-2 px-7 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors"
						>
							Get started free
							<ArrowRight className="w-4 h-4" />
						</Link>
						<Link
							to="/demo"
							className="inline-flex items-center gap-2 px-7 py-3 bg-card border border-border hover:border-primary/40 text-foreground rounded-lg font-semibold transition-colors"
						>
							Try the live demo
						</Link>
					</div>
				</motion.div>

			</div>
		</div>
	);
}
