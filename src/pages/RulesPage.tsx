import { useState } from 'react';
import { Sliders, Plus, Edit, Trash2, Code, AlertTriangle, CheckCircle, XCircle, X, TestTube2, Loader } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import {
	AppPage,
	AppPageHeader,
	AppStatGrid,
	AppStatCard,
	AppEmptyState,
	AppPrimaryButton,
	AppSecondaryButton,
	AppCallout,
} from '../components/AppPageLayout';

interface Rule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    priority: number;
    pattern: string;
    pattern_type: 'regex' | 'keyword' | 'contains' | 'starts_with' | 'ends_with';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    action: 'block' | 'warn' | 'log' | 'allow';
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
    action: 'block' | 'warn' | 'log' | 'allow';
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
        priority: 5,
        pattern: '',
        pattern_type: 'contains',
        severity: 'medium',
        action: 'warn',
        tags: '',
    });
    const [testText, setTestText] = useState('');
    const [testResult, setTestResult] = useState<{ matches: boolean; message: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch rules from API
    const { data: rules = [], isLoading, isError, error: rulesError, refetch } = useQuery<Rule[]>({
        queryKey: ['rules'],
        queryFn: async () => {
            return await api.getRules() as Rule[];
        },
        refetchInterval: 30000,
        retry: 1,
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
            priority: 5,
            pattern: '',
            pattern_type: 'contains',
            severity: 'medium',
            action: 'warn',
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
                test_input: testText,
            });
            setTestResult(result as any);
        } catch {
            showError('Pattern test failed');
            setTestResult({ matches: false, message: 'Test failed' });
        } finally {
            setIsTesting(false);
        }
    };

    const handleCreateRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showError('Rule name is required');
            return;
        }
        if (!formData.description.trim()) {
            showError('Description is required');
            return;
        }
        if (!formData.pattern.trim()) {
            showError('Pattern is required');
            return;
        }
        const priority = Math.min(10, Math.max(1, formData.priority || 5));
        const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        createRuleMutation.mutate({
            ...formData,
            name: formData.name.trim(),
            description: formData.description.trim(),
            pattern: formData.pattern.trim(),
            priority,
            tags,
        });
    };

    const handleUpdateRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRule) return;
        if (!formData.description.trim()) {
            showError('Description is required');
            return;
        }
        const priority = Math.min(10, Math.max(1, formData.priority || 5));
        const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        updateRuleMutation.mutate({
            id: editingRule.id,
            data: {
                ...formData,
                description: formData.description.trim(),
                priority,
                tags,
            },
        });
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
            action: rule.action === 'flag' ? 'warn' : rule.action as RuleFormData['action'],
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
            case 'info': return 'bg-muted text-muted-foreground';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <>
            <SEOMeta title="Rules" noindex />
            <AppPage>
                <AppPageHeader
                    eyebrow="Detection"
                    eyebrowIcon={Sliders}
                    title="Rule Engine"
                    description="Define custom detection rules and automated responses"
                    icon={Sliders}
                    actions={
                        <AppPrimaryButton onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Create Rule</span>
                            <span className="sm:hidden">New Rule</span>
                        </AppPrimaryButton>
                    }
                />

                <AppStatGrid>
                    <AppStatCard label="Total Rules" value={rules.length} icon={Sliders} />
                    <AppStatCard
                        label="Active"
                        value={rules.filter(r => r.enabled).length}
                        icon={CheckCircle}
                        tone="text-electric-green"
                    />
                    <AppStatCard
                        label="Critical Severity"
                        value={rules.filter(r => r.severity === 'critical').length}
                        icon={AlertTriangle}
                        tone="text-red-400"
                    />
                    <AppStatCard
                        label="Block Actions"
                        value={rules.filter(r => r.action === 'block').length}
                        icon={XCircle}
                        tone="text-violet-400"
                    />
                </AppStatGrid>

                <div className="dashboard-card rounded-2xl overflow-hidden border border-border">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : isError ? (
                        <div className="p-6">
                            <AppCallout variant="warning">
                                <p className="font-medium text-foreground">Could not load rules</p>
                                <p className="mt-1">
                                    {rulesError instanceof Error ? rulesError.message : 'Unable to reach the rules API. Check that the backend is running and your plan includes Rules.'}
                                </p>
                            </AppCallout>
                            <div className="mt-4">
                                <AppSecondaryButton onClick={() => void refetch()}>
                                    Try again
                                </AppSecondaryButton>
                            </div>
                        </div>
                    ) : rules.length === 0 ? (
                        <AppEmptyState
                            icon={Sliders}
                            title="No rules found"
                            description="Create your first detection rule to start protecting traffic"
                            action={
                                <AppPrimaryButton onClick={() => setShowCreateModal(true)}>
                                    <Plus className="w-4 h-4" />
                                    Create Rule
                                </AppPrimaryButton>
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                Rule
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                Pattern
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                Severity
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                Action
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
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
                                                        : 'bg-muted text-muted-foreground'
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
                        </div>
                    )}
                </div>
            </AppPage>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="dashboard-modal bg-card border border-border rounded-2xl w-full max-w-3xl mx-4 sm:mx-auto max-h-[90dvh] overflow-y-auto">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        min={1}
                                        max={10}
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 5 })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={2}
                                    placeholder="Rule description"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                        <option value="warn">Warn</option>
                                        <option value="log">Log</option>
                                        <option value="allow">Allow</option>
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
                                <AppSecondaryButton type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                                    Cancel
                                </AppSecondaryButton>
                                <AppPrimaryButton type="submit" disabled={createRuleMutation.isPending}>
                                    {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
                                </AppPrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editingRule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="dashboard-modal bg-card border border-border rounded-2xl w-full max-w-3xl mx-4 sm:mx-auto max-h-[90dvh] overflow-y-auto">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        min={1}
                                        max={10}
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 5 })}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                        <option value="warn">Warn</option>
                                        <option value="log">Log</option>
                                        <option value="allow">Allow</option>
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
                                <AppSecondaryButton type="button" onClick={() => { setShowEditModal(false); setEditingRule(null); resetForm(); }}>
                                    Cancel
                                </AppSecondaryButton>
                                <AppPrimaryButton type="submit" disabled={updateRuleMutation.isPending}>
                                    {updateRuleMutation.isPending ? 'Updating...' : 'Update Rule'}
                                </AppPrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
