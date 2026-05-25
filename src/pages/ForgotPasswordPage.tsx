import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../lib/auth';
import { ArrowLeft, Mail } from 'lucide-react';
import { AuthFormHeader, AuthLayout, AuthStatusPanel, authInputClass } from '../components/AuthLayout';
import { SEOMeta } from '../components/SEOMeta';

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
		<AuthLayout
			eyebrow="Account recovery"
			headline="Regain access without losing your security posture."
			bullets={[
				'Reset link expires in 15 minutes',
				'Other team members keep uninterrupted access',
				'Active sessions stay preserved after reset',
			]}
		>
			<SEOMeta title="Forgot Password" noindex />
			{status === 'sent' ? (
				<AuthStatusPanel icon={Mail} tone="success" title="Check your email">
					<p className="mb-2 text-muted-foreground">We sent a password reset link to</p>
					<p className="mb-8 font-semibold text-foreground">{email}</p>
					<p className="mb-8 text-sm text-muted-foreground">
						Didn't receive it? Check your spam folder or{' '}
						<button type="button" onClick={() => setStatus('idle')} className="font-medium text-primary hover:underline">
							try again
						</button>
						.
					</p>
					<Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
						<ArrowLeft className="h-4 w-4" />
						Back to sign in
					</Link>
				</AuthStatusPanel>
			) : (
				<>
					<AuthFormHeader title="Forgot password?" description="Enter your email and we'll send you a reset link." />

					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
								Work email
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className={`${authInputClass} pl-10`}
									placeholder="you@company.com"
									required
									disabled={status === 'loading'}
									autoFocus
								/>
							</div>
						</div>

						{status === 'error' && (
							<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
								{errorMsg}
							</div>
						)}

						<button
							type="submit"
							disabled={status === 'loading'}
							className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{status === 'loading' ? 'Sending…' : 'Send reset link'}
						</button>

						<div className="text-center">
							<Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
								<ArrowLeft className="h-3.5 w-3.5" />
								Back to sign in
							</Link>
						</div>
					</form>
				</>
			)}
		</AuthLayout>
	);
}
