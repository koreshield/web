import { Outlet, Link } from "react-router-dom";
import { SearchPalette } from "./SearchPalette";
import Footer from "./Footer";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Layout() {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold flex items-center gap-2">
                        <img src="/logo.png" alt="KoreShield Logo" className="w-8 h-8" />
                        <span>Kore<span className="text-electric-green">Shield</span></span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/docs" className="text-sm font-medium hover:text-electric-green transition-colors">Docs</Link>
                        <Link to="/status" className="text-sm font-medium hover:text-electric-green transition-colors">Status</Link>
                        <a href="https://blog.koreshield.com" target="_blank" rel="noreferrer" className="text-sm font-medium hover:text-electric-green transition-colors">Blog</a>
                        <SearchPalette />
                        <a href="https://github.com/koreshield/koreshield" target="_blank" rel="noreferrer" className="text-sm font-medium hover:text-electric-green transition-colors">GitHub</a>
                        <a href="https://github.com/koreshield/koreshield" className="bg-primary hover:bg-emerald-bright text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors glow-green">
                            Get Started
                        </a>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <div className="flex items-center gap-4 md:hidden">
                        <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-4">
                        <Link to="/docs" className="text-sm font-medium hover:text-electric-green" onClick={() => setMobileMenuOpen(false)}>Docs</Link>
                        <Link to="/status" className="text-sm font-medium hover:text-electric-green" onClick={() => setMobileMenuOpen(false)}>Status</Link>
                        <a href="https://github.com/koreshield/koreshield" className="text-sm font-medium hover:text-electric-green">GitHub</a>
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
