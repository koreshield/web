import { useState } from 'react';
import { Bell, Plus, Edit, Trash2, Mail, MessageSquare, Webhook, AlertTriangle, CheckCircle, Clock, X, TestTube2, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';

interface AlertRule {
    id: string;
    name: string;
    description: string;
    condition: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    enabled: boolean;
    channels: string[];
    cooldown_minutes: number;
    last_triggered?: string;
    trigger_count: number;
}

interface AlertChannel {
    id: string;
    type: 'email' | 'slack' | 'webhook' | 'teams' | 'pagerduty';
    name: string;
    enabled: boolean;
    config: Record<string, any>;
}

interface AlertRuleFormData {
    name: string;
    description: string;
    condition: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    enabled: boolean;
    channels: string;
    cooldown_minutes: number;
}

interface AlertChannelFormData {
    type: 'email' | 'slack' | 'webhook' | 'teams' | 'pagerduty';
    name: string;
    enabled: boolean;
    config: {
        // Email
        recipients?: string;
        // Slack
        webhook_url?: string;
        channel?: string;
        // Webhook
        url?: string;
        method?: string;
        headers?: string;
        // Teams
        teams_webhook_url?: string;
        // PagerDuty
        integration_key?: string;
    };
}

export function AlertsPage() {
    const [activeTab, setActiveTab] = useState<'rules' | 'channels'>('rules');
    const [showCreateRule, setShowCreateRule] = useState(false);
    const [showEditRule, setShowEditRule] = useState(false);
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [showEditChannel, setShowEditChannel] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
    const [editingChannel, setEditingChannel] = useState<AlertChannel | null>(null);
    const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
    
    const [ruleFormData, setRuleFormData] = useState<AlertRuleFormData>({
        name: '',
        description: '',
        condition: '',
        severity: 'medium',
        enabled: true,
        channels: '',
        cooldown_minutes: 60,
    });

    const [channelFormData, setChannelFormData] = useState<AlertChannelFormData>({
        type: 'email',
        name: '',
        enabled: true,
        config: {},
    });

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch alert rules from API
    const { data: rules = [], isLoading: rulesLoading } = useQuery<AlertRule[]>({
        queryKey: ['alert-rules'],
        queryFn: async () => {
            return await api.getAlertRules() as AlertRule[];
        },
        refetchInterval: 30000,
    });

    // Fetch alert channels from API
    const { data: channels = [], isLoading: channelsLoading } = useQuery<AlertChannel[]>({
        queryKey: ['alert-channels'],
        queryFn: async () => {
            return await api.getAlertChannels() as AlertChannel[];
        },
        refetchInterval: 30000,
    });

    // Create rule mutation
    const createRuleMutation = useMutation({
        mutationFn: (data: Partial<AlertRule>) => api.createAlertRule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
            success('Alert rule created successfully');
            setShowCreateRule(false);
            resetRuleForm();
        },
        onError: (err: Error) => {
            showError(`Failed to create alert rule: ${err.message}`);
        },
    });

    // Update rule mutation
    const updateRuleMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AlertRule> }) => api.updateAlertRule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
            success('Alert rule updated successfully');
            setShowEditRule(false);
            setEditingRule(null);
            resetRuleForm();
        },
        onError: (err: Error) => {
            showError(`Failed to update alert rule: ${err.message}`);
        },
    });

    // Delete rule mutation
    const deleteRuleMutation = useMutation({
        mutationFn: (ruleId: string) => api.deleteAlertRule(ruleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
            success('Alert rule deleted successfully');
        },
        onError: (err: Error) => {
            showError(`Failed to delete alert rule: ${err.message}`);
        },
    });

    // Create channel mutation
    const createChannelMutation = useMutation({
        mutationFn: (data: Partial<AlertChannel>) => api.createAlertChannel(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-channels'] });
            success('Alert channel created successfully');
            setShowCreateChannel(false);
            resetChannelForm();
        },
        onError: (err: Error) => {
            showError(`Failed to create alert channel: ${err.message}`);
        },
    });

    // Update channel mutation
    const updateChannelMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AlertChannel> }) => api.updateAlertChannel(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-channels'] });
            success('Alert channel updated successfully');
            setShowEditChannel(false);
            setEditingChannel(null);
            resetChannelForm();
        },
        onError: (err: Error) => {
            showError(`Failed to update alert channel: ${err.message}`);
        },
    });

    // Delete channel mutation
    const deleteChannelMutation = useMutation({
        mutationFn: (channelId: string) => api.deleteAlertChannel(channelId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-channels'] });
            success('Alert channel deleted successfully');
        },
        onError: (err: Error) => {
            showError(`Failed to delete alert channel: ${err.message}`);
        },
    });

    const handleDeleteRule = (ruleId: string, ruleName: string) => {
        if (confirm(`Are you sure you want to delete the alert rule "${ruleName}"? This action cannot be undone.`)) {
            deleteRuleMutation.mutate(ruleId);
        }
    };

    const handleDeleteChannel = (channelId: string, channelName: string) => {
        if (confirm(`Are you sure you want to delete the alert channel "${channelName}"? This action cannot be undone.`)) {
            deleteChannelMutation.mutate(channelId);
        }
    };

    const handleTestChannel = async (channelId: string) => {
        setTestingChannelId(channelId);
        try {
            const result = await api.testAlertChannel(channelId);
            if ((result as any).success) {
                success('Test notification sent successfully');
            } else {
                showError('Test notification failed');
            }
        } catch (err) {
            showError('Failed to send test notification');
        } finally {
            setTestingChannelId(null);
        }
    };

    const resetRuleForm = () => {
        setRuleFormData({
            name: '',
            description: '',
            condition: '',
            severity: 'medium',
            enabled: true,
            channels: '',
            cooldown_minutes: 60,
        });
    };

    const resetChannelForm = () => {
        setChannelFormData({
            type: 'email',
            name: '',
            enabled: true,
            config: {},
        });
    };

    const handleCreateRule = (e: React.FormEvent) => {
        e.preventDefault();
        const channelsList = ruleFormData.channels ? ruleFormData.channels.split(',').map(c => c.trim()).filter(Boolean) : [];
        createRuleMutation.mutate({
            ...ruleFormData,
            channels: channelsList,
        });
    };

    const handleUpdateRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRule) {
            const channelsList = ruleFormData.channels ? ruleFormData.channels.split(',').map(c => c.trim()).filter(Boolean) : [];
            updateRuleMutation.mutate({
                id: editingRule.id,
                data: {
                    ...ruleFormData,
                    channels: channelsList,
                },
            });
        }
    };

    const handleCreateChannel = (e: React.FormEvent) => {
        e.preventDefault();
        createChannelMutation.mutate(channelFormData);
    };

    const handleUpdateChannel = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingChannel) {
            updateChannelMutation.mutate({
                id: editingChannel.id,
                data: channelFormData,
            });
        }
    };

    const openEditRule = (rule: AlertRule) => {
        setEditingRule(rule);
        setRuleFormData({
            name: rule.name,
            description: rule.description,
            condition: rule.condition,
            severity: rule.severity,
            enabled: rule.enabled,
            channels: rule.channels.join(', '),
            cooldown_minutes: rule.cooldown_minutes,
        });
        setShowEditRule(true);
    };

    const openEditChannel = (channel: AlertChannel) => {
        setEditingChannel(channel);
        setChannelFormData({
            type: channel.type,
            name: channel.name,
            enabled: channel.enabled,
            config: { ...channel.config },
        });
        setShowEditChannel(true);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 text-red-600';
            case 'high': return 'bg-orange-500/10 text-orange-600';
            case 'medium': return 'bg-yellow-500/10 text-yellow-600';
            case 'low': return 'bg-blue-500/10 text-blue-600';
            default: return 'bg-gray-500/10 text-gray-600';
        }
    };

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail className="w-4 h-4" />;
            case 'slack': return <MessageSquare className="w-4 h-4" />;
            case 'webhook': return <Webhook className="w-4 h-4" />;
            case 'teams': return <MessageSquare className="w-4 h-4" />;
            case 'pagerduty': return <AlertTriangle className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    const renderChannelConfigInputs = () => {
        switch (channelFormData.type) {
            case 'email':
                return (
                    <div>
                        <label className="block text-sm font-medium mb-2">Recipients (comma-separated) *</label>
                        <input
                            type="text"
                            required
                            value={channelFormData.config.recipients || ''}
                            onChange={(e) => setChannelFormData({ 
                                ...channelFormData, 
                                config: { ...channelFormData.config, recipients: e.target.value } 
                            })}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="admin@example.com, ops@example.com"
                        />
                    </div>
                );
            case 'slack':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Webhook URL *</label>
                            <input
                                type="url"
                                required
                                value={channelFormData.config.webhook_url || ''}
                                onChange={(e) => setChannelFormData({ 
                                    ...channelFormData, 
                                    config: { ...channelFormData.config, webhook_url: e.target.value } 
                                })}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="https://hooks.slack.com/services/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Channel (optional)</label>
                            <input
                                type="text"
                                value={channelFormData.config.channel || ''}
                                onChange={(e) => setChannelFormData({ 
                                    ...channelFormData, 
                                    config: { ...channelFormData.config, channel: e.target.value } 
                                })}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="#alerts"
                            />
                        </div>
                    </div>
                );
            case 'webhook':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Webhook URL *</label>
                            <input
                                type="url"
                                required
                                value={channelFormData.config.url || ''}
                                onChange={(e) => setChannelFormData({ 
                                    ...channelFormData, 
                                    config: { ...channelFormData.config, url: e.target.value } 
                                })}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="https://your-webhook-url.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Method</label>
                            <select
                                value={channelFormData.config.method || 'POST'}
                                onChange={(e) => setChannelFormData({ 
                                    ...channelFormData, 
                                    config: { ...channelFormData.config, method: e.target.value } 
                                })}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Headers (JSON, optional)</label>
                            <textarea
                                value={channelFormData.config.headers || ''}
                                onChange={(e) => setChannelFormData({ 
                                    ...channelFormData, 
                                    config: { ...channelFormData.config, headers: e.target.value } 
                                })}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                                rows={3}
                                placeholder='{"Authorization": "Bearer token"}'
                            />
                        </div>
                    </div>
                );
            case 'teams':
                return (
                    <div>
                        <label className="block text-sm font-medium mb-2">Teams Webhook URL *</label>
                        <input
                            type="url"
                            required
                            value={channelFormData.config.teams_webhook_url || ''}
                            onChange={(e) => setChannelFormData({ 
                                ...channelFormData, 
                                config: { ...channelFormData.config, teams_webhook_url: e.target.value } 
                            })}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="https://outlook.office.com/webhook/..."
                        />
                    </div>
                );
            case 'pagerduty':
                return (
                    <div>
                        <label className="block text-sm font-medium mb-2">Integration Key *</label>
                        <input
                            type="text"
                            required
                            value={channelFormData.config.integration_key || ''}
                            onChange={(e) => setChannelFormData({ 
                                ...channelFormData, 
                                config: { ...channelFormData.config, integration_key: e.target.value } 
                            })}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="your-pagerduty-integration-key"
                        />
                    </div>
                );
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
                                <Bell className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Alert Management</h1>
                                <p className="text-sm text-muted-foreground">
                                    Configure alert rules and notification channels
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => activeTab === 'rules' ? setShowCreateRule(true) : setShowCreateChannel(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {activeTab === 'rules' ? 'Create Rule' : 'Create Channel'}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-6 border-b border-border">
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'rules'
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Alert Rules
                        </button>
                        <button
                            onClick={() => setActiveTab('channels')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'channels'
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Notification Channels
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Rules Tab */}
                {activeTab === 'rules' && (
                    <>
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
                                <div className="text-sm text-muted-foreground mb-1">Critical</div>
                                <div className="text-3xl font-bold text-red-600">
                                    {rules.filter(r => r.severity === 'critical').length}
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Total Triggers</div>
                                <div className="text-3xl font-bold text-purple-600">
                                    {rules.reduce((acc, r) => acc + r.trigger_count, 0)}
                                </div>
                            </div>
                        </div>

                        {/* Rules Table */}
                        <div className="bg-card border border-border rounded-lg overflow-hidden">
                            {rulesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : rules.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Bell className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
                                    <p className="text-muted-foreground">No alert rules found</p>
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
                                                    Condition
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Severity
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Channels
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
                                                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                                            {rule.condition}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(rule.severity)}`}>
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {rule.severity}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm">{rule.channels.length}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                                            rule.enabled 
                                                                ? 'bg-green-500/10 text-green-600' 
                                                                : 'bg-gray-500/10 text-gray-600'
                                                        }`}>
                                                            {rule.enabled ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                            {rule.enabled ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditRule(rule)}
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
                    </>
                )}

                {/* Channels Tab */}
                {activeTab === 'channels' && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Total Channels</div>
                                <div className="text-3xl font-bold">{channels.length}</div>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Active</div>
                                <div className="text-3xl font-bold text-green-600">
                                    {channels.filter(c => c.enabled).length}
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Email</div>
                                <div className="text-3xl font-bold text-blue-600">
                                    {channels.filter(c => c.type === 'email').length}
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Webhooks</div>
                                <div className="text-3xl font-bold text-purple-600">
                                    {channels.filter(c => c.type === 'webhook').length}
                                </div>
                            </div>
                        </div>

                        {/* Channels Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {channelsLoading ? (
                                <div className="col-span-full flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : channels.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-12">
                                    <Bell className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
                                    <p className="text-muted-foreground">No notification channels found</p>
                                </div>
                            ) : (
                                channels.map((channel) => (
                                    <div key={channel.id} className="bg-card border border-border rounded-lg p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    {getChannelIcon(channel.type)}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">{channel.name}</h3>
                                                    <p className="text-sm text-muted-foreground capitalize">{channel.type}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                channel.enabled 
                                                    ? 'bg-green-500/10 text-green-600' 
                                                    : 'bg-gray-500/10 text-gray-600'
                                            }`}>
                                                {channel.enabled ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleTestChannel(channel.id)}
                                                disabled={testingChannelId === channel.id}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                                            >
                                                {testingChannelId === channel.id ? (
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <TestTube2 className="w-4 h-4" />
                                                )}
                                                Test
                                            </button>
                                            <button
                                                onClick={() => openEditChannel(channel)}
                                                className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteChannel(channel.id, channel.name)}
                                                className="px-3 py-2 border border-border text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                                                disabled={deleteChannelMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Create Alert Rule Modal */}
            {showCreateRule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Create Alert Rule</h2>
                            <button
                                onClick={() => { setShowCreateRule(false); resetRuleForm(); }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRule} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Rule Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={ruleFormData.name}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="High Error Rate Alert"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={ruleFormData.description}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={2}
                                    placeholder="Alert when error rate exceeds threshold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Condition *</label>
                                <input
                                    type="text"
                                    required
                                    value={ruleFormData.condition}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, condition: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                                    placeholder="error_rate > 0.05"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Severity *</label>
                                    <select
                                        value={ruleFormData.severity}
                                        onChange={(e) => setRuleFormData({ ...ruleFormData, severity: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="critical">Critical</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Cooldown (minutes)</label>
                                    <input
                                        type="number"
                                        value={ruleFormData.cooldown_minutes}
                                        onChange={(e) => setRuleFormData({ ...ruleFormData, cooldown_minutes: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Notification Channels (comma-separated IDs)</label>
                                <input
                                    type="text"
                                    value={ruleFormData.channels}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, channels: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="email-primary, slack-ops"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={ruleFormData.enabled}
                                        onChange={(e) => setRuleFormData({ ...ruleFormData, enabled: e.target.checked })}
                                        className="rounded border-border"
                                    />
                                    <span className="text-sm font-medium">Enable rule immediately</span>
                                </label>
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateRule(false); resetRuleForm(); }}
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

            {/* Edit Alert Rule Modal */}
            {showEditRule && editingRule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Edit Alert Rule</h2>
                            <button
                                onClick={() => { setShowEditRule(false); setEditingRule(null); resetRuleForm(); }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRule} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Rule Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={ruleFormData.name}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={ruleFormData.description}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Condition *</label>
                                <input
                                    type="text"
                                    required
                                    value={ruleFormData.condition}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, condition: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Severity *</label>
                                    <select
                                        value={ruleFormData.severity}
                                        onChange={(e) => setRuleFormData({ ...ruleFormData, severity: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="critical">Critical</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Cooldown (minutes)</label>
                                    <input
                                        type="number"
                                        value={ruleFormData.cooldown_minutes}
                                        onChange={(e) => setRuleFormData({ ...ruleFormData, cooldown_minutes: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Notification Channels (comma-separated IDs)</label>
                                <input
                                    type="text"
                                    value={ruleFormData.channels}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, channels: e.target.value })}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={ruleFormData.enabled}
                                        onChange={(e) => setRuleFormData({ ...ruleFormData, enabled: e.target.checked })}
                                        className="rounded border-border"
                                    />
                                    <span className="text-sm font-medium">Enable rule</span>
                                </label>
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditRule(false); setEditingRule(null); resetRuleForm(); }}
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

            {/* Create Alert Channel Modal */}
            {showCreateChannel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Create Notification Channel</h2>
                            <button
                                onClick={() => { setShowCreateChannel(false); resetChannelForm(); }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateChannel} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Channel Type *</label>
                                    <select
                                        value={channelFormData.type}
                                        onChange={(e) => setChannelFormData({ ...channelFormData, type: e.target.value as any, config: {} })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="email">Email</option>
                                        <option value="slack">Slack</option>
                                        <option value="webhook">Webhook</option>
                                        <option value="teams">Microsoft Teams</option>
                                        <option value="pagerduty">PagerDuty</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Channel Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={channelFormData.name}
                                        onChange={(e) => setChannelFormData({ ...channelFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Primary Email Channel"
                                    />
                                </div>
                            </div>
                            
                            {renderChannelConfigInputs()}

                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={channelFormData.enabled}
                                        onChange={(e) => setChannelFormData({ ...channelFormData, enabled: e.target.checked })}
                                        className="rounded border-border"
                                    />
                                    <span className="text-sm font-medium">Enable channel immediately</span>
                                </label>
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateChannel(false); resetChannelForm(); }}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createChannelMutation.isPending}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {createChannelMutation.isPending ? 'Creating...' : 'Create Channel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Alert Channel Modal */}
            {showEditChannel && editingChannel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Edit Notification Channel</h2>
                            <button
                                onClick={() => { setShowEditChannel(false); setEditingChannel(null); resetChannelForm(); }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateChannel} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Channel Type *</label>
                                    <select
                                        disabled
                                        value={channelFormData.type}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg opacity-50 cursor-not-allowed"
                                    >
                                        <option value="email">Email</option>
                                        <option value="slack">Slack</option>
                                        <option value="webhook">Webhook</option>
                                        <option value="teams">Microsoft Teams</option>
                                        <option value="pagerduty">PagerDuty</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Channel Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={channelFormData.name}
                                        onChange={(e) => setChannelFormData({ ...channelFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            
                            {renderChannelConfigInputs()}

                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={channelFormData.enabled}
                                        onChange={(e) => setChannelFormData({ ...channelFormData, enabled: e.target.checked })}
                                        className="rounded border-border"
                                    />
                                    <span className="text-sm font-medium">Enable channel</span>
                                </label>
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditChannel(false); setEditingChannel(null); resetChannelForm(); }}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateChannelMutation.isPending}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {updateChannelMutation.isPending ? 'Updating...' : 'Update Channel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
