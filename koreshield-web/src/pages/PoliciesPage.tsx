import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';

interface Policy {
    id: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    roles: string[];
    enabled?: boolean;
    conditions?: Record<string, any>;
    actions?: string[];
    created_at?: string;
    updated_at?: string;
}

export function PoliciesPage() {
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Fetch policies from real API
    const { data: policies = [], isLoading, error } = useQuery({
        queryKey: ['policies'],
        queryFn: async () => {
            const response = await api.getPolicies();
            return Array.isArray(response) ? response : [];
        },
        refetchInterval: 30000,
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
            default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

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
                                <h1 className="text-2xl font-bold">Policy Management</h1>
                                <p className="text-sm text-muted-foreground">
                                    Configure security policies and access control
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Policy
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Total Policies</div>
                        <div className="text-3xl font-bold">{policies.length}</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Active</div>
                        <div className="text-3xl font-bold text-green-600">
                            {policies.filter((p: Policy) => p.enabled !== false).length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Critical</div>
                        <div className="text-3xl font-bold text-red-600">
                            {policies.filter((p: Policy) => p.severity === 'critical').length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Disabled</div>
                        <div className="text-3xl font-bold text-gray-600">
                            {policies.filter((p: Policy) => p.enabled === false).length}
                        </div>
                    </div>
                </div>

                {/* Policies Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
                            <p className="text-red-600">Failed to load policies</p>
                            <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
                        </div>
                    ) : policies.length === 0 ? (
                        <div className="bg-card border border-border rounded-lg p-12 text-center">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No Policies Configured</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first security policy to start protecting your LLM applications
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                            >
                                <Plus className="w-4 h-4" />
                                Create Your First Policy
                            </button>
                        </div>
                    ) : (
                        policies.map((policy) => (
                            <div key={policy.id} className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold">{policy.name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(policy.severity)}`}>
                                                {policy.severity.toUpperCase()}
                                            </span>
                                            {policy.enabled !== false ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Enabled
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500/10 text-gray-600 rounded-full text-xs font-medium">
                                                    <X className="w-3 h-3" />
                                                    Disabled
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">{policy.description}</p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Roles</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {policy.roles?.map((role) => (
                                                        <span key={role} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Actions</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {policy.actions?.map((action) => (
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
                                    
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => setEditingPolicy(policy)}
                                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(policy.id)}
                                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
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
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => deleteMutation.mutate(policy.id)}
                                                disabled={deleteMutation.isPending}
                                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                                            >
                                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
