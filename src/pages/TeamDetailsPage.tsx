import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	Users,
	UserPlus,
	ArrowLeft,
	Trash2,
	LayoutDashboard,
	Mail,
	XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
	AppEmptyState,
	AppPage,
	AppPageError,
	AppPageHeader,
	AppPageLoading,
	AppPageSection,
	AppPrimaryButton,
	AppSecondaryButton,
	AppSurface,
} from '../components/AppPageLayout';
import { api } from '../lib/api-client';
import { useAuthState } from '../hooks/useAuthState';
import { useToast } from '../components/ToastNotification';

interface TeamMember {
	id: string;
	user_id: string;
	team_id: string;
	role: 'owner' | 'admin' | 'member' | 'viewer';
	user_email: string;
	user_name: string;
	joined_at: string;
}

interface Team {
	id: string;
	name: string;
	slug: string;
	created_at: string;
	my_role: string;
	owner_id: string;
}

interface TeamInvite {
	id: string;
	team_id: string;
	email: string;
	role: 'admin' | 'member' | 'viewer';
	status: 'pending' | 'accepted' | 'cancelled';
	created_at: string;
	expires_at?: string | null;
}

interface SharedDashboard {
	id: string;
	team_id: string;
	name: string;
	dashboard_type: 'security' | 'analytics' | 'compliance';
	config: Record<string, unknown>;
	created_at: string;
}

const DASHBOARD_TYPE_LABELS: Record<SharedDashboard['dashboard_type'], string> = {
	security: 'Security',
	analytics: 'Analytics',
	compliance: 'Compliance',
};

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
}

export function TeamDetailsPage() {
	const { teamId } = useParams<{ teamId: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { success, error } = useToast();
	const { user: currentUser } = useAuthState();
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [showDashboardModal, setShowDashboardModal] = useState(false);
	const [isDeletingTeam, setIsDeletingTeam] = useState(false);
	const [renameValue, setRenameValue] = useState('');
	const [inviteData, setInviteData] = useState({ email: '', role: 'member' });
	const [dashboardData, setDashboardData] = useState({
		name: '',
		dashboard_type: 'security',
		config: '{\n  "widgets": []\n}',
	});

	const { data: team, isLoading: isTeamLoading, error: teamError } = useQuery<Team>({
		queryKey: ['team', teamId],
		queryFn: () => api.getTeam(teamId!) as Promise<Team>,
		enabled: !!teamId,
	});

	const { data: members = [], isLoading: isMembersLoading } = useQuery<TeamMember[]>({
		queryKey: ['team-members', teamId],
		queryFn: () => api.getTeamMembers(teamId!) as Promise<TeamMember[]>,
		enabled: !!teamId,
	});

	const { data: invites = [], isLoading: isInvitesLoading } = useQuery<TeamInvite[]>({
		queryKey: ['team-invites', teamId],
		queryFn: () => api.getTeamInvites(teamId!, 'pending') as Promise<TeamInvite[]>,
		enabled: !!teamId,
	});

	const { data: dashboards = [], isLoading: isDashboardsLoading } = useQuery<SharedDashboard[]>({
		queryKey: ['team-dashboards', teamId],
		queryFn: () => api.getSharedDashboards(teamId!) as Promise<SharedDashboard[]>,
		enabled: !!teamId,
	});

	const invalidateTeamQueries = () => {
		void queryClient.invalidateQueries({ queryKey: ['team', teamId] });
		void queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
		void queryClient.invalidateQueries({ queryKey: ['team-invites', teamId] });
		void queryClient.invalidateQueries({ queryKey: ['team-dashboards', teamId] });
		void queryClient.invalidateQueries({ queryKey: ['teams'] });
	};

	const updateTeamMutation = useMutation({
		mutationFn: (data: { name: string }) => api.updateTeam(teamId!, data),
		onSuccess: () => {
			invalidateTeamQueries();
			success('Team details updated');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to update team'));
		},
	});

	const inviteMemberMutation = useMutation({
		mutationFn: (data: { email: string; role: string }) => api.createTeamInvite(teamId!, data),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['team-invites', teamId] });
			setShowInviteModal(false);
			setInviteData({ email: '', role: 'member' });
			success('Invite created successfully');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to create invite'));
		},
	});

	const removeMemberMutation = useMutation({
		mutationFn: (userId: string) => api.removeMember(teamId!, userId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
			success('Member removed successfully');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to remove member'));
		},
	});

	const updateRoleMutation = useMutation({
		mutationFn: ({ userId, role }: { userId: string; role: string }) =>
			api.updateMemberRole(teamId!, userId, role),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
			success('Role updated successfully');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to update role'));
		},
	});

	const cancelInviteMutation = useMutation({
		mutationFn: (inviteId: string) => api.cancelInvite(teamId!, inviteId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['team-invites', teamId] });
			success('Invite cancelled successfully');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to cancel invite'));
		},
	});

	const createDashboardMutation = useMutation({
		mutationFn: async () => {
			let parsedConfig: Record<string, unknown> = {};
			if (dashboardData.config.trim()) {
				try {
					parsedConfig = JSON.parse(dashboardData.config) as Record<string, unknown>;
				} catch {
					throw new Error('Dashboard config must be valid JSON');
				}
			}
			return api.createSharedDashboard(teamId!, {
				name: dashboardData.name.trim(),
				dashboard_type: dashboardData.dashboard_type,
				config: parsedConfig,
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['team-dashboards', teamId] });
			setShowDashboardModal(false);
			setDashboardData({
				name: '',
				dashboard_type: 'security',
				config: '{\n  "widgets": []\n}',
			});
			success('Shared dashboard created');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to create shared dashboard'));
		},
	});

	const deleteDashboardMutation = useMutation({
		mutationFn: (dashboardId: string) => api.deleteSharedDashboard(teamId!, dashboardId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['team-dashboards', teamId] });
			success('Shared dashboard deleted');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to delete shared dashboard'));
		},
	});

	const deleteTeamMutation = useMutation({
		mutationFn: () => api.deleteTeam(teamId!),
		onSuccess: () => {
			success('Team deleted successfully');
			navigate('/teams');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to delete team'));
			setIsDeletingTeam(false);
		},
	});

	const pendingInvites = useMemo(
		() => invites.filter((invite) => invite.status === 'pending'),
		[invites],
	);

	if (isTeamLoading || isMembersLoading || isInvitesLoading || isDashboardsLoading) {
		return (
			<AppPage>
				<AppPageLoading label="Loading team…" />
			</AppPage>
		);
	}

	if (teamError || !team) {
		return (
			<AppPage>
				<AppPageError
					title="Team not found"
					message="This team may have been deleted or you may not have access."
					onRetry={() => navigate('/teams')}
				/>
			</AppPage>
		);
	}

	const canManageTeam = ['owner', 'admin'].includes(team.my_role);
	const isOwner = team.my_role === 'owner';
	const currentUserId = currentUser?.id;

	return (
		<AppPage>
			<Link to="/teams" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
				<ArrowLeft className="w-4 h-4" />
				Back to Teams
			</Link>

			<AppPageHeader
				eyebrow="Team workspace"
				eyebrowIcon={Users}
				title={team.name}
				description={`Created on ${format(new Date(team.created_at), 'MMM d, yyyy')} • /${team.slug}`}
				icon={Users}
				stats={[
					{ label: 'Members', value: members.length },
					{ label: 'Invites', value: pendingInvites.length, tone: 'text-amber-400' },
				]}
				actions={
					<>
						{canManageTeam && (
							<>
								<AppPrimaryButton onClick={() => setShowInviteModal(true)}>
									<UserPlus className="w-4 h-4" />
									Invite member
								</AppPrimaryButton>
								<AppSecondaryButton onClick={() => setShowDashboardModal(true)}>
									<LayoutDashboard className="w-4 h-4" />
									Share dashboard
								</AppSecondaryButton>
							</>
						)}
						{isOwner && (
							<AppSecondaryButton
								onClick={() => {
									if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
										setIsDeletingTeam(true);
										deleteTeamMutation.mutate();
									}
								}}
								disabled={isDeletingTeam}
								className="border-destructive/50 text-destructive hover:bg-destructive/10"
							>
								<Trash2 className="w-4 h-4" />
								{isDeletingTeam ? 'Deleting...' : 'Delete team'}
							</AppSecondaryButton>
						)}
					</>
				}
			/>

			{canManageTeam && (
				<AppPageSection eyebrow="Settings" title="Team settings" description="The team slug stays fixed once the team is created." variant="card">
					<div className="flex flex-col gap-3 sm:flex-row">
						<input
							type="text"
							value={renameValue || team.name}
							onChange={(event) => setRenameValue(event.target.value)}
							className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Team name"
						/>
						<AppPrimaryButton
							onClick={() => updateTeamMutation.mutate({ name: (renameValue || team.name).trim() })}
							disabled={updateTeamMutation.isPending || !(renameValue || team.name).trim()}
						>
							{updateTeamMutation.isPending ? 'Saving...' : 'Save name'}
						</AppPrimaryButton>
					</div>
				</AppPageSection>
			)}

			<AppPageSection title={`Members (${members.length})`} description="People with access to this team workspace.">
				<AppSurface className="overflow-hidden p-0">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="bg-muted/50 border-b border-border text-left">
										<th className="px-6 py-4 font-medium text-sm text-muted-foreground">User</th>
										<th className="px-6 py-4 font-medium text-sm text-muted-foreground">Role</th>
										<th className="px-6 py-4 font-medium text-sm text-muted-foreground">Joined</th>
										{canManageTeam && <th className="px-6 py-4 font-medium text-sm text-muted-foreground text-right">Actions</th>}
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{members.map((member) => (
										<tr key={member.id} className="hover:bg-muted/30 transition-colors">
											<td className="px-6 py-4">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
														{member.user_name?.[0]?.toUpperCase() || member.user_email[0].toUpperCase()}
													</div>
													<div>
														<div className="font-medium text-foreground">
															{member.user_name || 'Unknown'}
															{member.user_id === currentUserId && <span className="text-muted-foreground ml-2">(You)</span>}
														</div>
														<div className="text-sm text-muted-foreground">{member.user_email}</div>
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												{canManageTeam && member.role !== 'owner' ? (
													<select
														value={member.role}
														onChange={(event) => updateRoleMutation.mutate({ userId: member.user_id, role: event.target.value })}
														className="bg-muted border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
														disabled={updateRoleMutation.isPending}
													>
														<option value="admin">Admin</option>
														<option value="member">Member</option>
														<option value="viewer">Viewer</option>
													</select>
												) : (
													<span className={`px-2 py-1 rounded text-xs font-medium ${member.role === 'owner'
														? 'bg-purple-500/10 text-purple-400'
														: member.role === 'admin'
															? 'bg-blue-500/10 text-blue-400'
															: 'bg-muted text-muted-foreground'
														}`}>
														{member.role.toUpperCase()}
													</span>
												)}
											</td>
											<td className="px-6 py-4 text-sm text-muted-foreground">
												{format(new Date(member.joined_at), 'MMM d, yyyy')}
											</td>
											{canManageTeam && (
												<td className="px-6 py-4 text-right">
													{member.role !== 'owner' && (
														<button
															onClick={() => {
																if (confirm(`Remove ${member.user_email} from the team?`)) {
																	removeMemberMutation.mutate(member.user_id);
																}
															}}
															className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
															title="Remove Member"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													)}
												</td>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
				</AppSurface>
			</AppPageSection>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<AppPageSection title={`Pending invites (${pendingInvites.length})`} variant="card" className="mb-0">
					{pendingInvites.length === 0 ? (
						<AppEmptyState
							icon={Mail}
							title="No pending invites"
							description="Invite teammates to collaborate securely."
							action={
								canManageTeam ? (
									<AppPrimaryButton onClick={() => setShowInviteModal(true)}>
										<UserPlus className="w-4 h-4" />
										Invite member
									</AppPrimaryButton>
								) : undefined
							}
						/>
					) : (
						<div className="divide-y divide-border">
							{pendingInvites.map((invite) => (
								<div key={invite.id} className="flex items-start justify-between gap-4 p-4">
									<div>
										<div className="font-medium">{invite.email}</div>
										<div className="text-sm text-muted-foreground">
											Role: {invite.role} • Sent {format(new Date(invite.created_at), 'MMM d, yyyy')}
										</div>
										{invite.expires_at && (
											<div className="mt-1 text-xs text-muted-foreground">
												Expires {format(new Date(invite.expires_at), 'MMM d, yyyy')}
											</div>
										)}
									</div>
									{canManageTeam && (
										<AppSecondaryButton
											onClick={() => cancelInviteMutation.mutate(invite.id)}
											disabled={cancelInviteMutation.isPending && cancelInviteMutation.variables === invite.id}
										>
											{cancelInviteMutation.isPending && cancelInviteMutation.variables === invite.id ? (
												<>
													<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
													Cancelling...
												</>
											) : (
												<>
													<XCircle className="w-4 h-4" />
													Cancel
												</>
											)}
										</AppSecondaryButton>
									)}
								</div>
							))}
						</div>
					)}
				</AppPageSection>

				<AppPageSection title={`Shared dashboards (${dashboards.length})`} variant="card" className="mb-0">
					{dashboards.length === 0 ? (
						<AppEmptyState
							icon={LayoutDashboard}
							title="No shared dashboards"
							description="Create a shared dashboard for your team to review security posture together."
							action={
								canManageTeam ? (
									<AppPrimaryButton onClick={() => setShowDashboardModal(true)}>
										<LayoutDashboard className="w-4 h-4" />
										Share dashboard
									</AppPrimaryButton>
								) : undefined
							}
						/>
					) : (
						<div className="divide-y divide-border">
							{dashboards.map((dashboard) => (
								<div key={dashboard.id} className="flex items-start justify-between gap-4 p-4">
									<div>
										<div className="font-medium">{dashboard.name}</div>
										<div className="text-sm text-muted-foreground">
											{DASHBOARD_TYPE_LABELS[dashboard.dashboard_type]} dashboard • Created {format(new Date(dashboard.created_at), 'MMM d, yyyy')}
										</div>
									</div>
									{canManageTeam && (
										<button
											type="button"
											onClick={() => deleteDashboardMutation.mutate(dashboard.id)}
											className="rounded p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
											title="Delete shared dashboard"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									)}
								</div>
							))}
						</div>
					)}
				</AppPageSection>
			</div>

			{showInviteModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-xl">
						<h2 className="text-xl font-bold mb-4">Invite Team Member</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">
									Email Address <span className="text-red-500">*</span>
								</label>
								<input
									type="email"
									placeholder="colleague@example.com"
									value={inviteData.email}
									onChange={(event) => setInviteData({ ...inviteData, email: event.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
									autoFocus
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">
									Role <span className="text-red-500">*</span>
								</label>
								<select
									value={inviteData.role}
									onChange={(event) => setInviteData({ ...inviteData, role: event.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="admin">Admin</option>
									<option value="member">Member</option>
									<option value="viewer">Viewer</option>
								</select>
								<p className="text-xs text-muted-foreground mt-2">
									If the email already belongs to an existing Koreshield user, they can accept and join immediately. Otherwise the invite stays pending until they sign up.
								</p>
							</div>

							<div className="flex gap-3 mt-6">
								<button
									onClick={() => {
										setShowInviteModal(false);
										setInviteData({ email: '', role: 'member' });
									}}
									className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
									disabled={inviteMemberMutation.isPending}
								>
									Cancel
								</button>
								<button
									onClick={() => inviteMemberMutation.mutate(inviteData)}
									disabled={!inviteData.email || inviteMemberMutation.isPending}
									className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{inviteMemberMutation.isPending ? 'Sending...' : 'Send Invite'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{showDashboardModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-card border border-border rounded-lg max-w-xl w-full p-6 shadow-xl">
						<h2 className="text-xl font-bold mb-4">Create Shared Dashboard</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">
									Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Threat review dashboard"
									value={dashboardData.name}
									onChange={(event) => setDashboardData({ ...dashboardData, name: event.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Dashboard Type</label>
								<select
									value={dashboardData.dashboard_type}
									onChange={(event) => setDashboardData({ ...dashboardData, dashboard_type: event.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="security">Security</option>
									<option value="analytics">Analytics</option>
									<option value="compliance">Compliance</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Config JSON</label>
								<textarea
									rows={8}
									value={dashboardData.config}
									onChange={(event) => setDashboardData({ ...dashboardData, config: event.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
								/>
							</div>
							<div className="flex gap-3 mt-6">
								<button
									onClick={() => {
										setShowDashboardModal(false);
										setDashboardData({
											name: '',
											dashboard_type: 'security',
											config: '{\n  "widgets": []\n}',
										});
									}}
									className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
									disabled={createDashboardMutation.isPending}
								>
									Cancel
								</button>
								<button
									onClick={() => createDashboardMutation.mutate()}
									disabled={!dashboardData.name.trim() || createDashboardMutation.isPending}
									className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{createDashboardMutation.isPending ? 'Creating...' : 'Create Dashboard'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</AppPage>
	);
}
