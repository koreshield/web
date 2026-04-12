import { Github, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuthState } from '../hooks/useAuthState';
import Footer from './Footer';

const navLinkClass = 'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors';
const mobileNavLinkClass = 'text-base font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors';

export function MarketingLayout() {
	const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { isAuthenticated, isHydrating } = useAuthState();
	const { theme } = useTheme();
	const logoSrc = theme === 'light' ? '/logo/SVG/Black.svg' : '/logo/SVG/White.svg';

	const closeMobile = () => setMobileMenuOpen(false);

	// Disable body overflow when drawer is open
	useEffect(() => {
		if (isMobileMenuOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isMobileMenuOpen]);


	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
			<header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/[0.06]">
				<div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

					{/* Logo */}
					<Link to="/" className="flex items-center gap-2 tracking-tight">
						<img src={logoSrc} alt="KoreShield" className="w-8 h-8" />
						<span className="text-lg font-bold text-foreground">KoreShield</span>
					</Link>

					{/* Desktop Nav */}
					<nav className="hidden md:flex items-center gap-6">
						{!isAuthenticated && !isHydrating && (
							<>
								<a href="https://docs.koreshield.com" target="_blank" rel="noreferrer noopener" className={navLinkClass}>Docs</a>
								<a href="https://blog.koreshield.com" target="_blank" rel="noreferrer noopener" className={navLinkClass}>Blog</a>
								<Link to="/pricing" className={navLinkClass}>Pricing</Link>
								<Link to="/changelog" className={navLinkClass}>Changelog</Link>
							</>
						)}

						<a href="https://github.com/koreshield/" target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="KoreShield on GitHub">
							<Github className="w-4.5 h-4.5" />
						</a>

						{isAuthenticated ? (
							<Link
								to="/dashboard"
								className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/10"
							>
								Dashboard
							</Link>
						) : !isHydrating ? (
							<Link
								to="/login"
								className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/10"
							>
								Sign In
							</Link>
						) : null}
					</nav>

					{/* Mobile menu toggle */}
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
						className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Toggle menu"
					>
						{isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
					</button>
				</div>

				{/* Mobile Nav */}
				{isMobileMenuOpen && (
					<>
						{/* Backdrop */}
						<div
							className="fixed inset-0 bg-black/50 z-40 md:hidden"
							onClick={closeMobile}
						/>
						{/* Drawer */}
						<div className="fixed left-0 top-14 bottom-0 w-full bg-background border-t border-white/[0.06] z-40 md:hidden overflow-y-auto flex flex-col">
							<nav className="flex-1 px-6 py-4 flex flex-col gap-1">
								{!isAuthenticated && !isHydrating && (
									<>
										<a href="https://docs.koreshield.com" target="_blank" rel="noreferrer noopener" className={mobileNavLinkClass}>Docs</a>
										<a href="https://blog.koreshield.com" target="_blank" rel="noreferrer noopener" className={mobileNavLinkClass}>Blog</a>
										<Link to="/pricing" className={mobileNavLinkClass} onClick={closeMobile}>Pricing</Link>
										<Link to="/changelog" className={mobileNavLinkClass} onClick={closeMobile}>Changelog</Link>
										<Link to="/about" className={mobileNavLinkClass} onClick={closeMobile}>About</Link>
										<Link to="/contact" className={mobileNavLinkClass} onClick={closeMobile}>Contact</Link>
									</>
								)}
								<a href="https://github.com/koreshield/" target="_blank" rel="noreferrer noopener" className={`${mobileNavLinkClass} flex items-center gap-2`}>
									<Github className="w-4 h-4" /> GitHub
								</a>
							</nav>

							{/* Bottom section */}
							<div className="border-t border-white/[0.06] px-6 py-4">
								{isAuthenticated ? (
									<Link
										to="/dashboard"
										className="block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg font-semibold transition-colors"
										onClick={closeMobile}
									>
										Dashboard
									</Link>
								) : !isHydrating ? (
									<Link
										to="/login"
										className="block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg font-semibold transition-colors"
										onClick={closeMobile}
									>
										Sign In
									</Link>
								) : null}
							</div>
						</div>
					</>
				)}
			</header>

			<main className="flex-1 pt-14">
				<Outlet />
			</main>

			<Footer />
		</div>
	);
}
