import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const openRoles = [
	{
		title: 'Senior Backend Engineer',
		team: 'Platform',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Help us scale the KoreShield detection engine to handle billions of LLM requests. You'll own core infrastructure, shape API design, and work closely with our security research team.",
	},
	{
		title: 'ML Security Researcher',
		team: 'Research',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Discover, analyse, and build defences against new LLM attack vectors. You'll contribute to our detector corpus, publish research, and work alongside the engineering team to ship your findings to production.",
	},
	{
		title: 'Product Designer',
		team: 'Product',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Own the end-to-end design of KoreShield's dashboard and developer tooling. You care about clarity, motion, and making complex security data feel immediately understandable.",
	},
	{
		title: 'Enterprise Account Executive',
		team: 'Sales',
		location: 'London',
		type: 'Full-time',
		description: 'Build relationships with enterprise security and engineering teams. You understand the AI landscape, can speak credibly to technical buyers, and are driven by helping customers solve real problems.',
	},
	{
		title: 'Global Sales Manager',
		team: 'Sales',
		location: 'London',
		type: 'Full-time',
		description: 'Lead and scale our global sales motion, from pipeline strategy to closing enterprise deals. You bring experience selling security or developer tooling internationally and know how to build and coach high-performing teams.',
	},
	{
		title: 'UI Engineer',
		team: 'Engineering',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Craft the interfaces that security teams rely on every day. You care deeply about performance, accessibility, and pixel-perfect execution, turning complex data into clean, intuitive experiences.",
	},
	{
		title: 'Security Engineer (Red Team)',
		team: 'Security',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Attempt to break what we build. You'll simulate adversarial attacks against LLM-powered systems, uncover weaknesses in our detection pipeline, and feed your findings directly into hardening our defences.",
	},
	{
		title: 'Data Engineer (Big Data)',
		team: 'Platform',
		location: 'London / Remote',
		type: 'Full-time',
		description: 'Design and operate the data infrastructure that powers KoreShield at scale. You have hands-on experience with large-scale streaming and batch pipelines and a strong bias towards reliability and observability.',
	},
	{
		title: 'AI Product Manager',
		team: 'Product',
		location: 'London / Remote',
		type: 'Full-time',
		description: 'Define the roadmap for KoreShield\'s AI-powered detection and policy features. You sit at the intersection of security research, engineering, and customer needs, translating signals into a coherent product strategy.',
	},
	{
		title: 'Senior DevOps Engineer',
		team: 'Platform',
		location: 'London / Remote',
		type: 'Full-time',
		description: 'Own the infrastructure that keeps KoreShield fast, secure, and always-on. You bring deep experience with cloud-native deployments, CI/CD, and operating systems at high availability under real production pressure.',
	},
];

const values = [
	{ title: 'Ship fast, learn faster', body: 'We move quickly, release often, and iterate based on what we learn in production.' },
	{ title: 'Ownership without hierarchy', body: 'Everyone owns their work end-to-end. No waiting for sign-offs on decisions that are clearly yours to make.' },
	{ title: 'Research meets product', body: "Our security research directly ships to production. You'll see your work protecting real AI systems." },
	{ title: 'Distributed by default', body: 'We hire the best people regardless of location. Remote-first, async-friendly, with regular in-person sessions in London.' },
];

export default function CareersPage() {
	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<SEOMeta title="Careers at KoreShield" description="Join the team building the security layer the AI industry needs. Open roles in engineering, research, design, and sales." />

			{/* Hero */}
			<section className="py-24 px-6 relative ambient-glow">
				<div className="max-w-4xl mx-auto text-center relative z-10">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<div className="inline-flex items-center gap-2 bg-electric-green/10 border border-electric-green/20 text-electric-green text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
							<span className="w-1.5 h-1.5 rounded-full bg-electric-green animate-pulse" />
							We're hiring
						</div>
						<h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-[-0.04em] text-foreground">
							Build the security layer<br className="hidden md:block" /> the AI industry needs.
						</h1>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
							KoreShield is a small, focused team with a clear mission. If you're excited about AI security and want your work to matter from day one, we'd love to hear from you.
						</p>
					</motion.div>
				</div>
			</section>

			{/* Values */}
			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">How we work</h2>
					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
						{values.map((v, i) => (
							<motion.div
								key={v.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.08 }}
								className="bg-card border border-border rounded-xl p-5"
							>
								<h3 className="text-sm font-semibold text-foreground mb-2">{v.title}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Open Roles */}
			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">Open roles</h2>
					<div className="space-y-4">
						{openRoles.map((role, i) => (
							<motion.div
								key={role.title}
								initial={{ opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.06 }}
								className="bg-card border border-border hover:border-primary/40 rounded-xl p-6 transition-colors group"
							>
								<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
									<div>
										<h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{role.title}</h3>
										<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
											<span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{role.team}</span>
											<span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{role.location}</span>
											<span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{role.type}</span>
										</div>
									</div>
									<a
										href={`mailto:hello@koreshield.com?subject=Application: ${encodeURIComponent(role.title)}`}
										className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
									>
										Apply <ArrowRight className="w-3.5 h-3.5" />
									</a>
								</div>
								<p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* No role fits? */}
			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-3xl mx-auto">
					<div className="bg-card border border-white/[0.08] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
						<div>
							<h3 className="text-xl font-bold text-foreground mb-2">Don't see a matching role?</h3>
							<p className="text-muted-foreground text-sm leading-relaxed max-w-md">
								We hire for talent over titles. If you're exceptional and care about AI security, send us a note  -  we're always open to conversations.
							</p>
						</div>
						<Link
							to="/contact"
							className="shrink-0 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
						>
							Get in touch
							<ArrowRight className="w-4 h-4" />
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
