import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { SEOConfig } from '../lib/seo-config';

const team = [
	{
		name: 'Teslim O. Kazeem',
		role: 'Co-founder & CEO',
		bio: 'MSc Data Science. Leading the vision for enterprise-grade LLM security.',
		image: '/team/teslim-kazeem.png',
	},
	{
		name: 'Isaac Emmanuel',
		role: 'Co-founder & CTO',
		bio: '15+ years full-stack engineering. Architecting scalable security infrastructure.',
		image: '/team/isaac-emmanuel.jpg',
	},
	{
		name: 'Ahmed Oladapo',
		role: 'Co-founder & Security Engineer (Blue Team)',
		bio: 'Security engineer focused on detection coverage, and response workflows.',
		image: '/team/ahmed-oladapo.png',
	},
	{
		name: 'Victor Emmanuel',
		role: 'Frontend Engineer & Designer',
		bio: 'Crafting intuitive interfaces for complex security workflows.',
		image: null,
	},
];

const values = [
	{
		title: 'Security First',
		description: 'Every decision prioritises the security and privacy of our users. Trust is earned through transparency and rigorous testing, not promised.',
	},
	{
		title: 'Innovation',
		description: "We pioneer novel approaches to LLM security, pushing the boundaries of what's possible with AI safety research.",
	},
	{
		title: 'Transparency',
		description: "We publish clear documentation, MIT-licensed SDKs, and open security guidance. Our customers should never wonder what's running in their stack.",
	},
	{
		title: 'Global Impact',
		description: 'Building technology that protects AI systems worldwide, making the AI-powered future safer for everyone who depends on it.',
	},
];

export default function AboutPage() {
	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<SEOMeta {...SEOConfig.about} />

			{/* Hero */}
			<section className="py-24 px-6 relative ambient-glow">
				<div className="max-w-4xl mx-auto text-center relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<div className="inline-flex items-center gap-2 bg-electric-green/10 border border-electric-green/20 text-electric-green text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
							<span className="w-1.5 h-1.5 rounded-full bg-electric-green" />
							Our Story
						</div>
						<h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-[-0.04em] text-foreground">
							Securing the<br className="hidden md:block" /> AI-Powered Future
						</h1>
						<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
							KoreShield was built on one belief: production AI deserves the same security rigour as any critical infrastructure, and teams should not need a breach before they act on it.
						</p>
					</motion.div>
				</div>
			</section>

			{/* Mission */}
			<section className="py-20 px-6 border-t border-border">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl font-bold mb-8 tracking-tight text-foreground">Our Mission</h2>
					<div className="space-y-5 text-muted-foreground leading-relaxed text-lg">
						<p>
							Large Language Models are transforming how we build software, but they introduce entirely new security challenges. Traditional application security tools were not designed for prompt injection, jailbreaking, data exfiltration, and adversarial attacks.
						</p>
						<p>
							KoreShield was founded to solve this problem. We combine cutting-edge AI safety research with enterprise-grade infrastructure to provide comprehensive protection for LLM applications. Our mission is to make AI systems as secure as traditional software, enabling organisations to deploy AI confidently.
						</p>
						<p>
							We believe security shouldn't be an afterthought. By providing accessible SDKs, clear documentation, and commercial services, we're making world-class LLM security available to startups and enterprises alike.
						</p>
					</div>
				</div>
			</section>

			{/* Values */}
			<section className="py-20 px-6 bg-card/40 border-t border-border">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">Our Values</h2>
						<p className="text-muted-foreground">The principles that guide every decision we make.</p>
					</div>
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
						{values.map((value, index) => (
							<motion.div
								key={value.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								className="bg-card border border-border rounded-xl p-6"
							>
								<div className="w-8 h-8 rounded-lg bg-electric-green/10 flex items-center justify-center mb-4">
									<div className="w-2 h-2 rounded-full bg-electric-green" />
								</div>
								<h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Licensing & IP */}
			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl font-bold text-foreground mb-4">Licensing & IP</h2>
					<p className="text-muted-foreground leading-relaxed">
						KoreShield core is proprietary software. The SDKs, documentation, website, and blog are MIT-licensed
						in their respective repositories and directories. Commercial use of the core platform requires a valid
						licence or agreement with KoreShield.
					</p>
				</div>
			</section>

			{/* Why UK */}
			<section className="py-20 px-6 bg-card/40 border-t border-border">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-3xl font-bold text-center text-foreground mb-12 tracking-tight">
						Why We're Building in the UK
					</h2>
					<div className="grid md:grid-cols-2 gap-10">
						<div>
							<h3 className="text-xl font-semibold text-foreground mb-4">A Global Leader in AI Safety</h3>
							<p className="text-muted-foreground mb-4 leading-relaxed">
								The United Kingdom is at the forefront of AI safety research and regulation. With world-leading institutions like DeepMind, the Alan Turing Institute, and top universities driving innovation, the UK provides the perfect environment for developing cutting-edge security solutions.
							</p>
							<p className="text-muted-foreground leading-relaxed">
								We're proud to contribute to the UK's position as a global hub for responsible AI development, bringing together academic rigour, regulatory foresight, and commercial viability.
							</p>
						</div>
						<div>
							<h3 className="text-xl font-semibold text-foreground mb-4">Innovation at Scale</h3>
							<p className="text-muted-foreground mb-4 leading-relaxed">
								KoreShield represents a genuinely innovative approach to LLM security. Our 50+ detection patterns, real-time threat analysis, and multi-provider support architecture are designed for a category that is growing fast and needs serious operational tooling.
							</p>
							<p className="text-muted-foreground leading-relaxed">
								Our technology is designed for global scalability, supporting multi-tenancy, cloud-native deployment, and enterprise-grade compliance. We're building not just for today's market, but for the next decade of AI adoption.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Team */}
			<section className="py-24 px-6 bg-[#050a14] border-t border-border">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<span className="inline-block text-xs font-mono text-electric-green tracking-widest uppercase mb-4 px-3 py-1 rounded-full border border-electric-green/20 bg-electric-green/5">
							The People
						</span>
						<h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
							Meet the Team
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Researchers and engineers building the security layer the AI industry needs.
						</p>
					</div>

					<div className="flex flex-wrap justify-center gap-8">
						{team.map((member, index) => (
							<motion.div
								key={member.name}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.12 }}
								className="group relative w-full sm:w-72 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 text-center hover:border-electric-green/30 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1"
							>
								<div className="relative w-20 h-20 mx-auto mb-6">
									{member.image ? (
										<img
											src={member.image}
											alt={member.name}
											className="w-20 h-20 rounded-full object-cover object-center shadow-lg shadow-emerald-500/20"
										/>
									) : (
										<div className="w-20 h-20 rounded-full bg-gradient-to-br from-electric-green to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20">
											{member.name.split(' ').map((n) => n[0]).join('')}
										</div>
									)}
									<div className="absolute inset-0 rounded-full bg-gradient-to-br from-electric-green to-blue-500 opacity-20 blur-lg scale-110 group-hover:opacity-40 transition-opacity" />
								</div>
								<h3 className="text-lg font-bold text-white mb-2">{member.name}</h3>
								<span className="inline-block text-xs font-mono text-electric-green bg-electric-green/10 border border-electric-green/20 rounded-full px-3 py-1 mb-4">
									{member.role}
								</span>
								<p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
							</motion.div>
						))}
					</div>

					<div className="text-center mt-16">
						<Link
							to="/careers"
							className="inline-flex items-center gap-2 text-sm font-semibold text-electric-green bg-electric-green/10 border border-electric-green/20 hover:bg-electric-green/20 px-6 py-3 rounded-full transition-all duration-200"
						>
							We&apos;re hiring. Join our team
							<ArrowRight className="w-4 h-4" />
						</Link>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-20 px-6 border-t border-border">
				<div className="max-w-3xl mx-auto text-center">
					<h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
						Join Us in Securing AI Systems
					</h2>
					<p className="text-muted-foreground mb-8 text-lg">
						Whether you're a developer, researcher, or enterprise customer, we'd love to hear from you.
					</p>
					<div className="flex flex-wrap gap-4 justify-center">
						<a
							href="https://docs.koreshield.com/"
							target="_blank"
							rel="noreferrer noopener"
							className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
						>
							Get Started
							<ArrowRight className="w-4 h-4" />
						</a>
						<Link
							to="/contact"
							className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border hover:border-primary/50 text-foreground font-semibold rounded-lg transition-colors"
						>
							Contact Us
						</Link>
						<a
							href="https://github.com/koreshield/"
							target="_blank"
							rel="noreferrer noopener"
							className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border hover:border-primary/50 text-foreground font-semibold rounded-lg transition-colors"
						>
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
							</svg>
							View on GitHub
						</a>
					</div>
				</div>
			</section>
		</div>
	);
}
