import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../lib/auth';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { AuthLayout, AuthStatusPanel } from '../components/AuthLayout';

export function GitHubCallbackPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const handleCallback = async () => {
			const code = searchParams.get('code');
			const state = searchParams.get('state');

			if (!code || !state) {
				setError('Missing authorization code or state parameter.');
				setLoading(false);
				return;
			}

			try {
				const result = await authService.handleGitHubCallback(code, state);
				navigate(result.status === 'mfa_required' ? '/login' : '/dashboard', { replace: true });
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Authentication failed');
				setLoading(false);
			}
		};

		void handleCallback();
	}, [searchParams, navigate]);

	return (
		<AuthLayout
			eyebrow="Secure sign-in"
			headline="Connecting your GitHub account to Koreshield."
			bullets={[
				'OAuth 2.0 with PKCE protection',
				'No password stored on our servers',
				'Developer-friendly access',
			]}
		>
			{loading ? (
				<AuthStatusPanel icon={ShieldCheck} tone="loading" title="Completing sign-in…">
					<p className="text-muted-foreground">Please wait while we authenticate your account.</p>
				</AuthStatusPanel>
			) : (
				<AuthStatusPanel icon={AlertCircle} tone="error" title="Authentication error">
					<p className="mb-8 text-muted-foreground">{error}</p>
					<Link
						to="/login"
						className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Return to sign in
					</Link>
				</AuthStatusPanel>
			)}
		</AuthLayout>
	);
}
