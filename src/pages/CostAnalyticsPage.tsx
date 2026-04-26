import { useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Filter, Download, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';

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
        <div>
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-2xl font-bold">Cost Analytics</h1>
                                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                                    Track spending across providers, accounts, and time periods
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                                className="px-3 py-2 bg-muted border border-border rounded-lg text-xs sm:text-sm"
                            >
                                <option value="csv">CSV</option>
                                <option value="pdf">PDF</option>
                            </select>
                            <button
                                onClick={downloadReport}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 mt-6 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value as AnalyticsTimeRange)}
                                className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {TIME_RANGE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedProvider}
                                onChange={(e) => setSelectedProvider(e.target.value)}
                                className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">All Providers</option>
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="deepseek">DeepSeek</option>
                                <option value="gemini">Google Gemini</option>
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {/* Cost Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Current Period Cost</div>
                                <div className="text-3xl font-bold">£{currentPeriodCost.toFixed(2)}</div>
                                <div className={`flex items-center gap-1 text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {trend.isPositive ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                    {trend.value.toFixed(1)}% vs previous period
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Avg Cost per Request</div>
                                <div className="text-3xl font-bold">£{avgCostPerRequest.toFixed(4)}</div>
                                <div className="text-sm text-muted-foreground mt-2">
                                    Based on {currentRequests.toLocaleString()} requests
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Most Expensive Provider</div>
                                <div className="text-2xl font-bold">
                                    {providerCostBreakdown[0]?.category || 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">
                                    £{providerCostBreakdown[0]?.amount.toFixed(2) || '0.00'} ({providerCostBreakdown[0]?.percentage.toFixed(1) || '0'}%)
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Projected Monthly</div>
                                <div className="text-3xl font-bold">
                                    £{projectedMonthlyCost.toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">
                                    Based on current usage rate
                                </div>
                            </div>
                        </div>

                        {/* Cost Trend Chart */}
                        <div className="bg-card border border-border rounded-lg p-6 mb-8">
                            <h2 className="text-lg font-semibold mb-4">Cost Trend Over Time</h2>
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
                            </div>

                        {/* Provider Cost Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h2 className="text-lg font-semibold mb-4">Cost by Provider</h2>
                                <ResponsiveContainer width="100%" height={300} minHeight={300} minWidth={0}>
                                    <PieChart>
                                        <Pie
                                            data={providerCostBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ percent, index }: any) => {
                                                // FIXED: Access from providerCostBreakdown directly
                                                const item = providerCostBreakdown[index];
                                                return `${item.category}: ${(percent * 100).toFixed(1)}%`;
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
                                            formatter={(value: any) => [`£${Number(value).toFixed(2)}`, 'Cost']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <h2 className="text-lg font-semibold mb-4">Top 10 Accounts by Cost</h2>
                                <ResponsiveContainer width="100%" height={300} minHeight={300} minWidth={0}>
                                    <BarChart data={tenantCostBreakdown} layout="horizontal">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis type="number" stroke="#9ca3af" />
                                        <YAxis type="category" dataKey="tenant_name" stroke="#9ca3af" width={120} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                            formatter={(value: any) => [`£${Number(value).toFixed(2)}`, 'Cost']}
                                        />
                                        <Bar dataKey="cost" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Detailed Cost Table */}
                        <div className="bg-card border border-border rounded-lg overflow-hidden">
                            <div className="p-6 border-b border-border">
                                <h2 className="text-lg font-semibold">Detailed Cost Breakdown</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium">Provider</th>
                                            <th className="text-left py-3 px-4 font-medium">Requests</th>
                                            <th className="text-left py-3 px-4 font-medium">Tokens</th>
                                            <th className="text-left py-3 px-4 font-medium">Cost</th>
                                            <th className="text-left py-3 px-4 font-medium">Avg/Request</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {costData && costData.length > 0 && costData[costData.length - 1].provider_costs.map((provider) => (
                                            <tr key={provider.provider} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-medium">{provider.provider}</td>
                                                <td className="py-3 px-4">{provider.requests.toLocaleString()}</td>
                                                <td className="py-3 px-4">{provider.tokens.toLocaleString()}</td>
                                                <td className="py-3 px-4 font-semibold">£{provider.cost.toFixed(2)}</td>
                                                <td className="py-3 px-4">£{(provider.requests > 0 ? provider.cost / provider.requests : 0).toFixed(4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
