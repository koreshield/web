import { motion } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

interface Competitor {
	id: string;
	name: string;
	path: string;
	tagline: string;
	category: string;
	features: {
		label: string;
		koreshield: boolean;
		competitor: boolean;
	}[];
}

const COMPETITORS: Competitor[] = [
	{
		id: 'llm-guard',
		name: 'LLM Guard',
		path: '/vs/llm-guard',
		tagline: 'Pattern-based prompt filtering',
		category: 'Prompt Defense',
		features: [
			{ label: 'Real-time RAG scanning', koreshield: true, competitor: false },
			{ label: 'Cross-document correlation', koreshield: true, competitor: false },
			{ label: 'Multi-provider support', koreshield: true, competitor: true },
			{ label: 'Production audit logs', koreshield: true, competitor: false },
			{ label: 'Compliance ready', koreshield: true, competitor: false },
		],
	},
	{
		id: 'lakera-guard',
		name: 'Lakera Guard',
		path: '/vs/lakera-guard',
		tagline: 'API-based prompt filtering',
		category: 'API Security',
		features: [
			{ label: 'RAG document scanning', koreshield: true, competitor: false },
			{ label: 'Self-hosted deployment', koreshield: true, competitor: false },
			{ label: 'Enterprise RBAC', koreshield: true, competitor: false },
			{ label: 'Policy engine', koreshield: true, competitor: false },
			{ label: 'Immutable audit trail', koreshield: true, competitor: false },
		],
	},
	{
		id: 'build-yourself',
		name: 'Build It Yourself',
		path: '/vs/build-yourself',
		tagline: 'Custom detection logic',
		category: 'In-house Solution',
		features: [
			{ label: 'Time to production', koreshield: true, competitor: false },
			{ label: 'Cost efficiency', koreshield: true, competitor: false },
			{ label: 'Compliance evidence', koreshield: true, competitor: false },
			{ label: 'Vendor independence', koreshield: true, competitor: true },
			{ label: 'Production reliability', koreshield: true, competitor: false },
		],
	},
];

function ComparisonCard({ competitor, index }: { competitor: Competitor; index: number }) {
	return (
		<motion.div
			key={competitor.id}
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.4, delay: index * 0.1 }}
			className="group rounded-2xl border border-border bg-card/90 p-8 hover:border-primary/50 hover:bg-card/95 transition-all shadow-sm hover:shadow-lg hover:shadow-primary/10"
		>
			<div className="mb-4">
				<span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
					{competitor.category}
				</span>
			</div>

			<h3 className="text-2xl font-black text-foreground mb-2">{competitor.name}</h3>
			<p className="text-muted-foreground mb-6">{competitor.tagline}</p>

			<div className="space-y-3 mb-8">
				{competitor.features.slice(0, 3).map((feature) => (
					<div key={feature.label} className="flex items-center gap-3">
						{feature.koreshield ? (
							<Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
						) : (
							<X className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
						)}
						<span className="text-sm text-foreground/80">{feature.label}</span>
					</div>
				))}
			</div>

			<Link
				to={competitor.path}
				className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors group-hover:bg-primary group-hover:text-background"
			>
				Compare Details
				<ArrowRight className="h-4 w-4" />
			</Link>
		</motion.div>
	);
}

export default function ComparisonPage() {
	return (
		<div className="min-h-screen bg-background text-foreground pt-24 pb-24">
			<SEOMeta
				title="Koreshield vs Competitors | Comparison"
				description="See how Koreshield compares to LLM Guard, Lakera Guard, and building your own security layer."
			/>

			<div className="max-w-7xl mx-auto px-6">
				{/* Hero */}
				<section className="mb-20 text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground mb-6">
							How does Koreshield compare?
						</h1>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
							Side-by-side comparison with other LLM security solutions. 
							See what sets Koreshield apart for production AI applications.
						</p>
					</motion.div>

					{/* Stats */}
					<div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-12">
						<div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
							<div className="text-3xl font-black text-primary">{COMPETITORS.length}</div>
							<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground mt-2">
								Solutions Compared
							</div>
						</div>
						<div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
							<div className="text-3xl font-black text-primary">
								{COMPETITORS.reduce((acc, c) => acc + c.features.filter(f => f.koreshield).length, 0)}
							</div>
							<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground mt-2">
								Koreshield Advantages
							</div>
						</div>
						<div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
							<div className="text-3xl font-black text-primary">Production</div>
							<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground mt-2">
								Ready Today
							</div>
						</div>
					</div>
				</section>

				{/* Comparison Cards */}
				<section>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{COMPETITORS.map((competitor, index) => (
							<ComparisonCard key={competitor.id} competitor={competitor} index={index} />
						))}
					</div>
				</section>

				{/* CTA */}
				<section className="mt-20 text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-8 md:p-12"
					>
						<h2 className="text-3xl font-black text-foreground mb-4">Ready to protect your LLM?</h2>
						<p className="text-muted-foreground mb-8 max-w-xl mx-auto">
							Start with a free evaluation or request a personalized demo to see Koreshield in action.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								to="/demo"
								className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-background font-bold hover:bg-primary/90 transition-colors"
							>
								Request Demo
								<ArrowRight className="h-4 w-4" />
							</Link>
							<Link
								to="/pricing"
								className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-bold transition-colors"
							>
								View Pricing
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</motion.div>
				</section>
			</div>
		</div>
	);
}
