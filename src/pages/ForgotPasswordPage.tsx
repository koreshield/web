import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../lib/auth';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            await authService.forgotPassword(email);
            setStatus('sent');
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left brand panel  -  hidden on mobile */}
            <div className="hidden lg:flex lg:w-[45%] bg-card border-r border-white/[0.06] flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-electric-green/[0.04] via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-electric-green/[0.03] rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <img src="/logo/dark/SVG/Black.svg" alt="KoreShield" className="w-8 h-8 dark:hidden" />
                    <img src="/logo/light/SVG/White.svg" alt="KoreShield" className="w-8 h-8 hidden dark:block" />
                    <span className="text-xl font-bold text-foreground tracking-tight">KoreShield</span>
                </div>

                <div className="relative z-10 space-y-8">
                    <blockquote className="text-2xl font-semibold text-foreground leading-snug tracking-tight">
                        "Regain access in seconds. Your security posture stays intact."
                    </blockquote>

                    <div className="space-y-4">
                        {[
                            'Reset link expires in 15 minutes',
                            'Account access is never interrupted for others',
                            'All active sessions are preserved',
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
                        <img src="/logo/dark/SVG/Black.svg" alt="KoreShield" className="w-7 h-7 dark:hidden" />
                        <img src="/logo/light/SVG/White.svg" alt="KoreShield" className="w-7 h-7 hidden dark:block" />
                        <span className="font-bold text-foreground">KoreShield</span>
                    </div>

                    {status === 'sent' ? (
                        /* Success state */
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-electric-green/10 border border-electric-green/20 flex items-center justify-center mx-auto mb-6">
                                <Mail className="w-8 h-8 text-electric-green" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">Check your email</h1>
                            <p className="text-muted-foreground mb-2">
                                We sent a password reset link to
                            </p>
                            <p className="font-semibold text-foreground mb-8">{email}</p>
                            <p className="text-sm text-muted-foreground mb-8">
                                Didn't receive it? Check your spam folder or{' '}
                                <button
                                    type="button"
                                    onClick={() => setStatus('idle')}
                                    className="text-primary hover:underline font-medium"
                                >
                                    try again
                                </button>
                                .
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to sign in
                            </Link>
                        </div>
                    ) : (
                        /* Request form */
                        <>
                            <div className="mb-8">
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">Forgot password?</h1>
                                <p className="text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
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
                                            disabled={status === 'loading'}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                        {errorMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {status === 'loading' ? 'Sending…' : 'Send reset link'}
                                </button>

                                <div className="text-center">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Back to sign in
                                    </Link>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
