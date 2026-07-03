import { motion } from 'framer-motion';
import { ArrowRight, Building2, CheckCircle2, Globe2, Linkedin, LockKeyhole, ShieldCheck, Target, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { SEOConfig } from '../lib/seo-config';

const team = [
	{
		name: 'Teslim O. Kazeem',
		role: 'CEO & Product Lead',
		bio: 'Leads product direction, customer discovery, and the commercial path for Koreshield.',
		image: '/team/teslim-kazeem.png',
		linkedin: 'https://www.linkedin.com/in/teslim-kazeem/',
		profile: '/authors/teslim-kazeem',
	},
	{
		name: 'Isaac Emmanuel',
		role: 'CTO & Engineering Lead',
		bio: 'Architects the platform, SDKs, proxy layer, and operational infrastructure behind Koreshield.',
		image: '/team/isaac-emmanuel.jpg',
		linkedin: 'https://www.linkedin.com/in/isaacnsisong/',
		profile: '/authors/isaac-emmanuel',
	},
	{
		name: 'Uwagba Obinna',
		role: 'AI Risk & GRC Lead',
		bio: 'Shapes governance, risk, and compliance workflows so AI security evidence is usable by real organisations.',
		image: '/team/obinna.jpeg',
		linkedin: 'https://www.linkedin.com/in/uwagba-obinna',
		profile: undefined,
	},
];

const operatingPrinciples = [
	{
		icon: ShieldCheck,
		title: 'Security in the traffic path',
		body: 'AI security should sit where decisions happen: between the application, retrieved context, tools, and model providers.',
	},
	{
		icon: LockKeyhole,
		title: 'Privacy by default',
		body: 'Prompts and responses should be handled with minimisation, zero-retention defaults, and clear customer-controlled retention choices.',
	},
	{
		icon: CheckCircle2,
		title: 'Evidence over promises',
		body: 'Teams need audit logs, policy decisions, and repeatable checks they can show to security, compliance, and legal reviewers.',
	},
];

const platformPillars = [
	'Prompt injection and jailbreak detection',
	'RAG and retrieved-context scanning',
	'PII and sensitive-data leakage controls',
	'Provider routing and policy enforcement',
	'Tenant-scoped audit and operational evidence',
];

const facts = [
	{ label: 'Built in', value: 'United Kingdom' },
	{ label: 'Focus', value: 'Production AI security' },
	{ label: 'Team', value: '3 operators' },
	{ label: 'Model', value: 'Proxy-layer protection' },
];

export default function AboutPage() {
	return (
		<div className="min-h-screen overflow-hidden bg-background text-foreground transition-colors">
			<SEOMeta {...SEOConfig.about} />

			<section className="relative px-6 py-24 ambient-glow md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.13),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.1),transparent_26%)]" />
				<div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
					<motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green" />
							About Koreshield
						</div>
						<h1 className="max-w-4xl text-5xl font-extrabold tracking-[-0.055em] text-foreground md:text-7xl">
							We are building the security layer for production AI.
						</h1>
						<p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							Koreshield protects AI applications at runtime: prompts, retrieved context, provider calls, policy decisions, and the evidence teams need when security questions become business questions.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-bright">
								Book a demo <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/docs" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3 font-bold text-foreground transition-colors hover:border-electric-green/30 hover:bg-card">
								Read the docs
							</Link>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, scale: 0.96 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.7, delay: 0.1 }}
						className="relative rounded-[2rem] border border-white/[0.08] bg-card/75 p-6 shadow-2xl shadow-emerald-500/5"
					>
						<div className="absolute -inset-px -z-10 rounded-[2rem] bg-gradient-to-br from-electric-green/25 via-transparent to-blue-500/10" />
						<div className="mb-6 flex items-center justify-between">
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.25em] text-electric-green">Runtime posture</p>
								<p className="mt-2 text-2xl font-bold">What we protect</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-green/10">
								<ShieldCheck className="h-6 w-6 text-electric-green" />
							</div>
						</div>
						<div className="space-y-3">
							{platformPillars.map((pillar) => (
								<div key={pillar} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-background/50 px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-electric-green shadow-[0_0_16px_rgba(16,185,129,0.65)]" />
									<span className="text-sm text-muted-foreground">{pillar}</span>
								</div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/30 px-6 py-10">
				<div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{facts.map((fact) => (
						<div key={fact.label} className="rounded-2xl border border-white/[0.08] bg-background/55 p-5">
							<p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{fact.label}</p>
							<p className="mt-2 text-xl font-bold text-foreground">{fact.value}</p>
						</div>
					))}
				</div>
			</section>

			<section className="px-6 py-24">
				<div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
					<div>
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Our thesis</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">AI security has to move from policy documents into the request path.</h2>
					</div>
					<div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
						<p>
							LLM applications do not fail like normal software. A model can obey a malicious instruction hidden in a document, leak sensitive data through a helpful answer, call a tool under false context, or cross a tenant boundary without any traditional exploit.
						</p>
						<p>
							That is why Koreshield is built as a runtime layer. It inspects the prompts, context, responses, providers, and policy decisions that shape what an AI system actually does in production.
						</p>
						<p>
							Our goal is simple: make AI systems safer to ship, easier to govern, and easier to explain when customers, auditors, and regulators ask how they are protected.
						</p>
					</div>
				</div>
			</section>

			<section className="bg-muted/30 px-6 py-24">
				<div className="mx-auto max-w-7xl">
					<div className="mb-12 max-w-3xl">
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">How we operate</p>
						<h2 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Built for teams that cannot treat AI risk as a slide deck.</h2>
					</div>
					<div className="grid gap-5 md:grid-cols-3">
						{operatingPrinciples.map((principle, index) => (
							<motion.div
								key={principle.title}
								initial={{ opacity: 0, y: 18 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.45, delay: index * 0.08 }}
								className="group rounded-[1.75rem] border border-white/[0.08] bg-card/80 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-electric-green/30 hover:shadow-lg hover:shadow-emerald-500/10"
							>
								<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-green/10 transition-colors group-hover:bg-electric-green/20">
									<principle.icon className="h-6 w-6 text-electric-green" />
								</div>
								<h3 className="text-xl font-bold text-foreground">{principle.title}</h3>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">{principle.body}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="px-6 py-24">
				<div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
					<div className="rounded-[2rem] border border-white/[0.08] bg-card/70 p-8 lg:col-span-2">
						<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-green/10">
							<Globe2 className="h-6 w-6 text-electric-green" />
						</div>
						<h2 className="text-3xl font-extrabold tracking-[-0.03em]">Built from the UK, for global AI teams.</h2>
						<p className="mt-4 text-muted-foreground leading-relaxed">
							Koreshield is built in the United Kingdom, close to one of the world's most active conversations on AI safety, governance, and responsible deployment. That matters because our customers do not just need detection. They need controls that fit into security reviews, data protection expectations, procurement, and board-level risk conversations.
						</p>
					</div>
					<div className="rounded-[2rem] border border-white/[0.08] bg-card/70 p-8">
						<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-green/10">
							<Building2 className="h-6 w-6 text-electric-green" />
						</div>
						<h3 className="text-2xl font-bold tracking-tight">Commercially focused. Technically serious.</h3>
						<p className="mt-4 text-sm leading-relaxed text-muted-foreground">
							We build open SDKs and practical documentation around a commercial security platform, so teams can evaluate quickly and adopt with clarity.
						</p>
					</div>
				</div>
			</section>

			<section className="border-y border-border bg-[#050a14] px-6 py-24">
				<div className="mx-auto max-w-7xl">
					<div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">The people</p>
							<h2 className="text-4xl font-extrabold tracking-[-0.04em] text-white md:text-5xl">A small team with clear ownership.</h2>
						</div>
						<p className="max-w-xl text-muted-foreground">
							Three people covering product, engineering, and AI governance. Small enough to move fast; focused enough to keep the work coherent.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-3">
						{team.map((member, index) => (
							<motion.article
								key={member.name}
								initial={{ opacity: 0, y: 24 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.45, delay: index * 0.08 }}
								className="group relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.035] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-electric-green/30 hover:bg-white/[0.055]"
							>
								<div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-electric-green/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />
								<div className="relative mb-6 h-20 w-20 overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04]">
									<img src={member.image} alt={member.name} width="460" height="460" loading="lazy" decoding="async" className="h-full w-full object-cover" />
								</div>
								<h3 className="text-xl font-bold text-white">{member.name}</h3>
								<p className="mt-2 inline-flex rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-electric-green">
									{member.role}
								</p>
								<p className="mt-4 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
								{member.profile ? (
									<Link to={member.profile} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-electric-green">
										View author profile <ArrowRight className="h-4 w-4" />
									</Link>
								) : null}
								<a
									href={member.linkedin}
									target="_blank"
									rel="noreferrer noopener"
									className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-electric-green transition-colors hover:text-emerald-bright"
									aria-label={`${member.name} on LinkedIn`}
								>
									<Linkedin className="h-4 w-4" />
									LinkedIn
								</a>
							</motion.article>
						))}
					</div>
				</div>
			</section>

			<section className="px-6 py-24">
				<div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
					<div className="rounded-[2rem] border border-white/[0.08] bg-card/70 p-8">
						<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-green/10">
							<Target className="h-6 w-6 text-electric-green" />
						</div>
						<h2 className="text-3xl font-extrabold tracking-[-0.03em]">What we are building toward</h2>
						<p className="mt-4 text-muted-foreground leading-relaxed">
							Koreshield starts with runtime protection. The broader direction is a connected evidence layer for AI security: detection, audit logs, red-team validation, CI/CD gates, alerts, and compliance reporting.
						</p>
					</div>
					<div className="rounded-[2rem] border border-white/[0.08] bg-card/70 p-8">
						<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-green/10">
							<Users className="h-6 w-6 text-electric-green" />
						</div>
						<h3 className="text-2xl font-bold tracking-tight">For builders who already have AI in the wild.</h3>
						<p className="mt-4 text-muted-foreground leading-relaxed">
							If your team is shipping AI agents, RAG features, internal copilots, or customer-facing assistants, Koreshield is designed to give you a practical control point before model behaviour becomes an incident.
						</p>
						<div className="mt-7 flex flex-col gap-3 sm:flex-row">
							<Link to="/solutions" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3 font-bold text-white transition-colors hover:bg-emerald-bright">
								Explore solutions <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 font-bold text-foreground transition-colors hover:bg-muted">
								Talk to us
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
