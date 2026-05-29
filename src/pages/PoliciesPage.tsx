import { useMemo, useState } from 'react';
import { Shield, Plus, Edit, Trash2, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import { useAuthState } from '../hooks/useAuthState';
import {
	AppPage,
	AppPageHeader,
	AppStatGrid,
	AppStatCard,
	AppCallout,
	AppEmptyState,
	AppPrimaryButton,
	AppSecondaryButton,
	AppSurface,
} from '../components/AppPageLayout';

interface Policy {
    id: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    roles: string[];
    enabled?: boolean;
    conditions?: Record<string, unknown>;
    actions?: string[];
    created_at?: string;
    updated_at?: string;
}

type PolicyRole = 'admin' | 'moderator' | 'user';

type CreatePolicyForm = {
    id: string;
    name: string;
    description: string;
    severity: Policy['severity'];
    roles: PolicyRole[];
};

const DEFAULT_POLICY_FORM: CreatePolicyForm = {
    id: '',
    name: '',
    description: '',
    severity: 'medium',
    roles: ['admin', 'moderator', 'user'],
};

const AVAILABLE_ROLES: PolicyRole[] = ['admin', 'moderator', 'user'];

function slugifyPolicyId(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function PoliciesPage() {
    const { user } = useAuthState();
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState<CreatePolicyForm>(DEFAULT_POLICY_FORM);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const isAdmin = user?.role === 'owner' || user?.role === 'admin';

    // Fetch policies from real API
    const { data: policies = [], isLoading, error } = useQuery({
        queryKey: ['policies'],
        queryFn: async () => {
            const response = await api.getPolicies();
            return Array.isArray(response) ? response : [];
        },
        refetchInterval: 30000,
        retry: 1,
    });
    const hasPermissionError =
        error instanceof Error && (
            error.message.toLowerCase().includes('insufficient permissions') ||
            error.message.toLowerCase().includes('multi-factor authentication')
        );

    const createMutation = useMutation({
        mutationFn: (policy: CreatePolicyForm) =>
            api.createPolicy({
                id: policy.id,
                name: policy.name,
                description: policy.description,
                severity: policy.severity,
                roles: policy.roles,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            addToast({ type: 'success', message: 'Policy created successfully' });
            setShowCreateModal(false);
            setFormData(DEFAULT_POLICY_FORM);
        },
        onError: (mutationError: unknown) => {
            const message = mutationError instanceof Error ? mutationError.message : 'Failed to create policy';
            addToast({ type: 'error', message });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ policyId, policy }: { policyId: string; policy: CreatePolicyForm }) =>
            api.updatePolicy(policyId, {
                id: policy.id,
                name: policy.name,
                description: policy.description,
                severity: policy.severity,
                roles: policy.roles,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            addToast({ type: 'success', message: 'Policy updated successfully' });
            setShowCreateModal(false);
            setEditingPolicy(null);
            setFormData(DEFAULT_POLICY_FORM);
        },
        onError: (mutationError: unknown) => {
            const message = mutationError instanceof Error ? mutationError.message : 'Failed to update policy';
            addToast({ type: 'error', message });
        },
    });

    // Delete policy mutation
    const deleteMutation = useMutation({
        mutationFn: (policyId: string) => api.deletePolicy(policyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            addToast({ type: 'success', message: 'Policy deleted successfully' });
            setDeleteConfirm(null);
        },
        onError: () => {
            addToast({ type: 'error', message: 'Failed to delete policy' });
        },
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 text-red-600 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    const handleNameChange = (value: string) => {
        const nextId = slugifyPolicyId(value);
        setFormData((previous) => ({
            ...previous,
            name: value,
            id: previous.id === '' || previous.id === slugifyPolicyId(previous.name) ? nextId : previous.id,
        }));
    };

    const toggleRole = (role: PolicyRole) => {
        setFormData((previous) => {
            const hasRole = previous.roles.includes(role);
            const roles = hasRole
                ? previous.roles.filter((entry) => entry !== role)
                : [...previous.roles, role];
            return {
                ...previous,
                roles,
            };
        });
    };

    const handleCreatePolicy = () => {
        if (!formData.id || !formData.name || !formData.description || formData.roles.length === 0) {
            addToast({
                type: 'warning',
                message: 'Complete the policy form before creating it',
            });
            return;
        }
        if (editingPolicy) {
            updateMutation.mutate({ policyId: editingPolicy.id, policy: formData });
            return;
        }
        createMutation.mutate(formData);
    };

    const openCreateModal = () => {
        setEditingPolicy(null);
        setFormData(DEFAULT_POLICY_FORM);
        setShowCreateModal(true);
    };

    const openEditModal = (policy: Policy) => {
        setEditingPolicy(policy);
        setFormData({
            id: policy.id,
            name: policy.name,
            description: policy.description,
            severity: policy.severity,
            roles: (policy.roles ?? ['admin', 'moderator', 'user']) as PolicyRole[],
        });
        setShowCreateModal(true);
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const modalTitle = editingPolicy ? 'Edit Security Policy' : 'Create Security Policy';
    const modalDescription = editingPolicy
        ? 'Update how this policy behaves in your workspace.'
        : 'Add a policy that can be referenced and managed from the Koreshield dashboard.';
    const submitLabel = editingPolicy ? 'Save changes' : 'Create policy';
    const permissionBanner = useMemo(() => {
        if (isAdmin) {
            return null;
        }
        return 'You can review workspace policies here, but only owners and admins can create, edit, or delete them.';
    }, [isAdmin]);

    return (
        <>
            <SEOMeta title="Policies" noindex />
            <AppPage>
                <AppPageHeader
                    eyebrow="Access control"
                    eyebrowIcon={Shield}
                    title="Policy Management"
                    description="Configure security policies and access control"
                    icon={Shield}
                    actions={
                        <AppPrimaryButton onClick={openCreateModal} disabled={!isAdmin} className="w-full sm:w-auto">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Create Policy</span>
                            <span className="sm:hidden">New Policy</span>
                        </AppPrimaryButton>
                    }
                />

                <AppStatGrid>
                    <AppStatCard label="Total Policies" value={policies.length} icon={Shield} />
                    <AppStatCard
                        label="Active"
                        value={policies.filter((p: Policy) => p.enabled !== false).length}
                        icon={CheckCircle}
                        tone="text-electric-green"
                    />
                    <AppStatCard
                        label="Critical"
                        value={policies.filter((p: Policy) => p.severity === 'critical').length}
                        icon={AlertTriangle}
                        tone="text-red-400"
                    />
                    <AppStatCard
                        label="Disabled"
                        value={policies.filter((p: Policy) => p.enabled === false).length}
                        icon={X}
                        tone="text-muted-foreground"
                    />
                </AppStatGrid>

                <div className="grid grid-cols-1 gap-6">
                    {(hasPermissionError || permissionBanner) && (
                        <AppCallout variant="warning">
                            {hasPermissionError
                                ? 'Policy management is only available to workspace owners and admins. If this is your first Koreshield workspace, sign out and sign back in once so your account can refresh its role before trying again.'
                                : permissionBanner}
                        </AppCallout>
                    )}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <AppSurface className="border-red-500/50 p-6 text-center">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
                            <p className="text-red-600 font-bold">Failed to load policies</p>
                            <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
                        </AppSurface>
                    ) : policies.length === 0 ? (
                        <AppEmptyState
                            icon={Shield}
                            title="No Policies Configured"
                            description="Create your first security policy to start protecting your LLM applications"
                            action={
                                <AppPrimaryButton onClick={openCreateModal} disabled={!isAdmin}>
                                    <Plus className="w-4 h-4" />
                                    Create Your First Policy
                                </AppPrimaryButton>
                            }
                        />
                    ) : (
                        policies.map((policy) => (
                            <AppSurface key={policy.id} className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold">{policy.name}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(policy.severity)}`}>
                                                    {policy.severity.toUpperCase()}
                                                </span>
                                                {policy.enabled !== false ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Enabled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                                                        <X className="w-3 h-3" />
                                                        Disabled
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">{policy.description}</p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Roles</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {policy.roles?.map((role: string) => (
                                                        <span key={role} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Actions</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {policy.actions?.map((action: string) => (
                                                        <span key={action} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-mono">
                                                            {action}
                                                        </span>
                                                    )) || <span className="text-xs text-muted-foreground">No actions defined</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Updated</div>
                                                <div className="text-sm">{policy.updated_at ? new Date(policy.updated_at).toLocaleDateString() : 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-4">
                                        <button
                                            onClick={() => openEditModal(policy)}
                                            disabled={!isAdmin}
                                            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(policy.id)}
                                            disabled={!isAdmin}
                                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Delete Confirmation */}
                                {deleteConfirm === policy.id && (
                                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                                        <p className="text-sm text-red-600 mb-3">
                                            Are you sure you want to delete this policy? This action cannot be undone.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <button
                                                onClick={() => deleteMutation.mutate(policy.id)}
                                                disabled={deleteMutation.isPending}
                                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm w-full sm:w-auto"
                                            >
                                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm w-full sm:w-auto"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </AppSurface>
                        ))
                    )}
                </div>
            </AppPage>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="dashboard-modal w-full max-w-2xl mx-4 sm:mx-auto rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90dvh] overflow-y-auto">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold">{modalTitle}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">{modalDescription}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setEditingPolicy(null);
                                    setFormData(DEFAULT_POLICY_FORM);
                                }}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label="Close create policy dialog"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="policy-name" className="mb-2 block text-sm font-medium">Policy name</label>
                                <input
                                    id="policy-name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(event) => handleNameChange(event.target.value)}
                                    placeholder="Protect prompt leakage"
                                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label htmlFor="policy-id" className="mb-2 block text-sm font-medium">Policy ID</label>
                                <input
                                    id="policy-id"
                                    type="text"
                                    value={formData.id}
                                    onChange={(event) => setFormData((previous) => ({ ...previous, id: slugifyPolicyId(event.target.value) }))}
                                    placeholder="protect-prompt-leakage"
                                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label htmlFor="policy-description" className="mb-2 block text-sm font-medium">Description</label>
                                <textarea
                                    id="policy-description"
                                    value={formData.description}
                                    onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
                                    rows={4}
                                    placeholder="Explain what this policy is intended to protect and when it should apply."
                                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="policy-severity" className="mb-2 block text-sm font-medium">Severity</label>
                                    <select
                                        id="policy-severity"
                                        value={formData.severity}
                                        onChange={(event) =>
                                            setFormData((previous) => ({
                                                ...previous,
                                                severity: event.target.value as Policy['severity'],
                                            }))
                                        }
                                        className="w-full rounded-lg border border-border bg-muted px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">Allowed roles</label>
                                    <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted p-3">
                                        {AVAILABLE_ROLES.map((role) => {
                                            const selected = formData.roles.includes(role);
                                            return (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => toggleRole(role)}
                                                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                                        selected
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    {role}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <AppSecondaryButton
                                type="button"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setEditingPolicy(null);
                                    setFormData(DEFAULT_POLICY_FORM);
                                }}
                                className="flex-1 w-full"
                                disabled={isSaving}
                            >
                                Cancel
                            </AppSecondaryButton>
                            <AppPrimaryButton
                                type="button"
                                onClick={handleCreatePolicy}
                                className="flex-1 w-full"
                                disabled={!isAdmin || isSaving}
                            >
                                {isSaving ? (editingPolicy ? 'Saving...' : 'Creating...') : submitLabel}
                            </AppPrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
