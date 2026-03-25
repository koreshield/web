import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../lib/auth';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (authService.isAuthenticated()) {
            const fromLocation = (location.state as any)?.from;
            const from = fromLocation ? `${fromLocation.pathname}${fromLocation.search || ''}` : '/dashboard';
            navigate(from, { replace: true });
        }
    }, [navigate, location]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.login(email, password);
            const fromLocation = (location.state as any)?.from;
            const from = fromLocation ? `${fromLocation.pathname}${fromLocation.search || ''}` : '/dashboard';
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left brand panel — hidden on mobile */}
            <div className="hidden lg:flex lg:w-[45%] bg-card border-r border-white/[0.06] flex-col justify-between p-12 relative overflow-hidden">
                {/* Subtle ambient gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-electric-green/[0.04] via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-electric-green/[0.03] rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <img src="/logo/SVG/Black.svg" alt="KoreShield" className="w-8 h-8 dark:hidden" />
                    <img src="/logo/SVG/White.svg" alt="KoreShield" className="w-8 h-8 hidden dark:block" />
                    <span className="text-xl font-bold text-foreground tracking-tight">KoreShield</span>
                </div>

                {/* Testimonial / value prop */}
                <div className="relative z-10 space-y-8">
                    <blockquote className="text-2xl font-semibold text-foreground leading-snug tracking-tight">
                        "The security layer your LLM provider doesn't include."
                    </blockquote>

                    <div className="space-y-4">
                        {[
                            '95% detection accuracy across 50+ attack patterns',
                            'Sub-30ms interception — zero perceptible latency',
                            'Zero prompt data stored or retained',
                        ].map((item) => (
                            <div key={item} className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-electric-green mt-0.5 shrink-0" />
                                <span className="text-sm text-muted-foreground">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 text-xs text-muted-foreground/60">
                    © {new Date().getFullYear()} KoreShield. All rights reserved.
                </p>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <img src="/logo/SVG/Black.svg" alt="KoreShield" className="w-7 h-7 dark:hidden" />
                        <img src="/logo/SVG/White.svg" alt="KoreShield" className="w-7 h-7 hidden dark:block" />
                        <span className="font-bold text-foreground">KoreShield</span>
                    </div>

                    {(location.state as any)?.passwordReset && (
                        <div className="mb-6 p-3 bg-electric-green/10 border border-electric-green/20 rounded-lg text-sm text-electric-green font-medium">
                            Password updated — sign in with your new credentials.
                        </div>
                    )}

                    <div className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">Welcome back</h1>
                        <p className="text-muted-foreground">Your security dashboard is one step away.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                                Work email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
                                    placeholder="you@company.com"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">Don't have an account? </span>
                            <Link
                                to={{ pathname: '/signup', search: location.search }}
                                state={location.state}
                                className="text-primary hover:underline font-medium"
                            >
                                Get started
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
