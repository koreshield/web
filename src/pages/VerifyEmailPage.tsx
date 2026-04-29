import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') ?? '';

    const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setErrorMsg('No verification token found. Please check your email link.');
            setStatus('error');
            return;
        }

        const verify = async () => {
            try {
                const response = await fetch('/v1/management/verify-email?token=' + encodeURIComponent(token), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.detail || 'Verification failed');
                }

                setStatus('done');
                setTimeout(() => navigate('/login', { state: { emailVerified: true } }), 3000);
            } catch (err) {
                setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
                setStatus('error');
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left brand panel */}
            <div className="hidden lg:flex lg:w-[45%] bg-card border-r border-white/[0.06] flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-electric-green/[0.04] via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-electric-green/[0.03] rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex items-center gap-3">
                    <img src="/logo/dark/SVG/Black.svg" alt="KoreShield" className="w-8 h-8 dark:hidden" />
                    <img src="/logo/light/SVG/White.svg" alt="KoreShield" className="w-8 h-8 hidden dark:block" />
                    <span className="text-xl font-bold text-foreground tracking-tight">KoreShield</span>
                </div>

                <div className="relative z-10 space-y-8">
                    <blockquote className="text-2xl font-semibold text-foreground leading-snug tracking-tight">
                        "Email verification is a simple but critical step to keep your account secure."
                    </blockquote>
                    <div>
                        <p className="text-sm text-muted-foreground">— KoreShield Security Team</p>
                    </div>
                </div>

                <div className="relative z-10 space-y-4 text-sm text-muted-foreground">
                    <p>🔐 Two-factor authentication available</p>
                    <p>🛡️ Enterprise-grade security</p>
                    <p>✓ SOC 2 Type II compliant</p>
                </div>
            </div>

            {/* Right form section */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {!token ? (
                        /* Invalid / missing token state */
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-8 h-8 text-destructive" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Invalid verification link</h1>
                            <p className="text-muted-foreground mb-8">
                                This email verification link is invalid or has expired. Please check your email or request a new verification link.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    ) : status === 'done' ? (
                        /* Success state */
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-electric-green/10 border border-electric-green/20 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-electric-green" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">Email verified!</h1>
                            <p className="text-muted-foreground mb-6">
                                Your email address has been successfully verified. Redirecting you to sign in…
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Go to sign in
                            </Link>
                        </div>
                    ) : status === 'error' ? (
                        /* Error state */
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-8 h-8 text-destructive" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Verification failed</h1>
                            <p className="text-muted-foreground mb-2">{errorMsg}</p>
                            <p className="text-sm text-muted-foreground mb-8">
                                If the problem persists, please contact support or try signing up again.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
                                >
                                    Back to sign in
                                </Link>
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
                                >
                                    Sign up again
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* Loading state */
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <Mail className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">Verifying your email…</h1>
                            <p className="text-muted-foreground mb-8">
                                Please wait while we confirm your email address.
                            </p>
                            <div className="flex justify-center items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
