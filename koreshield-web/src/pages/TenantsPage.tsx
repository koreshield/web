import { useState } from 'react';
import { Users, Plus, Search, Shield, AlertCircle, CheckCircle, XCircle, Edit, Trash2, Key, Settings, X, TrendingUp, Activity, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';

interface Tenant {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    status: 'active' | 'suspended' | 'deactivated';
    tier: 'free' | 'starter' | 'professional' | 'enterprise';
    contact_email?: string;
    contact_name?: string;
    created_at: string;
    updated_at: string;
    max_requests_per_minute?: number;
    max_requests_per_hour?: number;
    max_requests_per_day?: number;
}

interface TenantFormData {
    tenant_id: string;
    name: string;
    description: string;
    tier: 'free' | 'starter' | 'professional' | 'enterprise';
    contact_email: string;
    contact_name: string;
    max_requests_per_minute: number;
    max_requests_per_hour: number;
    max_requests_per_day: number;
}

export function TenantsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterTier, setFilterTier] = useState<string>('all');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showUsageStatsModal, setShowUsageStatsModal] = useState(false);
    const [formData, setFormData] = useState<TenantFormData>({
        tenant_id: '',
        name: '',
        description: '',
        tier: 'starter',
        contact_email: '',
        contact_name: '',
        max_requests_per_minute: 100,
        max_requests_per_hour: 5000,
        max_requests_per_day: 100000,
    });
    
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    // Fetch tenants
    const { data: tenantsData = [], isLoading } = useQuery<Tenant[]>({
        queryKey: ['tenants', searchQuery, filterStatus, filterTier],
        queryFn: async () => {
            const params: any = {};
            if (filterStatus !== 'all') params.status = filterStatus;
            if (filterTier !== 'all') params.tier = filterTier;
            const data = await api.getTenants(params) as Tenant[];
            
            // Client-side search filtering
            if (searchQuery) {
                return data.filter(t => 
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.tenant_id.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            return data;
        },
        refetchInterval: 10000,
    });
    
    const tenants = tenantsData as Tenant[];

    // Fetch usage stats for selected tenant
    const { data: usageStats } = useQuery({
        queryKey: ['tenant-usage', selectedTenant?.tenant_id],
        queryFn: () => selectedTenant ? api.getTenantUsageStats(selectedTenant.tenant_id) : null,
        enabled: !!selectedTenant && showUsageStatsModal,
    });

    // Create tenant mutation
    const createTenantMutation = useMutation({
        mutationFn: (data: Partial<Tenant>) => api.createTenant(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            success('Tenant created successfully');
            setShowCreateModal(false);
            resetForm();
        },
        onError: () => {
            error('Failed to create tenant');
        },
    });

    // Update tenant mutation
    const updateTenantMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) => api.updateTenant(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            success('Tenant updated successfully');
            setShowEditModal(false);
            setSelectedTenant(null);
            resetForm();
        },
        onError: () => {
            error('Failed to update tenant');
        },
    });

    // Delete tenant mutation
    const deleteTenantMutation = useMutation({
        mutationFn: (tenantId: string) => api.deleteTenant(tenantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            success('Tenant deactivated successfully');
        },
        onError: () => {
            error('Failed to deactivate tenant');
        },
    });

    const handleDeleteTenant = (tenant: Tenant) => {
        if (confirm(`Are you sure you want to deactivate "${tenant.name}"? This action cannot be undone.`)) {
            deleteTenantMutation.mutate(tenant.tenant_id);
        }
    };

    const resetForm = () => {
        setFormData({
            tenant_id: '',
            name: '',
            description: '',
            tier: 'starter',
            contact_email: '',
            contact_name: '',
            max_requests_per_minute: 100,
            max_requests_per_hour: 5000,
            max_requests_per_day: 100000,
        });
    };

    const handleCreateTenant = (e: React.FormEvent) => {
        e.preventDefault();
        createTenantMutation.mutate(formData);
    };

    const handleUpdateTenant = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTenant) {
            updateTenantMutation.mutate({
                id: selectedTenant.tenant_id,
                data: formData,
            });
        }
    };

    const openEditModal = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setFormData({
            tenant_id: tenant.tenant_id,
            name: tenant.name,
            description: tenant.description || '',
            tier: tenant.tier,
            contact_email: tenant.contact_email || '',
            contact_name: tenant.contact_name || '',
            max_requests_per_minute: tenant.max_requests_per_minute || 100,
            max_requests_per_hour: tenant.max_requests_per_hour || 5000,
            max_requests_per_day: tenant.max_requests_per_day || 100000,
        });
        setShowEditModal(true);
    };

    const openUsageStats = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setShowUsageStatsModal(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-600';
            case 'suspended': return 'bg-yellow-500/10 text-yellow-600';
            case 'deactivated': return 'bg-red-500/10 text-red-600';
            default: return 'bg-gray-500/10 text-gray-600';
        }
    };

    const getTierBadgeColor = (tier: string) => {
        switch (tier) {
            case 'enterprise': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
            case 'professional': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'starter': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'free': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
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
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Tenant Management</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage multi-tenant infrastructure and access control
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Tenant
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 mt-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search tenants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="deactivated">Deactivated</option>
                        </select>
                        <select
                            value={filterTier}
                            onChange={(e) => setFilterTier(e.target.value)}
                            className="px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Tiers</option>
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="professional">Professional</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Total Tenants</div>
                        <div className="text-3xl font-bold">{tenants.length}</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Active</div>
                        <div className="text-3xl font-bold text-green-600">
                            {tenants.filter(t => t.status === 'active').length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Suspended</div>
                        <div className="text-3xl font-bold text-yellow-600">
                            {tenants.filter(t => t.status === 'suspended').length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Enterprise</div>
                        <div className="text-3xl font-bold text-purple-600">
                            {tenants.filter(t => t.tier === 'enterprise').length}
                        </div>
                    </div>
                </div>

                {/* Tenants Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : tenants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Users className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
                            <p className="text-muted-foreground">No tenants found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Tenant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Tier
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {tenants.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-muted/50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium">{tenant.name}</div>
                                                    <div className="text-sm text-muted-foreground">{tenant.tenant_id}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                                                    {tenant.status === 'active' && <CheckCircle className="w-3 h-3" />}
                                                    {tenant.status === 'suspended' && <AlertCircle className="w-3 h-3" />}
                                                    {tenant.status === 'deactivated' && <XCircle className="w-3 h-3" />}
                                                    {tenant.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getTierBadgeColor(tenant.tier)}`}>
                                                    <Shield className="w-3 h-3" />
                                                    {tenant.tier}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div>{tenant.contact_name || '-'}</div>
                                                    <div className="text-muted-foreground">{tenant.contact_email || '-'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(tenant.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openUsageStats(tenant)}
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title="Usage Stats"
                                                    >
                                                        <Activity className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(tenant)}
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title="API Keys"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title="Settings"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    {tenant.status !== 'deactivated' && (
                                                        <button
                                                            onClick={() => handleDeleteTenant(tenant)}
                                                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                                            title="Deactivate"
                                                            disabled={deleteTenantMutation.isPending}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Tenant Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Create New Tenant</h2>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tenant ID *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.tenant_id}
                                        onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="tenant_abc123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Acme Corporation"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={3}
                                    placeholder="Description of the tenant"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tier *</label>
                                    <select
                                        value={formData.tier}
                                        onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="free">Free</option>
                                        <option value="starter">Starter</option>
                                        <option value="professional">Professional</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Contact Name</label>
                                    <input
                                        type="text"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Contact Email</label>
                                <input
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="admin@acme.com"
                                />
                            </div>
                            <div className="border-t border-border pt-4 mt-4">
                                <h3 className="text-sm font-semibold mb-3">Rate Limits</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Per Minute</label>
                                        <input
                                            type="number"
                                            value={formData.max_requests_per_minute}
                                            onChange={(e) => setFormData({ ...formData, max_requests_per_minute: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Per Hour</label>
                                        <input
                                            type="number"
                                            value={formData.max_requests_per_hour}
                                            onChange={(e) => setFormData({ ...formData, max_requests_per_hour: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Per Day</label>
                                        <input
                                            type="number"
                                            value={formData.max_requests_per_day}
                                            onChange={(e) => setFormData({ ...formData, max_requests_per_day: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createTenantMutation.isPending}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {createTenantMutation.isPending ? 'Creating...' : 'Create Tenant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Tenant Modal */}
            {showEditModal && selectedTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Edit Tenant</h2>
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedTenant(null); resetForm(); }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateTenant} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tenant ID *</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={formData.tenant_id}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg opacity-50 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tier *</label>
                                    <select
                                        value={formData.tier}
                                        onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="free">Free</option>
                                        <option value="starter">Starter</option>
                                        <option value="professional">Professional</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Contact Name</label>
                                    <input
                                        type="text"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Contact Email</label>
                                <input
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="border-t border-border pt-4 mt-4">
                                <h3 className="text-sm font-semibold mb-3">Rate Limits</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Per Minute</label>
                                        <input
                                            type="number"
                                            value={formData.max_requests_per_minute}
                                            onChange={(e) => setFormData({ ...formData, max_requests_per_minute: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Per Hour</label>
                                        <input
                                            type="number"
                                            value={formData.max_requests_per_hour}
                                            onChange={(e) => setFormData({ ...formData, max_requests_per_hour: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Per Day</label>
                                        <input
                                            type="number"
                                            value={formData.max_requests_per_day}
                                            onChange={(e) => setFormData({ ...formData, max_requests_per_day: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setSelectedTenant(null); resetForm(); }}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateTenantMutation.isPending}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {updateTenantMutation.isPending ? 'Updating...' : 'Update Tenant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Usage Stats Modal */}
            {showUsageStatsModal && selectedTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h2 className="text-xl font-bold">{selectedTenant.name} - Usage Statistics</h2>
                                <p className="text-sm text-muted-foreground">{selectedTenant.tenant_id}</p>
                            </div>
                            <button
                                onClick={() => { setShowUsageStatsModal(false); setSelectedTenant(null); }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            {usageStats ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-muted/50 border border-border rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                <TrendingUp className="w-4 h-4" />
                                                Total Requests
                                            </div>
                                            <div className="text-2xl font-bold">{(usageStats as any).total_requests || 0}</div>
                                        </div>
                                        <div className="bg-muted/50 border border-border rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                <Activity className="w-4 h-4" />
                                                Requests Today
                                            </div>
                                            <div className="text-2xl font-bold">{(usageStats as any).requests_today || 0}</div>
                                        </div>
                                        <div className="bg-muted/50 border border-border rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                <Clock className="w-4 h-4" />
                                                Requests This Hour
                                            </div>
                                            <div className="text-2xl font-bold">{(usageStats as any).requests_this_hour || 0}</div>
                                        </div>
                                    </div>
                                    <div className="border-t border-border pt-4">
                                        <h3 className="text-sm font-semibold mb-3">Rate Limits</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Per Minute:</span>
                                                <span className="font-medium">{selectedTenant.max_requests_per_minute || 'Unlimited'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Per Hour:</span>
                                                <span className="font-medium">{selectedTenant.max_requests_per_hour || 'Unlimited'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Per Day:</span>
                                                <span className="font-medium">{selectedTenant.max_requests_per_day || 'Unlimited'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
