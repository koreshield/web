import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../lib/auth';
import { ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { AuthFormHeader, AuthLayout, AuthStatusPanel, authInputClass } from '../components/AuthLayout';

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
		<AuthLayout
			eyebrow="Account recovery"
			headline="Set a strong password and get back to protecting your AI systems."
			bullets={[
				'At least 8 characters required',
				'Active sessions stay preserved',
				'Your security posture stays intact',
			]}
		>
			{!token ? (
				<AuthStatusPanel icon={KeyRound} tone="error" title="Invalid reset link">
					<p className="mb-8 text-muted-foreground">
						This password reset link is invalid or has expired. Please request a new one.
					</p>
					<Link
						to="/forgot-password"
						className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Request new link
					</Link>
				</AuthStatusPanel>
			) : status === 'done' ? (
				<AuthStatusPanel icon={ShieldCheck} tone="success" title="Password updated">
					<p className="mb-6 text-muted-foreground">
						Your password has been reset successfully. Redirecting you to sign in…
					</p>
					<Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
						<ArrowLeft className="h-3.5 w-3.5" />
						Go to sign in
					</Link>
				</AuthStatusPanel>
			) : (
				<>
					<AuthFormHeader title="Set new password" description="Choose a strong password for your account." />

					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
								New password
							</label>
							<div className="relative">
								<KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<input
									id="password"
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className={`${authInputClass} pl-10 pr-10`}
									placeholder="Min. 8 characters"
									required
									minLength={8}
									disabled={status === 'loading'}
									autoFocus
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
							{password.length > 0 && password.length < 8 && (
								<p className="mt-1.5 text-xs text-destructive">At least 8 characters required</p>
							)}
						</div>

						<div>
							<label htmlFor="confirm" className="mb-2 block text-sm font-medium text-foreground">
								Confirm password
							</label>
							<div className="relative">
								<KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<input
									id="confirm"
									type={showConfirm ? 'text' : 'password'}
									value={confirm}
									onChange={(e) => setConfirm(e.target.value)}
									className={`${authInputClass} pl-10 pr-10`}
									placeholder="Re-enter your password"
									required
									disabled={status === 'loading'}
								/>
								<button
									type="button"
									onClick={() => setShowConfirm((v) => !v)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
									aria-label={showConfirm ? 'Hide password' : 'Show password'}
								>
									{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
							{confirm.length > 0 && password !== confirm && (
								<p className="mt-1.5 text-xs text-destructive">Passwords don't match</p>
							)}
						</div>

						{status === 'error' && (
							<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
								{errorMsg}
							</div>
						)}

						<button
							type="submit"
							disabled={!isValid || status === 'loading'}
							className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{status === 'loading' ? 'Updating…' : 'Reset password'}
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
