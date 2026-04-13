import { Github, Menu, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuthState } from '../hooks/useAuthState';
import Footer from './Footer';
import { ThemeToggle } from './ThemeToggle';

const desktopNavLinkClass = 'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';
const mobileNavLinkClass = 'flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-card';

const productLinks = [
	{ label: 'Pricing', to: '/pricing' },
	{ label: 'Demo', to: '/demo' },
	{ label: 'RAG Security', to: '/rag-security' },
];

const companyLinks = [
	{ label: 'About', to: '/about' },
	{ label: 'Contact', to: '/contact' },
	{ label: 'Changelog', to: '/changelog' },
];

const resourceLinks = [
	{ label: 'Docs', href: 'https://docs.koreshield.com' },
	{ label: 'Blog', href: 'https://blog.koreshield.com' },
	{ label: 'GitHub', href: 'https://github.com/koreshield/' },
];

function MobileNavSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-3">
			<p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
				{title}
			</p>
			<div className="space-y-2">{children}</div>
		</div>
	);
}

export function MarketingLayout() {
	const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { isAuthenticated } = useAuthState();
	const { theme } = useTheme();
	const logoSrc = theme === 'light' ? '/logo/SVG/Black.svg' : '/logo/SVG/White.svg';

	const closeMobile = () => setMobileMenuOpen(false);

	useEffect(() => {
		if (!isMobileMenuOpen) {
			document.body.style.overflow = '';
			return;
		}

		document.body.style.overflow = 'hidden';

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closeMobile();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('keydown', handleEscape);
		};
	}, [isMobileMenuOpen]);

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
			<header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-background/80 backdrop-blur-xl">
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
					<Link to="/" className="flex items-center gap-2.5 tracking-tight">
						<img src={logoSrc} alt="KoreShield" className="h-8 w-8" />
						<div className="min-w-0">
							<span className="block text-lg font-bold text-foreground">KoreShield</span>
							<span className="hidden text-[11px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
								AI Security
							</span>
						</div>
					</Link>

					<nav className="hidden items-center gap-6 md:flex">
						{!isAuthenticated ? (
							<>
								{productLinks.map((item) => (
									<Link key={item.to} to={item.to} className={desktopNavLinkClass}>
										{item.label}
									</Link>
								))}
								{companyLinks.map((item) => (
									<Link key={item.to} to={item.to} className={desktopNavLinkClass}>
										{item.label}
									</Link>
								))}
								{resourceLinks.slice(0, 2).map((item) => (
									<a
										key={item.href}
										href={item.href}
										target="_blank"
										rel="noreferrer noopener"
										className={desktopNavLinkClass}
									>
										{item.label}
									</a>
								))}
							</>
						) : null}

						<ThemeToggle />

						<a
							href="https://github.com/koreshield/"
							target="_blank"
							rel="noreferrer noopener"
							className="text-muted-foreground transition-colors hover:text-foreground"
							aria-label="KoreShield on GitHub"
						>
							<Github className="h-4.5 w-4.5" />
						</a>

						{isAuthenticated ? (
							<Link
								to="/dashboard"
								className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-emerald-500/10 transition-colors hover:bg-primary/90"
							>
								Dashboard
							</Link>
						) : (
							<div className="flex items-center gap-2">
								<Link
									to="/login"
									className="rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-card"
								>
									Sign In
								</Link>
								<Link
									to="/demo"
									className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-emerald-500/10 transition-colors hover:bg-primary/90"
								>
									Book Demo
								</Link>
							</div>
						)}
					</nav>

					<div className="flex items-center gap-2 md:hidden">
						<ThemeToggle className="px-2.5 py-2" />

						{/* Direct auth link always visible in mobile header — no wait, no tap-the-drawer */}
						{isAuthenticated ? (
							<Link
								to="/dashboard"
								className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
							>
								Dashboard
							</Link>
						) : (
							<Link
								to="/login"
								className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-card"
							>
								Sign In
							</Link>
						)}

						<button
							type="button"
							onClick={() => setMobileMenuOpen((open) => !open)}
							className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground transition-colors hover:text-foreground hover:border-primary/30"
							aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
							aria-expanded={isMobileMenuOpen}
						>
							{isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</button>
					</div>
				</div>

				{isMobileMenuOpen ? (
					<div className="md:hidden">
						<div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm" onClick={closeMobile} />
						<div className="fixed inset-x-4 top-20 z-50 max-h-[calc(100vh-6rem)] overflow-hidden rounded-[28px] border border-white/10 bg-background/95 shadow-2xl shadow-black/30">
							<div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
								<div>
									<p className="text-sm font-semibold text-foreground">Navigate KoreShield</p>
									<p className="text-xs text-muted-foreground">Product, resources, and company links.</p>
								</div>
								<ThemeToggle showLabel />
							</div>

							<div className="max-h-[calc(100vh-11rem)] overflow-y-auto px-5 py-5">
								<div className="space-y-6">
									<MobileNavSection title="Product">
										{productLinks.map((item) => (
											<Link key={item.to} to={item.to} onClick={closeMobile} className={mobileNavLinkClass}>
												<span>{item.label}</span>
												<Sparkles className="h-4 w-4 text-primary/80" />
											</Link>
										))}
									</MobileNavSection>

									<MobileNavSection title="Company">
										{companyLinks.map((item) => (
											<Link key={item.to} to={item.to} onClick={closeMobile} className={mobileNavLinkClass}>
												<span>{item.label}</span>
												<span className="text-xs text-muted-foreground">Open</span>
											</Link>
										))}
									</MobileNavSection>

									<MobileNavSection title="Resources">
										{resourceLinks.map((item) => (
											<a
												key={item.href}
												href={item.href}
												target="_blank"
												rel="noreferrer noopener"
												className={mobileNavLinkClass}
											>
												<span>{item.label}</span>
												<span className="text-xs text-muted-foreground">External</span>
											</a>
										))}
									</MobileNavSection>
								</div>
							</div>

							<div className="border-t border-white/[0.08] bg-card/50 px-5 py-4">
								{isAuthenticated ? (
									<Link
										to="/dashboard"
										onClick={closeMobile}
										className="block rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
									>
										Go to Dashboard
									</Link>
								) : (
									<div className="grid grid-cols-2 gap-3">
										<Link
											to="/login"
											onClick={closeMobile}
											className="rounded-2xl border border-border bg-background px-4 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-primary/30"
										>
											Sign In
										</Link>
										<Link
											to="/demo"
											onClick={closeMobile}
											className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
										>
											Book Demo
										</Link>
									</div>
								)}
							</div>
						</div>
					</div>
				) : null}
			</header>

			<main className="flex-1 pt-16">
				<Outlet />
			</main>

			<Footer />
		</div>
	);
}
