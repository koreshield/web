import { Github, LogOut, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../lib/auth";
import { useAuthState } from "../hooks/useAuthState";
import Footer from "./Footer";

const navLinkClass = "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors";
const mobileNavLinkClass = "text-base font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors";

export function Layout() {
	const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
	const navigate = useNavigate();
	const { isAuthenticated, user, isHydrating } = useAuthState();
	const { theme } = useTheme();
	const logoSrc = theme === 'light' ? '/logo/SVG/Black.svg' : '/logo/SVG/White.svg';

	const closeMobile = () => setMobileMenuOpen(false);

	const handleLogout = () => {
		authService.logout();
		navigate('/');
	};

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
			<header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/[0.06]">
				<div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

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
						{isAuthenticated && (
							<>
								<Link to="/dashboard" className={navLinkClass}>Dashboard</Link>
								<Link to="/getting-started" className={navLinkClass}>Getting Started</Link>
								<Link to="/teams" className={navLinkClass}>Teams</Link>
								<Link to="/threat-monitoring" className={navLinkClass}>Threats</Link>
								<Link to="/provider-health" className={navLinkClass}>Providers</Link>
								<Link to="/advanced-analytics" className={navLinkClass}>Analytics</Link>
							</>
						)}

						<a href="https://github.com/koreshield/" target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="KoreShield on GitHub">
							<Github className="w-4.5 h-4.5" />
						</a>

						{isAuthenticated ? (
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-1.5 text-sm">
									<User className="w-4 h-4 text-primary" />
									<Link to="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
										{user?.name || user?.email}
									</Link>
								</div>
								<button
									type="button"
									onClick={handleLogout}
									className="flex items-center gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
								>
									<LogOut className="w-3.5 h-3.5" />
									Logout
								</button>
							</div>
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
					<div className="md:hidden border-t border-white/[0.06] bg-background/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
						{isAuthenticated && (
							<>
								<Link to="/dashboard" className={mobileNavLinkClass} onClick={closeMobile}>Dashboard</Link>
								<Link to="/getting-started" className={mobileNavLinkClass} onClick={closeMobile}>Getting Started</Link>
								<Link to="/teams" className={mobileNavLinkClass} onClick={closeMobile}>Teams</Link>
								<Link to="/threat-monitoring" className={mobileNavLinkClass} onClick={closeMobile}>Threats</Link>
								<Link to="/provider-health" className={mobileNavLinkClass} onClick={closeMobile}>Providers</Link>
								<Link to="/advanced-analytics" className={mobileNavLinkClass} onClick={closeMobile}>Analytics</Link>
								<Link to="/threat-map" className={mobileNavLinkClass} onClick={closeMobile}>Threat Map</Link>
								<Link to="/compliance-reports" className={mobileNavLinkClass} onClick={closeMobile}>Compliance</Link>
								<Link to="/api-key-management" className={mobileNavLinkClass} onClick={closeMobile}>API Keys</Link>
								<Link to="/audit-logs" className={mobileNavLinkClass} onClick={closeMobile}>Audit Logs</Link>
								<Link to="/rag-security" className={mobileNavLinkClass} onClick={closeMobile}>RAG Security</Link>
							</>
						)}
						<a href="https://github.com/koreshield/" target="_blank" rel="noreferrer noopener" className={`${mobileNavLinkClass} flex items-center gap-2`}>
							<Github className="w-4 h-4" /> GitHub
						</a>

						<div className="pt-4 pb-2">
							{isAuthenticated ? (
								<div className="space-y-3">
									<div className="flex items-center gap-3 px-4 py-3 bg-card border border-white/[0.08] rounded-lg">
										<User className="w-5 h-5 text-primary shrink-0" />
										<div>
											<div className="text-sm font-medium text-foreground">{user?.name}</div>
											<div className="text-xs text-muted-foreground">{user?.email}</div>
										</div>
									</div>
									<button
										type="button"
										onClick={handleLogout}
										className="flex items-center justify-center gap-2 w-full bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-3 rounded-lg font-semibold transition-colors"
									>
										<LogOut className="w-4 h-4" />
										Logout
									</button>
								</div>
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
				)}
			</header>

			<main className="flex-1 pt-16">
				<Outlet />
			</main>

			<Footer />
		</div>
	);
}
