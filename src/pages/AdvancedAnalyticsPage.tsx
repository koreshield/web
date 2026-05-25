import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, PoundSterling, Zap, BarChart3, Download, Activity } from 'lucide-react';
import {
	BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
	Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { SEOMeta } from '../components/SEOMeta';
import { api } from '../lib/api-client';
import { format } from 'date-fns';
import {
	AppPage,
	AppPageHeader,
	AppStatGrid,
	AppStatCard,
	AppPageSection,
	AppEmptyState,
	AppPrimaryButton,
	AppSecondaryButton,
	AppSurface,
	AppPageError,
	AppPageLoading,
} from '../components/AppPageLayout';

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

// ── Provider display name helper ──────────────────────────────────────────────
// Normalise raw DB provider values into readable names for the UI.
// The DB stores Python class names (e.g. "OpenAIProvider") from __class__.__name__
// as well as config-key slugs (e.g. "openai"). All lookups are case-insensitive.
function formatProviderName(raw: string): string {
	const MAP: Record<string, string> = {
		// Class-name variants (what actually gets stored in RequestLog.provider)
		openaiprovider: 'OpenAI',
		azureopenaiprovider: 'Azure OpenAI',
		anthropicprovider: 'Anthropic',
		cohereprovider: 'Cohere',
		mistralprovider: 'Mistral',
		groqprovider: 'Groq',
		togetherAIprovider: 'Together AI',
		// Config-key slug variants
		openai: 'OpenAI',
		openai_provider: 'OpenAI',
		anthropic: 'Anthropic',
		azure: 'Azure OpenAI',
		azure_openai: 'Azure OpenAI',
		cohere: 'Cohere',
		mistral: 'Mistral',
		groq: 'Groq',
		together: 'Together AI',
		together_ai: 'Together AI',
	};
	return MAP[raw.toLowerCase()] ?? raw.replace(/Provider$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Compute cost optimization recommendations from real provider data ─────────
function computeOptimizations(providers: ProviderMetric[]): CostOptimization[] {
	if (!providers.length) return [];

	const sorted = [...providers].sort((a, b) => b.cost_per_request - a.cost_per_request);
	const cheapest = providers.reduce((min, p) => p.cost_per_request < min.cost_per_request ? p : min, providers[0]);
	const mostExpensive = sorted[0];
	const highLatency = providers.filter(p => p.avg_latency_ms > 1500);
	// 90% threshold — anything above is acceptable provider reliability.
	// (Previously 99%, which flagged every provider including healthy ones.)
	const lowReliability = providers.filter(p => p.success_rate < 90);

	const recs: CostOptimization[] = [];

	if (mostExpensive && cheapest && mostExpensive.provider !== cheapest.provider) {
		const ratio = mostExpensive.cost_per_request / cheapest.cost_per_request;
		if (ratio > 1.5) {
			recs.push({
				recommendation: `${formatProviderName(mostExpensive.provider)} costs ${ratio.toFixed(1)}x more per request than ${formatProviderName(cheapest.provider)}. Route lower-complexity queries to ${formatProviderName(cheapest.provider)}.`,
				potentialSavings: `~${Math.round((mostExpensive.total_cost - cheapest.cost_per_request * mostExpensive.total_requests) * 100) / 100}`,
				priority: ratio > 3 ? 'high' : 'medium',
				category: 'Model Selection',
			});
		}
	}

	highLatency.forEach(p => {
		recs.push({
			recommendation: `${formatProviderName(p.provider)} averages ${p.avg_latency_ms.toFixed(0)}ms latency. Consider request timeouts or a faster fallback provider for real-time use cases.`,
			potentialSavings: 'UX improvement',
			priority: 'medium',
			category: 'Latency Optimization',
		});
	});

	lowReliability.forEach(p => {
		recs.push({
			recommendation: `${formatProviderName(p.provider)} has a ${p.success_rate.toFixed(1)}% success rate. Add retry logic and circuit breaker to improve resilience.`,
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
		name: formatProviderName(p.provider),
		value: p.total_cost,
	})).filter(p => p.value > 0);

	// Provider chart data shaped for recharts
	const providerChartData = providers.map(p => ({
		provider: formatProviderName(p.provider),
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
			<AppPage>
				<AppPageError
					title="Failed to load analytics"
					message="Failed to load analytics data. Please try again."
				/>
			</AppPage>
		);
	}

	return (
		<AppPage>
			<SEOMeta
				title="Advanced Analytics | Koreshield"
				description="Cost optimization, performance metrics, and provider comparison analytics"
			/>

			<AppPageHeader
				eyebrow="Deep insights"
				eyebrowIcon={BarChart3}
				title="Advanced Analytics"
				description="Cost optimization and performance insights"
				icon={BarChart3}
				actions={
					<div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
						<select
							value={timeRange}
							onChange={(e) => setTimeRange(e.target.value as TimeRange)}
							className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="7d">Last 7 days</option>
							<option value="30d">Last 30 days</option>
							<option value="90d">Last 90 days</option>
							<option value="1y">Last year</option>
						</select>
						<AppPrimaryButton onClick={exportData}>
							<Download className="h-4 w-4" />
							Export
						</AppPrimaryButton>
					</div>
				}
			/>

			<AppStatGrid>
				<AppStatCard
					label="Total Spend"
					value={loadingCosts ? '…' : `£${totalCost.toFixed(4)}`}
					icon={PoundSterling}
					tone="text-emerald-400"
					detail="Selected period"
				/>
				<AppStatCard
					label="Total Requests"
					value={loadingProviders ? '…' : totalRequests.toLocaleString()}
					icon={TrendingUp}
					tone="text-sky-400"
					detail="Proxied requests"
				/>
				<AppStatCard
					label="Projected Monthly"
					value={loadingCosts ? '…' : `£${(costSummary?.projected_monthly_cost ?? 0).toFixed(2)}`}
					icon={Zap}
					tone="text-amber-400"
					detail="Based on recent trend"
				/>
				<AppStatCard
					label="Avg Success Rate"
					value={loadingProviders ? '…' : `${avgSuccessRate.toFixed(1)}%`}
					icon={BarChart3}
					tone="text-violet-400"
					detail="Across all providers"
				/>
			</AppStatGrid>

			<div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
				<AppPageSection variant="card" title="Cost Optimization Recommendations">
					{loadingProviders ? (
						<AppPageLoading label="Loading recommendations…" />
					) : optimizations.length === 0 ? (
						<AppEmptyState
							icon={BarChart3}
							title="No recommendations yet"
							description="Recommendations are generated automatically as your request volume grows."
						/>
					) : (
						<div className="space-y-3">
							{optimizations.map((opt, index) => (
								<AppSurface key={index} className="border-0 bg-background/55">
									<div className="mb-2 flex items-start justify-between">
										<span className={`rounded-full border px-2 py-1 text-xs ${getPriorityColor(opt.priority)}`}>
											{opt.priority.toUpperCase()}
										</span>
										<span className="ml-2 text-right text-sm font-semibold text-green-600">
											{opt.potentialSavings}
										</span>
									</div>
									<p className="mt-2 text-sm">{opt.recommendation}</p>
									<p className="mt-1 text-xs text-muted-foreground">{opt.category}</p>
								</AppSurface>
							))}
						</div>
					)}
				</AppPageSection>

				<AppPageSection variant="card" title="Daily Cost Trend">
					{loadingCosts ? (
						<AppPageLoading label="Loading cost trend…" />
					) : budgetChartData.length === 0 ? (
						<AppEmptyState icon={PoundSterling} title="No cost data" description="No cost data available for this period." />
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
				</AppPageSection>
			</div>

			<AppPageSection title="Provider Comparison">
				<div className="mb-4 flex flex-wrap gap-2">
					{(['latency', 'cost', 'reliability', 'throughput'] as const).map((metric) => (
						<AppSecondaryButton
							key={metric}
							onClick={() => setSelectedMetric(metric)}
							className={selectedMetric === metric ? 'border-primary/25 bg-primary/12 text-primary' : undefined}
						>
							{metric.charAt(0).toUpperCase() + metric.slice(1)}
						</AppSecondaryButton>
					))}
				</div>
				{loadingProviders ? (
					<AppPageLoading label="Loading provider data…" />
				) : providerChartData.length === 0 ? (
					<AppEmptyState icon={BarChart3} title="No provider data" description="No provider data available for this period." />
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
			</AppPageSection>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<AppPageSection variant="card" title="Cost by Provider">
					{loadingProviders ? (
						<AppPageLoading label="Loading cost allocation…" />
					) : costAllocation.length === 0 ? (
						<AppEmptyState icon={PoundSterling} title="No cost data yet" description="No cost data available yet." />
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
										formatter={(v: number | undefined) => [v != null ? `£${v.toFixed(6)}` : 'N/A', 'Cost']}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className="mt-2 space-y-2">
								{costAllocation.map((item, index) => (
									<div key={item.name} className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-2">
											<div
												className="h-3 w-3 flex-shrink-0 rounded-full"
												style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
											/>
											<span>{item.name}</span>
										</div>
										<span className="font-semibold">£{item.value.toFixed(4)}</span>
									</div>
								))}
							</div>
						</>
					)}
				</AppPageSection>

				<AppPageSection variant="card" title="Performance Summary">
					{loadingProviders ? (
						<AppPageLoading label="Loading performance…" />
					) : providers.length === 0 ? (
						<AppEmptyState icon={Activity} title="No provider data yet" description="No provider data available yet." />
					) : (
						<div className="space-y-4">
							<AppSurface className="border-0 bg-background/55">
								<div className="mb-2 flex items-center justify-between">
									<span className="text-sm font-medium">Avg Latency</span>
									<span className="text-2xl font-bold">{avgLatency.toFixed(0)}ms</span>
								</div>
								<div className="h-2 w-full rounded-full bg-muted">
									<div
										className="h-2 rounded-full bg-blue-500"
										style={{ width: `${Math.min((avgLatency / 3000) * 100, 100)}%` }}
									/>
								</div>
							</AppSurface>

							<AppSurface className="border-0 bg-background/55">
								<div className="mb-2 flex items-center justify-between">
									<span className="text-sm font-medium">Avg Success Rate</span>
									<span className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</span>
								</div>
								<div className="h-2 w-full rounded-full bg-muted">
									<div
										className="h-2 rounded-full bg-green-500"
										style={{ width: `${avgSuccessRate}%` }}
									/>
								</div>
							</AppSurface>

							<div className="mt-2 space-y-2">
								{providers.map((p) => (
									<div key={p.provider} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
										<span className="max-w-[60%] truncate font-medium">{p.provider}</span>
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
				</AppPageSection>
			</div>
		</AppPage>
	);
}

export default AdvancedAnalyticsPage;
