import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Users, LogIn } from 'lucide-react';
import { api } from '../lib/api-client';
import { useAuthState } from '../hooks/useAuthState';

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

	// 1. Load invite preview (no auth needed)
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

	// 2. Accept the invite (requires being logged in)
	const handleAccept = async () => {
		if (!isAuthenticated) {
			// Redirect to login, come back here after
			navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
			return;
		}
		setPageState('accepting');
		try {
			const result = await api.acceptTeamInvite(token) as { message: string; team_id: string; team_name?: string };
			setSuccessMsg(result.message);
			setPageState('success');
			// Navigate to the team page after a short delay
			setTimeout(() => {
				navigate(`/teams/${result.team_id}`);
			}, 2500);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to accept the invitation.';
			setErrorMsg(msg);
			setPageState('error');
		}
	};

	// ── Loading ─────────────────────────────────────────────────────────────
	if (pageState === 'loading') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4 text-muted-foreground">
					<Loader2 className="w-10 h-10 animate-spin text-primary" />
					<p>Loading your invitation…</p>
				</div>
			</div>
		);
	}

	// ── Error ───────────────────────────────────────────────────────────────
	if (pageState === 'error') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background px-4">
				<div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-lg text-center space-y-4">
					<div className="flex justify-center">
						<div className="p-4 bg-destructive/10 rounded-full">
							<XCircle className="w-10 h-10 text-destructive" />
						</div>
					</div>
					<h1 className="text-2xl font-bold">Invite not found</h1>
					<p className="text-muted-foreground">{errorMsg}</p>
					<Link
						to="/login"
						className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
					>
						<LogIn className="w-4 h-4" />
						Go to Login
					</Link>
				</div>
			</div>
		);
	}

	// ── Success ──────────────────────────────────────────────────────────────
	if (pageState === 'success') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background px-4">
				<div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-lg text-center space-y-4">
					<div className="flex justify-center">
						<div className="p-4 bg-green-500/10 rounded-full">
							<CheckCircle2 className="w-10 h-10 text-green-500" />
						</div>
					</div>
					<h1 className="text-2xl font-bold">You're in!</h1>
					<p className="text-muted-foreground">{successMsg}</p>
					<p className="text-sm text-muted-foreground">Redirecting to your team…</p>
					<Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
				</div>
			</div>
		);
	}

	// ── Preview / Accept ──────────────────────────────────────────────────────
	const userEmailMatchesInvite = isAuthenticated && user?.email?.toLowerCase() === invite?.email?.toLowerCase();
	const emailMismatch = isAuthenticated && !userEmailMatchesInvite;

	return (
		<div className="min-h-screen flex items-center justify-center bg-background px-4">
			<div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-lg space-y-6">
				{/* Header */}
				<div className="text-center space-y-3">
					<div className="flex justify-center">
						<div className="p-4 bg-primary/10 rounded-full">
							<Users className="w-10 h-10 text-primary" />
						</div>
					</div>
					<h1 className="text-2xl font-bold">Team Invitation</h1>
					<p className="text-muted-foreground">
						You've been invited to join a team on KoreShield.
					</p>
				</div>

				{/* Invite details */}
				{invite && (
					<div className="bg-muted/40 border border-border rounded-lg divide-y divide-border">
						<div className="flex justify-between items-center px-4 py-3 text-sm">
							<span className="text-muted-foreground">Team</span>
							<span className="font-semibold">{invite.team_name || 'Unknown team'}</span>
						</div>
						<div className="flex justify-between items-center px-4 py-3 text-sm">
							<span className="text-muted-foreground">Invited email</span>
							<span className="font-mono text-xs">{invite.email}</span>
						</div>
						<div className="flex justify-between items-center px-4 py-3 text-sm">
							<span className="text-muted-foreground">Your role</span>
							<span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium uppercase">
								{invite.role}
							</span>
						</div>
						{invite.expires_at && (
							<div className="flex justify-between items-center px-4 py-3 text-sm">
								<span className="text-muted-foreground">Expires</span>
								<span className="text-muted-foreground text-xs">
									{new Date(invite.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
								</span>
							</div>
						)}
					</div>
				)}

				{/* Email mismatch warning */}
				{emailMismatch && (
					<div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-700 dark:text-yellow-400">
						<strong>Account mismatch.</strong> You're logged in as <span className="font-mono">{user?.email}</span>, but this invite was sent to <span className="font-mono">{invite?.email}</span>. Please sign in with the correct account to accept.
					</div>
				)}

				{/* CTA */}
				{!isAuthenticated ? (
					<div className="space-y-3">
						<p className="text-sm text-center text-muted-foreground">
							Sign in to your KoreShield account to accept this invitation.
						</p>
						<Link
							to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
							className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
						>
							<LogIn className="w-4 h-4" />
							Sign In to Accept
						</Link>
						<Link
							to={`/signup?invite=${token}`}
							className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-muted border border-border rounded-lg font-medium hover:bg-muted/80 transition-colors text-sm"
						>
							Create an account instead
						</Link>
					</div>
				) : emailMismatch ? (
					<div className="space-y-3">
						<Link
							to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
							className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
						>
							<LogIn className="w-4 h-4" />
							Sign In with the Right Account
						</Link>
					</div>
				) : (
					<button
						onClick={() => void handleAccept()}
						disabled={pageState === 'accepting'}
						className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{pageState === 'accepting' ? (
							<><Loader2 className="w-4 h-4 animate-spin" /> Accepting…</>
						) : (
							<><CheckCircle2 className="w-4 h-4" /> Accept Invitation</>
						)}
					</button>
				)}
			</div>
		</div>
	);
}

export default InviteAcceptPage;
