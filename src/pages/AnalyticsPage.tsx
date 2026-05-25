import { useState } from 'react';
import { Building2, TrendingUp, Users, Activity, BarChart3, Filter } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api-client';
import {
	AppPage,
	AppPageHeader,
	AppStatGrid,
	AppStatCard,
	AppPageSection,
	AppEmptyState,
	AppPrimaryButton,
	AppSecondaryButton,
	AppPageError,
	AppPageLoading,
} from '../components/AppPageLayout';

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

function asSelectedMetric(value: string): 'requests' | 'blocked' | 'attacks' | 'latency' {
    return value as 'requests' | 'blocked' | 'attacks' | 'latency';
}

export function AnalyticsPage() {
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('24h');
    const [selectedMetric, setSelectedMetric] = useState<'requests' | 'blocked' | 'attacks' | 'latency'>('requests');

    // Fetch tenant analytics from API
    const { data: analytics = [], isLoading, error, refetch } = useQuery<TenantAnalytics[]>({
        queryKey: ['tenant-analytics', timeRange],
        queryFn: async () => {
            // Note: Backend doesn't support time_range filtering yet
            return await api.getAnalyticsTenants() as TenantAnalytics[];
        },
        refetchInterval: 30000,
    });
    const analyticsError = error as (Error & { code?: number }) | null;
    const accessDenied = analyticsError?.code === 403;

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
        <AppPage>
            <SEOMeta title="Analytics" noindex />
            <AppPageHeader
                eyebrow="Insights"
                eyebrowIcon={BarChart3}
                title="Usage Analytics"
                description="Account-level insights and performance comparisons"
                icon={BarChart3}
                actions={
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:w-auto sm:px-4"
                    >
                        <option value="1h">Last hour</option>
                        <option value="24h">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                    </select>
                }
            />

            {accessDenied && (
                <AppEmptyState
                    icon={BarChart3}
                    title="Analytics require an admin seat"
                    description="Your account can use Koreshield, but tenant-level analytics are currently restricted to admin users. Finish onboarding with teams, API keys, rules, alerts, and protected requests first, then return once your role is upgraded."
                    action={
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <AppPrimaryButton onClick={() => navigate('/getting-started')}>
                                Continue onboarding
                            </AppPrimaryButton>
                            <AppSecondaryButton onClick={() => navigate('/dashboard')}>
                                Back to dashboard
                            </AppSecondaryButton>
                        </div>
                    }
                />
            )}

            {!accessDenied && analyticsError && (
                <AppPageError
                    title="Analytics are not loading right now"
                    message={analyticsError.message || 'Something went wrong while loading analytics.'}
                    onRetry={() => void refetch()}
                />
            )}

            {!accessDenied && !analyticsError && !isLoading && analytics.length === 0 && (
                <AppEmptyState
                    icon={BarChart3}
                    title="No analytics data yet"
                    description="Usage analytics appear here once requests are flowing through the Koreshield proxy. Send your first request via POST /v1/scan or POST /v1/chat/completions using your API key to get started."
                />
            )}

            {!accessDenied && !analyticsError && (analytics.length > 0 || isLoading) && (
                <>
                    <AppStatGrid>
                        <AppStatCard label="Total Requests" value={totalRequests.toLocaleString()} icon={Activity} tone="text-sky-400" detail="Across all accounts" />
                        <AppStatCard
                            label="Blocked"
                            value={totalBlocked.toLocaleString()}
                            icon={TrendingUp}
                            tone="text-red-400"
                            detail={`${totalRequests > 0 ? ((totalBlocked / totalRequests) * 100).toFixed(1) : 0}% block rate`}
                        />
                        <AppStatCard label="Attacks Detected" value={totalAttacks.toLocaleString()} icon={Building2} tone="text-amber-400" detail="Security incidents" />
                        <AppStatCard label="Avg Latency" value={`${avgLatency.toFixed(0)}ms`} icon={Users} tone="text-violet-400" detail="Platform-wide" />
                    </AppStatGrid>

                    <AppPageSection
                        eyebrow="Comparison"
                        title="Account Comparison"
                        actions={
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <select
                                    value={selectedMetric}
                                    onChange={(e) => setSelectedMetric(asSelectedMetric(e.target.value))}
                                    className="rounded-lg border border-border bg-background/60 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="requests">Total Requests</option>
                                    <option value="blocked">Blocked Requests</option>
                                    <option value="attacks">Attacks Detected</option>
                                    <option value="latency">Average Latency</option>
                                </select>
                            </div>
                        }
                    >
                        {isLoading ? (
                            <AppPageLoading label="Loading analytics…" />
                        ) : (
                            <ResponsiveContainer width="100%" height={350} minHeight={350} minWidth={0}>
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
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                                    <Legend />
                                    <Bar dataKey={selectedMetric} fill="#3b82f6" name={getMetricLabel(selectedMetric)} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </AppPageSection>

                    <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                        <AppPageSection variant="card" title="Account Tier Distribution">
                            <ResponsiveContainer width="100%" height={300} minHeight={300} minWidth={0}>
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
                        </AppPageSection>

                        <AppPageSection variant="card" title="Top Accounts by Activity">
                            <div className="space-y-4">
                                {analytics
                                    .sort((a, b) => b.requests_total - a.requests_total)
                                    .slice(0, 5)
                                    .map((tenant, index) => (
                                        <div key={tenant.tenant_id} className="flex items-center gap-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
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
                                                    tenant.tier === 'starter' ? 'text-blue-600' : 'text-muted-foreground'
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
                        </AppPageSection>
                    </div>

                    <AppPageSection title="All Accounts Performance" className="overflow-hidden p-0">
                        <div className="overflow-x-auto p-6 pt-0">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Account</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Tier</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Requests</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Blocked</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Attacks</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Latency</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Error Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {analytics.map((tenant) => (
                                        <tr key={tenant.tenant_id} className="hover:bg-muted/50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{tenant.tenant_name}</div>
                                                <div className="font-mono text-sm text-muted-foreground">{tenant.tenant_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`rounded px-2 py-1 text-xs font-medium ${
                                                    tenant.tier === 'enterprise' ? 'bg-orange-500/10 text-orange-600' :
                                                    tenant.tier === 'professional' ? 'bg-purple-500/10 text-purple-600' :
                                                    tenant.tier === 'starter' ? 'bg-blue-500/10 text-blue-600' :
                                                    'bg-muted text-muted-foreground'
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
                    </AppPageSection>
                </>
            )}
        </AppPage>
    );
}
