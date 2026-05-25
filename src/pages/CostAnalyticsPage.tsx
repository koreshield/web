import { useState } from 'react';
import { PoundSterling, Filter, Download, Calendar, TrendingUp } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import {
	AppPage,
	AppPageHeader,
	AppStatGrid,
	AppStatCard,
	AppPageSection,
	AppPrimaryButton,
	AppPageLoading,
} from '../components/AppPageLayout';

interface CostData {
    period: string;
    total_cost: number;
    provider_costs: {
        provider: string;
        cost: number;
        requests: number;
        tokens: number;
    }[];
    tenant_costs: {
        tenant_id: string;
        tenant_name: string;
        cost: number;
        tier: string;
    }[];
}

interface CostBreakdown {
    category: string;
    amount: number;
    percentage: number;
    color: string;
}

const TIME_RANGE_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
] as const;

type AnalyticsTimeRange = (typeof TIME_RANGE_OPTIONS)[number]['value'];

export function CostAnalyticsPage() {
    const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('7d');
    const [selectedProvider, setSelectedProvider] = useState('all');
    const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

    const { success, error: showError } = useToast();

    // Fetch cost data
    const { data: costData = [] as CostData[], isLoading } = useQuery<CostData[]>({
        queryKey: ['costAnalytics', timeRange, selectedProvider],
        queryFn: async () => {
            const result = await api.getCostAnalytics({ 
                time_range: timeRange,
                provider: selectedProvider !== 'all' ? selectedProvider : undefined 
            });
            return result as CostData[];
        },
        staleTime: 60000,
        refetchInterval: 60000
    });

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    // Calculate cost trends
    const calculateTrend = () => {
        if (!costData || costData.length < 2) return { value: 0, isPositive: true };
        const latest = costData[costData.length - 1].total_cost;
        const previous = costData[costData.length - 2].total_cost;
        const change = ((latest - previous) / previous) * 100;
        return { value: Math.abs(change), isPositive: change < 0 }; // Negative is good for costs
    };

    const trend = calculateTrend();
    const currentPeriodCost = costData && costData.length > 0 ? costData[costData.length - 1].total_cost : 0;
    const currentProviderCosts = costData && costData.length > 0 ? costData[costData.length - 1].provider_costs : [];
    const currentRequests = currentProviderCosts.reduce((sum, provider) => sum + provider.requests, 0);
    const avgCostPerRequest = currentRequests > 0 ? currentPeriodCost / currentRequests : 0;
    const totalObservedCost = costData.reduce((sum, item) => sum + item.total_cost, 0);
    const daysInRange =
        timeRange === 'today' ? 1 :
        timeRange === '7d' ? 7 :
        timeRange === '30d' ? 30 :
        timeRange === '90d' ? 90 : 365;
    const projectedMonthlyCost = daysInRange > 0 ? (totalObservedCost / daysInRange) * 30 : 0;

    // Aggregate provider costs
    const providerCostBreakdown: CostBreakdown[] = costData && costData.length > 0
        ? costData[costData.length - 1].provider_costs.map((p, idx: number) => ({
            category: p.provider,
            amount: p.cost,
            percentage: currentPeriodCost > 0 ? (p.cost / currentPeriodCost) * 100 : 0,
            color: COLORS[idx % COLORS.length]
        }))
        : [];

    // Aggregate tenant costs
    const tenantCostBreakdown = costData && costData.length > 0
        ? costData[costData.length - 1].tenant_costs.slice(0, 10) // Top 10
        : [];

    const downloadReport = async () => {
        try {
            const params: any = {
                time_range: timeRange,
            };
            if (selectedProvider !== 'all') params.provider = selectedProvider;

            const blob = await api.exportData(exportFormat, '/v1/analytics/costs', params);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cost-analytics-${timeRange}.${exportFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            success(`Cost report exported as ${exportFormat.toUpperCase()}`);
        } catch (err) {
            showError(`Failed to export report: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    return (
        <AppPage>
            <SEOMeta title="Cost Analytics" noindex />
            <AppPageHeader
                eyebrow="Spend"
                eyebrowIcon={PoundSterling}
                title="Cost Analytics"
                description="Track spending across providers, accounts, and time periods"
                icon={PoundSterling}
                actions={
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
                        <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-xs sm:text-sm"
                        >
                            <option value="csv">CSV</option>
                            <option value="pdf">PDF</option>
                        </select>
                        <AppPrimaryButton onClick={downloadReport}>
                            <Download className="h-4 w-4" />
                            Export Report
                        </AppPrimaryButton>
                    </div>
                }
            />

            <div className="mb-8 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as AnalyticsTimeRange)}
                        className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {TIME_RANGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Providers</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="gemini">Google Gemini</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <AppPageLoading label="Loading cost analytics…" />
            ) : (
                <>
                    <AppStatGrid>
                        <AppStatCard
                            label="Current Period Cost"
                            value={`£${currentPeriodCost.toFixed(2)}`}
                            icon={PoundSterling}
                            tone="text-emerald-400"
                            detail={`${trend.isPositive ? '↓' : '↑'} ${trend.value.toFixed(1)}% vs previous period`}
                        />
                        <AppStatCard
                            label="Avg Cost per Request"
                            value={`£${avgCostPerRequest.toFixed(4)}`}
                            icon={TrendingUp}
                            tone="text-sky-400"
                            detail={`Based on ${currentRequests.toLocaleString()} requests`}
                        />
                        <AppStatCard
                            label="Most Expensive Provider"
                            value={providerCostBreakdown[0]?.category || 'N/A'}
                            icon={Filter}
                            tone="text-amber-400"
                            detail={`£${providerCostBreakdown[0]?.amount.toFixed(2) || '0.00'} (${providerCostBreakdown[0]?.percentage.toFixed(1) || '0'}%)`}
                        />
                        <AppStatCard
                            label="Projected Monthly"
                            value={`£${projectedMonthlyCost.toFixed(2)}`}
                            icon={Calendar}
                            tone="text-violet-400"
                            detail="Based on current usage rate"
                        />
                    </AppStatGrid>

                    <AppPageSection title="Cost Trend Over Time">
                        <ResponsiveContainer width="100%" height={300} minHeight={300} minWidth={0}>
                            <LineChart data={costData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="period" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                    labelStyle={{ color: '#f9fafb' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="total_cost" stroke="#3b82f6" strokeWidth={2} name="Total Cost (£)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </AppPageSection>

                    <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                        <AppPageSection variant="card" title="Cost by Provider">
                            <ResponsiveContainer width="100%" height={300} minHeight={300} minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={providerCostBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ percent, index }: { percent?: number; index?: number }) => {
                                            const item = providerCostBreakdown[index ?? 0];
                                            return `${item.category}: ${((percent ?? 0) * 100).toFixed(1)}%`;
                                        }}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="amount"
                                    >
                                        {providerCostBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                        formatter={(value) => [`£${Number(value).toFixed(2)}`, 'Cost']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </AppPageSection>

                        <AppPageSection variant="card" title="Top 10 Accounts by Cost">
                            <ResponsiveContainer width="100%" height={300} minHeight={300} minWidth={0}>
                                <BarChart data={tenantCostBreakdown} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis type="number" stroke="#9ca3af" />
                                    <YAxis type="category" dataKey="tenant_name" stroke="#9ca3af" width={120} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                        formatter={(value) => [`£${Number(value).toFixed(2)}`, 'Cost']}
                                    />
                                    <Bar dataKey="cost" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </AppPageSection>
                    </div>

                    <AppPageSection title="Detailed Cost Breakdown" className="overflow-hidden p-0">
                        <div className="overflow-x-auto p-6 pt-0">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Provider</th>
                                        <th className="px-4 py-3 text-left font-medium">Requests</th>
                                        <th className="px-4 py-3 text-left font-medium">Tokens</th>
                                        <th className="px-4 py-3 text-left font-medium">Cost</th>
                                        <th className="px-4 py-3 text-left font-medium">Avg/Request</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {costData && costData.length > 0 && costData[costData.length - 1].provider_costs.map((provider) => (
                                        <tr key={provider.provider} className="border-b border-border transition-colors hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">{provider.provider}</td>
                                            <td className="px-4 py-3">{provider.requests.toLocaleString()}</td>
                                            <td className="px-4 py-3">{provider.tokens.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-semibold">£{provider.cost.toFixed(2)}</td>
                                            <td className="px-4 py-3">£{(provider.requests > 0 ? provider.cost / provider.requests : 0).toFixed(4)}</td>
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
