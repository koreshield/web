import { useState } from 'react';
import { TrendingUp, DollarSign, Zap, BarChart3, Download } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { SEOMeta } from '../components/SEOMeta';
import { format } from 'date-fns';

interface CostOptimization {
	recommendation: string;
	potentialSavings: number;
	priority: 'high' | 'medium' | 'low';
	category: string;
}

interface ProviderMetrics {
	provider: string;
	avgLatency: number;
	costPerRequest: number;
	reliability: number;
	throughput: number;
}

interface BudgetForecast {
	month: string;
	projected: number;
	actual: number;
	trend: number;
}

const MOCK_COST_OPTIMIZATIONS: CostOptimization[] = [
	{ recommendation: 'Switch 30% of GPT-4 requests to GPT-3.5-turbo for simple queries', potentialSavings: 2340, priority: 'high', category: 'Model Selection' },
	{ recommendation: 'Implement request caching for repeated queries', potentialSavings: 1890, priority: 'high', category: 'Caching' },
	{ recommendation: 'Reduce max_tokens from 2048 to 1024 for summarization tasks', potentialSavings: 1250, priority: 'medium', category: 'Token Optimization' },
	{ recommendation: 'Enable batch processing for non-urgent requests', potentialSavings: 980, priority: 'medium', category: 'Batching' },
	{ recommendation: 'Use Claude Haiku instead of Claude Opus for classification', potentialSavings: 750, priority: 'low', category: 'Model Selection' },
];

const MOCK_PROVIDER_METRICS: ProviderMetrics[] = [
	{ provider: 'OpenAI GPT-4', avgLatency: 1200, costPerRequest: 0.045, reliability: 99.8, throughput: 850 },
	{ provider: 'OpenAI GPT-3.5', avgLatency: 450, costPerRequest: 0.002, reliability: 99.9, throughput: 1200 },
	{ provider: 'Anthropic Claude 3', avgLatency: 980, costPerRequest: 0.038, reliability: 99.7, throughput: 920 },
	{ provider: 'Google Gemini Pro', avgLatency: 720, costPerRequest: 0.025, reliability: 99.6, throughput: 1050 },
	{ provider: 'Cohere Command', avgLatency: 650, costPerRequest: 0.018, reliability: 99.5, throughput: 980 },
];

const MOCK_BUDGET_FORECAST: BudgetForecast[] = [
	{ month: 'Jan', projected: 12500, actual: 11800, trend: 5 },
	{ month: 'Feb', projected: 13200, actual: 12900, trend: 8 },
	{ month: 'Mar', projected: 14100, actual: 0, trend: 12 },
	{ month: 'Apr', projected: 15200, actual: 0, trend: 15 },
	{ month: 'May', projected: 16500, actual: 0, trend: 18 },
	{ month: 'Jun', projected: 17900, actual: 0, trend: 22 },
];

const MOCK_COST_ALLOCATION = [
	{ name: 'Production', value: 45, cost: 5400 },
	{ name: 'Development', value: 25, cost: 3000 },
	{ name: 'Testing', value: 20, cost: 2400 },
	{ name: 'Research', value: 10, cost: 1200 },
];

const ALLOCATION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export function AdvancedAnalyticsPage() {
	const [selectedMetric, setSelectedMetric] = useState<'latency' | 'cost' | 'reliability' | 'throughput'>('cost');

	const totalSavings = MOCK_COST_OPTIMIZATIONS.reduce((sum, opt) => sum + opt.potentialSavings, 0);
	const currentMonthCost = MOCK_BUDGET_FORECAST[1].actual;
	const projectedMonthCost = MOCK_BUDGET_FORECAST[2].projected;

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high': return 'bg-red-500/10 text-red-600 border-red-500/50';
			case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/50';
			case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/50';
			default: return 'bg-gray-500/10 text-gray-600 border-gray-500/50';
		}
	};

	const exportData = () => {
		const data = {
			costOptimizations: MOCK_COST_OPTIMIZATIONS,
			providerMetrics: MOCK_PROVIDER_METRICS,
			budgetForecast: MOCK_BUDGET_FORECAST,
			costAllocation: MOCK_COST_ALLOCATION,
			exportedAt: new Date().toISOString()
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `analytics-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="min-h-screen bg-background">
			<SEOMeta
				title="Advanced Analytics | KoreShield"
				description="Cost optimization, performance metrics, and provider comparison analytics"
			/>

			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold flex items-center gap-3">
								<BarChart3 className="w-8 h-8 text-primary" />
								Advanced Analytics
							</h1>
							<p className="text-muted-foreground mt-1">
								Cost optimization and performance insights
							</p>
						</div>
						<button
							onClick={exportData}
							className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
						>
							<Download className="w-4 h-4" />
							Export Data
						</button>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Potential Savings</span>
							<DollarSign className="w-5 h-5 text-green-500" />
						</div>
						<div className="text-3xl font-bold text-green-600">${totalSavings.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground mt-1">Per month</p>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Current Spend</span>
							<TrendingUp className="w-5 h-5 text-blue-500" />
						</div>
						<div className="text-3xl font-bold">${currentMonthCost.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground mt-1">This month</p>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Projected Spend</span>
							<Zap className="w-5 h-5 text-orange-500" />
						</div>
						<div className="text-3xl font-bold">${projectedMonthCost.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground mt-1">Next month</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
					<div className="bg-card border border-border rounded-lg p-6">
						<h2 className="text-xl font-semibold mb-4">Cost Optimization Recommendations</h2>
						<div className="space-y-3">
							{MOCK_COST_OPTIMIZATIONS.map((opt, index) => (
								<div key={index} className="p-4 bg-muted/50 rounded-lg">
									<div className="flex items-start justify-between mb-2">
										<span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(opt.priority)}`}>
											{opt.priority.toUpperCase()}
										</span>
										<span className="text-sm font-bold text-green-600">
											+${opt.potentialSavings}/mo
										</span>
									</div>
									<p className="text-sm mt-2">{opt.recommendation}</p>
									<p className="text-xs text-muted-foreground mt-1">{opt.category}</p>
								</div>
							))}
						</div>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<h2 className="text-xl font-semibold mb-4">Budget Forecast</h2>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={MOCK_BUDGET_FORECAST}>
								<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
								<XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
								<YAxis stroke="hsl(var(--muted-foreground))" />
								<Tooltip
									contentStyle={{
										backgroundColor: 'hsl(var(--card))',
										border: '1px solid hsl(var(--border))',
										borderRadius: '8px'
									}}
								/>
								<Legend />
								<Line type="monotone" dataKey="projected" stroke="#3b82f6" strokeWidth={2} name="Projected" />
								<Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual" />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>

				<div className="bg-card border border-border rounded-lg p-6 mb-8">
					<h2 className="text-xl font-semibold mb-4">Provider Comparison</h2>
					<div className="flex gap-2 mb-4">
						{(['latency', 'cost', 'reliability', 'throughput'] as const).map((metric) => (
							<button
								key={metric}
								onClick={() => setSelectedMetric(metric)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMetric === metric
									? 'bg-primary text-primary-foreground'
									: 'bg-muted hover:bg-muted/80'
									}`}
							>
								{metric.charAt(0).toUpperCase() + metric.slice(1)}
							</button>
						))}
					</div>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={MOCK_PROVIDER_METRICS}>
							<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
							<XAxis dataKey="provider" stroke="hsl(var(--muted-foreground))" />
							<YAxis stroke="hsl(var(--muted-foreground))" />
							<Tooltip
								contentStyle={{
									backgroundColor: 'hsl(var(--card))',
									border: '1px solid hsl(var(--border))',
									borderRadius: '8px'
								}}
							/>
							<Legend />
							<Bar
								dataKey={selectedMetric === 'latency' ? 'avgLatency' :
									selectedMetric === 'cost' ? 'costPerRequest' :
										selectedMetric === 'reliability' ? 'reliability' : 'throughput'}
								fill="#3b82f6"
								name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div className="bg-card border border-border rounded-lg p-6">
						<h2 className="text-xl font-semibold mb-4">Cost Allocation by Team</h2>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={MOCK_COST_ALLOCATION}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
									outerRadius={100}
									fill="#8884d8"
									dataKey="value"
								>
									{MOCK_COST_ALLOCATION.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: 'hsl(var(--card))',
										border: '1px solid hsl(var(--border))',
										borderRadius: '8px'
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
						<div className="mt-4 space-y-2">
							{MOCK_COST_ALLOCATION.map((item, index) => (
								<div key={item.name} className="flex items-center justify-between text-sm">
									<div className="flex items-center gap-2">
										<div
											className="w-3 h-3 rounded-full"
											style={{ backgroundColor: ALLOCATION_COLORS[index] }}
										/>
										<span>{item.name}</span>
									</div>
									<span className="font-semibold">${item.cost.toLocaleString()}</span>
								</div>
							))}
						</div>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
						<div className="space-y-4">
							<div className="p-4 bg-muted/50 rounded-lg">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium">Average Latency</span>
									<span className="text-2xl font-bold">782ms</span>
								</div>
								<div className="w-full bg-muted rounded-full h-2">
									<div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
								</div>
							</div>

							<div className="p-4 bg-muted/50 rounded-lg">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium">Throughput</span>
									<span className="text-2xl font-bold">1,024 req/s</span>
								</div>
								<div className="w-full bg-muted rounded-full h-2">
									<div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
								</div>
							</div>

							<div className="p-4 bg-muted/50 rounded-lg">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium">Error Rate</span>
									<span className="text-2xl font-bold">0.12%</span>
								</div>
								<div className="w-full bg-muted rounded-full h-2">
									<div className="bg-red-500 h-2 rounded-full" style={{ width: '12%' }}></div>
								</div>
							</div>

							<div className="p-4 bg-muted/50 rounded-lg">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium">Token Efficiency</span>
									<span className="text-2xl font-bold">92%</span>
								</div>
								<div className="w-full bg-muted rounded-full h-2">
									<div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

export default AdvancedAnalyticsPage;
