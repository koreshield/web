import { useMemo, useState } from 'react';
import { Shield, Users, Plus, Edit2, Trash2, Key, Search, Filter } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import {
	AppPage,
	AppPageHeader,
	AppPageSection,
	AppPrimaryButton,
	AppSecondaryButton,
	AppSurface,
	AppPageLoading,
} from '../components/AppPageLayout';

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

	const rbacTabs = [
		{ id: 'users' as const, label: 'Users' },
		{ id: 'roles' as const, label: 'Roles' },
		{ id: 'permissions' as const, label: 'Permissions' },
	];

	return (
		<AppPage>
			<SEOMeta title="Access Control" noindex />
			<AppPageHeader
				eyebrow="Access control"
				eyebrowIcon={Shield}
				title="RBAC Management"
				description="Manage users, roles, and permissions"
				icon={Shield}
				tabs={rbacTabs}
				activeTab={activeTab}
				onTabChange={(id) => setActiveTab(id as typeof activeTab)}
				actions={
					activeTab === 'users' ? (
						<AppPrimaryButton
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
							className="w-full sm:w-auto"
						>
							<Plus className="h-4 w-4" />
							Add User
						</AppPrimaryButton>
					) : activeTab === 'roles' ? (
						<AppPrimaryButton
							onClick={() => {
								setEditingRole(null);
								setRoleForm({ name: '', description: '', permissions: [] });
								setShowRoleModal(true);
							}}
							className="w-full sm:w-auto"
						>
							<Plus className="h-4 w-4" />
							Create Role
						</AppPrimaryButton>
					) : undefined
				}
			/>

			{activeTab === 'users' && (
				<>
					<div className="mb-6 flex flex-wrap gap-4">
						<div className="relative min-w-0 flex-1">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search users by name or email..."
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								className="dashboard-input py-2 pl-10 pr-4"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<select
								value={roleFilter}
								onChange={(event) => setRoleFilter(event.target.value)}
								className="rounded-lg border border-border bg-background/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="all">All Roles</option>
								{roles.map((role) => (
									<option key={role.id} value={role.name}>{role.name}</option>
								))}
							</select>
						</div>
					</div>

					<AppPageSection className="overflow-hidden p-0" variant="card">
						<div className="dashboard-table-wrap">
							<table className="w-full">
								<thead className="border-b border-border bg-muted/50">
									<tr>
										<th className="px-4 py-3 text-left font-medium">User</th>
										<th className="px-4 py-3 text-left font-medium">Role</th>
										<th className="px-4 py-3 text-left font-medium">Status</th>
										<th className="px-4 py-3 text-left font-medium">Last Login</th>
										<th className="px-4 py-3 text-left font-medium">Actions</th>
									</tr>
								</thead>
								<tbody>
									{usersLoading ? (
										<tr>
											<td colSpan={5} className="py-8 text-center">
												<AppPageLoading label="Loading users…" />
											</td>
										</tr>
									) : filteredUsers.length === 0 ? (
										<tr>
											<td colSpan={5} className="py-8 text-center text-muted-foreground">
												No users found
											</td>
										</tr>
									) : (
										filteredUsers.map((user) => (
											<tr key={user.id} className="border-b border-border transition-colors hover:bg-muted/50">
												<td className="px-4 py-3">
													<div>
														<div className="font-medium">{user.name}</div>
														<div className="text-sm text-muted-foreground">{user.email}</div>
													</div>
												</td>
												<td className="px-4 py-3">
													<span className="rounded bg-primary/10 px-2 py-1 text-sm text-primary">{user.role}</span>
												</td>
												<td className="px-4 py-3">
													<span className={`rounded px-2 py-1 text-sm ${user.status === 'active'
														? 'bg-green-500/10 text-green-600'
														: user.status === 'inactive'
															? 'bg-red-500/10 text-red-600'
															: 'bg-yellow-500/10 text-yellow-600'
													}`}>
														{user.status}
													</span>
												</td>
												<td className="px-4 py-3 text-sm text-muted-foreground">{user.last_login}</td>
												<td className="px-4 py-3">
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
															className="rounded p-1 transition-colors hover:bg-muted"
														>
															<Edit2 className="h-4 w-4 text-primary" />
														</button>
														<button
															onClick={() => {
																if (confirm('Delete this user?')) {
																	deleteUserMutation.mutate(user.id);
																}
															}}
															disabled={deleteUserMutation.isPending && deleteUserMutation.variables === user.id}
															aria-label={`Delete ${user.email}`}
															className="rounded p-1 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
														>
															{deleteUserMutation.isPending && deleteUserMutation.variables === user.id ? (
																<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
															) : (
																<Trash2 className="h-4 w-4 text-red-600" />
															)}
														</button>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</AppPageSection>
				</>
			)}

			{activeTab === 'roles' && (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{rolesLoading ? (
						<div className="col-span-full">
							<AppPageLoading label="Loading roles…" />
						</div>
					) : (
						roles.map((role) => (
							<AppSurface key={role.id}>
								<div className="mb-4 flex items-start justify-between gap-3">
									<div>
										<h3 className="text-lg font-semibold">{role.name}</h3>
										<p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
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
											className="rounded p-1 transition-colors hover:bg-muted"
										>
											<Edit2 className="h-4 w-4 text-primary" />
										</button>
										<button
											onClick={() => {
												if (confirm(`Delete the role "${role.name}"?`)) {
													deleteRoleMutation.mutate(role.id);
												}
											}}
											aria-label={`Delete role ${role.name}`}
											className="rounded p-1 transition-colors hover:bg-muted"
										>
											<Trash2 className="h-4 w-4 text-red-600" />
										</button>
									</div>
								</div>

								<div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
									<Users className="h-4 w-4" />
									{role.user_count} users
								</div>

								<div>
									<div className="mb-2 text-sm font-medium">Permissions:</div>
									<div className="flex flex-wrap gap-2">
										{role.permissions.slice(0, 3).map((perm) => (
											<span key={perm} className="rounded bg-muted px-2 py-1 text-xs">
												{perm}
											</span>
										))}
										{role.permissions.length > 3 && (
											<span className="rounded bg-muted px-2 py-1 text-xs">
												+{role.permissions.length - 3} more
											</span>
										)}
									</div>
								</div>
							</AppSurface>
						))
					)}
				</div>
			)}

			{activeTab === 'permissions' && (
				<div className="space-y-6">
					{permissionsLoading ? (
						<AppPageLoading label="Loading permissions…" />
					) : (
						Object.entries(groupedPermissions).map(([category, perms]) => (
							<AppPageSection key={category} title={category}>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{perms.map((perm) => (
										<AppSurface key={perm.id} className="flex items-start gap-3">
											<Key className="mt-1 h-4 w-4 shrink-0 text-primary" />
											<div>
												<div className="text-sm font-medium">{perm.name}</div>
												<div className="mt-1 text-xs text-muted-foreground">{perm.description}</div>
											</div>
										</AppSurface>
									))}
								</div>
							</AppPageSection>
						))
					)}
				</div>
			)}

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
							<div className="mt-6 flex gap-3">
								<AppSecondaryButton onClick={resetUserForm} className="flex-1">
									Cancel
								</AppSecondaryButton>
								<AppPrimaryButton
									onClick={() => userMutation.mutate()}
									disabled={!userForm.name.trim() || !userForm.email.trim() || !userForm.role}
									className="flex-1"
								>
									{editingUser ? 'Update' : 'Create'}
								</AppPrimaryButton>
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
							<div className="mt-6 flex gap-3">
								<AppSecondaryButton onClick={resetRoleForm} className="flex-1">
									Cancel
								</AppSecondaryButton>
								<AppPrimaryButton
									onClick={() => roleMutation.mutate()}
									disabled={!roleForm.name.trim() || roleForm.permissions.length === 0}
									className="flex-1"
								>
									{editingRole ? 'Update' : 'Create'}
								</AppPrimaryButton>
							</div>
						</div>
					</div>
				</div>
			)}
		</AppPage>
	);
}
