import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const suggestedLinks = [
	{
		href: 'https://docs.koreshield.com/docs/getting-started/quick-start/',
		label: 'Quickstart Tutorial',
		desc: 'Get up and running in under 15 minutes',
		external: true,
	},
	{
		href: 'https://docs.koreshield.com/docs/getting-started/installation/',
		label: 'Installation Guide',
		desc: 'Docker, Python, NPM, Kubernetes',
		external: true,
	},
	{
		href: 'https://docs.koreshield.com/docs/api-reference/',
		label: 'API Reference',
		desc: 'Full endpoint documentation',
		external: true,
	},
];

export default function NotFoundPage() {
	return (
		<div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-background">
			<div className="max-w-xl w-full text-center">
				<motion.div
					initial={{ opacity: 0, y: -16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					{/* 404 number */}
					<motion.div
						className="text-[9rem] font-extrabold leading-none tracking-[-0.06em] text-electric-green/20 select-none mb-4"
						animate={{ scale: [1, 1.03, 1] }}
						transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
					>
						404
					</motion.div>

					{/* Badge */}
					<div className="inline-flex items-center gap-2 bg-electric-green/10 border border-electric-green/20 text-electric-green text-xs font-semibold px-3 py-1.5 rounded-full mb-5 uppercase tracking-widest">
						<span className="w-1.5 h-1.5 rounded-full bg-electric-green" />
						Page Not Found
					</div>

					<h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
						Nothing here but silence.
					</h1>
					<p className="text-muted-foreground mb-8 leading-relaxed">
						The page you're looking for doesn't exist or has been moved. Let's get you back on track.
					</p>

					{/* Primary actions */}
					<div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
						<Link
							to="/"
							className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
						>
							<Home className="w-4 h-4" />
							Back to Home
						</Link>
						<a
							href="https://docs.koreshield.com"
							target="_blank"
							rel="noreferrer noopener"
							className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border hover:border-primary/40 text-foreground font-semibold rounded-lg transition-colors"
						>
							<BookOpen className="w-4 h-4" />
							Documentation
						</a>
					</div>

					{/* Suggested links */}
					<div className="bg-card border border-border rounded-xl p-5 text-left">
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Popular pages</p>
						<div className="space-y-1">
							{suggestedLinks.map((link) => (
								<a
									key={link.label}
									href={link.href}
									target={link.external ? '_blank' : undefined}
									rel={link.external ? 'noreferrer noopener' : undefined}
									className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
								>
									<div>
										<p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{link.label}</p>
										<p className="text-xs text-muted-foreground">{link.desc}</p>
									</div>
									<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
								</a>
							))}
						</div>
					</div>

					<p className="text-xs text-muted-foreground mt-6">
						Still stuck?{' '}
						<a href="mailto:support@koreshield.com" className="text-primary hover:underline">
							Email support
						</a>
						{' '}or join our{' '}
						<a href="https://discord.gg/koreshield" target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">
							Discord community
						</a>.
					</p>
				</motion.div>
			</div>
		</div>
	);
}
