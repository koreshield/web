import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Zap, BarChart3, Download, Loader2, AlertCircle } from 'lucide-react';
import {
	BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
	Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { SEOMeta } from '../components/SEOMeta';
import { api } from '../lib/api-client';
import { format } from 'date-fns';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProviderMetric {
	provider: string;
	avg_latency_ms: number;
	cost_per_request: number;
	total_requests: number;
	total_cost: number;
	success_rate: number;
	throughput_rpm: number;
}

interface CostDataPoint {
	period: string;
	total_cost: number;
	provider_costs: Array<{ provider: string; cost: number; requests: number }>;
}

interface CostOptimization {
	recommendation: string;
	potentialSavings: string;
	priority: 'high' | 'medium' | 'low';
	category: string;
}

type SelectedMetric = 'latency' | 'cost' | 'reliability' | 'throughput';
type TimeRange = '7d' | '30d' | '90d' | '1y';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

// ── Compute cost optimization recommendations from real provider data ─────────
function computeOptimizations(providers: ProviderMetric[]): CostOptimization[] {
	if (!providers.length) return [];

	const sorted = [...providers].sort((a, b) => b.cost_per_request - a.cost_per_request);
	const cheapest = providers.reduce((min, p) => p.cost_per_request < min.cost_per_request ? p : min, providers[0]);
	const mostExpensive = sorted[0];
	const highLatency = providers.filter(p => p.avg_latency_ms > 1500);
	const lowReliability = providers.filter(p => p.success_rate < 99);

	const recs: CostOptimization[] = [];

	if (mostExpensive && cheapest && mostExpensive.provider !== cheapest.provider) {
		const ratio = mostExpensive.cost_per_request / cheapest.cost_per_request;
		if (ratio > 1.5) {
			recs.push({
				recommendation: `${mostExpensive.provider} costs ${ratio.toFixed(1)}x more per request than ${cheapest.provider}. Route lower-complexity queries to ${cheapest.provider}.`,
				potentialSavings: `~${Math.round((mostExpensive.total_cost - cheapest.cost_per_request * mostExpensive.total_requests) * 100) / 100}`,
				priority: ratio > 3 ? 'high' : 'medium',
				category: 'Model Selection',
			});
		}
	}

	highLatency.forEach(p => {
		recs.push({
			recommendation: `${p.provider} averages ${p.avg_latency_ms.toFixed(0)}ms latency. Consider request timeouts or a faster fallback provider for real-time use cases.`,
			potentialSavings: 'UX improvement',
			priority: 'medium',
			category: 'Latency Optimization',
		});
	});

	lowReliability.forEach(p => {
		recs.push({
			recommendation: `${p.provider} has a ${p.success_rate.toFixed(1)}% success rate. Add retry logic and circuit breaker to improve resilience.`,
			potentialSavings: 'Reliability improvement',
			priority: 'high',
			category: 'Reliability',
		});
	});

	if (providers.some(p => p.total_requests > 1000)) {
		recs.push({
			recommendation: 'High request volume detected. Implement semantic caching for repeated or similar queries to reduce redundant API calls.',
			potentialSavings: 'Up to 30% cost reduction',
			priority: 'medium',
			category: 'Caching',
		});
	}

	return recs.slice(0, 5);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdvancedAnalyticsPage() {
	const [selectedMetric, setSelectedMetric] = useState<SelectedMetric>('cost');
	const [timeRange, setTimeRange] = useState<TimeRange>('30d');

	// Provider metrics
	const {
		data: providerMetricsRaw,
		isLoading: loadingProviders,
		error: errorProviders,
	} = useQuery({
		queryKey: ['provider-metrics', timeRange],
		queryFn: () => api.getProviderMetrics(timeRange),
		refetchInterval: 60_000,
		retry: false,
	});

	// Cost / budget data
	const {
		data: costDataRaw,
		isLoading: loadingCosts,
	} = useQuery({
		queryKey: ['cost-analytics', timeRange],
		queryFn: () => api.getCostAnalytics({ provider: undefined }),
		refetchInterval: 60_000,
		retry: false,
	});

	// Cost summary
	const { data: costSummaryRaw } = useQuery({
		queryKey: ['cost-summary'],
		queryFn: () => api.getCostSummary(),
		refetchInterval: 60_000,
		retry: false,
	});

	const providers: ProviderMetric[] = Array.isArray(providerMetricsRaw)
		? (providerMetricsRaw as ProviderMetric[])
		: [];

	const costData: CostDataPoint[] = Array.isArray(costDataRaw)
		? (costDataRaw as CostDataPoint[])
		: [];

	const costSummary = costSummaryRaw as {
		current_period_cost?: number;
		projected_monthly_cost?: number;
	} | undefined;

	// Budget forecast chart data — last 30 days daily costs
	const budgetChartData = costData.slice(-30).map(d => ({
		period: d.period,
		cost: d.total_cost,
	}));

	// Cost allocation by provider (pie chart from provider totals)
	const costAllocation = providers.map(p => ({
		name: p.provider,
		value: p.total_cost,
	})).filter(p => p.value > 0);

	// Provider chart data shaped for recharts
	const providerChartData = providers.map(p => ({
		provider: p.provider.replace('OpenAI ', '').replace('Anthropic ', ''),
		latency: p.avg_latency_ms,
		cost: p.cost_per_request,
		reliability: p.success_rate,
		throughput: p.throughput_rpm,
	}));

	// Computed optimizations from real data
	const optimizations = computeOptimizations(providers);

	// Summary stats
	const totalCost = providers.reduce((s, p) => s + p.total_cost, 0);
	const totalRequests = providers.reduce((s, p) => s + p.total_requests, 0);
	const avgLatency = providers.length
		? providers.reduce((s, p) => s + p.avg_latency_ms, 0) / providers.length
		: 0;
	const avgSuccessRate = providers.length
		? providers.reduce((s, p) => s + p.success_rate, 0) / providers.length
		: 0;

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high': return 'bg-red-500/10 text-red-600 border-red-500/50';
			case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/50';
			case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/50';
			default: return 'bg-muted text-muted-foreground border-border';
		}
	};

	const exportData = () => {
		const data = {
			providerMetrics: providers,
			budgetForecast: budgetChartData,
			costAllocation,
			optimizations,
			exportedAt: new Date().toISOString(),
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `analytics-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const metricKey = {
		latency: 'latency',
		cost: 'cost',
		reliability: 'reliability',
		throughput: 'throughput',
	}[selectedMetric];

	const metricLabel = {
		latency: 'Avg Latency (ms)',
		cost: 'Cost per Request ($)',
		reliability: 'Success Rate (%)',
		throughput: 'Throughput (req/min)',
	}[selectedMetric];

	if (errorProviders) {
		return (
			<div className="max-w-7xl mx-auto px-4 py-16 text-center">
				<AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
				<p className="text-muted-foreground">Failed to load analytics data. Please try again.</p>
			</div>
		);
	}

	return (
		<div className="bg-background">
			<SEOMeta
				title="Advanced Analytics | KoreShield"
				description="Cost optimization, performance metrics, and provider comparison analytics"
			/>

			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
								<BarChart3 className="w-8 h-8 text-primary" />
								Advanced Analytics
							</h1>
							<p className="text-sm sm:text-base text-muted-foreground mt-1">
								Cost optimization and performance insights
							</p>
						</div>
						<div className="flex items-center gap-3">
							<select
								value={timeRange}
								onChange={e => setTimeRange(e.target.value as TimeRange)}
								className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="7d">Last 7 days</option>
								<option value="30d">Last 30 days</option>
								<option value="90d">Last 90 days</option>
								<option value="1y">Last year</option>
							</select>
							<button
								onClick={exportData}
								className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
							>
								<Download className="w-4 h-4" />
								Export
							</button>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
				{/* Summary stats */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Total Spend</span>
							<DollarSign className="w-5 h-5 text-green-500" />
						</div>
						{loadingCosts ? (
							<Loader2 className="w-6 h-6 animate-spin text-muted-foreground mt-1" />
						) : (
							<>
								<div className="text-3xl font-bold">${totalCost.toFixed(4)}</div>
								<p className="text-xs text-muted-foreground mt-1">Selected period</p>
							</>
						)}
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Total Requests</span>
							<TrendingUp className="w-5 h-5 text-blue-500" />
						</div>
						{loadingProviders ? (
							<Loader2 className="w-6 h-6 animate-spin text-muted-foreground mt-1" />
						) : (
							<>
								<div className="text-3xl font-bold">{totalRequests.toLocaleString()}</div>
								<p className="text-xs text-muted-foreground mt-1">Proxied requests</p>
							</>
						)}
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Projected Monthly</span>
							<Zap className="w-5 h-5 text-orange-500" />
						</div>
						{loadingCosts ? (
							<Loader2 className="w-6 h-6 animate-spin text-muted-foreground mt-1" />
						) : (
							<>
								<div className="text-3xl font-bold">
									${costSummary?.projected_monthly_cost?.toFixed(2) ?? 'N/A'}
								</div>
								<p className="text-xs text-muted-foreground mt-1">Based on recent trend</p>
							</>
						)}
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Avg Success Rate</span>
							<BarChart3 className="w-5 h-5 text-purple-500" />
						</div>
						{loadingProviders ? (
							<Loader2 className="w-6 h-6 animate-spin text-muted-foreground mt-1" />
						) : (
							<>
								<div className="text-3xl font-bold">
									{providers.length ? `${avgSuccessRate.toFixed(1)}%` : 'N/A'}
								</div>
								<p className="text-xs text-muted-foreground mt-1">Across all providers</p>
							</>
						)}
					</div>
				</div>

				{/* Recommendations + Budget forecast */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
					<div className="bg-card border border-border rounded-lg p-4 sm:p-6">
						<h2 className="text-lg sm:text-xl font-semibold mb-4">Cost Optimization Recommendations</h2>
						{loadingProviders ? (
							<div className="flex items-center justify-center h-40">
								<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
							</div>
						) : optimizations.length === 0 ? (
							<div className="text-center py-10 text-muted-foreground text-sm">
								<p>No recommendations yet. Recommendations are generated automatically as your request volume grows.</p>
							</div>
						) : (
							<div className="space-y-3">
								{optimizations.map((opt, index) => (
									<div key={index} className="p-4 bg-muted/50 rounded-lg">
										<div className="flex items-start justify-between mb-2">
											<span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(opt.priority)}`}>
												{opt.priority.toUpperCase()}
											</span>
											<span className="text-sm font-semibold text-green-600 ml-2 text-right">
												{opt.potentialSavings}
											</span>
										</div>
										<p className="text-sm mt-2">{opt.recommendation}</p>
										<p className="text-xs text-muted-foreground mt-1">{opt.category}</p>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="bg-card border border-border rounded-lg p-4 sm:p-6 overflow-x-auto">
						<h2 className="text-lg sm:text-xl font-semibold mb-4">Daily Cost Trend</h2>
						{loadingCosts ? (
							<div className="flex items-center justify-center h-[300px]">
								<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
							</div>
						) : budgetChartData.length === 0 ? (
							<div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
								No cost data available for this period.
							</div>
						) : (
							<ResponsiveContainer width="100%" height={300}>
								<LineChart data={budgetChartData}>
									<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
									<XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
									<YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
									<Tooltip
										contentStyle={{
											backgroundColor: 'hsl(var(--card))',
											border: '1px solid hsl(var(--border))',
											borderRadius: '8px',
										}}
									/>
									<Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} name="Cost ($)" dot={false} />
								</LineChart>
							</ResponsiveContainer>
						)}
					</div>
				</div>

				{/* Provider comparison chart */}
				<div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-8 overflow-x-auto">
					<h2 className="text-lg sm:text-xl font-semibold mb-4">Provider Comparison</h2>
					<div className="flex flex-wrap gap-2 mb-4">
						{(['latency', 'cost', 'reliability', 'throughput'] as const).map(metric => (
							<button
								key={metric}
								onClick={() => setSelectedMetric(metric)}
								className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
									selectedMetric === metric
										? 'bg-primary text-primary-foreground'
										: 'bg-muted hover:bg-muted/80'
								}`}
							>
								{metric.charAt(0).toUpperCase() + metric.slice(1)}
							</button>
						))}
					</div>
					{loadingProviders ? (
						<div className="flex items-center justify-center h-[300px]">
							<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
						</div>
					) : providerChartData.length === 0 ? (
						<div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
							No provider data available for this period.
						</div>
					) : (
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={providerChartData}>
								<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
								<XAxis dataKey="provider" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
								<YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
								<Tooltip
									contentStyle={{
										backgroundColor: 'hsl(var(--card))',
										border: '1px solid hsl(var(--border))',
										borderRadius: '8px',
									}}
								/>
								<Bar dataKey={metricKey} fill="#3b82f6" name={metricLabel} radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					)}
				</div>

				{/* Cost by provider (pie) + Performance summary */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
					<div className="bg-card border border-border rounded-lg p-4 sm:p-6">
						<h2 className="text-lg sm:text-xl font-semibold mb-4">Cost by Provider</h2>
						{loadingProviders ? (
							<div className="flex items-center justify-center h-[300px]">
								<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
							</div>
						) : costAllocation.length === 0 ? (
							<div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
								No cost data available yet.
							</div>
						) : (
							<>
								<ResponsiveContainer width="100%" height={260}>
									<PieChart>
										<Pie
											data={costAllocation}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={({ name, percent }) =>
												percent && percent > 0.05
													? `${name}: ${(percent * 100).toFixed(0)}%`
													: ''
											}
											outerRadius={100}
											dataKey="value"
										>
											{costAllocation.map((_, index) => (
												<Cell
													key={`cell-${index}`}
													fill={CHART_COLORS[index % CHART_COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: 'hsl(var(--card))',
												border: '1px solid hsl(var(--border))',
												borderRadius: '8px',
											}}
											formatter={(v: number | undefined) => [v != null ? `$${v.toFixed(6)}` : 'N/A', 'Cost']}
										/>
									</PieChart>
								</ResponsiveContainer>
								<div className="mt-2 space-y-2">
									{costAllocation.map((item, index) => (
										<div key={item.name} className="flex items-center justify-between text-sm">
											<div className="flex items-center gap-2">
												<div
													className="w-3 h-3 rounded-full flex-shrink-0"
													style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
												/>
												<span>{item.name}</span>
											</div>
											<span className="font-semibold">${item.value.toFixed(4)}</span>
										</div>
									))}
								</div>
							</>
						)}
					</div>

					<div className="bg-card border border-border rounded-lg p-4 sm:p-6">
						<h2 className="text-lg sm:text-xl font-semibold mb-4">Performance Summary</h2>
						{loadingProviders ? (
							<div className="flex items-center justify-center h-40">
								<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
							</div>
						) : providers.length === 0 ? (
							<div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
								No provider data available yet.
							</div>
						) : (
							<div className="space-y-4">
								<div className="p-4 bg-muted/50 rounded-lg">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium">Avg Latency</span>
										<span className="text-2xl font-bold">{avgLatency.toFixed(0)}ms</span>
									</div>
									<div className="w-full bg-muted rounded-full h-2">
										<div
											className="bg-blue-500 h-2 rounded-full"
											style={{ width: `${Math.min((avgLatency / 3000) * 100, 100)}%` }}
										/>
									</div>
								</div>

								<div className="p-4 bg-muted/50 rounded-lg">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium">Avg Success Rate</span>
										<span className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</span>
									</div>
									<div className="w-full bg-muted rounded-full h-2">
										<div
											className="bg-green-500 h-2 rounded-full"
											style={{ width: `${avgSuccessRate}%` }}
										/>
									</div>
								</div>

								<div className="space-y-2 mt-2">
									{providers.map(p => (
										<div key={p.provider} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
											<span className="font-medium truncate max-w-[60%]">{p.provider}</span>
											<div className="flex items-center gap-3 text-xs text-muted-foreground">
												<span>{p.avg_latency_ms.toFixed(0)}ms</span>
												<span>{p.success_rate.toFixed(1)}%</span>
												<span>{p.total_requests.toLocaleString()} req</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

export default AdvancedAnalyticsPage;
