import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Clock, MapPin, MessageSquareQuote, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const recruitmentEmail = 'hello@koreshield.com';

const featuredRole = {
	title: 'Social Media Operator',
	team: 'Growth',
	location: 'Remote',
	type: 'Flexible / Remote',
	description:
		'Help KoreShield show up where LLM security conversations are already happening. This is a hands-on role for someone who understands X and LinkedIn deeply and knows how to earn attention with sharp, human, technically credible engagement.',
	email: recruitmentEmail,
};

const openRoles = [
	featuredRole,
	{
		title: 'Senior Backend Engineer',
		team: 'Platform',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Help us scale the KoreShield detection engine to handle billions of LLM requests. You'll own core infrastructure, shape API design, and work closely with our security research team.",
		email: recruitmentEmail,
	},
	{
		title: 'ML Security Researcher',
		team: 'Research',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Discover, analyse, and build defences against new LLM attack vectors. You'll contribute to our detector corpus, publish research, and work alongside the engineering team to ship your findings to production.",
		email: recruitmentEmail,
	},
	{
		title: 'Product Designer',
		team: 'Product',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Own the end-to-end design of KoreShield's dashboard and developer tooling. You care about clarity, motion, and making complex security data feel immediately understandable.",
		email: recruitmentEmail,
	},
	{
		title: 'Enterprise Account Executive',
		team: 'Sales',
		location: 'London',
		type: 'Full-time',
		description: 'Build relationships with enterprise security and engineering teams. You understand the AI landscape, can speak credibly to technical buyers, and are driven by helping customers solve real problems.',
		email: recruitmentEmail,
	},
	{
		title: 'Global Sales Manager',
		team: 'Sales',
		location: 'London',
		type: 'Full-time',
		description: 'Lead and scale our global sales motion, from pipeline strategy to closing enterprise deals. You bring experience selling security or developer tooling internationally and know how to build and coach high-performing teams.',
		email: recruitmentEmail,
	},
	{
		title: 'UI Engineer',
		team: 'Engineering',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Craft the interfaces that security teams rely on every day. You care deeply about performance, accessibility, and pixel-perfect execution, turning complex data into clean, intuitive experiences.",
		email: recruitmentEmail,
	},
	{
		title: 'Security Engineer (Red Team)',
		team: 'Security',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Attempt to break what we build. You'll simulate adversarial attacks against LLM-powered systems, uncover weaknesses in our detection pipeline, and feed your findings directly into hardening our defences.",
		email: recruitmentEmail,
	},
	{
		title: 'Data Engineer (Big Data)',
		team: 'Platform',
		location: 'London / Remote',
		type: 'Full-time',
		description: 'Design and operate the data infrastructure that powers KoreShield at scale. You have hands-on experience with large-scale streaming and batch pipelines and a strong bias towards reliability and observability.',
		email: recruitmentEmail,
	},
	{
		title: 'AI Product Manager',
		team: 'Product',
		location: 'London / Remote',
		type: 'Full-time',
		description: "Define the roadmap for KoreShield's AI-powered detection and policy features. You sit at the intersection of security research, engineering, and customer needs, translating signals into a coherent product strategy.",
		email: recruitmentEmail,
	},
	{
		title: 'Senior DevOps Engineer',
		team: 'Platform',
		location: 'London / Remote',
		type: 'Full-time',
		description: 'Own the infrastructure that keeps KoreShield fast, secure, and always-on. You bring deep experience with cloud-native deployments, CI/CD, and operating systems at high availability under real production pressure.',
		email: recruitmentEmail,
	},
];

const responsibilities = [
	'Monitor X and LinkedIn daily for conversations around AI security, LLM vulnerabilities, prompt injection, and AI risk.',
	'Identify threads and posts worth engaging with and respond quickly with substance, not filler.',
	'Draft replies and comments that sound human, sharp, and informed rather than like a scheduled brand account.',
	'Spot ragebait and debate-worthy posts on X where a well-placed response can pull attention back to KoreShield.',
	'Engage founders, security leads, and developers on LinkedIn through comments, replies, and shares that build credibility.',
	'Grow KoreShield’s presence across both platforms and help the brand earn standing in the developer and AI security community.',
	'Flag fast-moving topics to the founder so we can turn them into stronger content quickly.',
];

const profile = [
	'You are already on X and LinkedIn multiple times a day by choice.',
	'You understand how reach works on X: timing, threading, reply positioning, quote tweeting, and staying inside a live conversation.',
	'You understand how LinkedIn distribution actually works and how buyer and developer audiences behave differently.',
	'You can write with a sharp, direct voice and shift tone depending on the platform and the audience.',
	'You are comfortable being in the middle of a heated thread when the moment calls for it.',
	'You pick things up fast and are genuinely curious enough to learn the basics of LLM security quickly.',
	'Bonus if you have grown an account before, run a niche account, or done similar work for a founder or brand.',
];

const notRequired = [
	'A degree',
	'A cybersecurity background',
	'Prior startup experience',
	'Experience running paid social',
];

const values = [
	{
		title: 'Direct access to the founder',
		body: 'You will hear the product story, the roadmap, and the real market context directly, not as recycled talking points.',
	},
	{
		title: 'Remote and flexible',
		body: 'This role is fully remote with flexible hours, as long as you are present when the conversations that matter are happening.',
	},
	{
		title: 'Room to grow',
		body: 'As KoreShield grows, this role can grow with it into a broader brand, content, or community function.',
	},
];

export default function CareersPage() {
	const applyHref = `mailto:${featuredRole.email}?subject=${encodeURIComponent(`Application: ${featuredRole.title}`)}`;

	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<SEOMeta
				title="Careers at KoreShield"
				description="Join KoreShield as a remote Social Media Operator and help shape how the LLM security conversation moves across X and LinkedIn."
			/>

			<section className="py-24 px-6 relative ambient-glow overflow-hidden">
				<div className="max-w-5xl mx-auto relative z-10">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<div className="inline-flex items-center gap-2 bg-electric-green/10 border border-electric-green/20 text-electric-green text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
							<span className="w-1.5 h-1.5 rounded-full bg-electric-green animate-pulse" />
							Now hiring
						</div>
						<div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
							<div>
								<h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-[-0.04em] text-foreground">
									Join KoreShield as our
									<br className="hidden md:block" /> Social Media Operator.
								</h1>
								<p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
									We are not looking for someone to queue bland posts. We need someone who knows how attention moves on X and LinkedIn, can join fast-moving AI security conversations with confidence, and can help make KoreShield impossible to ignore in the right rooms.
								</p>
							</div>

							<div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-6 shadow-[0_18px_80px_rgba(0,0,0,0.18)]">
								<h2 className="text-xl font-bold text-foreground mb-4">{featuredRole.title}</h2>
								<div className="grid gap-3 text-sm text-muted-foreground mb-6">
									<span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> {featuredRole.team}</span>
									<span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {featuredRole.location}</span>
									<span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {featuredRole.type}</span>
								</div>
								<p className="text-sm text-muted-foreground leading-relaxed mb-6">{featuredRole.description}</p>
								<a
									href={applyHref}
									className="inline-flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-lg transition-colors"
								>
									Apply via email
									<ArrowRight className="w-4 h-4" />
								</a>
								<p className="text-xs text-muted-foreground mt-3">
									Send your application or a short introduction to <span className="text-foreground font-medium">{featuredRole.email}</span>.
								</p>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="bg-card border border-border rounded-2xl p-8">
						<div className="inline-flex items-center gap-2 text-electric-green text-sm font-semibold mb-5">
							<MessageSquareQuote className="w-4 h-4" />
							What the role actually is
						</div>
						<p className="text-muted-foreground leading-relaxed mb-6">
							Koreshield is a runtime LLM security proxy. We sit between applications and model providers and stop prompt injection, data leakage, and agent exploits before they complete. Your role is to be in the room where those conversations are already happening and make sure KoreShield is part of them.
						</p>
						<ul className="space-y-3">
							{responsibilities.map((item) => (
								<li key={item} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
									<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="space-y-6">
						<div className="bg-card border border-border rounded-2xl p-8">
							<div className="inline-flex items-center gap-2 text-electric-green text-sm font-semibold mb-5">
								<Sparkles className="w-4 h-4" />
								Who you are
							</div>
							<ul className="space-y-3">
								{profile.map((item) => (
									<li key={item} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
										<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>

						<div className="bg-card border border-border rounded-2xl p-8">
							<h3 className="text-lg font-semibold text-foreground mb-4">What you do not need</h3>
							<div className="flex flex-wrap gap-2 mb-6">
								{notRequired.map((item) => (
									<span key={item} className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
										{item}
									</span>
								))}
							</div>
							<p className="text-sm text-muted-foreground leading-relaxed">
								What matters more is taste, speed, curiosity, and the ability to sound like a credible human in live conversations.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">All open roles</h2>
					<div className="space-y-4">
						{openRoles.map((role, i) => (
							<motion.div
								key={role.title}
								initial={{ opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.04 }}
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
										href={`mailto:${role.email}?subject=${encodeURIComponent(`Application: ${role.title}`)}`}
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

			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-5xl mx-auto">
					<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">What we offer</h2>
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{values.map((value, i) => (
							<motion.div
								key={value.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.08 }}
								className="bg-card border border-border rounded-xl p-6"
							>
								<h3 className="text-sm font-semibold text-foreground mb-2">{value.title}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">{value.body}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-4xl mx-auto">
					<div className="bg-card border border-white/[0.08] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
						<div>
							<h3 className="text-xl font-bold text-foreground mb-2">Ready to apply?</h3>
							<p className="text-muted-foreground text-sm leading-relaxed max-w-md">
								Send your note, relevant profile links, or a short explanation of why you would be strong in this role to {featuredRole.email}.
							</p>
						</div>
						<div className="flex flex-col sm:flex-row gap-3">
							<a
								href={applyHref}
								className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
							>
								Email recruitment
								<ArrowRight className="w-4 h-4" />
							</a>
							<Link
								to="/contact"
								className="inline-flex items-center justify-center gap-2 border border-border hover:border-primary/40 text-foreground font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
							>
								Contact us
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
