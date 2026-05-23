import { ArrowRight, CheckCircle2, Github, Linkedin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const linkClass = 'text-sm text-muted-foreground transition-colors hover:text-foreground';

const footerGroups = [
	{
		title: 'Solutions',
		links: [
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
			{ label: 'Integrations', to: '/integrations' },
			{ label: 'Changelog', to: '/changelog' },
			{ label: 'Status', to: '/status' },
		],
	},
	{
		title: 'Resources',
		links: [
			{ label: 'Documentation', to: '/docs' },
			{ label: 'Blog', to: '/blog' },
			{ label: 'Research', to: '/research' },
			{ label: 'RAG Security Guide', to: '/solutions/rag-security' },
			{ label: 'Compare LLM Guard', to: '/compare/llm-guard' },
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

function Footer() {
	return (
		<footer className="relative overflow-hidden border-t border-white/[0.08] bg-[#070909] px-6 py-16 text-foreground">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-green/50 to-transparent" />
			<div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-electric-green/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />

			<div className="relative mx-auto max-w-7xl">
				<div className="mb-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-7 md:p-8">
						<div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
							<div>
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
										<img src="/favicon.svg" alt="" className="h-8 w-8" />
									</div>
									<div>
										<p className="text-2xl font-extrabold tracking-tight text-white">Koreshield</p>
										<p className="mt-1 text-sm text-muted-foreground">Runtime security for production AI.</p>
									</div>
								</div>
								<p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
									Protect prompts, RAG context, provider calls, policy decisions, and audit evidence before risky AI behaviour reaches customers.
								</p>
							</div>
							<div className="flex gap-3">
								<a href="https://github.com/koreshield" target="_blank" rel="noreferrer noopener" aria-label="Koreshield on GitHub" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-muted-foreground transition-colors hover:border-electric-green/30 hover:text-white">
									<Github className="h-5 w-5" />
								</a>
								<a href="https://twitter.com/koreshield" target="_blank" rel="noreferrer noopener" aria-label="Koreshield on X" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-muted-foreground transition-colors hover:border-electric-green/30 hover:text-white">
									<XIcon className="h-4 w-4" />
								</a>
								<a href="https://www.linkedin.com/company/koreshield" target="_blank" rel="noreferrer noopener" aria-label="Koreshield on LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-muted-foreground transition-colors hover:border-electric-green/30 hover:text-white">
									<Linkedin className="h-5 w-5" />
								</a>
							</div>
						</div>
					</div>

					<div className="rounded-[2rem] border border-electric-green/20 bg-electric-green/[0.075] p-7 md:p-8">
						<div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-green/15">
							<ShieldCheck className="h-6 w-6 text-electric-green" />
						</div>
						<h2 className="text-2xl font-extrabold tracking-tight text-white">See what your AI is exposed to.</h2>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							Run a guided demo against your stack: prompts, RAG, providers, alerts, and audit evidence.
						</p>
						<div className="mt-6 flex flex-col gap-3 sm:flex-row">
							<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright">
								Book a demo <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/docs" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-black/20 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black/35">
								Read docs
							</Link>
						</div>
					</div>
				</div>

				<div className="grid gap-10 border-y border-white/[0.08] py-10 sm:grid-cols-2 lg:grid-cols-5">
					{footerGroups.map((group) => (
						<div key={group.title}>
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
					<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
						<span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
							<CheckCircle2 className="h-3.5 w-3.5 text-electric-green" />
							Zero-retention default
						</span>
						<span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
							<CheckCircle2 className="h-3.5 w-3.5 text-electric-green" />
							UK company
						</span>
						<span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
							<CheckCircle2 className="h-3.5 w-3.5 text-electric-green" />
							Python + Node SDKs
						</span>
					</div>
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
