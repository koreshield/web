import { useState } from 'react';
import { Sliders, Plus, Edit, Trash2, Code, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';

interface Rule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    priority: number;
    conditions: {
        type: string;
        operator: string;
        value: any;
    }[];
    actions: {
        type: string;
        params: Record<string, any>;
    }[];
    created_at: string;
    updated_at: string;
}

export function RulesPage() {
    const [_showCreateModal, setShowCreateModal] = useState(false);
    const [_editingRule, setEditingRule] = useState<Rule | null>(null);
    
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch rules from API
    const { data: rules = [], isLoading } = useQuery<Rule[]>({
        queryKey: ['rules'],
        queryFn: async () => {
            return await api.getRules() as Rule[];
        },
        refetchInterval: 30000,
    });
    
    // Delete rule mutation
    const deleteRuleMutation = useMutation({
        mutationFn: (ruleId: string) => api.deleteRule(ruleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            success('Rule deleted successfully');
        },
        onError: (err: Error) => {
            showError(`Failed to delete rule: ${err.message}`);
        },
    });
    
    const handleDeleteRule = (ruleId: string, ruleName: string) => {
        if (confirm(`Are you sure you want to delete the rule "${ruleName}"? This action cannot be undone.`)) {
            deleteRuleMutation.mutate(ruleId);
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
                                <Sliders className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Rule Engine Configuration</h1>
                                <p className="text-sm text-muted-foreground">
                                    Define custom detection rules and automated responses
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Rule
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Total Rules</div>
                        <div className="text-3xl font-bold">{rules.length}</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Active</div>
                        <div className="text-3xl font-bold text-green-600">
                            {rules.filter(r => r.enabled).length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">High Priority</div>
                        <div className="text-3xl font-bold text-orange-600">
                            {rules.filter(r => r.priority >= 8).length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Disabled</div>
                        <div className="text-3xl font-bold text-gray-600">
                            {rules.filter(r => !r.enabled).length}
                        </div>
                    </div>
                </div>

                {/* Rules List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 bg-card border border-border rounded-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="bg-card border border-border rounded-lg p-12 text-center">
                            <Sliders className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No rules configured</p>
                        </div>
                    ) : (
                        rules
                            .sort((a, b) => b.priority - a.priority)
                            .map((rule) => (
                                <div key={rule.id} className="bg-card border border-border rounded-lg p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{rule.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    rule.priority >= 8 ? 'bg-red-500/10 text-red-600' :
                                                    rule.priority >= 5 ? 'bg-orange-500/10 text-orange-600' :
                                                    'bg-blue-500/10 text-blue-600'
                                                }`}>
                                                    Priority: {rule.priority}
                                                </span>
                                                {rule.enabled ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Enabled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500/10 text-gray-600 rounded-full text-xs font-medium">
                                                        <XCircle className="w-3 h-3" />
                                                        Disabled
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">{rule.description}</p>

                                            {/* Conditions */}
                                            <div className="mb-4">
                                                <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                                    <Code className="w-3 h-3" />
                                                    CONDITIONS
                                                </div>
                                                <div className="space-y-2">
                                                    {rule.conditions.map((condition, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-2 rounded font-mono">
                                                            <span className="text-blue-600">{condition.type}</span>
                                                            <span className="text-muted-foreground">{condition.operator}</span>
                                                            <span className="text-orange-600">{JSON.stringify(condition.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div>
                                                <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    ACTIONS
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {rule.actions.map((action, idx) => (
                                                        <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded text-xs font-mono">
                                                            {action.type}
                                                            {Object.keys(action.params).length > 0 && (
                                                                <span className="text-muted-foreground ml-2">
                                                                    ({Object.entries(action.params).map(([k, v]) => `${k}=${v}`).join(', ')})
                                                                </span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => setEditingRule(rule)}
                                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRule(rule.id, rule.name)}
                                                disabled={deleteRuleMutation.isPending}
                                                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                                        Last updated: {new Date(rule.updated_at).toLocaleString()}
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </main>
        </div>
    );
}
