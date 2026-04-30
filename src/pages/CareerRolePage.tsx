import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Briefcase, Clock, MapPin } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { careerRoles, getCareerRole } from '../content/careers';

function SectionList({ title, items }: { title: string; items: string[] }) {
	if (!items.length) {
		return null;
	}

	return (
		<div className="bg-card border border-border rounded-2xl p-8">
			<h2 className="text-xl font-bold text-foreground mb-5">{title}</h2>
			<ul className="space-y-3">
				{items.map((item) => (
					<li key={item} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
						<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
						<span>{item}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export default function CareerRolePage() {
	const { slug } = useParams<{ slug: string }>();
	const role = slug ? getCareerRole(slug) : undefined;

	if (!role) {
		return <Navigate to="/careers" replace />;
	}

	const relatedRoles = careerRoles.filter((item) => item.slug !== role.slug).slice(0, 3);
	const applyHref = `mailto:${role.recruitmentEmail}?subject=${encodeURIComponent(`Application: ${role.title}`)}`;

	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<SEOMeta
				title={`${role.title} at KoreShield`}
				description={role.summary}
			/>

			<section className="py-20 px-6 relative ambient-glow overflow-hidden">
				<div className="max-w-6xl mx-auto relative z-10">
					<Link
						to="/careers"
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to careers
					</Link>

					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
							<div>
								<div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-5">
									<span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{role.team}</span>
									<span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{role.location}</span>
									<span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{role.type}</span>
								</div>
								<h1 className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] text-foreground mb-5">{role.title}</h1>
								<p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-5">{role.hero}</p>
								<div className="space-y-4">
									{role.overview.map((paragraph) => (
										<p key={paragraph} className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
											{paragraph}
										</p>
									))}
								</div>
							</div>

							<div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-6 shadow-[0_18px_80px_rgba(0,0,0,0.18)]">
								<h2 className="text-xl font-bold text-foreground mb-3">Apply for this role</h2>
								<p className="text-sm text-muted-foreground leading-relaxed mb-5">
									Send your note, relevant links, and a short explanation of why this role fits you to <span className="text-foreground font-medium">{role.recruitmentEmail}</span>.
								</p>
								<div className="flex flex-col gap-3">
									<a
										href={applyHref}
										className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-lg transition-colors"
									>
										Apply by email
										<ArrowRight className="w-4 h-4" />
									</a>
									<Link
										to="/contact"
										className="inline-flex items-center justify-center gap-2 border border-border hover:border-primary/40 text-foreground font-semibold px-5 py-3 rounded-lg transition-colors"
									>
										Contact us
									</Link>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-2">
					<SectionList title="What you’ll work on" items={role.responsibilities} />
					<SectionList title="What we’re looking for" items={role.profile} />
					{role.niceToHave && role.niceToHave.length > 0 ? (
						<SectionList title="Nice to have" items={role.niceToHave} />
					) : null}
					{role.notRequired && role.notRequired.length > 0 ? (
						<SectionList title="Not required" items={role.notRequired} />
					) : null}
				</div>
			</section>

			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-6xl mx-auto">
					<SectionList title="What we offer" items={role.whatWeOffer} />
				</div>
			</section>

			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">Other open roles</h2>
					<div className="grid gap-5 lg:grid-cols-3">
						{relatedRoles.map((item, index) => (
							<motion.div
								key={item.slug}
								initial={{ opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.05 }}
								className="bg-card border border-border rounded-2xl p-6"
							>
								<div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
									<span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{item.team}</span>
									<span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{item.location}</span>
								</div>
								<h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.summary}</p>
								<Link to={`/careers/${item.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
									View role
									<ArrowRight className="w-4 h-4" />
								</Link>
							</motion.div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
