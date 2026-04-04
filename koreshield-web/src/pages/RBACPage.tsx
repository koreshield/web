import { useMemo, useState } from 'react';
import { Shield, Users, Plus, Edit2, Trash2, Key, Search, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';

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

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
}

export function RBACPage() {
	const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
	const [showUserModal, setShowUserModal] = useState(false);
	const [showRoleModal, setShowRoleModal] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [editingRole, setEditingRole] = useState<Role | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [roleFilter, setRoleFilter] = useState('all');
	const [userForm, setUserForm] = useState({
		name: '',
		email: '',
		role: '',
		status: 'pending' as User['status'],
		send_invite: true,
	});
	const [roleForm, setRoleForm] = useState({
		name: '',
		description: '',
		permissions: [] as string[],
	});

	const queryClient = useQueryClient();
	const { success, error } = useToast();

	const { data: usersData = [], isLoading: usersLoading } = useQuery({
		queryKey: ['rbac-users', searchQuery, roleFilter],
		queryFn: async () => {
			const paramsObj: { search?: string; role?: string } = {};
			if (searchQuery) paramsObj.search = searchQuery;
			if (roleFilter !== 'all') paramsObj.role = roleFilter;
			return api.getUsers(paramsObj);
		},
	});
	const users = usersData as User[];

	const { data: rolesData = [], isLoading: rolesLoading } = useQuery({
		queryKey: ['rbac-roles'],
		queryFn: async () => api.getRoles(),
	});
	const roles = rolesData as Role[];

	const { data: permissionsData = [], isLoading: permissionsLoading } = useQuery({
		queryKey: ['rbac-permissions'],
		queryFn: async () => api.getPermissions(),
	});
	const permissions = permissionsData as Permission[];

	const resetUserForm = () => {
		setShowUserModal(false);
		setEditingUser(null);
		setUserForm({
			name: '',
			email: '',
			role: roles[0]?.name ?? '',
			status: 'pending',
			send_invite: true,
		});
	};

	const resetRoleForm = () => {
		setShowRoleModal(false);
		setEditingRole(null);
		setRoleForm({
			name: '',
			description: '',
			permissions: [],
		});
	};

	const userMutation = useMutation({
		mutationFn: async () => {
			if (editingUser) {
				return api.updateUser(editingUser.id, {
					name: userForm.name.trim(),
					role: userForm.role,
					status: userForm.status,
				});
			}
			return api.createUser({
				name: userForm.name.trim(),
				email: userForm.email.trim(),
				role: userForm.role,
				send_invite: userForm.send_invite,
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['rbac-users'] });
			success(editingUser ? 'User updated' : 'User created');
			resetUserForm();
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, editingUser ? 'Failed to update user' : 'Failed to create user'));
		},
	});

	const roleMutation = useMutation({
		mutationFn: async () => {
			if (editingRole) {
				return api.updateRole(editingRole.id, {
					description: roleForm.description.trim(),
					permissions: roleForm.permissions,
				});
			}
			return api.createRole({
				name: roleForm.name.trim(),
				description: roleForm.description.trim(),
				permissions: roleForm.permissions,
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
			void queryClient.invalidateQueries({ queryKey: ['rbac-users'] });
			success(editingRole ? 'Role updated' : 'Role created');
			resetRoleForm();
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, editingRole ? 'Failed to update role' : 'Failed to create role'));
		},
	});

	const deleteUserMutation = useMutation({
		mutationFn: async (userId: string) => api.deleteUser(userId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['rbac-users'] });
			void queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
			success('User deleted');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to delete user'));
		},
	});

	const deleteRoleMutation = useMutation({
		mutationFn: async (roleId: string) => api.deleteRole(roleId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
			success('Role deleted');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to delete role'));
		},
	});

	const filteredUsers = useMemo(
		() => users.filter((user) => {
			const matchesSearch =
				user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesRole = roleFilter === 'all' || user.role === roleFilter;
			return matchesSearch && matchesRole;
		}),
		[roleFilter, searchQuery, users],
	);

	const groupedPermissions = permissions.reduce((acc, perm) => {
		if (!acc[perm.category]) acc[perm.category] = [];
		acc[perm.category].push(perm);
		return acc;
	}, {} as Record<string, Permission[]>);

	return (
		<div>
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div className="flex items-center gap-2 sm:gap-3 min-w-0">
							<div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
								<Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
							</div>
							<div className="min-w-0">
								<h1 className="text-lg sm:text-2xl font-bold">RBAC Management</h1>
								<p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
									Manage users, roles, and permissions
								</p>
							</div>
						</div>
						{activeTab === 'users' && (
							<button
								onClick={() => {
									setEditingUser(null);
									setUserForm({
										name: '',
										email: '',
										role: roles[0]?.name ?? '',
										status: 'pending',
										send_invite: true,
									});
									setShowUserModal(true);
								}}
								className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto text-sm"
							>
								<Plus className="w-4 h-4" />
								Add User
							</button>
						)}
						{activeTab === 'roles' && (
							<button
								onClick={() => {
									setEditingRole(null);
									setRoleForm({ name: '', description: '', permissions: [] });
									setShowRoleModal(true);
								}}
								className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto text-sm"
							>
								<Plus className="w-4 h-4" />
								Create Role
							</button>
						)}
					</div>

					<div className="flex overflow-x-auto gap-2 sm:gap-4 mt-4 sm:mt-6 border-b border-border">
						{(['users', 'roles', 'permissions'] as const).map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`pb-3 px-2 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
							>
								<div className="flex items-center gap-1 sm:gap-2">
									{tab === 'users' && <Users className="w-3 h-3 sm:w-4 sm:h-4" />}
									{tab === 'roles' && <Shield className="w-3 h-3 sm:w-4 sm:h-4" />}
									{tab === 'permissions' && <Key className="w-3 h-3 sm:w-4 sm:h-4" />}
									{tab.charAt(0).toUpperCase() + tab.slice(1)}
								</div>
								{activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
							</button>
						))}
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{activeTab === 'users' && (
					<>
						<div className="flex gap-4 mb-6 flex-wrap">
							<div className="flex-1 min-w-0 relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<input
									type="text"
									placeholder="Search users by name or email..."
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div className="flex items-center gap-2">
								<Filter className="w-4 h-4 text-muted-foreground" />
								<select
									value={roleFilter}
									onChange={(event) => setRoleFilter(event.target.value)}
									className="px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="all">All Roles</option>
									{roles.map((role) => (
										<option key={role.id} value={role.name}>{role.name}</option>
									))}
								</select>
							</div>
						</div>

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
												<tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
													<td className="py-3 px-4">
														<div>
															<div className="font-medium">{user.name}</div>
															<div className="text-sm text-muted-foreground">{user.email}</div>
														</div>
													</td>
													<td className="py-3 px-4">
														<span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">{user.role}</span>
													</td>
													<td className="py-3 px-4">
														<span className={`px-2 py-1 rounded text-sm ${user.status === 'active'
															? 'bg-green-500/10 text-green-600'
															: user.status === 'inactive'
																? 'bg-red-500/10 text-red-600'
																: 'bg-yellow-500/10 text-yellow-600'
															}`}>
															{user.status}
														</span>
													</td>
													<td className="py-3 px-4 text-sm text-muted-foreground">{user.last_login}</td>
													<td className="py-3 px-4">
														<div className="flex gap-2">
															<button
																onClick={() => {
																	setEditingUser(user);
																	setUserForm({
																		name: user.name,
																		email: user.email,
																		role: user.role,
																		status: user.status,
																		send_invite: false,
																	});
																	setShowUserModal(true);
																}}
																aria-label={`Edit ${user.email}`}
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
																aria-label={`Delete ${user.email}`}
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

				{activeTab === 'roles' && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{rolesLoading ? (
							<div className="col-span-full flex items-center justify-center py-12">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
							</div>
						) : (
							roles.map((role) => (
								<div key={role.id} className="bg-card border border-border rounded-lg p-6">
									<div className="flex items-start justify-between mb-4 gap-3">
										<div>
											<h3 className="text-lg font-semibold">{role.name}</h3>
											<p className="text-sm text-muted-foreground mt-1">{role.description}</p>
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => {
													setEditingRole(role);
													setRoleForm({
														name: role.name,
														description: role.description,
														permissions: role.permissions,
													});
													setShowRoleModal(true);
												}}
												aria-label={`Edit role ${role.name}`}
												className="p-1 hover:bg-muted rounded transition-colors"
											>
												<Edit2 className="w-4 h-4 text-primary" />
											</button>
											<button
												onClick={() => {
													if (confirm(`Delete the role "${role.name}"?`)) {
														deleteRoleMutation.mutate(role.id);
													}
												}}
												aria-label={`Delete role ${role.name}`}
												className="p-1 hover:bg-muted rounded transition-colors"
											>
												<Trash2 className="w-4 h-4 text-red-600" />
											</button>
										</div>
									</div>

									<div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
										<Users className="w-4 h-4" />
										{role.user_count} users
									</div>

									<div>
										<div className="text-sm font-medium mb-2">Permissions:</div>
										<div className="flex flex-wrap gap-2">
											{role.permissions.slice(0, 3).map((perm) => (
												<span key={perm} className="px-2 py-1 bg-muted text-xs rounded">
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
														<div className="text-xs text-muted-foreground mt-1">{perm.description}</div>
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

			{showUserModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
						<h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add User'}</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">Name</label>
								<input
									type="text"
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
									value={userForm.name}
									onChange={(event) => setUserForm({ ...userForm, name: event.target.value })}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Email</label>
								<input
									type="email"
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
									value={userForm.email}
									onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
									disabled={Boolean(editingUser)}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Role</label>
								<select
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
									value={userForm.role}
									onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
								>
									{roles.map((role) => (
										<option key={role.id} value={role.name}>{role.name}</option>
									))}
								</select>
							</div>
							{editingUser && (
								<div>
									<label className="block text-sm font-medium mb-2">Status</label>
									<select
										className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
										value={userForm.status}
										onChange={(event) => setUserForm({ ...userForm, status: event.target.value as User['status'] })}
									>
										<option value="active">active</option>
										<option value="inactive">inactive</option>
										<option value="pending">pending</option>
									</select>
								</div>
							)}
							{!editingUser && (
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={userForm.send_invite}
										onChange={(event) => setUserForm({ ...userForm, send_invite: event.target.checked })}
									/>
									Send invite email
								</label>
							)}
							<div className="flex gap-3 mt-6">
								<button onClick={resetUserForm} className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
									Cancel
								</button>
								<button
									onClick={() => userMutation.mutate()}
									disabled={!userForm.name.trim() || !userForm.email.trim() || !userForm.role}
									className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
								>
									{editingUser ? 'Update' : 'Create'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{showRoleModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-card border border-border rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
						<h2 className="text-xl font-bold mb-4">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">Name</label>
								<input
									type="text"
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
									value={roleForm.name}
									onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })}
									disabled={Boolean(editingRole)}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Description</label>
								<textarea
									rows={3}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
									value={roleForm.description}
									onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Permissions</label>
								<div className="border border-border rounded-lg p-4 max-h-64 overflow-y-auto">
									{permissions.map((perm) => (
										<label key={perm.id} className="flex items-center gap-2 py-2">
											<input
												type="checkbox"
												checked={roleForm.permissions.includes(perm.name)}
												onChange={(event) => {
													const next = new Set(roleForm.permissions);
													if (event.target.checked) {
														next.add(perm.name);
													} else {
														next.delete(perm.name);
													}
													setRoleForm({ ...roleForm, permissions: [...next] });
												}}
												className="rounded border-border"
											/>
											<span className="text-sm">{perm.name}</span>
										</label>
									))}
								</div>
							</div>
							<div className="flex gap-3 mt-6">
								<button onClick={resetRoleForm} className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
									Cancel
								</button>
								<button
									onClick={() => roleMutation.mutate()}
									disabled={!roleForm.name.trim() || roleForm.permissions.length === 0}
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
