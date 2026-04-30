import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Clock, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { careerRoles, getFeaturedCareerRole } from '../content/careers';

const values = [
	{
		title: 'Ship work that matters',
		body: 'KoreShield sits in the runtime path of real AI systems. The work here is not theoretical or decorative.',
	},
	{
		title: 'Small team, high ownership',
		body: 'You will be close to product direction, technical tradeoffs, and real customer feedback from day one.',
	},
	{
		title: 'Remote by default',
		body: 'We care more about quality, taste, and follow-through than where you are sitting while you work.',
	},
	{
		title: 'Direct, serious culture',
		body: 'We value sharp thinking, fast execution, and people who can move a product forward without a lot of ceremony.',
	},
];

export default function CareersPage() {
	const featuredRole = getFeaturedCareerRole();

	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<SEOMeta
				title="Careers at KoreShield"
				description="Explore open roles at KoreShield across growth, product, security, research, engineering, and sales."
			/>

			<section className="py-24 px-6 relative ambient-glow overflow-hidden">
				<div className="max-w-6xl mx-auto relative z-10">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<div className="inline-flex items-center gap-2 bg-electric-green/10 border border-electric-green/20 text-electric-green text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
							<span className="w-1.5 h-1.5 rounded-full bg-electric-green animate-pulse" />
							We&apos;re hiring
						</div>
						<div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
							<div>
								<h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-[-0.04em] text-foreground">
									Help build the security layer
									<br className="hidden md:block" /> the AI industry needs.
								</h1>
								<p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
									KoreShield is building the runtime protection layer for LLM-powered applications. We work across security, platform, product, growth, and research, and we care about shipping work that is technically real and commercially useful.
								</p>
							</div>

							<div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-6 shadow-[0_18px_80px_rgba(0,0,0,0.18)]">
								<div className="inline-flex items-center gap-2 text-electric-green text-xs font-semibold uppercase tracking-[0.18em] mb-4">
									<Sparkles className="w-3.5 h-3.5" />
									Latest opening
								</div>
								<h2 className="text-xl font-bold text-foreground mb-2">{featuredRole.title}</h2>
								<div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
									<span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{featuredRole.team}</span>
									<span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{featuredRole.location}</span>
									<span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{featuredRole.type}</span>
								</div>
								<p className="text-sm text-muted-foreground leading-relaxed mb-5">{featuredRole.summary}</p>
								<div className="flex flex-col sm:flex-row gap-3">
									<Link
										to={`/careers/${featuredRole.slug}`}
										className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-lg transition-colors"
									>
										View role
										<ArrowRight className="w-4 h-4" />
									</Link>
									<a
										href={`mailto:${featuredRole.recruitmentEmail}?subject=${encodeURIComponent(`Application: ${featuredRole.title}`)}`}
										className="inline-flex items-center justify-center gap-2 border border-border hover:border-primary/40 text-foreground font-semibold px-5 py-3 rounded-lg transition-colors"
									>
										Apply by email
									</a>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">Open roles</h2>
					<div className="grid gap-5 lg:grid-cols-2">
						{careerRoles.map((role, i) => (
							<motion.div
								key={role.slug}
								initial={{ opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.04 }}
								className="bg-card border border-border hover:border-primary/40 rounded-2xl p-6 transition-colors"
							>
								<div className="flex flex-col gap-4 h-full">
									<div>
										<div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
											<span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{role.team}</span>
											<span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{role.location}</span>
											<span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{role.type}</span>
										</div>
										<h3 className="text-lg font-bold text-foreground mb-2">{role.title}</h3>
										<p className="text-sm text-muted-foreground leading-relaxed">{role.summary}</p>
									</div>
									<div className="flex flex-wrap gap-3 mt-auto">
										<Link
											to={`/careers/${role.slug}`}
											className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
										>
											View details
											<ArrowRight className="w-4 h-4" />
										</Link>
										<a
											href={`mailto:${role.recruitmentEmail}?subject=${encodeURIComponent(`Application: ${role.title}`)}`}
											className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
										>
											Apply now
										</a>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">How we work</h2>
					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
						{values.map((value, i) => (
							<motion.div
								key={value.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.06 }}
								className="bg-card border border-border rounded-xl p-5"
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
							<h3 className="text-xl font-bold text-foreground mb-2">Want to apply or ask a question?</h3>
							<p className="text-muted-foreground text-sm leading-relaxed max-w-md">
								Reach us directly at <span className="text-foreground font-medium">{featuredRole.recruitmentEmail}</span>. If you are a strong fit, we would rather hear from you than miss you.
							</p>
						</div>
						<div className="flex flex-col sm:flex-row gap-3">
							<a
								href={`mailto:${featuredRole.recruitmentEmail}`}
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
