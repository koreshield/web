import { Outlet, Link, useNavigate } from "react-router-dom";
import { SearchPalette } from "./SearchPalette";
import Footer from "./Footer";
import { useState } from "react";
import { Menu, X, Github, LogOut, User } from "lucide-react";
import { authService } from "../lib/auth";

export function Layout() {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold flex items-center gap-2">
                        <img src="/logo/SVG/White.svg" alt="KoreShield Logo" className="w-8 h-8" />
                        <span>Kore<span className="text-electric-green">Shield</span></span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/docs" className="text-sm font-medium hover:text-electric-green transition-colors">Docs</Link>
                        <Link to="/pricing" className="text-sm font-medium hover:text-electric-green transition-colors">Pricing</Link>
                        <Link to="/playground" className="text-sm font-medium hover:text-electric-green transition-colors">Playground</Link>
                        {isAuthenticated && (
                            <Link to="/dashboard" className="text-sm font-medium hover:text-electric-green transition-colors">Dashboard</Link>
                        )}
                        <SearchPalette />
                        <a href="https://github.com/koreshield/koreshield" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                        {isAuthenticated ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-electric-green" />
                                    <span className="text-muted-foreground">{user?.name || user?.email}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="bg-primary hover:bg-emerald-bright text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors glow-green">
                                Sign In
                            </Link>
                        )}
                    </nav>

                    {/* Mobile Actions */}
                    <div className="flex items-center gap-2 md:hidden">
                        <SearchPalette mobile />
                        <button
                            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl p-6 flex flex-col gap-4 h-[calc(100vh-4rem)] overflow-y-auto">
                        <Link to="/why-koreshield" className="text-lg font-medium py-3 border-b border-white/5 hover:text-electric-green transition-colors" onClick={() => setMobileMenuOpen(false)}>Why KoreShield</Link>
                        <Link to="/docs" className="text-lg font-medium py-3 border-b border-white/5 hover:text-electric-green transition-colors" onClick={() => setMobileMenuOpen(false)}>Docs</Link>
                        <a href="https://blog.koreshield.com" target="_blank" rel="noreferrer" className="text-lg font-medium py-3 border-b border-white/5 hover:text-electric-green transition-colors" onClick={() => setMobileMenuOpen(false)}>Blog</a>
                        <Link to="/pricing" className="text-lg font-medium py-3 border-b border-white/5 hover:text-electric-green transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                        <Link to="/playground" className="text-lg font-medium py-3 border-b border-white/5 hover:text-electric-green transition-colors" onClick={() => setMobileMenuOpen(false)}>Playground</Link>
                        <Link to="/status" className="text-lg font-medium py-3 border-b border-white/5 hover:text-electric-green transition-colors" onClick={() => setMobileMenuOpen(false)}>Status</Link>
                        {isAuthenticated && (
                            <Link to="/dashboard" className="text-lg font-medium py-3 border-b border-white/5 hover:text-electric-green transition-colors" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                        )}
                        <a href="https://github.com/koreshield/koreshield" className="text-lg font-medium py-3 border-b border-white/5 hover:text-electric-green transition-colors flex items-center gap-2">
                            <Github className="w-5 h-5" /> GitHub
                        </a>

                        <div className="pt-4">
                            {isAuthenticated ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-lg">
                                        <User className="w-5 h-5 text-electric-green" />
                                        <div>
                                            <div className="text-sm font-medium">{user?.name}</div>
                                            <div className="text-xs text-muted-foreground">{user?.email}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center gap-2 w-full bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-4 rounded-lg text-lg font-bold transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="block w-full text-center bg-primary hover:bg-emerald-bright text-primary-foreground px-4 py-4 rounded-lg text-lg font-bold transition-colors shadow-lg shadow-electric-green/20" onClick={() => setMobileMenuOpen(false)}>
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
