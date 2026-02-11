import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, ArrowLeft, Trash2 } from 'lucide-react';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import { format } from 'date-fns';
import { authService } from '../lib/auth';

interface TeamMember {
	id: string; // Membership ID
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

export function TeamDetailsPage() {
	const { teamId } = useParams<{ teamId: string }>();
	const navigate = useNavigate();
	const { success, error } = useToast();
	const queryClient = useQueryClient();
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [inviteData, setInviteData] = useState({ email: '', role: 'member' });
	const [isDeletingTeam, setIsDeletingTeam] = useState(false);

	// Fetch Team
	const { data: team, isLoading: isTeamLoading, error: teamError } = useQuery<Team>({
		queryKey: ['team', teamId],
		queryFn: () => api.getTeam(teamId!) as Promise<Team>,
		enabled: !!teamId,
	});

	// Fetch Members
	const { data: members = [], isLoading: isMembersLoading } = useQuery<TeamMember[]>({
		queryKey: ['team-members', teamId],
		queryFn: () => api.getTeamMembers(teamId!) as Promise<TeamMember[]>,
		enabled: !!teamId,
	});

	// Add Member Mutation
	const addMemberMutation = useMutation({
		mutationFn: (data: { email: string; role: string }) => api.addMember(teamId!, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
			setShowInviteModal(false);
			setInviteData({ email: '', role: 'member' });
			success('Member added successfully!');
		},
		onError: (err: any) => {
			error(err.message || 'Failed to add member');
		},
	});

	// Remove Member Mutation
	const removeMemberMutation = useMutation({
		mutationFn: (userId: string) => api.removeMember(teamId!, userId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
			success('Member removed successfully');
		},
		onError: (err: any) => {
			error(err.message || 'Failed to remove member');
		},
	});

	// Update Role Mutation
	const updateRoleMutation = useMutation({
		mutationFn: ({ userId, role }: { userId: string; role: string }) =>
			api.updateMemberRole(teamId!, userId, role),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
			success('Role updated successfully');
		},
		onError: (err: any) => {
			error(err.message || 'Failed to update role');
		},
	});

	// Delete Team Mutation
	const deleteTeamMutation = useMutation({
		mutationFn: () => api.deleteTeam(teamId!),
		onSuccess: () => {
			success('Team deleted successfully');
			navigate('/teams');
		},
		onError: (err: any) => {
			error(err.message || 'Failed to delete team');
			setIsDeletingTeam(false);
		},
	});

	if (isTeamLoading || isMembersLoading) {
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

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex flex-col gap-4">
						<Link to="/teams" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
							<ArrowLeft className="w-4 h-4" />
							Back to Teams
						</Link>
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-3">
								<div className="p-3 bg-primary/10 rounded-lg">
									<Users className="w-8 h-8 text-primary" />
								</div>
								<div>
									<h1 className="text-3xl font-bold flex items-center gap-2">
										{team.name}
										<span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
											/{team.slug}
										</span>
									</h1>
									<p className="text-sm text-muted-foreground mt-1">
										Created on {format(new Date(team.created_at), 'MMM d, yyyy')}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								{canManageTeam && (
									<button
										onClick={() => setShowInviteModal(true)}
										className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
									>
										<UserPlus className="w-4 h-4" />
										<span>Add Member</span>
									</button>
								)}
								{isOwner && (
									<button
										onClick={() => {
											if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
												setIsDeletingTeam(true);
												deleteTeamMutation.mutate();
											}
										}}
										className="flex items-center gap-2 px-4 py-2 border border-destructive/50 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
										disabled={isDeletingTeam}
									>
										<Trash2 className="w-4 h-4" />
										{isDeletingTeam ? 'Deleting...' : 'Delete Team'}
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

				{/* Members Section */}
				<section className="space-y-4">
					<h2 className="text-xl font-bold flex items-center gap-2">
						<Users className="w-5 h-5" />
						Members ({members.length})
					</h2>

					<div className="bg-card border border-border rounded-lg overflow-hidden">
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
														{member.user_id === authService.getCurrentUser()?.id && <span className="text-muted-foreground ml-2">(You)</span>}
													</div>
													<div className="text-sm text-muted-foreground">{member.user_email}</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											{canManageTeam && member.role !== 'owner' ? (
												<select
													value={member.role}
													onChange={(e) => updateRoleMutation.mutate({ userId: member.user_id, role: e.target.value })}
													className="bg-muted border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
													disabled={updateRoleMutation.isPending}
												>
													<option value="admin">Admin</option>
													<option value="member">Member</option>
													<option value="viewer">Viewer</option>
												</select>
											) : (
												<span className={`px-2 py-1 rounded text-xs font-medium ${member.role === 'owner' ? 'bg-purple-500/10 text-purple-400' :
													member.role === 'admin' ? 'bg-blue-500/10 text-blue-400' :
														'bg-gray-500/10 text-gray-400'
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
				</section>
			</main>

			{/* Invite Member Modal */}
			{showInviteModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-xl">
						<h2 className="text-xl font-bold mb-4">Add Team Member</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">
									Email Address <span className="text-red-500">*</span>
								</label>
								<input
									type="email"
									placeholder="colleague@example.com"
									value={inviteData.email}
									onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
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
									onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="admin">Admin</option>
									<option value="member">Member</option>
									<option value="viewer">Viewer</option>
								</select>
								<p className="text-xs text-muted-foreground mt-2">
									<strong>Admin:</strong> Can manage members and settings.<br />
									<strong>Member:</strong> Can manage resources.<br />
									<strong>Viewer:</strong> Read-only access.
								</p>
							</div>

							<div className="flex gap-3 mt-6">
								<button
									onClick={() => {
										setShowInviteModal(false);
										setInviteData({ email: '', role: 'member' });
									}}
									className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
									disabled={addMemberMutation.isPending}
								>
									Cancel
								</button>
								<button
									onClick={() => addMemberMutation.mutate(inviteData)}
									disabled={!inviteData.email || addMemberMutation.isPending}
									className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
