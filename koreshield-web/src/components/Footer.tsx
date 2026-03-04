import { Link } from 'react-router-dom';

function Footer() {
	return (
		<footer className="bg-card/50 dark:bg-[#0A0A0C] border-t border-white/[0.06] py-16 px-6 transition-colors">
			<div className="max-w-7xl mx-auto">
				{/* Logo + Tagline */}
				<div className="flex items-center gap-3 mb-12">
					<img src="/logo/SVG/Black.svg" alt="KoreShield Logo" className="w-8 h-8 dark:hidden" />
					<img src="/logo/SVG/White.svg" alt="KoreShield Logo" className="w-8 h-8 hidden dark:block" />
					<div>
						<div className="text-xl font-bold text-foreground tracking-tight">
							KoreShield
						</div>
						<p className="text-muted-foreground text-sm mt-1">The enterprise-grade LLM security firewall</p>
					</div>
				</div>

				{/* 4-column link grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
					{/* Product */}
					<div>
						<h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Product</h4>
						<ul className="space-y-3">
							<li><a href="https://docs.koreshield.com/docs/category/features/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Features</a></li>
							<li><Link to="/integrations" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Integrations</Link></li>
							<li><Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Pricing</Link></li>
							<li><Link to="/demo" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Demo</Link></li>
							<li><Link to="/playground" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Playground</Link></li>
							<li><Link to="/changelog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Changelog</Link></li>
						</ul>
					</div>

					{/* Resources */}
					<div>
						<h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Resources</h4>
						<ul className="space-y-3">
							<li><a href="https://docs.koreshield.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Documentation</a></li>
							<li><a href="https://blog.koreshield.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Blog</a></li>
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
							<li><Link to="/careers" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Careers</Link></li>
						</ul>
					</div>

					{/* Legal */}
					<div>
						<h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Legal</h4>
						<ul className="space-y-3">
							<li><Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Privacy Policy</Link></li>
							<li><Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Terms of Service</Link></li>
							<li><Link to="/cookie-policy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Cookie Policy</Link></li>
						</ul>
					</div>
				</div>

				{/* Copyright */}
				<div className="pt-8 border-t border-white/[0.06] text-center text-muted-foreground text-sm">
					<p>© {new Date().getFullYear()} KoreShield. All rights reserved.</p>
					<p className="mt-2 text-xs text-muted-foreground/70">
						KoreShield is a trading name of Koreshield Labs Ltd., incorporated in England & Wales. Company registration number: 17057784.
					</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
