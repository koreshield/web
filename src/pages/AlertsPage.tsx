import { useState } from 'react';
import { Bell, Plus, Edit, Trash2, Mail, MessageSquare, Webhook, AlertTriangle, CheckCircle, Clock, X, TestTube2, Loader, Send } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import {
	AppPage,
	AppPageHeader,
	AppStatGrid,
	AppStatCard,
	AppCallout,
	AppEmptyState,
	AppPrimaryButton,
	AppSecondaryButton,
	AppPageSection,
	AppSurface,
} from '../components/AppPageLayout';

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
    type: 'email' | 'slack' | 'webhook' | 'teams' | 'telegram' | 'pagerduty';
    name: string;
    enabled: boolean;
    config: Record<string, unknown>;
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
    type: 'email' | 'slack' | 'webhook' | 'teams' | 'telegram' | 'pagerduty';
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
        // Telegram
        bot_token?: string;
        channel_id?: string;
        message_thread_id?: string;
        // PagerDuty
        integration_key?: string;
    };
}

function asSeverity(value: string): AlertRuleFormData['severity'] {
    return value as AlertRuleFormData['severity'];
}

function asChannelType(value: string): AlertChannelFormData['type'] {
    return value as AlertChannelFormData['type'];
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
        retry: 1,
    });

    // Fetch alert channels from API
    const { data: channels = [], isLoading: channelsLoading } = useQuery<AlertChannel[]>({
        queryKey: ['alert-channels'],
        queryFn: async () => {
            return await api.getAlertChannels() as AlertChannel[];
        },
        refetchInterval: 30000,
        retry: 1,
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
            const result = await api.testAlertChannel(channelId) as { success?: boolean; message?: string };
            if (result.success) {
                success('Test notification sent successfully');
            } else {
                showError('Test notification failed');
            }
        } catch {
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
        if (!ruleFormData.name.trim()) {
            showError('Alert name is required');
            return;
        }
        if (!ruleFormData.description.trim()) {
            showError('Description is required');
            return;
        }
        if (!ruleFormData.condition.trim()) {
            showError('Condition is required');
            return;
        }
        const channelsList = ruleFormData.channels ? ruleFormData.channels.split(',').map(c => c.trim()).filter(Boolean) : [];
        createRuleMutation.mutate({
            ...ruleFormData,
            name: ruleFormData.name.trim(),
            description: ruleFormData.description.trim(),
            condition: ruleFormData.condition.trim(),
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
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail className="w-4 h-4" />;
            case 'slack': return <MessageSquare className="w-4 h-4" />;
            case 'webhook': return <Webhook className="w-4 h-4" />;
            case 'teams': return <MessageSquare className="w-4 h-4" />;
            case 'telegram': return <Send className="w-4 h-4" />;
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
                            className="dashboard-input w-full"
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
                                className="dashboard-input w-full"
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
                                className="dashboard-input w-full"
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
                                className="dashboard-input w-full"
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
                                className="dashboard-input w-full"
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
                                className="dashboard-input w-full font-mono"
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
                            className="dashboard-input w-full"
                            placeholder="https://outlook.office.com/webhook/..."
                        />
                    </div>
                );
            case 'telegram':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Bot Token *</label>
                            <input
                                type="password"
                                required
                                value={channelFormData.config.bot_token || ''}
                                onChange={(e) => setChannelFormData({
                                    ...channelFormData,
                                    config: { ...channelFormData.config, bot_token: e.target.value }
                                })}
                                className="dashboard-input w-full"
                                placeholder="Telegram bot token"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Channel ID *</label>
                            <input
                                type="text"
                                required
                                value={channelFormData.config.channel_id || ''}
                                onChange={(e) => setChannelFormData({
                                    ...channelFormData,
                                    config: { ...channelFormData.config, channel_id: e.target.value }
                                })}
                                className="dashboard-input w-full"
                                placeholder="-1001234567890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Message Thread ID</label>
                            <input
                                type="text"
                                value={channelFormData.config.message_thread_id || ''}
                                onChange={(e) => setChannelFormData({
                                    ...channelFormData,
                                    config: { ...channelFormData.config, message_thread_id: e.target.value }
                                })}
                                className="dashboard-input w-full"
                                placeholder="Optional forum topic thread id"
                            />
                        </div>
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
                            className="dashboard-input w-full"
                            placeholder="your-pagerduty-integration-key"
                        />
                    </div>
                );
        }
    };

    return (
        <>
            <SEOMeta title="Alerts" noindex />
            <AppPage>
                <AppPageHeader
                    eyebrow="Notifications"
                    eyebrowIcon={Bell}
                    title="Alert Management"
                    description="Configure alert rules and notification channels"
                    icon={Bell}
                    actions={
                        <AppPrimaryButton
                            onClick={() => activeTab === 'rules' ? setShowCreateRule(true) : setShowCreateChannel(true)}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">{activeTab === 'rules' ? 'Create Rule' : 'Create Channel'}</span>
                            <span className="sm:hidden">{activeTab === 'rules' ? 'Rule' : 'Channel'}</span>
                        </AppPrimaryButton>
                    }
                    tabs={[
                        { id: 'rules', label: 'Rules' },
                        { id: 'channels', label: 'Channels' },
                    ]}
                    activeTab={activeTab}
                    onTabChange={(id) => setActiveTab(id as 'rules' | 'channels')}
                />

                <AppCallout variant="info">
                    Alerts help customers prove that Koreshield is operating, but they only become useful after you connect at least one notification channel and one rule.
                </AppCallout>

                {activeTab === 'rules' && (
                    <>
                        <AppStatGrid>
                            <AppStatCard label="Total Rules" value={rules.length} icon={Bell} />
                            <AppStatCard
                                label="Active"
                                value={rules.filter(r => r.enabled).length}
                                icon={CheckCircle}
                                tone="text-electric-green"
                            />
                            <AppStatCard
                                label="Critical"
                                value={rules.filter(r => r.severity === 'critical').length}
                                icon={AlertTriangle}
                                tone="text-red-400"
                            />
                            <AppStatCard
                                label="Total Triggers"
                                value={rules.reduce((acc, r) => acc + r.trigger_count, 0)}
                                icon={Clock}
                                tone="text-violet-400"
                            />
                        </AppStatGrid>

                        <AppPageSection title="Alert rules" className="overflow-hidden p-0" variant="card">
                            {rulesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : rules.length === 0 ? (
                                <AppEmptyState
                                    icon={Bell}
                                    title="No alert rules found"
                                    description="Create a rule to notify your team when Koreshield detects important events"
                                    action={
                                        <AppPrimaryButton onClick={() => setShowCreateRule(true)}>
                                            <Plus className="w-4 h-4" />
                                            Create your first rule
                                        </AppPrimaryButton>
                                    }
                                />
                            ) : (
                                <div className="dashboard-table-wrap">
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
                                                                : 'bg-muted text-muted-foreground'
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
                        </AppPageSection>
                    </>
                )}

                {activeTab === 'channels' && (
                    <>
                        <AppStatGrid>
                            <AppStatCard label="Total Channels" value={channels.length} icon={Bell} />
                            <AppStatCard
                                label="Active"
                                value={channels.filter(c => c.enabled).length}
                                icon={CheckCircle}
                                tone="text-electric-green"
                            />
                            <AppStatCard
                                label="Email"
                                value={channels.filter(c => c.type === 'email').length}
                                icon={Mail}
                                tone="text-sky-400"
                            />
                            <AppStatCard
                                label="Webhooks"
                                value={channels.filter(c => c.type === 'webhook').length}
                                icon={Webhook}
                                tone="text-violet-400"
                            />
                        </AppStatGrid>

                        <AppPageSection title="Notification channels">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6">
                            {channelsLoading ? (
                                <div className="col-span-full flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : channels.length === 0 ? (
                                <div className="col-span-full">
                                    <AppEmptyState
                                        icon={Bell}
                                        title="No notification channels found"
                                        description="Add a channel so alert rules can reach your team"
                                        action={
                                            <AppPrimaryButton onClick={() => setShowCreateChannel(true)}>
                                                <Plus className="w-4 h-4" />
                                                Add your first channel
                                            </AppPrimaryButton>
                                        }
                                    />
                                </div>
                            ) : (
                                channels.map((channel) => (
                                    <AppSurface key={channel.id} className="p-6">
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
                                                    : 'bg-muted text-muted-foreground'
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
                                    </AppSurface>
                                ))
                            )}
                        </div>
                        </AppPageSection>
                    </>
                )}
            </AppPage>

            {showCreateRule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="dashboard-modal bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 sm:mx-auto max-h-[90dvh] overflow-y-auto">
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
                                    className="dashboard-input w-full"
                                    placeholder="High Error Rate Alert"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={ruleFormData.description}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                                    className="dashboard-input w-full"
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
                                    className="dashboard-input w-full font-mono"
                                    placeholder="error_rate > 0.05"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Severity *</label>
                                    <select
                                        value={ruleFormData.severity}
                                        onChange={(e) => setRuleFormData({ ...ruleFormData, severity: e.target.value as AlertRuleFormData['severity'] })}
                                        className="dashboard-input w-full"
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
                                        className="dashboard-input w-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Notification Channels (comma-separated IDs)</label>
                                <input
                                    type="text"
                                    value={ruleFormData.channels}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, channels: e.target.value })}
                                    className="dashboard-input w-full"
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
                                <AppSecondaryButton type="button" onClick={() => { setShowCreateRule(false); resetRuleForm(); }}>
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

            {showEditRule && editingRule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="dashboard-modal bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 sm:mx-auto max-h-[90dvh] overflow-y-auto">
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
                                    className="dashboard-input w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={ruleFormData.description}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                                    className="dashboard-input w-full"
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
                                    className="dashboard-input w-full font-mono"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Severity *</label>
                                    <select
                                        value={ruleFormData.severity}
	                                        onChange={(e) => setRuleFormData({ ...ruleFormData, severity: asSeverity(e.target.value) })}
                                        className="dashboard-input w-full"
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
                                        className="dashboard-input w-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Notification Channels (comma-separated IDs)</label>
                                <input
                                    type="text"
                                    value={ruleFormData.channels}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, channels: e.target.value })}
                                    className="dashboard-input w-full"
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
                                <AppSecondaryButton type="button" onClick={() => { setShowEditRule(false); setEditingRule(null); resetRuleForm(); }}>
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

            {showCreateChannel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="dashboard-modal bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 sm:mx-auto max-h-[90dvh] overflow-y-auto">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Channel Type *</label>
                                    <select
                                        value={channelFormData.type}
	                                        onChange={(e) => setChannelFormData({ ...channelFormData, type: asChannelType(e.target.value), config: {} })}
                                        className="dashboard-input w-full"
                                    >
                                        <option value="email">Email</option>
                                        <option value="slack">Slack</option>
                                        <option value="webhook">Webhook</option>
                                        <option value="teams">Microsoft Teams</option>
                                        <option value="telegram">Telegram</option>
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
                                        className="dashboard-input w-full"
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
                                <AppSecondaryButton type="button" onClick={() => { setShowCreateChannel(false); resetChannelForm(); }}>
                                    Cancel
                                </AppSecondaryButton>
                                <AppPrimaryButton type="submit" disabled={createChannelMutation.isPending}>
                                    {createChannelMutation.isPending ? 'Creating...' : 'Create Channel'}
                                </AppPrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditChannel && editingChannel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="dashboard-modal bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 sm:mx-auto max-h-[90dvh] overflow-y-auto">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        <option value="telegram">Telegram</option>
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
                                        className="dashboard-input w-full"
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
                                <AppSecondaryButton type="button" onClick={() => { setShowEditChannel(false); setEditingChannel(null); resetChannelForm(); }}>
                                    Cancel
                                </AppSecondaryButton>
                                <AppPrimaryButton type="submit" disabled={updateChannelMutation.isPending}>
                                    {updateChannelMutation.isPending ? 'Updating...' : 'Update Channel'}
                                </AppPrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
