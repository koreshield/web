import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../lib/auth';
import { ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const isValid = password.length >= 8 && password === confirm;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setStatus('loading');
        setErrorMsg('');

        try {
            await authService.resetPassword(token, password);
            setStatus('done');
            setTimeout(() => navigate('/login', { state: { passwordReset: true } }), 2500);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            setStatus('error');
        }
    };

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
                        "Set a strong password and get back to protecting your AI systems."
                    </blockquote>

                    <div className="space-y-4">
                        {[
                            'At least 8 characters required',
                            'All active sessions will be preserved',
                            'Your security posture stays intact',
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

                    {!token ? (
                        /* Invalid / missing token state */
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
                                <KeyRound className="w-8 h-8 text-destructive" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Invalid reset link</h1>
                            <p className="text-muted-foreground mb-8">
                                This password reset link is invalid or has expired. Please request a new one.
                            </p>
                            <Link
                                to="/forgot-password"
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
                            >
                                Request new link
                            </Link>
                        </div>
                    ) : status === 'done' ? (
                        /* Success state */
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-electric-green/10 border border-electric-green/20 flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-8 h-8 text-electric-green" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">Password updated</h1>
                            <p className="text-muted-foreground mb-6">
                                Your password has been reset successfully. Redirecting you to sign in…
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Go to sign in
                            </Link>
                        </div>
                    ) : (
                        /* Reset form */
                        <>
                            <div className="mb-8">
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">Set new password</h1>
                                <p className="text-muted-foreground">Choose a strong password for your account.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">
                                        New password
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
                                            placeholder="Min. 8 characters"
                                            required
                                            minLength={8}
                                            disabled={status === 'loading'}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {password.length > 0 && password.length < 8 && (
                                        <p className="text-xs text-destructive mt-1.5">At least 8 characters required</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="confirm" className="block text-sm font-medium mb-2 text-foreground">
                                        Confirm password
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            id="confirm"
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            className="w-full pl-10 pr-10 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
                                            placeholder="Re-enter your password"
                                            required
                                            disabled={status === 'loading'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {confirm.length > 0 && password !== confirm && (
                                        <p className="text-xs text-destructive mt-1.5">Passwords don't match</p>
                                    )}
                                </div>

                                {status === 'error' && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                        {errorMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!isValid || status === 'loading'}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {status === 'loading' ? 'Updating…' : 'Reset password'}
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
