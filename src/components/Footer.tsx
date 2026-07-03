import { ArrowRight, Github, Linkedin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const linkClass = 'text-sm text-muted-foreground transition-colors hover:text-foreground';

const footerGroups = [
	{
		title: 'Solutions',
		links: [
			{ label: 'Our Solutions', to: '/solutions' },
			{ label: 'AI Detection & Response', to: '/solutions/ai-detection-response' },
			{ label: 'Application Protection', to: '/solutions/ai-application-protection' },
			{ label: 'AI Agents Security', to: '/solutions/ai-agents-security' },
			{ label: 'AI Usage Control', to: '/solutions/ai-usage-control' },
			{ label: 'RAG Security', to: '/solutions/rag-security' },
			{ label: 'KorePilot', to: '/solutions/korepilot' },
			{ label: 'Voice & Audio Protection', to: '/solutions/voice-audio-protection' },
		],
	},
	{
		title: 'Product',
		links: [
			{ label: 'Pricing', to: '/pricing' },
			{ label: 'Book a Demo', to: '/demo' },
			{ label: 'Self-Hosted Deployment', to: '/docs/integrations/deployment/self-hosted' },
			{ label: 'Integrations', to: '/integrations' },
			{ label: 'Changelog', to: '/changelog' },
			{ label: 'Status', to: '/status' },
		],
	},
	{
		title: 'Resources',
		links: [
			{ label: 'Documentation', to: '/docs' },
			{ label: 'FAQ', to: '/faq' },
			{ label: 'Blog', to: '/blog' },
			{ label: 'Research', to: '/research' },
			{ label: 'RAG Security Guide', to: '/solutions/rag-security' },
			{ label: 'Compare Koreshield', to: '/vs' },
		],
	},
	{
		title: 'Company',
		links: [
			{ label: 'About', to: '/about' },
			{ label: 'Contact', to: '/contact' },
			{ label: 'Careers', to: '/careers', badge: 'hiring' },
		],
	},
	{
		title: 'Legal',
		links: [
			{ label: 'Privacy Policy', to: '/privacy-policy' },
			{ label: 'Terms of Service', to: '/terms-of-service' },
			{ label: 'Cookie Policy', to: '/cookie-policy' },
			{ label: 'Data Processing Agreement', to: '/dpa' },
		],
	},
];

function XIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

const socialLinks = [
	{
		label: 'GitHub',
		href: 'https://github.com/koreshield',
		icon: <Github className="h-10 w-10 md:h-12 md:w-12" />,
	},
	{
		label: 'X / Twitter',
		href: 'https://twitter.com/koreshield',
		icon: <XIcon className="h-9 w-9 md:h-11 md:w-11" />,
	},
	{
		label: 'LinkedIn',
		href: 'https://www.linkedin.com/company/koreshield',
		icon: <Linkedin className="h-10 w-10 md:h-12 md:w-12" />,
	},
];

function Footer() {
	return (
		<footer className="relative overflow-hidden border-t border-white/[0.08] bg-[#070909] px-4 py-16 text-foreground sm:px-6">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-green/50 to-transparent" />
			<div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-electric-green/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />

			<div className="relative mx-auto max-w-7xl min-w-0">
				<div className="mb-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="relative min-w-0 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6 md:p-8">
						<div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-electric-green/10 blur-3xl" />
						<div className="relative flex h-full flex-col gap-8">
							<div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
								<div>
									<p className="text-xs font-bold uppercase tracking-[0.28em] text-electric-green">Connect on socials</p>
									<h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">Follow Koreshield</h2>
								</div>
								<div className="flex min-w-0 items-center gap-3 text-sm text-muted-foreground">
									<img src="/logo/light/SVG/White.svg" alt="Koreshield" className="h-8 w-8" />
									<span>Secure AI before it acts.</span>
								</div>
							</div>

							<div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
								{socialLinks.map((social) => (
									<a
										key={social.label}
										href={social.href}
										target="_blank"
										rel="noreferrer noopener"
										aria-label={`Koreshield on ${social.label}`}
										className="group flex min-h-32 min-w-0 flex-col justify-between rounded-[1.35rem] border border-white/[0.08] bg-black/20 p-5 text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:border-electric-green/35 hover:bg-electric-green/[0.07] hover:text-white hover:shadow-2xl hover:shadow-emerald-500/10 sm:min-h-36"
									>
										<span className="transition-colors group-hover:text-electric-green">{social.icon}</span>
										<span className="text-sm font-bold tracking-tight">{social.label}</span>
									</a>
								))}
							</div>
						</div>
					</div>

					<div className="min-w-0 overflow-hidden rounded-[2rem] border border-electric-green/20 bg-electric-green/[0.075] p-6 md:p-8">
						<div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-green/15">
							<ShieldCheck className="h-6 w-6 text-electric-green" />
						</div>
						<h2 className="max-w-full text-2xl font-extrabold tracking-tight text-white">See what your AI is exposed to.</h2>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							Run a guided demo against your stack: prompts, RAG, providers, alerts, and audit evidence.
						</p>
						<div className="mt-6 flex flex-col gap-3 sm:flex-row">
							<Link to="/demo" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-electric-green px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright sm:w-auto">
								Book a demo <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/docs" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-black/20 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black/35 sm:w-auto">
								Read docs
							</Link>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap justify-between gap-x-8 gap-y-10 border-y border-white/[0.08] py-10">
					{footerGroups.map((group) => (
						<div key={group.title} className="min-w-[140px] flex-1 md:flex-initial">
							<h3 className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-white">{group.title}</h3>
							<ul className="space-y-3">
								{group.links.map((link) => (
									<li key={link.to}>
										<Link to={link.to} className={linkClass}>
											{link.label}
											{'badge' in link && link.badge ? (
												<span className="ml-2 rounded-full bg-electric-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-electric-green">
													{link.badge}
												</span>
											) : null}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="flex flex-col gap-6 pt-8 md:flex-row md:items-center md:justify-between">
					<div className="text-sm text-muted-foreground md:text-right">
						<p>© {new Date().getFullYear()} Koreshield. All rights reserved.</p>
						<p className="mt-1 text-xs text-muted-foreground/70">Koreshield Labs Ltd. · Incorporated in England & Wales · Co. No. 17057784</p>
					</div>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
