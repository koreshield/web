import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	Users,
	UserPlus,
	ArrowLeft,
	Trash2,
	Pencil,
	LayoutDashboard,
	Mail,
	XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../lib/api-client';
import { authService } from '../lib/auth';
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
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (teamError || !team) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<h2 className="text-2xl font-bold">Team not found</h2>
				<Link to="/teams" className="text-primary hover:underline">Return to Teams</Link>
			</div>
		);
	}

	const canManageTeam = ['owner', 'admin'].includes(team.my_role);
	const isOwner = team.my_role === 'owner';
	const currentUserId = authService.getCurrentUser()?.id;

	return (
		<div>
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
					<div className="flex flex-col gap-3 sm:gap-4">
						<Link to="/teams" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
							<ArrowLeft className="w-4 h-4" />
							Back to Teams
						</Link>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
								<div className="flex items-center gap-3 min-w-0">
									<div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
										<Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
									</div>
									<div className="min-w-0">
										<h1 className="text-xl sm:text-3xl font-bold flex flex-wrap items-center gap-2">
											<span className="truncate">{team.name}</span>
											<span className="text-xs sm:text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
												/{team.slug}
											</span>
										</h1>
										<p className="text-xs sm:text-sm text-muted-foreground mt-1">
											Created on {format(new Date(team.created_at), 'MMM d, yyyy')}
										</p>
									</div>
								</div>
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
									{canManageTeam && (
										<>
											<button
												onClick={() => setShowInviteModal(true)}
												className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
											>
												<UserPlus className="w-4 h-4" />
												Invite Member
											</button>
											<button
												onClick={() => setShowDashboardModal(true)}
												className="flex items-center justify-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm"
											>
												<LayoutDashboard className="w-4 h-4" />
												Share Dashboard
											</button>
										</>
									)}
									{isOwner && (
										<button
											onClick={() => {
												if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
													setIsDeletingTeam(true);
													deleteTeamMutation.mutate();
												}
											}}
											className="flex items-center justify-center gap-2 px-4 py-2 border border-destructive/50 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm"
											disabled={isDeletingTeam}
										>
											<Trash2 className="w-4 h-4" />
											{isDeletingTeam ? 'Deleting...' : 'Delete Team'}
										</button>
									)}
								</div>
							</div>

							{canManageTeam && (
								<div className="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
									<div className="flex items-center gap-2">
										<Pencil className="w-4 h-4 text-primary" />
										<h2 className="font-semibold">Team settings</h2>
									</div>
									<div className="flex flex-col sm:flex-row gap-3">
										<input
											type="text"
											value={renameValue || team.name}
											onChange={(event) => setRenameValue(event.target.value)}
											className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
											placeholder="Team name"
										/>
										<button
											onClick={() => updateTeamMutation.mutate({ name: (renameValue || team.name).trim() })}
											disabled={updateTeamMutation.isPending || !(renameValue || team.name).trim()}
											className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
										>
											{updateTeamMutation.isPending ? 'Saving...' : 'Save name'}
										</button>
									</div>
									<p className="text-xs text-muted-foreground">
										The team slug stays fixed once the team is created.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
				<section className="space-y-4">
					<h2 className="text-xl font-bold flex items-center gap-2">
						<Users className="w-5 h-5" />
						Members ({members.length})
					</h2>

					<div className="bg-card border border-border rounded-lg overflow-hidden">
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
					</div>
				</section>

				<section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-bold flex items-center gap-2">
								<Mail className="w-5 h-5" />
								Pending invites ({pendingInvites.length})
							</h2>
						</div>
						<div className="bg-card border border-border rounded-lg divide-y divide-border">
							{pendingInvites.length === 0 ? (
								<div className="p-6 text-sm text-muted-foreground">
									No pending invites yet. Invite teammates to collaborate securely.
								</div>
							) : (
								pendingInvites.map((invite) => (
									<div key={invite.id} className="p-4 flex items-start justify-between gap-4">
										<div>
											<div className="font-medium">{invite.email}</div>
											<div className="text-sm text-muted-foreground">
												Role: {invite.role} • Sent {format(new Date(invite.created_at), 'MMM d, yyyy')}
											</div>
											{invite.expires_at && (
												<div className="text-xs text-muted-foreground mt-1">
													Expires {format(new Date(invite.expires_at), 'MMM d, yyyy')}
												</div>
											)}
										</div>
										{canManageTeam && (
											<button
												onClick={() => cancelInviteMutation.mutate(invite.id)}
												className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm"
											>
												<XCircle className="w-4 h-4" />
												Cancel
											</button>
										)}
									</div>
								))
							)}
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-bold flex items-center gap-2">
								<LayoutDashboard className="w-5 h-5" />
								Shared dashboards ({dashboards.length})
							</h2>
						</div>
						<div className="bg-card border border-border rounded-lg divide-y divide-border">
							{dashboards.length === 0 ? (
								<div className="p-6 text-sm text-muted-foreground">
									No shared dashboards created yet.
								</div>
							) : (
								dashboards.map((dashboard) => (
									<div key={dashboard.id} className="p-4 flex items-start justify-between gap-4">
										<div>
											<div className="font-medium">{dashboard.name}</div>
											<div className="text-sm text-muted-foreground">
												{DASHBOARD_TYPE_LABELS[dashboard.dashboard_type]} dashboard • Created {format(new Date(dashboard.created_at), 'MMM d, yyyy')}
											</div>
										</div>
										{canManageTeam && (
											<button
												onClick={() => deleteDashboardMutation.mutate(dashboard.id)}
												className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
												title="Delete shared dashboard"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										)}
									</div>
								))
							)}
						</div>
					</div>
				</section>
			</main>

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
									If the email already belongs to an existing KoreShield user, they can accept and join immediately. Otherwise the invite stays pending until they sign up.
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
		</div>
	);
}
