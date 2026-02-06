import { useState } from 'react';
import { Sliders, Plus, Edit, Trash2, Code, AlertTriangle, CheckCircle, XCircle, X, TestTube2, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';

interface Rule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    priority: number;
    pattern: string;
    pattern_type: 'regex' | 'keyword' | 'contains' | 'starts_with' | 'ends_with';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    action: 'block' | 'flag' | 'log' | 'warn';
    tags?: string[];
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

interface RuleFormData {
    name: string;
    description: string;
    enabled: boolean;
    priority: number;
    pattern: string;
    pattern_type: 'regex' | 'keyword' | 'contains' | 'starts_with' | 'ends_with';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    action: 'block' | 'flag' | 'log' | 'warn';
    tags: string;
}

export function RulesPage() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [formData, setFormData] = useState<RuleFormData>({
        name: '',
        description: '',
        enabled: true,
        priority: 100,
        pattern: '',
        pattern_type: 'contains',
        severity: 'medium',
        action: 'flag',
        tags: '',
    });
    const [testText, setTestText] = useState('');
    const [testResult, setTestResult] = useState<{ matches: boolean; message: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    
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

    // Create rule mutation
    const createRuleMutation = useMutation({
        mutationFn: (data: Partial<Rule>) => api.createRule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            success('Rule created successfully');
            setShowCreateModal(false);
            resetForm();
        },
        onError: (err: Error) => {
            showError(`Failed to create rule: ${err.message}`);
        },
    });

    // Update rule mutation
    const updateRuleMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Rule> }) => api.updateRule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            success('Rule updated successfully');
            setShowEditModal(false);
            setEditingRule(null);
            resetForm();
        },
        onError: (err: Error) => {
            showError(`Failed to update rule: ${err.message}`);
        },
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

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            enabled: true,
            priority: 100,
            pattern: '',
            pattern_type: 'contains',
            severity: 'medium',
            action: 'flag',
            tags: '',
        });
        setTestText('');
        setTestResult(null);
    };

    const handleTestPattern = async () => {
        if (!formData.pattern || !testText) {
            showError('Please enter both a pattern and test text');
            return;
        }
        
        setIsTesting(true);
        try {
            const result = await api.testRule({
                pattern: formData.pattern,
                pattern_type: formData.pattern_type,
                test_text: testText,
            });
            setTestResult(result as any);
        } catch (err) {
            showError('Pattern test failed');
            setTestResult({ matches: false, message: 'Test failed' });
        } finally {
            setIsTesting(false);
        }
    };

    const handleCreateRule = (e: React.FormEvent) => {
        e.preventDefault();
        const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        createRuleMutation.mutate({
            ...formData,
            tags,
        });
    };

    const handleUpdateRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRule) {
            const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
            updateRuleMutation.mutate({
                id: editingRule.id,
                data: {
                    ...formData,
                    tags,
                },
            });
        }
    };

    const openEditModal = (rule: Rule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            description: rule.description,
            enabled: rule.enabled,
            priority: rule.priority,
            pattern: rule.pattern,
            pattern_type: rule.pattern_type,
            severity: rule.severity,
            action: rule.action,
            tags: rule.tags?.join(', ') || '',
        });
        setShowEditModal(true);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 text-red-600';
            case 'high': return 'bg-orange-500/10 text-orange-600';
            case 'medium': return 'bg-yellow-500/10 text-yellow-600';
            case 'low': return 'bg-blue-500/10 text-blue-600';
            case 'info': return 'bg-gray-500/10 text-gray-600';
            default: return 'bg-gray-500/10 text-gray-600';
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
                        <div className="text-sm text-muted-foreground mb-1">Critical Severity</div>
                        <div className="text-3xl font-bold text-red-600">
                            {rules.filter(r => r.severity === 'critical').length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Block Actions</div>
                        <div className="text-3xl font-bold text-purple-600">
                            {rules.filter(r => r.action === 'block').length}
                        </div>
                    </div>
                </div>

                {/* Rules Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Sliders className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
                            <p className="text-muted-foreground">No rules found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Rule
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Pattern
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Severity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {rules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-muted/50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium">{rule.name}</div>
                                                    <div className="text-sm text-muted-foreground">{rule.description}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Code className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                                        {rule.pattern_type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(rule.severity)}`}>
                                                    {rule.severity === 'critical' && <AlertTriangle className="w-3 h-3" />}
                                                    {rule.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium capitalize">{rule.action}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                                    rule.enabled 
                                                        ? 'bg-green-500/10 text-green-600' 
                                                        : 'bg-gray-500/10 text-gray-600'
                                                }`}>
                                                    {rule.enabled ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {rule.enabled ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(rule)}
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRule(rule.id, rule.name)}
                                                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                                        title="Delete"
                                                        disabled={deleteRuleMutation.isPending}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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

            {/* Create Rule Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Create New Rule</h2>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRule} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Rule Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="My Rule"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Priority</label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
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
                                    rows={2}
                                    placeholder="Rule description"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Pattern Type *</label>
                                    <select
                                        value={formData.pattern_type}
                                        onChange={(e) => setFormData({ ...formData, pattern_type: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="contains">Contains</option>
                                        <option value="regex">Regex</option>
                                        <option value="keyword">Keyword</option>
                                        <option value="starts_with">Starts With</option>
                                        <option value="ends_with">Ends With</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Pattern *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.pattern}
                                        onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                                        placeholder="pattern"
                                    />
                                </div>
                            </div>
                            
                            {/* Pattern Testing */}
                            <div className="border-t border-border pt-4 mt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <TestTube2 className="w-4 h-4" />
                                    <h3 className="text-sm font-semibold">Test Pattern</h3>
                                </div>
                                <div className="space-y-2">
                                    <textarea
                                        value={testText}
                                        onChange={(e) => setTestText(e.target.value)}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows={3}
                                        placeholder="Enter test text to check if pattern matches..."
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleTestPattern}
                                            disabled={isTesting}
                                            className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                                        >
                                            {isTesting ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
                                            Test Pattern
                                        </button>
                                        {testResult && (
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                                                testResult.matches 
                                                    ? 'bg-green-500/10 text-green-600' 
                                                    : 'bg-red-500/10 text-red-600'
                                            }`}>
                                                {testResult.matches ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                <span className="text-sm font-medium">{testResult.message}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Severity *</label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="critical">Critical</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                        <option value="info">Info</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Action *</label>
                                    <select
                                        value={formData.action}
                                        onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="block">Block</option>
                                        <option value="flag">Flag</option>
                                        <option value="log">Log</option>
                                        <option value="warn">Warn</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Status</label>
                                    <select
                                        value={formData.enabled ? 'enabled' : 'disabled'}
                                        onChange={(e) => setFormData({ ...formData, enabled: e.target.value === 'enabled' })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="enabled">Enabled</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="security, prompt-injection, pii"
                                />
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
                                    disabled={createRuleMutation.isPending}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Rule Modal */}
            {showEditModal && editingRule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Edit Rule</h2>
                            <button
                                onClick={() => { setShowEditModal(false); setEditingRule(null); resetForm(); }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRule} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Rule Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Priority</label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
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
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Pattern Type *</label>
                                    <select
                                        value={formData.pattern_type}
                                        onChange={(e) => setFormData({ ...formData, pattern_type: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="contains">Contains</option>
                                        <option value="regex">Regex</option>
                                        <option value="keyword">Keyword</option>
                                        <option value="starts_with">Starts With</option>
                                        <option value="ends_with">Ends With</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Pattern *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.pattern}
                                        onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                                    />
                                </div>
                            </div>
                            
                            {/* Pattern Testing */}
                            <div className="border-t border-border pt-4 mt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <TestTube2 className="w-4 h-4" />
                                    <h3 className="text-sm font-semibold">Test Pattern</h3>
                                </div>
                                <div className="space-y-2">
                                    <textarea
                                        value={testText}
                                        onChange={(e) => setTestText(e.target.value)}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows={3}
                                        placeholder="Enter test text to check if pattern matches..."
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleTestPattern}
                                            disabled={isTesting}
                                            className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                                        >
                                            {isTesting ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
                                            Test Pattern
                                        </button>
                                        {testResult && (
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                                                testResult.matches 
                                                    ? 'bg-green-500/10 text-green-600' 
                                                    : 'bg-red-500/10 text-red-600'
                                            }`}>
                                                {testResult.matches ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                <span className="text-sm font-medium">{testResult.message}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Severity *</label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="critical">Critical</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                        <option value="info">Info</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Action *</label>
                                    <select
                                        value={formData.action}
                                        onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="block">Block</option>
                                        <option value="flag">Flag</option>
                                        <option value="log">Log</option>
                                        <option value="warn">Warn</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Status</label>
                                    <select
                                        value={formData.enabled ? 'enabled' : 'disabled'}
                                        onChange={(e) => setFormData({ ...formData, enabled: e.target.value === 'enabled' })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="enabled">Enabled</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="security, prompt-injection, pii"
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingRule(null); resetForm(); }}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateRuleMutation.isPending}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {updateRuleMutation.isPending ? 'Updating...' : 'Update Rule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
