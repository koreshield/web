import { Activity, BookOpen, Github } from 'lucide-react';

function Footer() {
	return (
		<footer className="bg-card/50 dark:bg-[#0A0A0C] border-t border-white/[0.06] py-16 px-6 transition-colors">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row items-center justify-between gap-6">
					{/* Logo */}
					<div className="flex items-center gap-3">
						<img src="/logo/SVG/Black.svg" alt="KoreShield Logo" className="w-8 h-8 dark:hidden" />
						<img src="/logo/SVG/White.svg" alt="KoreShield Logo" className="w-8 h-8 hidden dark:block" />
						<div>
							<div className="text-xl font-bold text-foreground tracking-tight">
								KoreShield
							</div>
							<p className="text-muted-foreground text-sm mt-1">The enterprise-grade LLM security firewall</p>
						</div>
					</div>

					{/* Links */}
					<div className="flex items-center gap-8">
						<a
							href="https://github.com/koreshield/"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
						>
							<Github className="w-5 h-5" />
							<span>GitHub</span>
						</a>
						<a
							href="https://docs.koreshield.com"
							className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
						>
							<BookOpen className="w-5 h-5" />
							<span>Docs</span>
						</a>
						<a
							href="/status"
							className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
						>
							<Activity className="w-5 h-5" />
							<span>Status</span>
						</a>
					</div>
				</div>

				{/* Copyright */}
				<div className="mt-10 pt-8 border-t border-white/[0.06] text-center text-muted-foreground text-sm">
					© 2026 Koreshield. Open source.
				</div>
			</div>
		</footer>
	);
}

export default Footer;
