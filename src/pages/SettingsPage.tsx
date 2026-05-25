import {
	AlertTriangle,
	ArrowRight,
	Building,
	CheckCircle2,
	CreditCard,
	Globe,
	Lock,
	Mail,
	Pencil,
	Rocket,
	Settings as SettingsIcon,
	Shield,
	Trash2,
	User,
	Users,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
	AppCallout,
	AppPage,
	AppPageHeader,
	AppPageSection,
	AppPrimaryButton,
	AppSecondaryButton,
	AppStatCard,
	AppStatGrid,
	AppSurface,
} from '../components/AppPageLayout';
import { SEOMeta } from '../components/SEOMeta';
import { useToast } from '../components/ToastNotification';
import { useAuthState } from '../hooks/useAuthState';
import { api } from '../lib/api-client';
import { authService } from '../lib/auth';

const inputClass =
	'w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm transition-colors placeholder:text-muted-foreground/50';

type Tab = 'profile' | 'security' | 'danger';

export function SettingsPage() {
	const { user } = useAuthState();
	const toast = useToast();
	const [activeTab, setActiveTab] = useState<Tab>('profile');

	// Profile edit state
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState('');
	const [editCompany, setEditCompany] = useState('');
	const [editJobTitle, setEditJobTitle] = useState('');
	const [saving, setSaving] = useState(false);

	// Delete account state
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteConfirmText, setDeleteConfirmText] = useState('');
	const [deleting, setDeleting] = useState(false);
	const [sendingResetEmail, setSendingResetEmail] = useState(false);

	const isPrivilegedAccount = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'superuser';

	const handleStartEdit = () => {
		setEditName(user?.name || '');
		setEditCompany(user?.company || '');
		setEditJobTitle(user?.job_title || '');
		setEditing(true);
	};

	const handleCancelEdit = () => {
		setEditing(false);
	};

	const handleSave = async () => {
		if (!editName.trim()) {
			toast.error('Name required', 'Display name cannot be empty.');
			return;
		}
		setSaving(true);
		try {
			const result = await api.updateMe({
				name: editName.trim(),
				company: editCompany.trim(),
				job_title: editJobTitle.trim(),
			}) as { user?: Record<string, unknown> };
			if (result?.user && user) {
				authService.setSession({
					...user,
					name: editName.trim(),
					company: editCompany.trim() || null,
					job_title: editJobTitle.trim() || null,
				});
			}
			toast.success('Profile updated', 'Your profile details have been saved.');
			setEditing(false);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Please try again.';
			toast.error('Failed to save', msg);
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (deleteConfirmText !== user?.email) return;
		setDeleting(true);
		try {
			await api.deleteMyAccount();
			await authService.logout();
			window.location.href = '/';
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Please try again or contact support.';
			toast.error('Failed to delete account', msg);
			setDeleting(false);
		}
	};

	const handleSendPasswordReset = async () => {
		if (!user?.email) return;
		setSendingResetEmail(true);
		try {
			await authService.forgotPassword(user.email);
			toast.success('Reset email sent', 'A password reset link has been sent to your account email.');
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Please try again.';
			toast.error('Failed to send reset email', msg);
		} finally {
			setSendingResetEmail(false);
		}
	};

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<p className="text-muted-foreground">Please log in to view settings.</p>
			</div>
		);
	}

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'profile', label: 'Profile' },
		{ id: 'security', label: 'Security' },
		{ id: 'danger', label: 'Danger zone' },
	];

	const initials = user.name
		? user.name
			.split(' ')
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
		: user.email.slice(0, 2).toUpperCase();

	return (
		<AppPage maxWidth="6xl">
			<SEOMeta title="Settings" noindex />
			<AppPageHeader
				eyebrow="Workspace"
				eyebrowIcon={SettingsIcon}
				title="Settings"
				description="Manage your account, profile, and preferences."
				icon={SettingsIcon}
				tabs={tabs}
				activeTab={activeTab}
				onTabChange={(id) => { setActiveTab(id as Tab); setEditing(false); }}
			/>

			{/* ── Profile tab ─────────────────────────────────────────────── */}
			{activeTab === 'profile' && (
				<div className="space-y-6">
					<AppPageSection
						eyebrow="Workspace profile"
						title={user.name || 'Koreshield account'}
						description="Manage the identity, plan, and account controls that shape how your workspace uses Koreshield in development and production."
						variant="panel"
					>
						<div className="mb-6 flex items-start gap-4">
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-lg font-semibold text-primary shadow-[0_0_30px_rgba(16,185,129,0.12)]">
								{initials}
							</div>
						</div>
						<AppStatGrid columns={4}>
							<AppStatCard label="Account status" value={<span className="capitalize">{user.status || 'unknown'}</span>} tone={user.status === 'active' ? 'text-emerald-500' : 'text-amber-500'} />
							<AppStatCard label="Verification" value={user.email_verified ? 'Verified' : 'Unverified'} tone={user.email_verified ? 'text-emerald-500' : 'text-amber-500'} />
							<AppStatCard label="Role" value={<span className="capitalize">{user.role}</span>} icon={Shield} />
							<AppStatCard label="Company" value={user.company || 'Not set'} icon={Building} />
						</AppStatGrid>
						<div className="grid gap-3 md:grid-cols-3">
								<Link
									to="/settings/api-keys"
									className="rounded-xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
								>
									<div className="flex items-center justify-between gap-3">
										<Shield className="h-5 w-5 text-primary" />
										<ArrowRight className="h-4 w-4 text-muted-foreground" />
									</div>
									<p className="mt-4 text-sm font-semibold text-foreground">Manage API keys</p>
									<p className="mt-1 text-sm leading-6 text-muted-foreground">Create or rotate keys used by your servers and integrations.</p>
								</Link>
								<Link
									to="/billing"
									className="rounded-xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
								>
									<div className="flex items-center justify-between gap-3">
										<CreditCard className="h-5 w-5 text-primary" />
										<ArrowRight className="h-4 w-4 text-muted-foreground" />
									</div>
									<p className="mt-4 text-sm font-semibold text-foreground">Review plan and usage</p>
									<p className="mt-1 text-sm leading-6 text-muted-foreground">Check your billing tier, protected-request usage, and workspace limits.</p>
								</Link>
								<a
									href="https://koreshield.ai"
									target="_blank"
									rel="noreferrer noopener"
									className="rounded-xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
								>
									<div className="flex items-center justify-between gap-3">
										<Globe className="h-5 w-5 text-primary" />
										<ArrowRight className="h-4 w-4 text-muted-foreground" />
									</div>
									<p className="mt-4 text-sm font-semibold text-foreground">Visit website</p>
									<p className="mt-1 text-sm leading-6 text-muted-foreground">Jump back to the main Koreshield site, docs, and public product pages.</p>
								</a>
						</div>
					</AppPageSection>

					<AppPageSection title="Account information" description="Read-only details tied to your account.">
						<div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-1.5">
									<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
										<Mail className="w-3.5 h-3.5" /> Email
									</label>
									<div className="p-3 bg-muted rounded-md text-sm font-medium">{user.email}</div>
									<p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
										<Shield className="w-3.5 h-3.5" /> Role
									</label>
									<div className="p-3 bg-muted rounded-md text-sm font-medium capitalize">{user.role}</div>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
										<User className="w-3.5 h-3.5" /> Account status
									</label>
									<div className="flex items-center gap-2 p-3 bg-muted rounded-md text-sm font-medium capitalize">
										<span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
										{user.status || 'unknown'}
									</div>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
										<CheckCircle2 className="w-3.5 h-3.5" /> Email verification
									</label>
									<div className="flex items-center gap-2 p-3 bg-muted rounded-md text-sm font-medium">
										<span className={`w-2 h-2 rounded-full ${user.email_verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
										{user.email_verified ? 'Verified' : 'Unverified'}
									</div>
							</div>
						</div>
					</AppPageSection>

					<AppPageSection
						title="Profile details"
						description="Your display name and professional info."
						actions={
							!editing ? (
								<button
									type="button"
									onClick={handleStartEdit}
									className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
								>
									<Pencil className="w-3.5 h-3.5" /> Edit
								</button>
							) : (
								<button
									type="button"
									onClick={handleCancelEdit}
									className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
								>
									<X className="w-3.5 h-3.5" /> Cancel
								</button>
							)
						}
					>
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-1.5">
										<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
											<User className="w-3.5 h-3.5" /> Full name
										</label>
										{editing ? (
											<input
												type="text"
												value={editName}
												onChange={(e) => setEditName(e.target.value)}
												className={inputClass}
												placeholder="Your full name"
												autoFocus
											/>
										) : (
											<div className="p-3 bg-muted rounded-md text-sm font-medium">
												{user.name || <span className="text-muted-foreground italic">Not set</span>}
											</div>
										)}
									</div>

									<div className="space-y-1.5">
										<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
											<Building className="w-3.5 h-3.5" /> Company
										</label>
										{editing ? (
											<input
												type="text"
												value={editCompany}
												onChange={(e) => setEditCompany(e.target.value)}
												className={inputClass}
												placeholder="Your company"
											/>
										) : (
											<div className="p-3 bg-muted rounded-md text-sm font-medium">
												{user.company || <span className="text-muted-foreground italic">Not set</span>}
											</div>
										)}
									</div>

									<div className="space-y-1.5">
										<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
											<Building className="w-3.5 h-3.5" /> Job title
										</label>
										{editing ? (
											<input
												type="text"
												value={editJobTitle}
												onChange={(e) => setEditJobTitle(e.target.value)}
												className={inputClass}
												placeholder="Your role"
											/>
										) : (
											<div className="p-3 bg-muted rounded-md text-sm font-medium">
												{user.job_title || <span className="text-muted-foreground italic">Not set</span>}
											</div>
										)}
									</div>
								</div>

								{editing && (
									<div className="flex justify-end pt-1">
										<AppPrimaryButton type="button" onClick={() => void handleSave()} disabled={saving}>
											{saving ? (
												<>
													<span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
													Saving…
												</>
											) : (
												<>
													<CheckCircle2 className="w-3.5 h-3.5" />
													Save changes
												</>
											)}
										</AppPrimaryButton>
									</div>
								)}
					</AppPageSection>

					<div className="grid gap-4 md:grid-cols-2">
						<AppSurface>
								<div className="flex items-start justify-between gap-3">
									<div>
										<h3 className="text-sm font-semibold text-foreground">Koreshield access</h3>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											Manage the credentials and team controls that govern how your workspace connects to Koreshield.
										</p>
									</div>
									<Shield className="mt-0.5 h-5 w-5 text-primary" />
								</div>
								<div className="mt-4 space-y-2">
									<Link
										to="/settings/api-keys"
										className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
									>
										<span className="inline-flex items-center gap-2">
											<Shield className="h-4 w-4 text-primary" />
											Server API keys
										</span>
										<ArrowRight className="h-4 w-4 text-muted-foreground" />
									</Link>
									<Link
										to="/teams"
										className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
									>
										<span className="inline-flex items-center gap-2">
											<Users className="h-4 w-4 text-primary" />
											Team access
										</span>
										<ArrowRight className="h-4 w-4 text-muted-foreground" />
									</Link>
								</div>
						</AppSurface>

						<AppSurface>
								<div className="flex items-start justify-between gap-3">
									<div>
										<h3 className="text-sm font-semibold text-foreground">Plan and onboarding</h3>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											Keep billing, rollout steps, and documentation close by while you finish setting up your production path.
										</p>
									</div>
									<Rocket className="mt-0.5 h-5 w-5 text-primary" />
								</div>
								<div className="mt-4 space-y-2">
									<Link
										to="/billing"
										className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
									>
										<span className="inline-flex items-center gap-2">
											<SettingsIcon className="h-4 w-4 text-primary" />
											Billing and plan
										</span>
										<ArrowRight className="h-4 w-4 text-muted-foreground" />
									</Link>
									<Link
										to="/docs/getting-started/quick-start"
										className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
									>
										<span className="inline-flex items-center gap-2">
											<Rocket className="h-4 w-4 text-primary" />
											Quick-start docs
										</span>
										<ArrowRight className="h-4 w-4 text-muted-foreground" />
									</Link>
								</div>
						</AppSurface>
					</div>
				</div>
			)}

			{/* ── Security tab ───────────────────────────────────────────── */}
			{activeTab === 'security' && (
				<div className="space-y-6">
					<AppPageSection
						eyebrow="Security controls"
						title="Protect your workspace access"
						description="Use verification, password recovery, and privileged-access protections to keep your Koreshield account ready for secure rollout work."
						variant="panel"
					>
						<span className="sr-only">Security overview</span>
					</AppPageSection>

					<AppPageSection title="Email verification" description="Keep your account verified so you can create keys, receive critical account mail, and avoid friction in account recovery.">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-start gap-3">
									<div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${user.email_verified ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
										{user.email_verified ? (
											<CheckCircle2 className="h-5 w-5 text-emerald-500" />
										) : (
											<AlertTriangle className="h-5 w-5 text-amber-500" />
										)}
									</div>
									<div>
										<p className="text-sm font-medium text-foreground">
											{user.email_verified ? 'Email verified' : 'Email not verified'}
										</p>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											{user.email_verified
												? 'Your account email is verified and ready for protected account actions.'
												: 'Verify this email to unlock the smoothest account flow and reduce support friction later.'}
										</p>
									</div>
							</div>
							{!user.email_verified && (
								<AppPrimaryButton
									type="button"
									onClick={() => void api.resendVerificationEmail().then(() => {
										toast.success('Verification email sent', 'A fresh verification email is on the way.');
									}).catch((err: unknown) => {
										const msg = err instanceof Error ? err.message : 'Please try again.';
										toast.error('Failed to resend verification email', msg);
									})}
								>
									Resend verification
								</AppPrimaryButton>
							)}
						</div>
					</AppPageSection>

					<div className="grid gap-4 md:grid-cols-2">
						<AppSurface>
								<div className="flex items-start justify-between gap-3">
									<div>
										<h3 className="text-sm font-semibold text-foreground">Password and recovery</h3>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											Send yourself a reset link if you want to rotate your password without waiting for an access problem.
										</p>
									</div>
									<Lock className="mt-0.5 h-5 w-5 text-primary" />
								</div>
								<AppCallout variant="info" className="mb-3">
									Password changes are currently handled through secure email reset links rather than an in-session password form.
								</AppCallout>
								<AppCallout variant="info" className="mb-0">
									Use this before you forget a password, rotate credentials after access changes, or hand off an account to a new approved owner.
								</AppCallout>
								<AppSecondaryButton
									type="button"
									onClick={() => void handleSendPasswordReset()}
									disabled={sendingResetEmail}
									className="mt-4 border-primary/30 text-primary hover:bg-primary/5"
								>
									<Mail className="h-4 w-4" />
									{sendingResetEmail ? 'Sending reset link…' : 'Send password reset link'}
								</AppSecondaryButton>
						</AppSurface>

						<AppSurface>
								<div className="flex items-start justify-between gap-3">
									<div>
										<h3 className="text-sm font-semibold text-foreground">Privileged verification</h3>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											Koreshield currently enforces an extra email verification step for privileged sign-ins, rather than a self-serve MFA enrollment flow for every user.
										</p>
									</div>
									<Shield className="mt-0.5 h-5 w-5 text-primary" />
								</div>
								<div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
									<p className="text-sm font-medium text-foreground">
										{isPrivilegedAccount ? 'Extra verification required for your role' : 'No privileged-access challenge on your current role'}
									</p>
									<p className="mt-1 text-sm leading-6 text-muted-foreground">
										{isPrivilegedAccount
											? 'Admin, owner, and superuser sign-ins require a one-time email verification code before privileged access is granted.'
											: 'If your role is elevated later, privileged sign-in protection will apply automatically.'}
									</p>
								</div>
								<AppCallout variant="info" className="mb-0">
									There is not yet a general self-serve MFA enrollment screen for every account, so this page reflects the real protections currently available instead of pretending otherwise.
								</AppCallout>
								<Link
									to="/contact?subject=Security%20controls%20question"
									className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
								>
									Ask about stronger account controls
									<ArrowRight className="h-4 w-4" />
								</Link>
						</AppSurface>
					</div>
				</div>
			)}

			{/* ── Danger zone tab ─────────────────────────────────────────── */}
			{activeTab === 'danger' && (
				<AppPageSection className="border-destructive/30">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h2 className="text-base font-semibold text-destructive flex items-center gap-2">
									<AlertTriangle className="w-5 h-5" /> Delete account
								</h2>
								<p className="text-sm text-muted-foreground mt-2 max-w-md">
									Permanently deletes your account, all API keys, billing records, team memberships, and every piece of data associated with your account. This action is irreversible.
								</p>
							</div>
						</div>
						<div className="mt-5 pt-5 border-t border-destructive/20">
							<AppSecondaryButton
								type="button"
								onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }}
								className="border-destructive/50 text-destructive hover:bg-destructive/10"
							>
								<Trash2 className="w-4 h-4" />
								Delete my account
							</AppSecondaryButton>
						</div>
				</AppPageSection>
			)}

			{/* Delete account modal */}
			{showDeleteModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-2 bg-destructive/10 rounded-lg">
								<AlertTriangle className="w-5 h-5 text-destructive" />
							</div>
							<h3 className="text-lg font-semibold">Delete account</h3>
						</div>
						<p className="text-sm text-muted-foreground mb-2">
							This will permanently delete your account, API keys, billing records, and all associated data. There is no way to recover this.
						</p>
						<p className="text-sm font-medium mb-3">Type your email address to confirm:</p>
						<p className="text-xs font-mono bg-muted px-2 py-1 rounded mb-3 text-muted-foreground">
							{user.email}
						</p>
						<input
							type="text"
							value={deleteConfirmText}
							onChange={(e) => setDeleteConfirmText(e.target.value)}
							className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-destructive text-sm mb-4"
							placeholder={user.email}
							autoComplete="off"
						/>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setShowDeleteModal(false)}
								disabled={deleting}
								className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void handleDeleteAccount()}
								disabled={deleteConfirmText !== user.email || deleting}
								className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium disabled:opacity-50"
							>
								{deleting ? (
									<span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
								) : (
									<Trash2 className="w-4 h-4" />
								)}
								{deleting ? 'Deleting…' : 'Delete permanently'}
							</button>
						</div>
					</div>
				</div>
			)}
		</AppPage>
	);
}
