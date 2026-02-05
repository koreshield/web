import { useState } from 'react';
import { Shield, Users, Plus, Edit2, Trash2, Key, Search, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
    last_login: string;
    permissions: string[];
}

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    user_count: number;
}

interface Permission {
    id: string;
    name: string;
    description: string;
    category: string;
}

export function RBACPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
    const [showUserModal, setShowUserModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const queryClient = useQueryClient();

    // Fetch users
    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ['rbac-users', searchQuery, roleFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (roleFilter !== 'all') params.append('role', roleFilter);
            return api.getUsers(params.toString());
        },
    });

    // Fetch roles
    const { data: roles = [], isLoading: rolesLoading } = useQuery({
        queryKey: ['rbac-roles'],
        queryFn: async () => {
            return api.getRoles();
        },
    });

    // Fetch permissions
    const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
        queryKey: ['rbac-permissions'],
        queryFn: async () => {
            return api.getPermissions();
        },
    });

    // Create/Update user mutation
    const userMutation = useMutation({
        mutationFn: async (user: Partial<User>) => {
            if (editingUser) {
                return api.updateUser(editingUser.id, user);
            }
            return api.createUser(user);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac-users'] });
            setShowUserModal(false);
            setEditingUser(null);
        },
    });

    // Create/Update role mutation
    const roleMutation = useMutation({
        mutationFn: async (role: Partial<Role>) => {
            if (editingRole) {
                return api.updateRole(editingRole.id, role);
            }
            return api.createRole(role);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
            setShowRoleModal(false);
            setEditingRole(null);
        },
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            return api.deleteUser(userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac-users'] });
        },
    });

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const groupedPermissions = permissions.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Shield className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">RBAC Management</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage users, roles, and permissions
                                </p>
                            </div>
                        </div>
                        {activeTab === 'users' && (
                            <button
                                onClick={() => setShowUserModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add User
                            </button>
                        )}
                        {activeTab === 'roles' && (
                            <button
                                onClick={() => setShowRoleModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create Role
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mt-6 border-b border-border">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'users'
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Users
                            </div>
                            {activeTab === 'users' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'roles'
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Roles
                            </div>
                            {activeTab === 'roles' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('permissions')}
                            className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'permissions'
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                Permissions
                            </div>
                            {activeTab === 'permissions' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Users Tab */}
                {activeTab === 'users' && (
                    <>
                        {/* Filters */}
                        <div className="flex gap-4 mb-6 flex-wrap">
                            <div className="flex-1 min-w-[300px] relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
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
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.name}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-card border border-border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium">User</th>
                                            <th className="text-left py-3 px-4 font-medium">Role</th>
                                            <th className="text-left py-3 px-4 font-medium">Status</th>
                                            <th className="text-left py-3 px-4 font-medium">Last Login</th>
                                            <th className="text-left py-3 px-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersLoading ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <tr
                                                    key={user.id}
                                                    className="border-b border-border hover:bg-muted/50 transition-colors"
                                                >
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <div className="font-medium">{user.name}</div>
                                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`px-2 py-1 rounded text-sm ${user.status === 'active'
                                                                    ? 'bg-green-500/10 text-green-600'
                                                                    : user.status === 'inactive'
                                                                        ? 'bg-red-500/10 text-red-600'
                                                                        : 'bg-yellow-500/10 text-yellow-600'
                                                                }`}
                                                        >
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                                        {user.last_login}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingUser(user);
                                                                    setShowUserModal(true);
                                                                }}
                                                                className="p-1 hover:bg-muted rounded transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4 text-primary" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('Delete this user?')) {
                                                                        deleteUserMutation.mutate(user.id);
                                                                    }
                                                                }}
                                                                className="p-1 hover:bg-muted rounded transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-600" />
                                                            </button>
                                                        </div>
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

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rolesLoading ? (
                            <div className="col-span-full flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            roles.map((role) => (
                                <div key={role.id} className="bg-card border border-border rounded-lg p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold">{role.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingRole(role);
                                                setShowRoleModal(true);
                                            }}
                                            className="p-1 hover:bg-muted rounded transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-primary" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <Users className="w-4 h-4" />
                                        {role.user_count} users
                                    </div>

                                    <div>
                                        <div className="text-sm font-medium mb-2">Permissions:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {role.permissions.slice(0, 3).map((perm) => (
                                                <span
                                                    key={perm}
                                                    className="px-2 py-1 bg-muted text-xs rounded"
                                                >
                                                    {perm}
                                                </span>
                                            ))}
                                            {role.permissions.length > 3 && (
                                                <span className="px-2 py-1 bg-muted text-xs rounded">
                                                    +{role.permissions.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Permissions Tab */}
                {activeTab === 'permissions' && (
                    <div className="space-y-6">
                        {permissionsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            Object.entries(groupedPermissions).map(([category, perms]) => (
                                <div key={category} className="bg-card border border-border rounded-lg overflow-hidden">
                                    <div className="bg-muted/50 px-6 py-3 border-b border-border">
                                        <h3 className="font-semibold">{category}</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {perms.map((perm) => (
                                                <div key={perm.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                                    <Key className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-sm">{perm.name}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {perm.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* User Modal (simplified - in production, use a proper form component) */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">
                            {editingUser ? 'Edit User' : 'Add User'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    defaultValue={editingUser?.name}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    defaultValue={editingUser?.email}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <select
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    defaultValue={editingUser?.role}
                                >
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.name}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowUserModal(false);
                                        setEditingUser(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => userMutation.mutate({})}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    {editingUser ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Modal (simplified) */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingRole ? 'Edit Role' : 'Create Role'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    defaultValue={editingRole?.name}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    defaultValue={editingRole?.description}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Permissions</label>
                                <div className="border border-border rounded-lg p-4 max-h-64 overflow-y-auto">
                                    {permissions.map((perm) => (
                                        <label key={perm.id} className="flex items-center gap-2 py-2">
                                            <input
                                                type="checkbox"
                                                defaultChecked={editingRole?.permissions.includes(perm.name)}
                                                className="rounded border-border"
                                            />
                                            <span className="text-sm">{perm.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowRoleModal(false);
                                        setEditingRole(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => roleMutation.mutate({})}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    {editingRole ? 'Update' : 'Create'}
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
const mockUsers: User[] = [
    {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'Admin',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
        last_login: '2 hours ago',
        permissions: ['*'],
    },
    {
        id: '2',
        email: 'john.doe@acme.com',
        name: 'John Doe',
        role: 'Viewer',
        status: 'active',
        created_at: '2024-01-20T14:30:00Z',
        last_login: '1 day ago',
        permissions: ['view:dashboard', 'view:reports'],
    },
    {
        id: '3',
        email: 'jane.smith@techstart.io',
        name: 'Jane Smith',
        role: 'Editor',
        status: 'active',
        created_at: '2024-01-25T09:15:00Z',
        last_login: '3 hours ago',
        permissions: ['view:dashboard', 'edit:policies', 'view:reports'],
    },
    {
        id: '4',
        email: 'bob.wilson@devshop.com',
        name: 'Bob Wilson',
        role: 'Viewer',
        status: 'inactive',
        created_at: '2024-02-01T16:45:00Z',
        last_login: '2 weeks ago',
        permissions: ['view:dashboard'],
    },
    {
        id: '5',
        email: 'alice.johnson@cloudco.net',
        name: 'Alice Johnson',
        role: 'Editor',
        status: 'pending',
        created_at: '2024-02-04T11:20:00Z',
        last_login: 'Never',
        permissions: ['view:dashboard', 'edit:policies'],
    },
];

const mockRoles: Role[] = [
    {
        id: '1',
        name: 'Admin',
        description: 'Full system access with all permissions',
        permissions: ['*'],
        user_count: 1,
    },
    {
        id: '2',
        name: 'Editor',
        description: 'Can view and edit policies, rules, and configurations',
        permissions: [
            'view:dashboard',
            'view:analytics',
            'edit:policies',
            'edit:rules',
            'view:reports',
            'edit:tenants',
        ],
        user_count: 2,
    },
    {
        id: '3',
        name: 'Viewer',
        description: 'Read-only access to dashboards and reports',
        permissions: ['view:dashboard', 'view:analytics', 'view:reports'],
        user_count: 2,
    },
    {
        id: '4',
        name: 'Security Analyst',
        description: 'Specialized role for security monitoring and analysis',
        permissions: [
            'view:dashboard',
            'view:analytics',
            'view:alerts',
            'edit:alerts',
            'view:reports',
            'export:reports',
        ],
        user_count: 0,
    },
];

const mockPermissions: Permission[] = [
    { id: '1', name: 'view:dashboard', description: 'View main dashboard', category: 'Dashboard' },
    { id: '2', name: 'view:analytics', description: 'View analytics and metrics', category: 'Analytics' },
    { id: '3', name: 'view:reports', description: 'View generated reports', category: 'Reports' },
    { id: '4', name: 'export:reports', description: 'Export reports to CSV/PDF', category: 'Reports' },
    { id: '5', name: 'create:reports', description: 'Create custom reports', category: 'Reports' },
    { id: '6', name: 'view:alerts', description: 'View alert configurations', category: 'Alerts' },
    { id: '7', name: 'edit:alerts', description: 'Create and modify alerts', category: 'Alerts' },
    { id: '8', name: 'delete:alerts', description: 'Delete alert rules', category: 'Alerts' },
    { id: '9', name: 'view:policies', description: 'View security policies', category: 'Policies' },
    { id: '10', name: 'edit:policies', description: 'Create and modify policies', category: 'Policies' },
    { id: '11', name: 'delete:policies', description: 'Delete security policies', category: 'Policies' },
    { id: '12', name: 'view:rules', description: 'View rule engine configurations', category: 'Rules' },
    { id: '13', name: 'edit:rules', description: 'Create and modify rules', category: 'Rules' },
    { id: '14', name: 'delete:rules', description: 'Delete rules', category: 'Rules' },
    { id: '15', name: 'view:tenants', description: 'View tenant information', category: 'Tenants' },
    { id: '16', name: 'edit:tenants', description: 'Modify tenant configurations', category: 'Tenants' },
    { id: '17', name: 'create:tenants', description: 'Create new tenants', category: 'Tenants' },
    { id: '18', name: 'delete:tenants', description: 'Delete tenants', category: 'Tenants' },
    { id: '19', name: 'view:users', description: 'View user accounts', category: 'Users & Roles' },
    { id: '20', name: 'edit:users', description: 'Modify user accounts', category: 'Users & Roles' },
    { id: '21', name: 'create:users', description: 'Create new users', category: 'Users & Roles' },
    { id: '22', name: 'delete:users', description: 'Delete user accounts', category: 'Users & Roles' },
    { id: '23', name: 'view:roles', description: 'View role configurations', category: 'Users & Roles' },
    { id: '24', name: 'edit:roles', description: 'Modify role permissions', category: 'Users & Roles' },
    { id: '25', name: 'create:api_keys', description: 'Generate API keys', category: 'API Keys' },
    { id: '26', name: 'revoke:api_keys', description: 'Revoke API keys', category: 'API Keys' },
];
