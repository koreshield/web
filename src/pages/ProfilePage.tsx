import { AlertTriangle, BookOpen, Building, CheckCircle2, CreditCard, Key, Mail, Pencil, Rocket, Shield, Trash2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import {
	AppPage,
	AppPageHeader,
	AppPageSection,
	AppPrimaryButton,
	AppSecondaryButton,
	AppStatCard,
	AppStatGrid,
} from '../components/AppPageLayout';
import { useToast } from '../components/ToastNotification';
import { useAuthState } from '../hooks/useAuthState';
import { api } from '../lib/api-client';
import { authService } from '../lib/auth';

type BillingAccountSummary = {
	plan_slug?: string;
	plan_name?: string | null;
	status?: string;
	subscription_status?: string | null;
	billing_email?: string | null;
};

const inputClass =
	'w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm transition-colors placeholder:text-muted-foreground/50';

export function ProfilePage() {
	const { user } = useAuthState();
	const toast = useToast();
	const [billing, setBilling] = useState<BillingAccountSummary | null>(null);
	const [billingState, setBillingState] = useState<'loading' | 'ready' | 'error'>('loading');

	// Edit state
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState('');
	const [editCompany, setEditCompany] = useState('');
	const [editJobTitle, setEditJobTitle] = useState('');
	const [saving, setSaving] = useState(false);

	// Delete account state
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteConfirmText, setDeleteConfirmText] = useState('');
	const [deleting, setDeleting] = useState(false);

	// Email verification state
	const [resendingEmail, setResendingEmail] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);

	const handleResendVerificationEmail = async () => {
		try {
			setResendingEmail(true);
			await api.resendVerificationEmail();
			setResendSuccess(true);
				toast.success('Verification email sent successfully');
				setTimeout(() => setResendSuccess(false), 3000);
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to resend verification email';
				toast.error(message);
		} finally {
			setResendingEmail(false);
		}
	};

	useEffect(() => {
		if (!user) return;
		let active = true;
		void api.getBillingAccount()
			.then((account) => {
				if (!active) return;
				setBilling(account as BillingAccountSummary);
				setBillingState('ready');
			})
			.catch(() => {
				if (!active) return;
				setBillingState('error');
			});
		return () => { active = false; };
	}, [user]);

	const handleStartEdit = () => {
		setEditName(user?.name || '');
		setEditCompany(user?.company || '');
		setEditJobTitle(user?.job_title || '');
		setEditing(true);
	};

	const handleCancelEdit = () => {
		setEditing(false);
		setEditName('');
		setEditCompany('');
		setEditJobTitle('');
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
			// Update the local auth session so the name is reflected everywhere immediately
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

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<p className="text-muted-foreground">Please log in to view your profile.</p>
			</div>
		);
	}

	return (
		<AppPage maxWidth="6xl">
			<SEOMeta title="Profile" noindex />
			<div className="mx-auto max-w-3xl">
			<AppPageHeader
				eyebrow="Account"
				eyebrowIcon={User}
				title="User profile"
				description="Manage your account settings, billing state, and onboarding progress."
				icon={User}
			/>

			<AppPageSection
				title="Personal information"
				description="Your display name and account details."
				actions={
					!editing ? (
						<button
							type="button"
							onClick={handleStartEdit}
							className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
						>
							<Pencil className="w-3.5 h-3.5" />
							Edit
						</button>
					) : (
						<button
							type="button"
							onClick={handleCancelEdit}
							className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							<X className="w-3.5 h-3.5" />
							Cancel
						</button>
					)
				}
			>
						<div className="grid gap-4 md:grid-cols-2">
							{/* Name — editable */}
							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<User className="w-4 h-4" /> Full Name
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
									<div className="p-3 bg-muted rounded-md text-foreground font-medium">
										{user.name || <span className="text-muted-foreground italic">Not set</span>}
									</div>
								)}
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Building className="w-4 h-4" /> Company
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
									<div className="p-3 bg-muted rounded-md text-foreground font-medium">
										{user.company || <span className="text-muted-foreground italic">Not set</span>}
									</div>
								)}
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<BookOpen className="w-4 h-4" /> Job Title
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
									<div className="p-3 bg-muted rounded-md text-foreground font-medium">
										{user.job_title || <span className="text-muted-foreground italic">Not set</span>}
									</div>
								)}
							</div>

							{/* Email — read-only */}
							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Mail className="w-4 h-4" /> Email Address
								</label>
								<div className="p-3 bg-muted rounded-md text-foreground font-medium">
									{user.email}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<AlertTriangle className="w-4 h-4" /> Email Verification
								</label>
								<div className="p-3 bg-muted rounded-md">
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2">
											{user.email_verified ? (
												<>
													<CheckCircle2 className="w-4 h-4 text-green-500" />
													<span className="text-sm font-medium text-green-600">Verified</span>
												</>
											) : (
												<>
													<AlertTriangle className="w-4 h-4 text-amber-500" />
													<span className="text-sm font-medium text-amber-600">Unverified</span>
												</>
											)}
										</div>
										{!user.email_verified && (
											<button
												onClick={() => void handleResendVerificationEmail()}
												disabled={resendingEmail || resendSuccess}
												className="text-xs px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{resendSuccess ? '✓ Sent' : resendingEmail ? 'Sending...' : 'Resend'}
											</button>
										)}
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Shield className="w-4 h-4" /> Role
								</label>
								<div className="p-3 bg-muted rounded-md text-foreground font-medium capitalize">
									{user.role}
								</div>
							</div>

							{/* Status — read-only */}
							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Building className="w-4 h-4" /> Account Status
								</label>
								<div className="flex items-center gap-2 p-3 bg-muted rounded-md text-foreground font-medium capitalize">
									<span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
									{user.status || 'unknown'}
								</div>
							</div>
						</div>

				{editing && (
					<div className="flex justify-end pt-2">
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

			<AppPageSection title="Billing" description="Manage your subscription, invoices, and customer portal access.">
				<AppStatGrid columns={2} className="mb-4">
					<AppStatCard
						label="Plan"
						value={
							billingState === 'ready'
								? billing?.plan_name || billing?.plan_slug || 'Dev'
								: billingState === 'loading'
									? 'Loading…'
									: 'Unavailable'
						}
						icon={CreditCard}
					/>
					<AppStatCard
						label="Subscription status"
						value={
							billingState === 'ready'
								? <span className="capitalize">{billing?.subscription_status || billing?.status || 'inactive'}</span>
								: billingState === 'loading'
									? 'Loading…'
									: 'Unavailable'
						}
					/>
				</AppStatGrid>
				<Link
					to="/billing"
					className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Open billing
				</Link>
			</AppPageSection>

			<AppPageSection title="Getting started" description="Finish connecting Koreshield to your application.">
				<div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
					<Link to="/getting-started" className="dashboard-card rounded-2xl p-4 transition-colors hover:border-primary/40">
						<Rocket className="w-5 h-5 text-primary mb-3" />
						<div className="font-medium">Integration guide</div>
						<p className="text-sm text-muted-foreground mt-2">See the exact steps clients take to connect their app to Koreshield.</p>
					</Link>
					<Link to="/settings/api-keys" className="dashboard-card rounded-2xl p-4 transition-colors hover:border-primary/40">
						<Key className="w-5 h-5 text-primary mb-3" />
						<div className="font-medium">Server API keys</div>
						<p className="text-sm text-muted-foreground mt-2">Create the credentials your backend or gateway will use.</p>
					</Link>
					<Link to="/docs/getting-started/quick-start" className="dashboard-card rounded-2xl p-4 transition-colors hover:border-primary/40">
						<BookOpen className="w-5 h-5 text-primary mb-3" />
						<div className="font-medium">Public docs</div>
						<p className="text-sm text-muted-foreground mt-2">Open the published docs if you want the broader setup guide.</p>
					</Link>
				</div>
			</AppPageSection>

			<AppPageSection className="border-destructive/30">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
							<AlertTriangle className="w-5 h-5" /> Danger zone
						</h2>
						<p className="text-sm text-muted-foreground mt-1">
							Permanently delete your account and all associated data. This cannot be undone.
						</p>
					</div>
					<AppSecondaryButton
						type="button"
						onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }}
						className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
					>
						<Trash2 className="w-4 h-4" />
						Delete account
					</AppSecondaryButton>
				</div>
			</AppPageSection>

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
						<p className="text-sm font-medium mb-3">
							Type your email address to confirm:
						</p>
						<p className="text-xs font-mono bg-muted px-2 py-1 rounded mb-3 text-muted-foreground">{user.email}</p>
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
			</div>
		</AppPage>
	);
}
