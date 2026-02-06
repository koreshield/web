import { useState } from 'react';
import { Users, Plus, Search, Shield, AlertCircle, CheckCircle, XCircle, Edit, Trash2, Key, Settings } from 'lucide-react';
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

export function TenantsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterTier, setFilterTier] = useState<string>('all');
    const [_selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [_showCreateModal, setShowCreateModal] = useState(false);
    
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-600';
            case 'suspended': return 'bg-yellow-500/10 text-yellow-600';
            case 'deactivated': return 'bg-red-500/10 text-red-600';
            default: return 'bg-gray-500/10 text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-4 h-4" />;
            case 'suspended': return <AlertCircle className="w-4 h-4" />;
            case 'deactivated': return <XCircle className="w-4 h-4" />;
            default: return <Shield className="w-4 h-4" />;
        }
    };

    const getTierBadge = (tier: string) => {
        const colors = {
            free: 'bg-gray-500/10 text-gray-600',
            starter: 'bg-blue-500/10 text-blue-600',
            professional: 'bg-purple-500/10 text-purple-600',
            enterprise: 'bg-orange-500/10 text-orange-600',
        };
        return colors[tier as keyof typeof colors] || colors.free;
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
                                <h1 className="text-2xl font-bold">Tenant Administration</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage multi-tenant infrastructure and configurations
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

                {/* Filters */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
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
                            <option value="all">All Statuses</option>
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

                {/* Tenants List */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : tenants.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No tenants found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted border-b border-border">
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
                                        <tr key={tenant.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium">{tenant.name}</div>
                                                    <div className="text-sm text-muted-foreground font-mono">
                                                        {tenant.tenant_id}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                                                    {getStatusIcon(tenant.status)}
                                                    {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTierBadge(tenant.tier)}`}>
                                                    {tenant.tier.charAt(0).toUpperCase() + tenant.tier.slice(1)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    {tenant.contact_name && <div>{tenant.contact_name}</div>}
                                                    {tenant.contact_email && (
                                                        <div className="text-muted-foreground">{tenant.contact_email}</div>
                                                    )}
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
                                                        onClick={() => setSelectedTenant(tenant)}
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
        </div>
    );
}
