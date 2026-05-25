import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Users, LogIn } from 'lucide-react';
import { api } from '../lib/api-client';
import { useAuthState } from '../hooks/useAuthState';
import { AuthFormHeader, AuthLayout, AuthStatusPanel } from '../components/AuthLayout';
import { SEOMeta } from '../components/SEOMeta';

interface InvitePreview {
	invite_id: string;
	team_id: string;
	team_name: string | null;
	email: string;
	role: string;
	expires_at: string | null;
	status: string;
}

type PageState = 'loading' | 'preview' | 'accepting' | 'success' | 'error';

export function InviteAcceptPage() {
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token') ?? '';
	const navigate = useNavigate();
	const { isAuthenticated, user } = useAuthState();

	const [pageState, setPageState] = useState<PageState>('loading');
	const [invite, setInvite] = useState<InvitePreview | null>(null);
	const [errorMsg, setErrorMsg] = useState('');
	const [successMsg, setSuccessMsg] = useState('');

	useEffect(() => {
		if (!token) {
			setErrorMsg('No invite token found in the link. Please check the link and try again.');
			setPageState('error');
			return;
		}

		api.previewTeamInvite(token)
			.then((data: unknown) => {
				setInvite(data as InvitePreview);
				setPageState('preview');
			})
			.catch((err: unknown) => {
				const msg = err instanceof Error ? err.message : 'This invite is invalid or has expired.';
				setErrorMsg(msg);
				setPageState('error');
			});
	}, [token]);

	const handleAccept = async () => {
		if (!isAuthenticated) {
			navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
			return;
		}
		setPageState('accepting');
		try {
			const result = await api.acceptTeamInvite(token) as { message: string; team_id: string; team_name?: string };
			setSuccessMsg(result.message);
			setPageState('success');
			setTimeout(() => {
				navigate(`/teams/${result.team_id}`);
			}, 2500);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to accept the invitation.';
			setErrorMsg(msg);
			setPageState('error');
		}
	};

	const userEmailMatchesInvite = isAuthenticated && user?.email?.toLowerCase() === invite?.email?.toLowerCase();
	const emailMismatch = isAuthenticated && !userEmailMatchesInvite;

	if (pageState === 'loading') {
		return (
			<AuthLayout
				eyebrow="Team collaboration"
				headline="Join your team on Koreshield and start protecting AI systems together."
				bullets={[
					'Shared policies and alert rules',
					'Role-based access controls',
					'Unified audit trail',
				]}
			>
				<SEOMeta title="Accept Invite" noindex />
				<AuthStatusPanel icon={Loader2} tone="loading" title="Loading your invitation…">
					<p className="text-muted-foreground">Please wait while we fetch invite details.</p>
				</AuthStatusPanel>
			</AuthLayout>
		);
	}

	if (pageState === 'error') {
		return (
			<AuthLayout
				eyebrow="Team collaboration"
				headline="Join your team on Koreshield and start protecting AI systems together."
				bullets={[
					'Shared policies and alert rules',
					'Role-based access controls',
					'Unified audit trail',
				]}
			>
				<SEOMeta title="Accept Invite" noindex />
				<AuthStatusPanel icon={XCircle} tone="error" title="Invite not found">
					<p className="mb-8 text-muted-foreground">{errorMsg}</p>
					<Link
						to="/login"
						className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<LogIn className="h-4 w-4" />
						Go to sign in
					</Link>
				</AuthStatusPanel>
			</AuthLayout>
		);
	}

	if (pageState === 'success') {
		return (
			<AuthLayout
				eyebrow="Team collaboration"
				headline="Join your team on Koreshield and start protecting AI systems together."
				bullets={[
					'Shared policies and alert rules',
					'Role-based access controls',
					'Unified audit trail',
				]}
			>
				<SEOMeta title="Accept Invite" noindex />
				<AuthStatusPanel icon={CheckCircle2} tone="success" title="You're in!">
					<p className="mb-2 text-muted-foreground">{successMsg}</p>
					<p className="mb-6 text-sm text-muted-foreground">Redirecting to your team…</p>
					<Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
				</AuthStatusPanel>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout
			eyebrow="Team collaboration"
			headline="Join your team on Koreshield and start protecting AI systems together."
			bullets={[
				'Shared policies and alert rules',
				'Role-based access controls',
				'Unified audit trail',
			]}
		>
			<SEOMeta title="Accept Invite" noindex />
			<AuthFormHeader
				title="Team invitation"
				description="You've been invited to join a team on Koreshield."
			/>

			<div className="mb-6 flex justify-center">
				<div className="rounded-full border border-primary/20 bg-primary/10 p-4">
					<Users className="h-10 w-10 text-primary" />
				</div>
			</div>

			{invite && (
				<div className="mb-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-muted/30">
					<div className="flex items-center justify-between px-4 py-3 text-sm">
						<span className="text-muted-foreground">Team</span>
						<span className="font-semibold">{invite.team_name || 'Unknown team'}</span>
					</div>
					<div className="flex items-center justify-between px-4 py-3 text-sm">
						<span className="text-muted-foreground">Invited email</span>
						<span className="font-mono text-xs">{invite.email}</span>
					</div>
					<div className="flex items-center justify-between px-4 py-3 text-sm">
						<span className="text-muted-foreground">Your role</span>
						<span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase text-primary">
							{invite.role}
						</span>
					</div>
					{invite.expires_at && (
						<div className="flex items-center justify-between px-4 py-3 text-sm">
							<span className="text-muted-foreground">Expires</span>
							<span className="text-xs text-muted-foreground">
								{new Date(invite.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
							</span>
						</div>
					)}
				</div>
			)}

			{emailMismatch && (
				<div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-400">
					<strong>Account mismatch.</strong> You're logged in as <span className="font-mono">{user?.email}</span>, but this invite was sent to <span className="font-mono">{invite?.email}</span>. Please sign in with the correct account to accept.
				</div>
			)}

			{!isAuthenticated ? (
				<div className="space-y-3">
					<p className="text-center text-sm text-muted-foreground">
						Sign in to your Koreshield account to accept this invitation.
					</p>
					<Link
						to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
						className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<LogIn className="h-4 w-4" />
						Sign in to accept
					</Link>
					<Link
						to={`/signup?invite=${token}`}
						className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
					>
						Create an account instead
					</Link>
				</div>
			) : emailMismatch ? (
				<Link
					to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<LogIn className="h-4 w-4" />
					Sign in with the right account
				</Link>
			) : (
				<button
					onClick={() => void handleAccept()}
					disabled={pageState === 'accepting'}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{pageState === 'accepting' ? (
						<><Loader2 className="h-4 w-4 animate-spin" /> Accepting…</>
					) : (
						<><CheckCircle2 className="h-4 w-4" /> Accept invitation</>
					)}
				</button>
			)}
		</AuthLayout>
	);
}

export default InviteAcceptPage;
