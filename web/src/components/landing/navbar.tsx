import { useEffect, useState } from "react";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { SiGithub } from "react-icons/si";
import { GitHubButton } from "./github-button";

export const Navbar = () => {
  const { data: session } = authClient.useSession();
  const { data: organizations } = authClient.useListOrganizations();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-deep-navy/80 backdrop-blur-xl border-b border-white/5 py-4 supports-[backdrop-filter]:bg-deep-navy/60"
        : "bg-transparent py-6"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute -inset-1 bg-electric-blue/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img
              src="/logo-padlock.png"
              alt="KoreShield Logo"
              className={`${scrolled ? "w-8" : "w-10"} transition-all relative z-10`}
            />
          </div>
          <span className="font-bold text-lg tracking-tight text-white/90 group-hover:text-white transition-colors">
            KoreShield
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <Link to="/docs/$" className="hover:text-electric-blue transition-colors">
            Documentation
          </Link>
          <Link to="/pricing" className="hover:text-electric-blue transition-colors">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <GitHubButton size="sm" />
          </div>
          {session ? (
            <Link
              to={organizations?.length ? "/$orgSlug" : "/select"}
              params={{
                orgSlug:
                  organizations && organizations.length
                    ? organizations[0].slug
                    : "",
              }}
              className="hidden md:flex px-5 py-2 bg-electric-blue text-white rounded-lg font-medium hover:bg-electric-blue/90 transition-all shadow-lg shadow-electric-blue/20 items-center gap-2 text-sm"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex px-5 py-2 bg-white/5 text-white border border-white/10 rounded-lg font-medium hover:bg-white/10 transition-all backdrop-blur-sm items-center gap-2 text-sm group"
            >
              <LogIn size={16} className="text-white/60 group-hover:text-white transition-colors" />
              Login
            </Link>
          )}

          {/* Mobile hamburger button */}
          {!mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu - full height with animation */}
      <div
        className={`md:hidden fixed inset-0 bg-[#000000] z-[60] transition-all duration-300 ease-in-out ${mobileMenuOpen
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-full pointer-events-none"
          }`}
      >
        {/* Mobile menu header with logo and close button */}
        <div className="flex items-center justify-between px-6 py-6">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2"
          >
            <img src="/logo-padlock.png" alt="KoreShield Logo" className="w-10" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-80px)] px-6 pb-8">
          <div className="flex flex-col gap-2 flex-1">
            <Link
              to="/docs/$"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/80 hover:text-white transition-colors py-4 text-2xl font-medium border-b border-white/10"
            >
              Documentation
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/80 hover:text-white transition-colors py-4 text-2xl font-medium border-b border-white/10"
            >
              Pricing
            </Link>
            <a
              href="https://github.com/koreshield/koreshield"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-white/80 hover:text-white transition-colors py-4 text-2xl font-medium border-b border-white/10"
            >
              <SiGithub size={24} />
              GitHub
            </a>
          </div>

          {/* Dashboard/Login button at bottom */}
          <div className="mt-auto pt-6">
            {session ? (
              <Link
                to={organizations?.length ? "/$orgSlug" : "/select"}
                params={{
                  orgSlug:
                    organizations && organizations.length
                      ? organizations[0].slug
                      : "",
                }}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full px-6 py-4 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <LayoutDashboard size={20} />
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full px-6 py-4 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <LogIn size={20} />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
