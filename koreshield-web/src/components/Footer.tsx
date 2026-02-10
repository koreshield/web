import { Github, BookOpen, Activity } from 'lucide-react';

function Footer() {
	return (
		<footer className="bg-black border-t border-slate-800 py-12 px-6">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row items-center justify-between gap-6">
					{/* Logo */}
					<div className="flex items-center gap-2">
						<img src="/logo/SVG/White.svg" alt="KoreShield Logo" className="w-8 h-8" />
						<div>
							<div className="text-xl font-bold">
								Kore<span className="text-electric-green">Shield</span>
							</div>
							<p className="text-gray-500 text-sm mt-1">The enterprise-grade LLM security firewall</p>
						</div>
					</div>

					{/* Links */}
					<div className="flex items-center gap-8">
						<a
							href="https://github.com/koreshield/"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 text-gray-400 hover:text-electric-green transition-colors"
						>
							<Github className="w-5 h-5" />
							<span>GitHub</span>
						</a>
						<a
							href="https://docs.koreshield.com"
							className="flex items-center gap-2 text-gray-400 hover:text-electric-green transition-colors"
						>
							<BookOpen className="w-5 h-5" />
							<span>Docs</span>
						</a>
						<a
							href="/status"
							className="flex items-center gap-2 text-gray-400 hover:text-electric-green transition-colors"
						>
							<Activity className="w-5 h-5" />
							<span>Status</span>
						</a>
					</div>
				</div>

				{/* Copyright */}
				<div className="mt-8 pt-8 border-t border-slate-800 text-center text-gray-500 text-sm">
					© 2026 Koreshield. Open source.
				</div>
			</div>
		</footer>
	);
}

export default Footer;
