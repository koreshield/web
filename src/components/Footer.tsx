import { Link } from 'react-router-dom';

function Footer() {
	return (
		<footer className="bg-card border-t border-border py-16 px-6 transition-colors">
			<div className="max-w-7xl mx-auto">
				{/* Logo + Tagline */}
				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 mb-12">
					<div className="flex items-center gap-3">
						<img src="/logo/dark/SVG/Black.svg" alt="KoreShield Logo" className="w-8 h-8 dark:hidden" />
						<img src="/logo/light/SVG/White.svg" alt="KoreShield Logo" className="w-8 h-8 hidden dark:block" />
						<div>
							<div className="text-xl font-bold text-foreground tracking-tight">
								KoreShield
							</div>
							<p className="text-muted-foreground text-sm mt-0.5">The security layer your LLM provider doesn't include.</p>
						</div>
					</div>

					{/* Social links */}
					<div className="flex items-center gap-4">
						<a
							href="https://github.com/koreshield"
							target="_blank"
							rel="noreferrer noopener"
							aria-label="KoreShield on GitHub"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
								<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
							</svg>
						</a>
						<a
							href="https://twitter.com/koreshield"
							target="_blank"
							rel="noreferrer noopener"
							aria-label="KoreShield on X (Twitter)"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
							</svg>
						</a>
						<a
							href="https://www.linkedin.com/company/koreshield"
							target="_blank"
							rel="noreferrer noopener"
							aria-label="KoreShield on LinkedIn"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
								<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
							</svg>
						</a>
						<a
							href="https://t.me/koreshield"
							target="_blank"
							rel="noreferrer noopener"
							aria-label="KoreShield on Telegram"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
								<path d="M21.426 4.016a1.75 1.75 0 0 0-1.814-.225L3.593 10.228a1.75 1.75 0 0 0 .12 3.276l4.02 1.31 1.31 4.021a1.75 1.75 0 0 0 3.276.12l6.437-16.02a1.75 1.75 0 0 0-.33-1.92ZM9.16 14.84l-.86-2.64 7.654-5.17-5.17 7.655-1.624.155Zm1.768 3.835-.934-2.864 1.454-.139-.52 3.003Z" />
							</svg>
						</a>
					</div>
				</div>

				{/* 4-column link grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
					{/* Product */}
					<div>
						<h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Product</h4>
						<ul className="space-y-3">
							<li><Link to="/docs/features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Features</Link></li>
							<li><Link to="/integrations" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Integrations</Link></li>
							<li><Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Pricing</Link></li>
							<li><Link to="/demo" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Live Demo</Link></li>
							<li><Link to="/playground" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Playground</Link></li>
							<li><Link to="/changelog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Changelog</Link></li>
						</ul>
					</div>

					{/* Resources */}
					<div>
						<h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Resources</h4>
						<ul className="space-y-3">
							<li><Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Documentation</Link></li>
							<li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Blog</Link></li>
							<li><Link to="/research" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Research</Link></li>
							<li><Link to="/status" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Status</Link></li>
							<li><Link to="/why-koreshield" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Why KoreShield</Link></li>
						</ul>
					</div>

					{/* Company */}
					<div>
						<h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Company</h4>
						<ul className="space-y-3">
							<li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors text-sm">About</Link></li>
							<li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Contact</Link></li>
							<li><Link to="/careers" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Careers <span className="text-electric-green text-xs">hiring</span></Link></li>
						</ul>
					</div>

					{/* Legal */}
					<div>
						<h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Legal</h4>
						<ul className="space-y-3">
							<li><Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Privacy Policy</Link></li>
							<li><Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Terms of Service</Link></li>
							<li><Link to="/cookie-policy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Cookie Policy</Link></li>
							<li><Link to="/dpa" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Data Processing Agreement</Link></li>
						</ul>
					</div>
				</div>

				{/* Copyright */}
				<div className="pt-8 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-muted-foreground text-sm">
					<p>© {new Date().getFullYear()} KoreShield. All rights reserved.</p>
					<p className="text-xs text-muted-foreground/60">
						Koreshield Labs Ltd. · Incorporated in England & Wales · Co. No. 17057784
					</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
