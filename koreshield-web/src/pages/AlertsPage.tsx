import { useState } from 'react';
import { Bell, Plus, Edit, Trash2, Mail, MessageSquare, Webhook, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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
    type: 'email' | 'slack' | 'webhook' | 'teams';
    name: string;
    enabled: boolean;
    config: Record<string, any>;
}

export function AlertsPage() {
    const [activeTab, setActiveTab] = useState<'rules' | 'channels'>('rules');
    const [_showCreateRule, setShowCreateRule] = useState(false);
    const [_showCreateChannel, setShowCreateChannel] = useState(false);
    const [_editingRule, setEditingRule] = useState<AlertRule | null>(null);

    // Fetch alert rules
    const { data: rules = [], isLoading: rulesLoading } = useQuery({
        queryKey: ['alert-rules'],
        queryFn: async () => {
            // TODO: Replace with real API call to /api/v1/alerts/rules
            return mockRules;
        },
        refetchInterval: 30000,
    });

    // Fetch alert channels
    const { data: channels = [], isLoading: channelsLoading } = useQuery({
        queryKey: ['alert-channels'],
        queryFn: async () => {
            // TODO: Replace with real API call to /api/v1/alerts/channels
            return mockChannels;
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

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail className="w-4 h-4" />;
            case 'slack': return <MessageSquare className="w-4 h-4" />;
            case 'webhook': return <Webhook className="w-4 h-4" />;
            case 'teams': return <MessageSquare className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
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
                                <h1 className="text-2xl font-bold">Alert Configuration</h1>
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
                            {activeTab === 'rules' ? 'Create Alert Rule' : 'Add Channel'}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                activeTab === 'rules'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                            }`}
                        >
                            Alert Rules
                        </button>
                        <button
                            onClick={() => setActiveTab('channels')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                activeTab === 'channels'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                            }`}
                        >
                            Notification Channels
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'rules' ? (
                    <>
                        {/* Rules Stats */}
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
                                <div className="text-sm text-muted-foreground mb-1">Triggers Today</div>
                                <div className="text-3xl font-bold">
                                    {rules.reduce((sum, r) => sum + r.trigger_count, 0)}
                                </div>
                            </div>
                        </div>

                        {/* Rules List */}
                        <div className="space-y-4">
                            {rulesLoading ? (
                                <div className="flex items-center justify-center py-12 bg-card border border-border rounded-lg">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : rules.length === 0 ? (
                                <div className="bg-card border border-border rounded-lg p-12 text-center">
                                    <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">No alert rules configured</p>
                                </div>
                            ) : (
                                rules.map((rule) => (
                                    <div key={rule.id} className="bg-card border border-border rounded-lg p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold">{rule.name}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(rule.severity)}`}>
                                                        {rule.severity.toUpperCase()}
                                                    </span>
                                                    {rule.enabled ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Enabled
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500/10 text-gray-600 rounded-full text-xs font-medium">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Disabled
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-4">{rule.description}</p>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Condition</div>
                                                        <div className="text-sm font-mono bg-muted/50 px-3 py-2 rounded">
                                                            {rule.condition}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Channels</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {rule.channels.map((channel) => (
                                                                <span key={channel} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                                                    {channel}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Cooldown
                                                        </div>
                                                        <div className="text-sm">{rule.cooldown_minutes} minutes</div>
                                                    </div>
                                                </div>

                                                {rule.last_triggered && (
                                                    <div className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                                                        Last triggered: {new Date(rule.last_triggered).toLocaleString()} 
                                                        <span className="ml-4">Triggers: {rule.trigger_count}</span>
                                                    </div>
                                                )}
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
                    </>
                ) : (
                    <>
                        {/* Channels Stats */}
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
                                <div className="text-3xl font-bold">
                                    {channels.filter(c => c.type === 'email').length}
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Webhooks</div>
                                <div className="text-3xl font-bold">
                                    {channels.filter(c => c.type === 'webhook').length}
                                </div>
                            </div>
                        </div>

                        {/* Channels Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {channelsLoading ? (
                                <div className="col-span-2 flex items-center justify-center py-12 bg-card border border-border rounded-lg">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : channels.length === 0 ? (
                                <div className="col-span-2 bg-card border border-border rounded-lg p-12 text-center">
                                    <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">No notification channels configured</p>
                                </div>
                            ) : (
                                channels.map((channel) => (
                                    <div key={channel.id} className="bg-card border border-border rounded-lg p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    channel.enabled ? 'bg-primary/10 text-primary' : 'bg-gray-500/10 text-gray-500'
                                                }`}>
                                                    {getChannelIcon(channel.type)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{channel.name}</h3>
                                                    <p className="text-xs text-muted-foreground capitalize">{channel.type}</p>
                                                </div>
                                            </div>
                                            {channel.enabled ? (
                                                <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-500/10 text-gray-600 rounded text-xs">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2 text-sm mb-4">
                                            {Object.entries(channel.config).map(([key, value]) => (
                                                <div key={key} className="flex justify-between">
                                                    <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                                                    <span className="font-mono text-xs">
                                                        {key.includes('password') || key.includes('token') ? '••••••••' : String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm">
                                                Test
                                            </button>
                                            <button className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="px-4 py-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors">
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
        </div>
    );
}

// Mock data for development
const mockRules: AlertRule[] = [
    {
        id: '1',
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds 5% over 5 minutes',
        condition: 'error_rate > 0.05',
        severity: 'critical',
        enabled: true,
        channels: ['email', 'slack'],
        cooldown_minutes: 5,
        last_triggered: '2026-02-05T10:30:00Z',
        trigger_count: 12,
    },
    {
        id: '2',
        name: 'Attack Surge',
        description: 'Alert when attacks detected exceed 100 in 10 minutes',
        condition: 'attacks_detected > 100',
        severity: 'high',
        enabled: true,
        channels: ['slack', 'webhook'],
        cooldown_minutes: 10,
        last_triggered: '2026-02-04T15:22:00Z',
        trigger_count: 8,
    },
    {
        id: '3',
        name: 'High Latency Warning',
        description: 'Alert when average latency exceeds 500ms',
        condition: 'avg_latency > 500',
        severity: 'medium',
        enabled: true,
        channels: ['email'],
        cooldown_minutes: 15,
        trigger_count: 3,
    },
];

const mockChannels: AlertChannel[] = [
    {
        id: '1',
        type: 'email',
        name: 'Security Team Email',
        enabled: true,
        config: {
            smtp_server: 'smtp.gmail.com',
            from_address: 'alerts@koreshield.com',
            to_addresses: 'security@company.com',
        },
    },
    {
        id: '2',
        type: 'slack',
        name: 'Security Slack Channel',
        enabled: true,
        config: {
            webhook_url: 'https://hooks.slack.com/services/...',
            channel: '#security-alerts',
        },
    },
    {
        id: '3',
        type: 'webhook',
        name: 'PagerDuty Integration',
        enabled: true,
        config: {
            url: 'https://api.pagerduty.com/...',
            auth_token: '••••••••',
        },
    },
];
