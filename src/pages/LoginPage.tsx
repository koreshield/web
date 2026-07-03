import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../lib/auth';
import { Lock, Mail, Github } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { SEOMeta } from '../components/SEOMeta';

interface LocationState {
	from?: {
		pathname: string;
		search?: string;
	};
	passwordReset?: boolean;
}

// Official Google "G" mark - uses the brand colours on all backgrounds
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
		<AuthLayout
			eyebrow="Control plane"
			headline="Sign in to your AI security layer."
			bullets={[
				'Review threats and audit evidence',
				'Manage policies, keys, and teams',
				'Keep production AI traffic protected',
			]}
		>
			<SEOMeta title="Sign In" noindex />
					{locationState?.passwordReset && (
						<div className="mb-6 p-3 bg-electric-green/10 border border-electric-green/20 rounded-lg text-sm text-electric-green font-medium">
							Password updated. Sign in with your new credentials.
						</div>
					)}

					<div className="mb-8">
						<h1 className="text-3xl font-black text-foreground mb-2 tracking-[-0.045em]">
							{pendingMfa ? 'Verify privileged access' : 'Welcome back'}
						</h1>
						<p className="text-sm leading-6 text-muted-foreground">
							{pendingMfa
								? `Enter the 6-digit code we sent to ${pendingMfa.user.email}.`
								: 'Access policies, alerts, audit logs, and protected traffic.'}
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
										className="w-full pl-10 pr-4 py-3 bg-background/70 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
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
										className="w-full pl-10 pr-4 py-3 bg-background/70 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
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
									className="w-full px-4 py-3 bg-background/70 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg tracking-[0.4em] transition-colors"
									placeholder="000000"
									required
									disabled={anyLoading}
								/>
								<p className="mt-2 text-xs text-muted-foreground">
									Privileged dashboard access now requires a second factor for owners, admins, and superusers.
								</p>
							</div>
						)}

						{error && (() => {
							const isGoogleOAuth = error.toLowerCase().includes('google');
							const isGitHubOAuth = error.toLowerCase().includes('github');
							const isOAuthError = isGoogleOAuth || isGitHubOAuth;
							return (
								<div className={`p-3 rounded-lg text-sm border ${isOAuthError ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
									<p>{error}</p>
									{isGoogleOAuth && (
										<button
											type="button"
											onClick={handleGoogleLogin}
											disabled={anyLoading}
											className="mt-2 flex items-center gap-2 w-full justify-center py-2 px-3 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.12] rounded-md text-foreground text-xs font-medium transition-colors disabled:opacity-50"
										>
											<GoogleIcon />
											Continue with Google
										</button>
									)}
									{isGitHubOAuth && (
										<button
											type="button"
											onClick={handleGitHubLogin}
											disabled={anyLoading}
											className="mt-2 flex items-center gap-2 w-full justify-center py-2 px-3 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.12] rounded-md text-foreground text-xs font-medium transition-colors disabled:opacity-50"
										>
											<Github className="w-4 h-4" />
											Continue with GitHub
										</button>
									)}
									{!isOAuthError && error.includes('Privileged sign-in requires an email verification code') && (
										<p className="mt-2 text-xs text-destructive/80">
											This account is using admin MFA. The backend could not send the code email.
										</p>
									)}
								</div>
							);
						})()}

						<button
							type="submit"
							disabled={anyLoading}
							className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-primary/20"
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
										onClick={handleGoogleLogin}
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
		</AuthLayout>
	);
}
