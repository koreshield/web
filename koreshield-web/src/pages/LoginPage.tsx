import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../lib/auth';
import { Lock, Mail, ShieldCheck, Github } from 'lucide-react';

interface LocationState {
	from?: {
		pathname: string;
		search?: string;
	};
	passwordReset?: boolean;
}

// Official Google "G" mark — uses the brand colours on all backgrounds
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

export function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [mfaCode, setMfaCode] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null);
	const [resendingCode, setResendingCode] = useState(false);
	const [pendingMfa, setPendingMfa] = useState(() => authService.getPendingMfaChallenge());
	const navigate = useNavigate();
	const location = useLocation();
	const locationState = location.state as LocationState | null;

	useEffect(() => {
		if (authService.isAuthenticated()) {
			const fromLocation = locationState?.from;
			const from = fromLocation ? `${fromLocation.pathname}${fromLocation.search || ''}` : '/dashboard';
			navigate(from, { replace: true });
		}
	}, [locationState, navigate]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const result = await authService.login(email, password);
			if (result.status === 'mfa_required') {
				setPendingMfa(result.challenge);
				setMfaCode('');
				return;
			}
			const fromLocation = locationState?.from;
			const from = fromLocation ? `${fromLocation.pathname}${fromLocation.search || ''}` : '/dashboard';
			navigate(from, { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Invalid email or password');
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyMfa = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			await authService.verifyMfaCode(mfaCode);
			setPendingMfa(null);
			const fromLocation = locationState?.from;
			const from = fromLocation ? `${fromLocation.pathname}${fromLocation.search || ''}` : '/dashboard';
			navigate(from, { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Verification failed');
		} finally {
			setLoading(false);
		}
	};

	const handleGitHubLogin = async () => {
		if (oauthLoading) return;
		setError('');
		setOauthLoading('github');
		try {
			const { auth_url } = await authService.initializeGitHubOAuth();
			window.location.href = auth_url;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to initialize GitHub login');
			setOauthLoading(null);
		}
	};

	const handleGoogleLogin = async () => {
		if (oauthLoading) return;
		setError('');
		setOauthLoading('google');
		try {
			const { auth_url } = await authService.initializeGoogleOAuth();
			window.location.href = auth_url;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to initialize Google login');
			setOauthLoading(null);
		}
	};

	const handleResendMfa = async () => {
		setError('');
		setResendingCode(true);
		try {
			await authService.resendMfaCode();
			setPendingMfa(authService.getPendingMfaChallenge());
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to resend verification code');
		} finally {
			setResendingCode(false);
		}
	};

	const clearPendingMfa = () => {
		authService.clearPendingMfaChallenge();
		setPendingMfa(null);
		setMfaCode('');
		setError('');
	};

	const anyLoading = loading || oauthLoading !== null;

	return (
		<div className="min-h-screen bg-background flex">
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
						"The security layer your LLM provider doesn't include."
					</blockquote>

					<div className="space-y-4">
						{[
							'95% detection accuracy across 50+ attack patterns',
							'Sub-30ms interception, zero perceptible latency',
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

			<div className="flex-1 flex items-center justify-center p-6 sm:p-12">
				<div className="w-full max-w-md">
					<div className="flex items-center gap-2 mb-8 lg:hidden">
							<img src="/logo/dark/SVG/Black.svg" alt="KoreShield" className="w-7 h-7 dark:hidden" />
							<img src="/logo/light/SVG/White.svg" alt="KoreShield" className="w-7 h-7 hidden dark:block" />
						<span className="font-bold text-foreground">KoreShield</span>
					</div>

					{locationState?.passwordReset && (
						<div className="mb-6 p-3 bg-electric-green/10 border border-electric-green/20 rounded-lg text-sm text-electric-green font-medium">
							Password updated. Sign in with your new credentials.
						</div>
					)}

					<div className="mb-8">
						<h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
							{pendingMfa ? 'Verify privileged access' : 'Welcome back'}
						</h1>
						<p className="text-muted-foreground">
							{pendingMfa
								? `Enter the 6-digit code we sent to ${pendingMfa.user.email}.`
								: 'Your security dashboard is one step away.'}
						</p>
					</div>

					<form onSubmit={pendingMfa ? handleVerifyMfa : handleLogin} className="space-y-5">
						{!pendingMfa && (
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
										disabled={anyLoading}
									/>
								</div>
							</div>
						)}

						{!pendingMfa && (
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
										disabled={anyLoading}
									/>
								</div>
							</div>
						)}

						{pendingMfa && (
							<div>
								<label htmlFor="mfa-code" className="block text-sm font-medium mb-2 text-foreground">
									Verification code
								</label>
								<input
									id="mfa-code"
									type="text"
									inputMode="numeric"
									autoComplete="one-time-code"
									value={mfaCode}
									onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
									className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg tracking-[0.4em] transition-colors"
									placeholder="000000"
									required
									disabled={anyLoading}
								/>
								<p className="mt-2 text-xs text-muted-foreground">
									Privileged dashboard access now requires a second factor for owners, admins, and superusers.
								</p>
							</div>
						)}

						{error && (
							<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
								{error}
								{error.includes('Privileged sign-in requires an email verification code') ? (
									<p className="mt-2 text-xs text-destructive/80">
										This account is using admin MFA. The backend could not send the code email.
									</p>
								) : null}
							</div>
						)}

						<button
							type="submit"
							disabled={anyLoading}
							className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
						>
							{loading ? (pendingMfa ? 'Verifying…' : 'Signing in…') : (pendingMfa ? 'Verify and continue' : 'Sign in')}
						</button>

						{pendingMfa && (
							<div className="flex items-center justify-between gap-3 text-sm">
								<button
									type="button"
									onClick={handleResendMfa}
									disabled={anyLoading || resendingCode}
									className="text-primary hover:underline disabled:opacity-50"
								>
									{resendingCode ? 'Resending…' : 'Resend code'}
								</button>
								<button
									type="button"
									onClick={clearPendingMfa}
									disabled={anyLoading}
									className="text-muted-foreground hover:text-foreground"
								>
									Use another account
								</button>
							</div>
						)}

						{!pendingMfa && (
							<>
								<div className="relative my-6">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t border-border" />
									</div>
									<div className="relative flex justify-center text-sm">
										<span className="px-2 bg-gradient-to-b from-background to-background text-muted-foreground">
											or continue with
										</span>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<button
										type="button"
										onClick={handleGitHubLogin}
										disabled={anyLoading}
										className="flex items-center justify-center gap-2 px-4 py-3 bg-background hover:bg-muted border border-border rounded-lg font-medium text-foreground transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
										onClick={handleGoogleLogin}
										disabled={anyLoading}
										className="flex items-center justify-center gap-2 px-4 py-3 bg-background hover:bg-muted border border-border rounded-lg font-medium text-foreground transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
							</>
						)}
					</form>
				</div>
			</div>
		</div>
	);
}
