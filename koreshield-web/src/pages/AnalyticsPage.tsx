import { useState } from 'react';
import { Building2, TrendingUp, Users, Activity, BarChart3, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TenantAnalytics {
    tenant_id: string;
    tenant_name: string;
    requests_total: number;
    requests_blocked: number;
    attacks_detected: number;
    avg_latency: number;
    error_rate: number;
    tier: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#84cc16'];

export function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState('24h');
    const [selectedMetric, setSelectedMetric] = useState<'requests' | 'blocked' | 'attacks' | 'latency'>('requests');

    // Fetch tenant analytics
    const { data: analytics = [], isLoading } = useQuery({
        queryKey: ['tenant-analytics', timeRange],
        queryFn: async () => {
            // TODO: Replace with real API call to /api/v1/analytics/tenants
            return mockAnalytics;
        },
        refetchInterval: 30000,
    });

    const totalRequests = analytics.reduce((sum, t) => sum + t.requests_total, 0);
    const totalBlocked = analytics.reduce((sum, t) => sum + t.requests_blocked, 0);
    const totalAttacks = analytics.reduce((sum, t) => sum + t.attacks_detected, 0);
    const avgLatency = analytics.length > 0 
        ? analytics.reduce((sum, t) => sum + t.avg_latency, 0) / analytics.length 
        : 0;

    // Prepare chart data
    const tenantComparisonData = analytics.map(t => ({
        name: t.tenant_name,
        requests: t.requests_total,
        blocked: t.requests_blocked,
        attacks: t.attacks_detected,
        latency: t.avg_latency,
    }));

    const tierDistributionData = Object.entries(
        analytics.reduce((acc, t) => {
            acc[t.tier] = (acc[t.tier] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

    const getMetricLabel = (metric: string) => {
        switch (metric) {
            case 'requests': return 'Total Requests';
            case 'blocked': return 'Requests Blocked';
            case 'attacks': return 'Attacks Detected';
            case 'latency': return 'Avg Latency (ms)';
            default: return metric;
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
                                <BarChart3 className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Multi-Tenant Analytics</h1>
                                <p className="text-sm text-muted-foreground">
                                    Cross-tenant insights and performance comparisons
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="1h">Last hour</option>
                                <option value="24h">Last 24 hours</option>
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Total Requests</span>
                            <Activity className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold">{totalRequests.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">Across all tenants</div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Blocked Requests</span>
                            <TrendingUp className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-3xl font-bold text-red-600">{totalBlocked.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {totalRequests > 0 ? ((totalBlocked / totalRequests) * 100).toFixed(1) : 0}% block rate
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Attacks Detected</span>
                            <Building2 className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="text-3xl font-bold text-orange-600">{totalAttacks.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">Security incidents</div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Avg Latency</span>
                            <Users className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="text-3xl font-bold">{avgLatency.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground mt-1">Platform-wide</div>
                    </div>
                </div>

                {/* Metric Selector */}
                <div className="bg-card border border-border rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Tenant Comparison</h3>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value as any)}
                                className="px-3 py-1 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="requests">Total Requests</option>
                                <option value="blocked">Blocked Requests</option>
                                <option value="attacks">Attacks Detected</option>
                                <option value="latency">Average Latency</option>
                            </select>
                        </div>
                    </div>
                    
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={tenantComparisonData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey={selectedMetric} 
                                    fill="#3b82f6" 
                                    name={getMetricLabel(selectedMetric)}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Tier Distribution & Top Tenants */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Tier Distribution */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Tenant Tier Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPie>
                                <Pie
                                    data={tierDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {tierDistributionData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Tenants by Activity */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Top Tenants by Activity</h3>
                        <div className="space-y-4">
                            {analytics
                                .sort((a, b) => b.requests_total - a.requests_total)
                                .slice(0, 5)
                                .map((tenant, index) => (
                                    <div key={tenant.tenant_id} className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{tenant.tenant_name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {tenant.requests_total.toLocaleString()} requests
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-medium ${
                                                tenant.tier === 'enterprise' ? 'text-orange-600' :
                                                tenant.tier === 'professional' ? 'text-purple-600' :
                                                tenant.tier === 'starter' ? 'text-blue-600' : 'text-gray-600'
                                            }`}>
                                                {tenant.tier.charAt(0).toUpperCase() + tenant.tier.slice(1)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {tenant.avg_latency.toFixed(0)}ms avg
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Detailed Tenant Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h3 className="text-lg font-semibold">All Tenants Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tenant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tier</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Requests</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Blocked</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Attacks</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Latency</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Error Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {analytics.map((tenant) => (
                                    <tr key={tenant.tenant_id} className="hover:bg-muted/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{tenant.tenant_name}</div>
                                            <div className="text-sm text-muted-foreground font-mono">{tenant.tenant_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                tenant.tier === 'enterprise' ? 'bg-orange-500/10 text-orange-600' :
                                                tenant.tier === 'professional' ? 'bg-purple-500/10 text-purple-600' :
                                                tenant.tier === 'starter' ? 'bg-blue-500/10 text-blue-600' : 
                                                'bg-gray-500/10 text-gray-600'
                                            }`}>
                                                {tenant.tier.charAt(0).toUpperCase() + tenant.tier.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">{tenant.requests_total.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-red-600">{tenant.requests_blocked.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-orange-600">{tenant.attacks_detected.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">{tenant.avg_latency.toFixed(0)}ms</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={tenant.error_rate > 5 ? 'text-red-600' : 'text-green-600'}>
                                                {tenant.error_rate.toFixed(2)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Mock data for development
const mockAnalytics: TenantAnalytics[] = [
    {
        tenant_id: 'tenant_abc123',
        tenant_name: 'Acme Corporation',
        requests_total: 45678,
        requests_blocked: 1234,
        attacks_detected: 89,
        avg_latency: 45,
        error_rate: 0.5,
        tier: 'enterprise',
    },
    {
        tenant_id: 'tenant_def456',
        tenant_name: 'TechStart Inc',
        requests_total: 12345,
        requests_blocked: 456,
        attacks_detected: 34,
        avg_latency: 67,
        error_rate: 1.2,
        tier: 'professional',
    },
    {
        tenant_id: 'tenant_ghi789',
        tenant_name: 'DevShop',
        requests_total: 5678,
        requests_blocked: 234,
        attacks_detected: 12,
        avg_latency: 52,
        error_rate: 2.1,
        tier: 'starter',
    },
    {
        tenant_id: 'tenant_jkl012',
        tenant_name: 'StartupHub',
        requests_total: 23456,
        requests_blocked: 789,
        attacks_detected: 45,
        avg_latency: 58,
        error_rate: 0.8,
        tier: 'professional',
    },
    {
        tenant_id: 'tenant_mno345',
        tenant_name: 'CloudCo',
        requests_total: 67890,
        requests_blocked: 2345,
        attacks_detected: 156,
        avg_latency: 42,
        error_rate: 0.3,
        tier: 'enterprise',
    },
];
