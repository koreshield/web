import { Github, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuthState } from '../hooks/useAuthState';
import Footer from './Footer';

const NAV_LINKS = [
	{ label: 'Docs', href: 'https://docs.koreshield.com', external: true },
	{ label: 'Blog', href: 'https://blog.koreshield.com', external: true },
	{ label: 'Pricing', href: '/pricing', external: false },
	{ label: 'Changelog', href: '/changelog', external: false },
];

export function MarketingLayout() {
	const [isMobileOpen, setMobileOpen] = useState(false);
	const { theme } = useTheme();
	const { isAuthenticated, isHydrating } = useAuthState();
	const location = useLocation();
	const logoSrc = theme === 'light' ? '/logo/SVG/Black.svg' : '/logo/SVG/White.svg';

	// Close mobile menu on route change
	useEffect(() => {
		setMobileOpen(false);
	}, [location.pathname]);

	// Prevent body scroll when mobile menu open
	useEffect(() => {
		document.body.style.overflow = isMobileOpen ? 'hidden' : '';
		return () => { document.body.style.overflow = ''; };
	}, [isMobileOpen]);

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
			<header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/[0.06]">
				<div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

					{/* Logo */}
					<Link to="/" className="flex items-center gap-2.5 shrink-0 tracking-tight">
						<img src={logoSrc} alt="KoreShield" className="w-7 h-7" />
						<span className="text-base font-bold text-foreground">KoreShield</span>
					</Link>

					{/* Desktop nav */}
					<nav className="hidden md:flex items-center gap-7 flex-1">
						{NAV_LINKS.map(link =>
							link.external ? (
								<a
									key={link.label}
									href={link.href}
									target="_blank"
									rel="noreferrer noopener"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.label}
								</a>
							) : (
								<Link
									key={link.label}
									to={link.href}
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.label}
								</Link>
							)
						)}
					</nav>

					{/* Right side */}
					<div className="hidden md:flex items-center gap-4">
						<a
							href="https://github.com/koreshield/"
							target="_blank"
							rel="noreferrer noopener"
							className="text-muted-foreground hover:text-foreground transition-colors"
							aria-label="KoreShield on GitHub"
						>
							<Github className="w-4.5 h-4.5" />
						</a>

						{!isHydrating && (
							isAuthenticated ? (
								<Link
									to="/dashboard"
									className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors"
								>
									Dashboard
								</Link>
							) : (
								<Link
									to="/login"
									className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/10"
								>
									Sign In
								</Link>
							)
						)}
					</div>

					{/* Mobile toggle */}
					<button
						type="button"
						onClick={() => setMobileOpen(v => !v)}
						className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Toggle menu"
					>
						{isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
					</button>
				</div>

				{/* Mobile menu */}
				{isMobileOpen && (
					<div className="md:hidden border-t border-white/[0.06] bg-background/97 backdrop-blur-xl">
						<div className="px-6 pt-4 pb-6 flex flex-col gap-1">
							{NAV_LINKS.map(link =>
								link.external ? (
									<a
										key={link.label}
										href={link.href}
										target="_blank"
										rel="noreferrer noopener"
										className="py-3 text-base font-medium border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.label}
									</a>
								) : (
									<Link
										key={link.label}
										to={link.href}
										className="py-3 text-base font-medium border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.label}
									</Link>
								)
							)}
							<Link
								to="/about"
								className="py-3 text-base font-medium border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
							>
								About
							</Link>
							<Link
								to="/contact"
								className="py-3 text-base font-medium border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
							>
								Contact
							</Link>
							<a
								href="https://github.com/koreshield/"
								target="_blank"
								rel="noreferrer noopener"
								className="py-3 text-base font-medium border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
							>
								<Github className="w-4 h-4" /> GitHub
							</a>

							<div className="pt-4">
								{!isHydrating && (
									isAuthenticated ? (
										<Link
											to="/dashboard"
											className="block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg font-semibold transition-colors"
										>
											Go to Dashboard
										</Link>
									) : (
										<Link
											to="/login"
											className="block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg font-semibold transition-colors"
										>
											Sign In
										</Link>
									)
								)}
							</div>
						</div>
					</div>
				)}
			</header>

			<main className="flex-1 pt-16">
				<Outlet />
			</main>

			<Footer />
		</div>
	);
}
