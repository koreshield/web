import { Github, LogOut, Menu, Moon, SunMedium, User, X } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../lib/auth";
import Footer from "./Footer";

export function Layout() {
	const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
	const navigate = useNavigate();
	const isAuthenticated = authService.isAuthenticated();
	const user = authService.getCurrentUser();
	const { theme, toggleTheme } = useTheme();
	const logoSrc = theme === 'light' ? '/logo/SVG/Black.svg' : '/logo/SVG/White.svg';

	const handleLogout = () => {
		authService.logout();
		navigate('/');
	};

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
			<header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/[0.06]">
				<div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
					<Link to="/" className="text-xl font-bold flex items-center gap-2 tracking-tight">
						<img src={logoSrc} alt="KoreShield Logo" className="w-8 h-8" />
						<span className="text-foreground">KoreShield</span>
					</Link>

					{/* Desktop Nav */}
					<nav className="hidden md:flex items-center gap-6">
						{!isAuthenticated && (
							<>
								<a href="https://docs.koreshield.com" target="_blank" rel="noreferrer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Docs</a>
								<Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
								<Link to="/changelog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Changelog</Link>
							</>
						)}
						{isAuthenticated && (
							<>
								<Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
								<Link to="/teams" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Teams</Link>
								<Link to="/threat-monitoring" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Threats</Link>
								<Link to="/provider-health" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Providers</Link>
								<Link to="/advanced-analytics" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Analytics</Link>
							</>
						)}

						<button
							onClick={toggleTheme}
							className="p-2 rounded-md border border-white/[0.08] hover:border-primary transition-colors bg-card"
							aria-label="Toggle color mode"
						>
							{theme === 'light' ? <Moon className="w-5 h-5 text-muted-foreground" /> : <SunMedium className="w-5 h-5 text-muted-foreground" />}
						</button>
						<a href="https://github.com/koreshield/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
							<Github className="w-5 h-5" />
						</a>
						{isAuthenticated ? (
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2 text-sm">
										<User className="w-4 h-4 text-primary" />
									<Link to="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
										{user?.name || user?.email}
									</Link>
								</div>
								<button
									onClick={handleLogout}
									className="flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
								>
									<LogOut className="w-4 h-4" />
									Logout
								</button>
							</div>
						) : (
							<Link to="/login" className="bg-primary hover:bg-emerald-bright text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/10">
								Sign In
							</Link>
						)}
					</nav>

					{/* Mobile Actions */}
					<div className="flex items-center gap-2 md:hidden">
						<button
							onClick={toggleTheme}
							className="p-2 rounded-md border border-white/[0.08] bg-card text-muted-foreground"
							aria-label="Toggle color mode"
						>
							{theme === 'light' ? <Moon className="w-5 h-5" /> : <SunMedium className="w-5 h-5" />}
						</button>

						<button
							onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
							className="p-2 text-muted-foreground hover:text-foreground transition-colors"
							aria-label="Toggle menu"
						>
							{isMobileMenuOpen ? <X /> : <Menu />}
						</button>
					</div>
				</div>

				{/* Mobile Nav */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t border-white/[0.06] bg-background/95 backdrop-blur-xl p-6 flex flex-col gap-4 h-[calc(100vh-4rem)] overflow-y-auto">
						{!isAuthenticated && (
							<>
						<a href="https://docs.koreshield.com" target="_blank" rel="noreferrer" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors">Docs</a>
						<Link to="/pricing" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
						<Link to="/changelog" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Changelog</Link>
							</>
						)}
						{isAuthenticated && (
							<>
								<Link to="/dashboard" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
								<Link to="/teams" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Teams</Link>
								<Link to="/threat-monitoring" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Threats</Link>
								<Link to="/provider-health" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Providers</Link>
								<Link to="/advanced-analytics" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
								<Link to="/threat-map" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Threat Map</Link>
								<Link to="/compliance-reports" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Compliance</Link>
								<Link to="/api-key-management" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>API Keys</Link>
								<Link to="/audit-logs" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Audit Logs</Link>
							</>
						)}
						<a href="https://github.com/koreshield/" className="text-lg font-medium py-3 border-b border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
							<Github className="w-5 h-5" /> GitHub
						</a>

						<div className="pt-4">
							{isAuthenticated ? (
								<div className="space-y-3">
							<div className="flex items-center gap-2 px-4 py-3 bg-card border border-white/[0.08] rounded-lg cursor-default">
									<User className="w-5 h-5 text-primary" />
										<div>
											<div className="text-sm font-medium">{user?.name}</div>
											<div className="text-xs text-muted-foreground">{user?.email}</div>
										</div>
									</div>
									<button
										onClick={handleLogout}
										className="flex items-center justify-center gap-2 w-full bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-4 rounded-lg text-lg font-bold transition-colors cursor-pointer"
									>
										<LogOut className="w-5 h-5" />
										Logout
									</button>
								</div>
							) : (
								<Link to="/login" className="block w-full text-center bg-primary hover:bg-emerald-bright text-primary-foreground px-4 py-4 rounded-lg text-lg font-bold transition-colors shadow-sm shadow-emerald-500/10" onClick={() => setMobileMenuOpen(false)}>
									Sign In
								</Link>
							)}
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
