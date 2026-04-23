import {
	AlertTriangle,
	Building,
	CheckCircle2,
	Mail,
	Pencil,
	Shield,
	Trash2,
	User,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../components/ToastNotification';
import { useAuthState } from '../hooks/useAuthState';
import { api } from '../lib/api-client';
import { authService } from '../lib/auth';

const inputClass =
	'w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm transition-colors placeholder:text-muted-foreground/50';

type Tab = 'profile' | 'danger';

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

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<p className="text-muted-foreground">Please log in to view settings.</p>
			</div>
		);
	}

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'profile', label: 'Profile' },
		{ id: 'danger', label: 'Danger zone' },
	];

	return (
		<div>
			{/* Page header */}
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Shield className="w-6 h-6 text-primary" />
						</div>
						<div>
							<h1 className="text-2xl font-bold">Settings</h1>
							<p className="text-sm text-muted-foreground">
								Manage your account, profile, and preferences.
							</p>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Tabs */}
				<div className="flex gap-1 border-b border-border mb-8">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => { setActiveTab(tab.id); setEditing(false); }}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
								activeTab === tab.id
									? 'border-primary text-primary'
									: 'border-transparent text-muted-foreground hover:text-foreground'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* ── Profile tab ─────────────────────────────────────────────── */}
				{activeTab === 'profile' && (
					<div className="space-y-6">
						{/* Account info (read-only) */}
						<div className="bg-card border border-border rounded-lg shadow-sm">
							<div className="p-5 border-b border-border">
								<h2 className="text-base font-semibold">Account information</h2>
								<p className="text-sm text-muted-foreground mt-0.5">Read-only details tied to your account.</p>
							</div>
							<div className="p-5 grid gap-4 sm:grid-cols-2">
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
							</div>
						</div>

						{/* Profile details (editable) */}
						<div className="bg-card border border-border rounded-lg shadow-sm">
							<div className="p-5 border-b border-border flex items-center justify-between">
								<div>
									<h2 className="text-base font-semibold">Profile details</h2>
									<p className="text-sm text-muted-foreground mt-0.5">Your display name and professional info.</p>
								</div>
								{!editing ? (
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
								)}
							</div>
							<div className="p-5 space-y-4">
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
										<button
											type="button"
											onClick={() => void handleSave()}
											disabled={saving}
											className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-60 text-sm"
										>
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
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* ── Danger zone tab ─────────────────────────────────────────── */}
				{activeTab === 'danger' && (
					<div className="bg-card border border-destructive/30 rounded-lg shadow-sm p-5 sm:p-6">
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
							<button
								type="button"
								onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }}
								className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
							>
								<Trash2 className="w-4 h-4" />
								Delete my account
							</button>
						</div>
					</div>
				)}
			</div>

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
		</div>
	);
}
