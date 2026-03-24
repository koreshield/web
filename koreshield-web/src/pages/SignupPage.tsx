import { useState } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export function SignupPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/v1/management/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Signup failed');
            }

            sessionStorage.setItem('admin_user', JSON.stringify(data.user));

            const fromLocation = (location.state as any)?.from;
            if (fromLocation) {
                navigate(`${fromLocation.pathname}${fromLocation.search || ''}`, { replace: true });
                return;
            }

            const plan = searchParams.get('plan');
            const period = searchParams.get('period');
            if (plan && period) {
                navigate(`/billing?plan=${encodeURIComponent(plan)}&period=${encodeURIComponent(period)}&checkout=1`, { replace: true });
                return;
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left brand panel — hidden on mobile */}
            <div className="hidden lg:flex lg:w-[45%] bg-card border-r border-white/[0.06] flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-electric-green/[0.04] via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-electric-green/[0.03] rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <img src="/logo/SVG/Black.svg" alt="KoreShield" className="w-8 h-8 dark:hidden" />
                    <img src="/logo/SVG/White.svg" alt="KoreShield" className="w-8 h-8 hidden dark:block" />
                    <span className="text-xl font-bold text-foreground tracking-tight">KoreShield</span>
                </div>

                <div className="relative z-10 space-y-8">
                    <div>
                        <p className="text-xs font-semibold text-electric-green uppercase tracking-widest mb-3">What you get on day one</p>
                        <p className="text-2xl font-semibold text-foreground leading-snug tracking-tight">
                            Full LLM security — from your first API call.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            'Prompt injection & jailbreak detection',
                            'PII and sensitive data redaction',
                            'Real-time monitoring dashboard',
                            'Audit logs for every request',
                            'Multi-provider support out of the box',
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

                    <div className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
                            Start protecting your AI stack
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Takes 5 minutes to set up. No credit card required.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">
                                Full name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
                                    placeholder="Jane Smith"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">
                                Work email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
                                    placeholder="you@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">At least 8 characters.</p>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? (
                                'Creating account…'
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">Already have an account? </span>
                            <Link
                                to={{ pathname: '/login', search: location.search }}
                                state={location.state}
                                className="text-primary hover:underline font-medium"
                            >
                                Sign in
                            </Link>
                        </div>
                    </form>

                    <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
                        By creating an account you agree to our{' '}
                        <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
