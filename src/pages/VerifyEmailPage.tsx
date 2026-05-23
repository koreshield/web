import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { resolveApiBaseUrl } from '../lib/api-base';
import { authService } from '../lib/auth';
import { AuthLayout, AuthStatusPanel } from '../components/AuthLayout';

export function VerifyEmailPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get('token') ?? '';
	const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

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
				const response = await fetch(`${apiBaseUrl}/v1/management/verify-email?token=${encodeURIComponent(token)}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				});

				if (!response.ok) {
					let errData: { detail?: string; message?: string } | null = null;
					try {
						const text = await response.text();
						if (text.trim()) errData = JSON.parse(text);
					} catch { /* ignore parse errors */ }
					throw new Error(
						errData?.detail ||
						errData?.message ||
						'Verification failed. The link may have expired — please request a new one from your account settings.'
					);
				}

				sessionStorage.setItem('ks_email_verified_notice', '1');
				await authService.restoreSession(true).catch(() => false);
				setStatus('done');
				const destination = authService.isAuthenticated() ? '/dashboard?emailVerified=1' : '/login?emailVerified=1';
				setTimeout(() => navigate(destination), 2000);
			} catch (err) {
				setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
				setStatus('error');
			}
		};

		verify();
	}, [token, navigate, apiBaseUrl]);

	return (
		<AuthLayout
			eyebrow="Account security"
			headline="Email verification keeps your Koreshield account protected."
			bullets={[
				'Confirms you own the address on file',
				'Unlocks full dashboard access',
				'Takes just a few seconds',
			]}
		>
			{!token ? (
				<AuthStatusPanel icon={AlertCircle} tone="error" title="Invalid verification link">
					<p className="mb-8 text-muted-foreground">
						This email verification link is invalid or has expired. Please check your email or request a new verification link.
					</p>
					<Link
						to="/login"
						className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Back to sign in
					</Link>
				</AuthStatusPanel>
			) : status === 'done' ? (
				<AuthStatusPanel icon={CheckCircle} tone="success" title="Email verified!">
					<p className="mb-6 text-muted-foreground">
						Your email address has been successfully verified. Redirecting you…
					</p>
					<Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
						<ArrowLeft className="h-3.5 w-3.5" />
						Go to sign in
					</Link>
				</AuthStatusPanel>
			) : status === 'error' ? (
				<AuthStatusPanel icon={AlertCircle} tone="error" title="Verification failed">
					<p className="mb-2 text-muted-foreground">{errorMsg}</p>
					<p className="mb-8 text-sm text-muted-foreground">
						If the problem persists, please contact support or try signing up again.
					</p>
					<div className="flex flex-wrap justify-center gap-3">
						<Link
							to="/login"
							className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
						>
							Back to sign in
						</Link>
						<Link
							to="/signup"
							className="inline-flex items-center justify-center rounded-xl border border-border bg-background/70 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
						>
							Sign up again
						</Link>
					</div>
				</AuthStatusPanel>
			) : (
				<AuthStatusPanel icon={Mail} tone="loading" title="Verifying your email…">
					<p className="mb-8 text-muted-foreground">Please wait while we confirm your email address.</p>
					<div className="flex items-center justify-center gap-2">
						<div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
						<div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
						<div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
					</div>
				</AuthStatusPanel>
			)}
		</AuthLayout>
	);
}
