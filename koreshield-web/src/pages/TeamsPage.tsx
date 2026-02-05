import { useState } from 'react';
import { Users, Plus, UserPlus, Shield, Search, Filter, Mail, MoreVertical, Crown, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';

interface Team {
    id: string;
    name: string;
    description: string;
    owner_id: string;
    owner_name: string;
    member_count: number;
    created_at: string;
    status: 'active' | 'archived';
}

interface TeamMember {
    id: string;
    user_id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    joined_at: string;
    last_active: string;
    status: 'active' | 'pending' | 'inactive';
}

interface TeamInvite {
    id: string;
    email: string;
    role: string;
    invited_by: string;
    invited_at: string;
    expires_at: string;
    status: 'pending' | 'accepted' | 'expired';
}

interface SharedDashboard {
    id: string;
    name: string;
    type: 'analytics' | 'security' | 'cost' | 'custom';
    owner: string;
    shared_with: string[];
    created_at: string;
}

export function TeamsPage() {
    const [activeTab, setActiveTab] = useState<'teams' | 'members' | 'invites' | 'shared'>('teams');
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const queryClient = useQueryClient();

    // Fetch teams
    const { data: teamsData = [], isLoading: teamsLoading } = useQuery({
        queryKey: ['teams'],
        queryFn: async () => {
            return api.getTeams();
        },
    });
    const teams = teamsData as Team[];

    // Fetch team members
    const { data: membersData = [], isLoading: membersLoading } = useQuery({
        queryKey: ['team-members', selectedTeam?.id],
        queryFn: async () => {
            if (!selectedTeam?.id) return [];
            const params = roleFilter !== 'all' ? `?role=${roleFilter}` : '';
            return api.getTeamMembers(selectedTeam.id, params);
        },
        enabled: !!selectedTeam,
    });
    const members = membersData as TeamMember[];

    // Fetch invites
    const { data: invitesData = [], isLoading: invitesLoading } = useQuery({
        queryKey: ['team-invites', selectedTeam?.id],
        queryFn: async () => {
            if (!selectedTeam?.id) return [];
            return api.getTeamInvites(selectedTeam.id);
        },
        enabled: !!selectedTeam,
    });
    const invites = invitesData as TeamInvite[];

    // Fetch shared dashboards
    const { data: dashboardsData = [], isLoading: dashboardsLoading } = useQuery({
        queryKey: ['shared-dashboards', selectedTeam?.id],
        queryFn: async () => {
            if (!selectedTeam?.id) return [];
            return api.getSharedDashboards(selectedTeam.id);
        },
        enabled: !!selectedTeam,
    });
    const sharedDashboards = dashboardsData as SharedDashboard[];

    // Create team mutation
    const createTeamMutation = useMutation({
        mutationFn: async (team: Partial<Team>) => {
            return api.createTeam(team);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            setShowTeamModal(false);
        },
    });

    // Invite user mutation
    const inviteUserMutation = useMutation({
        mutationFn: async (invite: { email: string; role: string }) => {
            if (!selectedTeam?.id) throw new Error('No team selected');
            return api.inviteMember(selectedTeam.id, invite);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-invites'] });
            setShowInviteModal(false);
        },
    });

    // Update member role mutation
    const updateMemberRoleMutation = useMutation({
        mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
            if (!selectedTeam?.id) throw new Error('No team selected');
            return api.updateMemberRole(selectedTeam.id, memberId, role);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
        },
    });

    // Remove member mutation
    const removeMemberMutation = useMutation({
        mutationFn: async (memberId: string) => {
            // TODO: Replace with real API call
            console.log('Removing member:', memberId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
        },
    });

    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || member.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Team Collaboration</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage teams, members, and shared resources
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {selectedTeam && activeTab === 'members' && (
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Invite Member
                                </button>
                            )}
                            {activeTab === 'teams' && (
                                <button
                                    onClick={() => setShowTeamModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Team
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mt-6 border-b border-border">
                        <button
                            onClick={() => setActiveTab('teams')}
                            className={`pb-3 px-2 font-medium transition-colors relative ${
                                activeTab === 'teams'
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Teams
                            </div>
                            {activeTab === 'teams' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                        {selectedTeam && (
                            <>
                                <button
                                    onClick={() => setActiveTab('members')}
                                    className={`pb-3 px-2 font-medium transition-colors relative ${
                                        activeTab === 'members'
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="w-4 h-4" />
                                        Members ({members.length})
                                    </div>
                                    {activeTab === 'members' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('invites')}
                                    className={`pb-3 px-2 font-medium transition-colors relative ${
                                        activeTab === 'invites'
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Invites ({invites.length})
                                    </div>
                                    {activeTab === 'invites' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('shared')}
                                    className={`pb-3 px-2 font-medium transition-colors relative ${
                                        activeTab === 'shared'
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Shared Resources
                                    </div>
                                    {activeTab === 'shared' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Teams Tab */}
                {activeTab === 'teams' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teamsLoading ? (
                            <div className="col-span-full flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : teams.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No teams yet. Create your first team to get started.</p>
                            </div>
                        ) : (
                            teams.map((team) => (
                                <div
                                    key={team.id}
                                    className={`bg-card border rounded-lg p-6 cursor-pointer transition-all ${
                                        selectedTeam?.id === team.id
                                            ? 'border-primary shadow-lg'
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                    onClick={() => setSelectedTeam(team)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold mb-1">{team.name}</h3>
                                            <p className="text-sm text-muted-foreground">{team.description}</p>
                                        </div>
                                        <button className="p-1 hover:bg-muted rounded transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="w-4 h-4" />
                                            {team.member_count} members
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Crown className="w-4 h-4" />
                                            Owner: {team.owner_name}
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                team.status === 'active'
                                                    ? 'bg-green-500/10 text-green-600'
                                                    : 'bg-gray-500/10 text-gray-600'
                                            }`}>
                                                {team.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && selectedTeam && (
                    <>
                        {/* Filters */}
                        <div className="flex gap-4 mb-6 flex-wrap">
                            <div className="flex-1 min-w-[300px] relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="owner">Owner</option>
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                        </div>

                        {/* Members Table */}
                        <div className="bg-card border border-border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium">Member</th>
                                            <th className="text-left py-3 px-4 font-medium">Role</th>
                                            <th className="text-left py-3 px-4 font-medium">Status</th>
                                            <th className="text-left py-3 px-4 font-medium">Last Active</th>
                                            <th className="text-left py-3 px-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {membersLoading ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredMembers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No members found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMembers.map((member) => (
                                                <tr
                                                    key={member.id}
                                                    className="border-b border-border hover:bg-muted/50 transition-colors"
                                                >
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <div className="font-medium flex items-center gap-2">
                                                                {member.name}
                                                                {member.role === 'owner' && (
                                                                    <Crown className="w-4 h-4 text-yellow-600" />
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">{member.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) =>
                                                                updateMemberRoleMutation.mutate({
                                                                    memberId: member.id,
                                                                    role: e.target.value,
                                                                })
                                                            }
                                                            disabled={member.role === 'owner'}
                                                            className="px-2 py-1 bg-primary/10 text-primary rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="owner">Owner</option>
                                                            <option value="admin">Admin</option>
                                                            <option value="member">Member</option>
                                                            <option value="viewer">Viewer</option>
                                                        </select>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`px-2 py-1 rounded text-sm ${
                                                                member.status === 'active'
                                                                    ? 'bg-green-500/10 text-green-600'
                                                                    : member.status === 'pending'
                                                                    ? 'bg-yellow-500/10 text-yellow-600'
                                                                    : 'bg-red-500/10 text-red-600'
                                                            }`}
                                                        >
                                                            {member.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                                        {member.last_active}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {member.role !== 'owner' && (
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('Remove this member from the team?')) {
                                                                        removeMemberMutation.mutate(member.id);
                                                                    }
                                                                }}
                                                                className="p-1 hover:bg-muted rounded transition-colors"
                                                            >
                                                                <X className="w-4 h-4 text-red-600" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Invites Tab */}
                {activeTab === 'invites' && selectedTeam && (
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium">Email</th>
                                        <th className="text-left py-3 px-4 font-medium">Role</th>
                                        <th className="text-left py-3 px-4 font-medium">Invited By</th>
                                        <th className="text-left py-3 px-4 font-medium">Status</th>
                                        <th className="text-left py-3 px-4 font-medium">Expires</th>
                                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invitesLoading ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8">
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : invites.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No pending invites
                                            </td>
                                        </tr>
                                    ) : (
                                        invites.map((invite) => (
                                            <tr
                                                key={invite.id}
                                                className="border-b border-border hover:bg-muted/50 transition-colors"
                                            >
                                                <td className="py-3 px-4 font-medium">{invite.email}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                                                        {invite.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground">{invite.invited_by}</td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-2 py-1 rounded text-sm ${
                                                            invite.status === 'pending'
                                                                ? 'bg-yellow-500/10 text-yellow-600'
                                                                : invite.status === 'accepted'
                                                                ? 'bg-green-500/10 text-green-600'
                                                                : 'bg-red-500/10 text-red-600'
                                                        }`}
                                                    >
                                                        {invite.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground">{invite.expires_at}</td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        className="p-1 hover:bg-muted rounded transition-colors"
                                                        onClick={() => {
                                                            if (confirm('Cancel this invite?')) {
                                                                // TODO: Implement cancel invite
                                                            }
                                                        }}
                                                    >
                                                        <X className="w-4 h-4 text-red-600" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Shared Resources Tab */}
                {activeTab === 'shared' && selectedTeam && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dashboardsLoading ? (
                            <div className="col-span-full flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : sharedDashboards.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No shared resources yet</p>
                            </div>
                        ) : (
                            sharedDashboards.map((dashboard) => (
                                <div key={dashboard.id} className="bg-card border border-border rounded-lg p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">{dashboard.name}</h3>
                                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                                {dashboard.type}
                                            </span>
                                        </div>
                                        <button className="p-1 hover:bg-muted rounded transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Shared with {dashboard.shared_with.length} members
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Crown className="w-4 h-4" />
                                            Owner: {dashboard.owner}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Create Team Modal */}
            {showTeamModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Create New Team</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Team Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Engineering Team"
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe your team's purpose..."
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowTeamModal(false)}
                                    className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => createTeamMutation.mutate({})}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Create Team
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Member Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Invite Team Member</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    placeholder="user@example.com"
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <select className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option value="viewer">Viewer</option>
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => inviteUserMutation.mutate({ email: '', role: '' })}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Send Invite
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Mock data for development - TODO: Replace with real API
// @ts-ignore - Kept for reference
const mockTeams: Team[] = [
    {
        id: '1',
        name: 'Engineering Team',
        description: 'Core product development and infrastructure',
        owner_id: '1',
        owner_name: 'John Doe',
        member_count: 8,
        created_at: '2024-01-15T10:00:00Z',
        status: 'active',
    },
    {
        id: '2',
        name: 'Security Team',
        description: 'Security monitoring and incident response',
        owner_id: '2',
        owner_name: 'Jane Smith',
        member_count: 5,
        created_at: '2024-01-20T14:30:00Z',
        status: 'active',
    },
    {
        id: '3',
        name: 'Data Analytics',
        description: 'Business intelligence and data analysis',
        owner_id: '3',
        owner_name: 'Bob Wilson',
        member_count: 3,
        created_at: '2024-02-01T09:15:00Z',
        status: 'active',
    },
];

// @ts-ignore - Kept for reference
const mockMembers: TeamMember[] = [
    {
        id: '1',
        user_id: 'u1',
        name: 'John Doe',
        email: 'john.doe@koreshield.com',
        role: 'owner',
        joined_at: '2024-01-15T10:00:00Z',
        last_active: '2 hours ago',
        status: 'active',
    },
    {
        id: '2',
        user_id: 'u2',
        name: 'Alice Johnson',
        email: 'alice@koreshield.com',
        role: 'admin',
        joined_at: '2024-01-16T11:30:00Z',
        last_active: '5 minutes ago',
        status: 'active',
    },
    {
        id: '3',
        user_id: 'u3',
        name: 'Bob Smith',
        email: 'bob.smith@koreshield.com',
        role: 'member',
        joined_at: '2024-01-18T14:20:00Z',
        last_active: '1 day ago',
        status: 'active',
    },
    {
        id: '4',
        user_id: 'u4',
        name: 'Carol Davis',
        email: 'carol.davis@koreshield.com',
        role: 'viewer',
        joined_at: '2024-01-25T09:45:00Z',
        last_active: '3 hours ago',
        status: 'active',
    },
    {
        id: '5',
        user_id: 'u5',
        name: 'David Wilson',
        email: 'david.wilson@koreshield.com',
        role: 'member',
        joined_at: '2024-02-01T16:30:00Z',
        last_active: 'Never',
        status: 'pending',
    },
];

// @ts-ignore - Kept for reference
const mockInvites: TeamInvite[] = [
    {
        id: '1',
        email: 'newuser@example.com',
        role: 'member',
        invited_by: 'John Doe',
        invited_at: '2024-02-03T10:00:00Z',
        expires_at: 'In 5 days',
        status: 'pending',
    },
    {
        id: '2',
        email: 'contractor@example.com',
        role: 'viewer',
        invited_by: 'Alice Johnson',
        invited_at: '2024-02-02T14:30:00Z',
        expires_at: 'In 6 days',
        status: 'pending',
    },
];

// @ts-ignore - Kept for reference
const mockSharedDashboards: SharedDashboard[] = [
    {
        id: '1',
        name: 'Security Overview',
        type: 'security',
        owner: 'John Doe',
        shared_with: ['Alice', 'Bob', 'Carol'],
        created_at: '2024-01-20T10:00:00Z',
    },
    {
        id: '2',
        name: 'Cost Analysis Q1',
        type: 'cost',
        owner: 'Alice Johnson',
        shared_with: ['John', 'David'],
        created_at: '2024-02-01T14:30:00Z',
    },
    {
        id: '3',
        name: 'API Performance Metrics',
        type: 'analytics',
        owner: 'Bob Smith',
        shared_with: ['All Team'],
        created_at: '2024-01-25T09:15:00Z',
    },
];
