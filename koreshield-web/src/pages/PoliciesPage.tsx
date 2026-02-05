import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, X, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Policy {
    id: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    roles: string[];
    enabled: boolean;
    conditions: Record<string, any>;
    actions: string[];
    created_at: string;
    updated_at: string;
}

export function PoliciesPage() {
    const [_editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
    const [_showCreateModal, setShowCreateModal] = useState(false);

    // Fetch policies
    const { data: policies = [], isLoading } = useQuery({
        queryKey: ['policies'],
        queryFn: async () => {
            // TODO: Replace with real API call
            return mockPolicies;
        },
        refetchInterval: 30000,
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
                            {policies.filter(p => p.enabled).length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Critical</div>
                        <div className="text-3xl font-bold text-red-600">
                            {policies.filter(p => p.severity === 'critical').length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Disabled</div>
                        <div className="text-3xl font-bold text-gray-600">
                            {policies.filter(p => !p.enabled).length}
                        </div>
                    </div>
                </div>

                {/* Policies Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : policies.length === 0 ? (
                        <div className="bg-card border border-border rounded-lg p-12 text-center">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No policies configured</p>
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
                                            {policy.enabled ? (
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
                                                    {policy.roles.map((role) => (
                                                        <span key={role} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Actions</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {policy.actions.map((action) => (
                                                        <span key={action} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-mono">
                                                            {action}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Updated</div>
                                                <div className="text-sm">{new Date(policy.updated_at).toLocaleDateString()}</div>
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
                                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}

// Mock data for development
const mockPolicies: Policy[] = [
    {
        id: '1',
        name: 'Prompt Injection Detection',
        description: 'Detect and block prompt injection attempts in user inputs',
        severity: 'critical',
        roles: ['user', 'admin'],
        enabled: true,
        conditions: {
            attack_types: ['prompt_injection', 'jailbreak'],
            confidence_threshold: 0.8,
        },
        actions: ['block', 'log', 'alert'],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-02-01T10:00:00Z',
    },
    {
        id: '2',
        name: 'PII Data Protection',
        description: 'Prevent personally identifiable information leakage',
        severity: 'high',
        roles: ['user'],
        enabled: true,
        conditions: {
            attack_types: ['pii_leakage', 'data_exfiltration'],
            confidence_threshold: 0.7,
        },
        actions: ['sanitize', 'log', 'warn'],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-15T14:30:00Z',
    },
    {
        id: '3',
        name: 'SQL Injection Prevention',
        description: 'Block SQL injection attempts in prompts',
        severity: 'critical',
        roles: ['user', 'admin', 'moderator'],
        enabled: true,
        conditions: {
            attack_types: ['sql_injection'],
            confidence_threshold: 0.9,
        },
        actions: ['block', 'log', 'alert'],
        created_at: '2026-01-05T00:00:00Z',
        updated_at: '2026-01-20T09:00:00Z',
    },
    {
        id: '4',
        name: 'Content Moderation',
        description: 'Filter inappropriate or harmful content',
        severity: 'medium',
        roles: ['user'],
        enabled: false,
        conditions: {
            attack_types: ['inappropriate_content'],
            confidence_threshold: 0.6,
        },
        actions: ['warn', 'log'],
        created_at: '2026-01-10T00:00:00Z',
        updated_at: '2026-01-25T11:15:00Z',
    },
];
