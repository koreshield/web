import { authService } from '../lib/auth';
import { ArrowRight, Github, Lock, Mail, User } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { resolveApiBaseUrl } from '../lib/api-base';

interface LocationState {
    from?: {
        pathname: string;
        search?: string;
    };
}

// Official Google "G" mark
function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

export function SignupPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null);
    const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

    useEffect(() => {
        if (authService.isAuthenticated()) {
            const fromLocation = locationState?.from;
            const from = fromLocation ? `${fromLocation.pathname}${fromLocation.search || ''}` : '/dashboard';
            navigate(from, { replace: true });
        }
    }, [locationState, navigate]);

    const anyLoading = loading || oauthLoading !== null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${apiBaseUrl}/v1/management/signup`, {
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

            authService.setSession(data.user, data.token ?? null);

            const fromLocation = locationState?.from;
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

    const handleGitHubSignup = async () => {
        if (oauthLoading) return;
        setError('');
        setOauthLoading('github');
        try {
            const { auth_url } = await authService.initializeGitHubOAuth();
            window.location.href = auth_url;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize GitHub sign-up');
            setOauthLoading(null);
        }
    };

    const handleGoogleSignup = async () => {
        if (oauthLoading) return;
        setError('');
        setOauthLoading('google');
        try {
            const { auth_url } = await authService.initializeGoogleOAuth();
            window.location.href = auth_url;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize Google sign-up');
            setOauthLoading(null);
        }
    };

    return (
        <AuthLayout
            eyebrow="Get started"
            headline="Protect your first AI request today."
            bullets={[
                'Generate an API key',
                'Route traffic through Koreshield',
                'Review threats and audit evidence',
            ]}
        >
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-foreground mb-2 tracking-[-0.045em]">
                            Create your workspace
                        </h1>
                        <p className="text-muted-foreground text-sm leading-6">
                            Start free. Add a key, route traffic, and see Koreshield work.
                        </p>
                    </div>

                    {/* OAuth buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            type="button"
                            onClick={handleGitHubSignup}
                            disabled={anyLoading}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-background/70 hover:bg-muted border border-border rounded-xl font-medium text-foreground transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {oauthLoading === 'github' ? (
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                                </svg>
                            ) : (
                                <Github className="w-4 h-4 shrink-0" />
                            )}
                            GitHub
                        </button>

                        <button
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={anyLoading}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-background/70 hover:bg-muted border border-border rounded-xl font-medium text-foreground transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {oauthLoading === 'google' ? (
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                                </svg>
                            ) : (
                                <GoogleIcon />
                            )}
                            Google
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gradient-to-b from-background to-background text-muted-foreground">
                                or sign up with email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="signup-name" className="block text-sm font-medium mb-2 text-foreground">
                                Full name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="signup-name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={anyLoading}
                                    className="w-full pl-10 pr-4 py-3 bg-background/70 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
                                    placeholder="Jane Smith"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="signup-email" className="block text-sm font-medium mb-2 text-foreground">
                                Work email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="signup-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={anyLoading}
                                    className="w-full pl-10 pr-4 py-3 bg-background/70 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
                                    placeholder="you@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="signup-password" className="block text-sm font-medium mb-2 text-foreground">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="signup-password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    disabled={anyLoading}
                                    className="w-full pl-10 pr-4 py-3 bg-background/70 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
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
                            disabled={anyLoading}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                'Creating account...'
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
        </AuthLayout>
    );
}
