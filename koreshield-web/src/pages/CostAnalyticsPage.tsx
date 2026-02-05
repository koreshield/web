import { useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Filter, Download, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

export function CostAnalyticsPage() {
    const [timeRange, setTimeRange] = useState('7d');
    const [selectedProvider, setSelectedProvider] = useState('all');
    const [selectedTenant, setSelectedTenant] = useState('all');

    // Fetch cost data
    const { data: costData, isLoading } = useQuery({
        queryKey: ['cost-analytics', timeRange, selectedProvider, selectedTenant],
        queryFn: async () => {
            // TODO: Replace with real API call to /api/v1/analytics/costs
            return mockCostData;
        },
        refetchInterval: 300000, // Refresh every 5 minutes
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

    // Aggregate provider costs
    const providerCostBreakdown: CostBreakdown[] = costData && costData.length > 0
        ? costData[costData.length - 1].provider_costs.map((p, idx) => ({
            category: p.provider,
            amount: p.cost,
            percentage: (p.cost / currentPeriodCost) * 100,
            color: COLORS[idx % COLORS.length]
        }))
        : [];

    // Aggregate tenant costs
    const tenantCostBreakdown = costData && costData.length > 0
        ? costData[costData.length - 1].tenant_costs.slice(0, 10) // Top 10
        : [];

    const downloadReport = () => {
        // TODO: Implement CSV/PDF export
        console.log('Downloading cost report...');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Cost Analytics</h1>
                                <p className="text-sm text-muted-foreground">
                                    Track spending across providers, tenants, and time periods
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={downloadReport}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 mt-6 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="24h">Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="90d">Last 90 Days</option>
                                <option value="1y">Last Year</option>
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

                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedTenant}
                                onChange={(e) => setSelectedTenant(e.target.value)}
                                className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">All Tenants</option>
                                <option value="tenant1">Acme Corporation</option>
                                <option value="tenant2">TechStart Inc</option>
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
                                <div className="text-3xl font-bold">${currentPeriodCost.toFixed(2)}</div>
                                <div className={`flex items-center gap-1 text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {trend.isPositive ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                    {trend.value.toFixed(1)}% vs previous period
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Avg Cost per Request</div>
                                <div className="text-3xl font-bold">$0.0023</div>
                                <div className="text-sm text-muted-foreground mt-2">
                                    Based on {(currentPeriodCost / 0.0023).toLocaleString()} requests
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Most Expensive Provider</div>
                                <div className="text-2xl font-bold">
                                    {providerCostBreakdown[0]?.category || 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">
                                    ${providerCostBreakdown[0]?.amount.toFixed(2) || '0.00'} ({providerCostBreakdown[0]?.percentage.toFixed(1) || '0'}%)
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-sm text-muted-foreground mb-1">Projected Monthly</div>
                                <div className="text-3xl font-bold">
                                    ${(currentPeriodCost * 30 / parseInt(timeRange)).toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">
                                    Based on current usage rate
                                </div>
                            </div>
                        </div>

                        {/* Cost Trend Chart */}
                        <div className="bg-card border border-border rounded-lg p-6 mb-8">
                            <h2 className="text-lg font-semibold mb-4">Cost Trend Over Time</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={costData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="period" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                        labelStyle={{ color: '#f9fafb' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="total_cost" stroke="#3b82f6" strokeWidth={2} name="Total Cost ($)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Provider Cost Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h2 className="text-lg font-semibold mb-4">Cost by Provider</h2>
                                <ResponsiveContainer width="100%" height={300}>
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
                                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <h2 className="text-lg font-semibold mb-4">Top 10 Tenants by Cost</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={tenantCostBreakdown} layout="horizontal">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis type="number" stroke="#9ca3af" />
                                        <YAxis type="category" dataKey="tenant_name" stroke="#9ca3af" width={120} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
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
                                                <td className="py-3 px-4 font-semibold">${provider.cost.toFixed(2)}</td>
                                                <td className="py-3 px-4">${(provider.cost / provider.requests).toFixed(4)}</td>
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

// Mock data for development - TODO: Replace with real API
const mockCostData: CostData[] = [
    {
        period: 'Jan 29',
        total_cost: 145.23,
        provider_costs: [
            { provider: 'OpenAI', cost: 89.50, requests: 45230, tokens: 2340000 },
            { provider: 'Anthropic', cost: 34.12, requests: 12500, tokens: 890000 },
            { provider: 'DeepSeek', cost: 15.61, requests: 23400, tokens: 1120000 },
            { provider: 'Gemini', cost: 6.00, requests: 8900, tokens: 445000 },
        ],
        tenant_costs: [
            { tenant_id: '1', tenant_name: 'Acme Corp', cost: 78.90, tier: 'enterprise' },
            { tenant_id: '2', tenant_name: 'TechStart', cost: 34.20, tier: 'professional' },
            { tenant_id: '3', tenant_name: 'DevShop', cost: 18.50, tier: 'starter' },
            { tenant_id: '4', tenant_name: 'CloudCo', cost: 13.63, tier: 'professional' },
        ],
    },
    {
        period: 'Jan 30',
        total_cost: 152.67,
        provider_costs: [
            { provider: 'OpenAI', cost: 92.10, requests: 47100, tokens: 2450000 },
            { provider: 'Anthropic', cost: 37.45, requests: 13890, tokens: 945000 },
            { provider: 'DeepSeek', cost: 16.82, requests: 24560, tokens: 1180000 },
            { provider: 'Gemini', cost: 6.30, requests: 9200, tokens: 460000 },
        ],
        tenant_costs: [
            { tenant_id: '1', tenant_name: 'Acme Corp', cost: 82.40, tier: 'enterprise' },
            { tenant_id: '2', tenant_name: 'TechStart', cost: 36.80, tier: 'professional' },
            { tenant_id: '3', tenant_name: 'DevShop', cost: 19.20, tier: 'starter' },
            { tenant_id: '4', tenant_name: 'CloudCo', cost: 14.27, tier: 'professional' },
        ],
    },
    {
        period: 'Jan 31',
        total_cost: 138.92,
        provider_costs: [
            { provider: 'OpenAI', cost: 85.20, requests: 43200, tokens: 2250000 },
            { provider: 'Anthropic', cost: 31.50, requests: 11800, tokens: 840000 },
            { provider: 'DeepSeek', cost: 15.12, requests: 22300, tokens: 1070000 },
            { provider: 'Gemini', cost: 7.10, requests: 10200, tokens: 510000 },
        ],
        tenant_costs: [
            { tenant_id: '1', tenant_name: 'Acme Corp', cost: 74.50, tier: 'enterprise' },
            { tenant_id: '2', tenant_name: 'TechStart', cost: 32.10, tier: 'professional' },
            { tenant_id: '3', tenant_name: 'DevShop', cost: 18.80, tier: 'starter' },
            { tenant_id: '4', tenant_name: 'CloudCo', cost: 13.52, tier: 'professional' },
        ],
    },
    {
        period: 'Feb 1',
        total_cost: 165.45,
        provider_costs: [
            { provider: 'OpenAI', cost: 98.60, requests: 49800, tokens: 2590000 },
            { provider: 'Anthropic', cost: 40.20, requests: 15200, tokens: 1020000 },
            { provider: 'DeepSeek', cost: 18.45, requests: 26700, tokens: 1280000 },
            { provider: 'Gemini', cost: 8.20, requests: 11500, tokens: 575000 },
        ],
        tenant_costs: [
            { tenant_id: '1', tenant_name: 'Acme Corp', cost: 88.90, tier: 'enterprise' },
            { tenant_id: '2', tenant_name: 'TechStart', cost: 39.20, tier: 'professional' },
            { tenant_id: '3', tenant_name: 'DevShop', cost: 21.50, tier: 'starter' },
            { tenant_id: '4', tenant_name: 'CloudCo', cost: 15.85, tier: 'professional' },
        ],
    },
    {
        period: 'Feb 2',
        total_cost: 171.83,
        provider_costs: [
            { provider: 'OpenAI', cost: 102.40, requests: 51500, tokens: 2680000 },
            { provider: 'Anthropic', cost: 42.10, requests: 15900, tokens: 1070000 },
            { provider: 'DeepSeek', cost: 19.23, requests: 27800, tokens: 1330000 },
            { provider: 'Gemini', cost: 8.10, requests: 11300, tokens: 565000 },
        ],
        tenant_costs: [
            { tenant_id: '1', tenant_name: 'Acme Corp', cost: 92.30, tier: 'enterprise' },
            { tenant_id: '2', tenant_name: 'TechStart', cost: 40.80, tier: 'professional' },
            { tenant_id: '3', tenant_name: 'DevShop', cost: 22.30, tier: 'starter' },
            { tenant_id: '4', tenant_name: 'CloudCo', cost: 16.43, tier: 'professional' },
        ],
    },
    {
        period: 'Feb 3',
        total_cost: 158.20,
        provider_costs: [
            { provider: 'OpenAI', cost: 94.30, requests: 47600, tokens: 2480000 },
            { provider: 'Anthropic', cost: 38.90, requests: 14700, tokens: 990000 },
            { provider: 'DeepSeek', cost: 17.80, requests: 25900, tokens: 1240000 },
            { provider: 'Gemini', cost: 7.20, requests: 10100, tokens: 505000 },
        ],
        tenant_costs: [
            { tenant_id: '1', tenant_name: 'Acme Corp', cost: 85.10, tier: 'enterprise' },
            { tenant_id: '2', tenant_name: 'TechStart', cost: 37.60, tier: 'professional' },
            { tenant_id: '3', tenant_name: 'DevShop', cost: 20.60, tier: 'starter' },
            { tenant_id: '4', tenant_name: 'CloudCo', cost: 14.90, tier: 'professional' },
        ],
    },
    {
        period: 'Feb 4',
        total_cost: 176.92,
        provider_costs: [
            { provider: 'OpenAI', cost: 105.20, requests: 53000, tokens: 2760000 },
            { provider: 'Anthropic', cost: 43.50, requests: 16500, tokens: 1110000 },
            { provider: 'DeepSeek', cost: 19.82, requests: 28700, tokens: 1370000 },
            { provider: 'Gemini', cost: 8.40, requests: 11700, tokens: 585000 },
        ],
        tenant_costs: [
            { tenant_id: '1', tenant_name: 'Acme Corp', cost: 95.10, tier: 'enterprise' },
            { tenant_id: '2', tenant_name: 'TechStart', cost: 42.00, tier: 'professional' },
            { tenant_id: '3', tenant_name: 'DevShop', cost: 23.10, tier: 'starter' },
            { tenant_id: '4', tenant_name: 'CloudCo', cost: 16.72, tier: 'professional' },
        ],
    },
];
