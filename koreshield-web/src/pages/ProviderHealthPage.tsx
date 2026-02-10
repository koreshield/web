import { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Server, Zap, XCircle, Settings } from 'lucide-react';
import { useProviderHealth } from '../hooks/useApi';
import { wsClient, type ProviderHealthEvent, type WebSocketEvent } from '../lib/websocket-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

interface Provider {
	name: string;
	status: 'healthy' | 'degraded' | 'down';
	latency_ms: number;
	error_rate: number;
	last_check: string;
}

interface ProviderConfig {
	enabled: boolean;
	priority: number;
}

interface FailoverEvent {
	id: string;
	timestamp: string;
	from_provider: string;
	to_provider: string;
	reason: string;
}

export function ProviderHealthPage() {
	const [wsConnected, setWsConnected] = useState(false);
	const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderConfig>>({
		openai: { enabled: true, priority: 1 },
		anthropic: { enabled: true, priority: 2 },
		gemini: { enabled: true, priority: 3 },
		deepseek: { enabled: true, priority: 4 },
		azure: { enabled: true, priority: 5 },
	});
	const [failoverEvents] = useState<FailoverEvent[]>([]);

	// Fetch provider health data
	const { data: healthData, isLoading } = useProviderHealth();
	const providers: Record<string, Provider> = (healthData as any)?.providers || {};

	// WebSocket real-time updates
	useEffect(() => {
		wsClient.connect();
		setWsConnected(wsClient.isConnected());

		wsClient.subscribe(['provider_health_change']);

		const cleanupConnection = wsClient.on('connection_established', () => {
			setWsConnected(true);
		});

		const cleanupHealth = wsClient.on<ProviderHealthEvent>('provider_health_change', (event: WebSocketEvent<ProviderHealthEvent>) => {
			console.log('[ProviderHealth] Status changed:', event.data);

			// In a real implementation, this would trigger a refetch or optimistic update
			// For now, React Query will auto-invalidate the cache
		});

		return () => {
			cleanupConnection();
			cleanupHealth();
		};
	}, []);

	// Transform data for latency chart
	const latencyChartData = Object.entries(providers).map(([name, provider]) => ({
		name: name.charAt(0).toUpperCase() + name.slice(1),
		latency: provider.latency_ms,
		status: provider.status,
	}));

	const toggleProvider = (providerName: string) => {
		setProviderConfigs(prev => ({
			...prev,
			[providerName]: {
				...prev[providerName],
				enabled: !prev[providerName].enabled
			}
		}));
	};

	const updatePriority = (providerName: string, priority: number) => {
		setProviderConfigs(prev => ({
			...prev,
			[providerName]: {
				...prev[providerName],
				priority
			}
		}));
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'healthy': return 'text-green-500';
			case 'degraded': return 'text-yellow-500';
			case 'down': return 'text-red-500';
			default: return 'text-gray-500';
		}
	};

	const getStatusBg = (status: string) => {
		switch (status) {
			case 'healthy': return 'bg-green-500/10 border-green-500/50';
			case 'degraded': return 'bg-yellow-500/10 border-yellow-500/50';
			case 'down': return 'bg-red-500/10 border-red-500/50';
			default: return 'bg-gray-500/10 border-gray-500/50';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'healthy': return <CheckCircle className="w-5 h-5" />;
			case 'degraded': return <AlertCircle className="w-5 h-5" />;
			case 'down': return <XCircle className="w-5 h-5" />;
			default: return <Activity className="w-5 h-5" />;
		}
	};

	const getBarColor = (status: string) => {
		switch (status) {
			case 'healthy': return '#22c55e';
			case 'degraded': return '#eab308';
			case 'down': return '#ef4444';
			default: return '#6b7280';
		}
	};

	const healthyCount = Object.values(providers).filter(p => p.status === 'healthy').length;
	const degradedCount = Object.values(providers).filter(p => p.status === 'degraded').length;
	const downCount = Object.values(providers).filter(p => p.status === 'down').length;
	const avgLatency = Object.values(providers).length > 0
		? Object.values(providers).reduce((sum, p) => sum + p.latency_ms, 0) / Object.values(providers).length
		: 0;

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold flex items-center gap-3">
								<Server className="w-8 h-8 text-primary" />
								Provider Health Dashboard
							</h1>
							<p className="text-muted-foreground mt-1">
								Real-time monitoring of LLM provider infrastructure
							</p>
						</div>
						<div className="flex items-center gap-3">
							{wsConnected ? (
								<div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/50 rounded-lg">
									<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
									<span className="text-sm font-medium text-green-600">Live</span>
								</div>
							) : (
								<div className="flex items-center gap-2 px-3 py-2 bg-gray-500/10 border border-gray-500/50 rounded-lg">
									<div className="w-2 h-2 bg-gray-500 rounded-full"></div>
									<span className="text-sm font-medium text-gray-600">Connecting...</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Summary Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Healthy</span>
							<CheckCircle className="w-5 h-5 text-green-500" />
						</div>
						<div className="text-3xl font-bold text-green-600">{healthyCount}</div>
						<p className="text-xs text-muted-foreground mt-1">Operational providers</p>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Degraded</span>
							<AlertCircle className="w-5 h-5 text-yellow-500" />
						</div>
						<div className="text-3xl font-bold text-yellow-600">{degradedCount}</div>
						<p className="text-xs text-muted-foreground mt-1">Performance issues</p>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Down</span>
							<XCircle className="w-5 h-5 text-red-500" />
						</div>
						<div className="text-3xl font-bold text-red-600">{downCount}</div>
						<p className="text-xs text-muted-foreground mt-1">Unavailable</p>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Avg Latency</span>
							<Zap className="w-5 h-5 text-blue-500" />
						</div>
						<div className="text-3xl font-bold">{avgLatency.toFixed(0)}ms</div>
						<p className="text-xs text-muted-foreground mt-1">Response time</p>
					</div>
				</div>

				{/* Provider Status Cards */}
				<div className="mb-8">
					<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
						<Server className="w-5 h-5" />
						Provider Status
					</h2>

					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{Object.entries(providers).map(([name, provider]) => {
								const config = providerConfigs[name];

								return (
									<div
										key={name}
										className={`bg-card border rounded-lg p-6 ${getStatusBg(provider.status)}`}
									>
										<div className="flex items-start justify-between mb-4">
											<div className="flex items-center gap-3">
												<div className={`p-2 rounded-lg bg-card ${getStatusColor(provider.status)}`}>
													{getStatusIcon(provider.status)}
												</div>
												<div>
													<h3 className="font-semibold text-lg capitalize">{name}</h3>
													<span className={`text-sm ${getStatusColor(provider.status)}`}>
														{provider.status?.toUpperCase() || 'UNKNOWN'}
													</span>
												</div>
											</div>
											<button
												onClick={() => toggleProvider(name)}
												className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${config?.enabled
													? 'bg-green-500/20 text-green-600'
													: 'bg-gray-500/20 text-gray-600'
													}`}
											>
												{config?.enabled ? 'Enabled' : 'Disabled'}
											</button>
										</div>

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<span className="text-sm text-muted-foreground flex items-center gap-1">
													<Clock className="w-4 h-4" />
													Latency
												</span>
												<span className="text-sm font-semibold">{provider.latency_ms}ms</span>
											</div>

											<div className="flex items-center justify-between">
												<span className="text-sm text-muted-foreground flex items-center gap-1">
													<AlertCircle className="w-4 h-4" />
													Error Rate
												</span>
												<span className="text-sm font-semibold">{(provider.error_rate * 100).toFixed(2)}%</span>
											</div>

											<div className="flex items-center justify-between">
												<span className="text-sm text-muted-foreground">Priority</span>
												<input
													type="number"
													min="1"
													max="10"
													value={config?.priority || 5}
													onChange={(e) => updatePriority(name, parseInt(e.target.value))}
													className="w-16 px-2 py-1 bg-muted border border-border rounded text-sm text-center"
												/>
											</div>

											<div className="pt-2 border-t border-border">
												<span className="text-xs text-muted-foreground">
													Last checked: {format(new Date(provider.last_check), 'HH:mm:ss')}
												</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Latency Comparison Chart */}
				<div className="bg-card border border-border rounded-lg p-6 mb-8">
					<h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
						<Activity className="w-5 h-5" />
						Latency Comparison
					</h2>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={latencyChartData}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
							<XAxis dataKey="name" className="text-sm" />
							<YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
							<Tooltip
								contentStyle={{
									backgroundColor: 'hsl(var(--card))',
									border: '1px solid hsl(var(--border))',
									borderRadius: '8px'
								}}
							/>
							<Bar dataKey="latency" radius={[8, 8, 0, 0]}>
								{latencyChartData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>

				{/* Failover Visualization */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div className="bg-card border border-border rounded-lg p-6">
						<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
							<Zap className="w-5 h-5" />
							Failover Chain
						</h2>
						<div className="space-y-3">
							{Object.entries(providerConfigs)
								.sort(([, a], [, b]) => a.priority - b.priority)
								.map(([name, config], index) => (
									<div key={name} className="flex items-center gap-3">
										<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
											}`}>
											{index + 1}
										</div>
										<div className="flex-1 flex items-center justify-between">
											<span className="font-medium capitalize">{name}</span>
											{index === 0 && (
												<span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
													Primary
												</span>
											)}
											{!config.enabled && (
												<span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-600 rounded-full">
													Disabled
												</span>
											)}
										</div>
									</div>
								))}
						</div>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
							<Activity className="w-5 h-5" />
							Recent Failover Events
						</h2>
						{failoverEvents.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
								<p>No failover events</p>
								<p className="text-sm mt-1">All providers stable</p>
							</div>
						) : (
							<div className="space-y-3">
								{failoverEvents.slice(0, 10).map(event => (
									<div key={event.id} className="p-3 bg-muted/50 rounded-lg">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-sm font-medium capitalize">{event.from_provider}</span>
											<span className="text-muted-foreground">→</span>
											<span className="text-sm font-medium capitalize">{event.to_provider}</span>
										</div>
										<p className="text-xs text-muted-foreground">{event.reason}</p>
										<p className="text-xs text-muted-foreground mt-1">
											{format(new Date(event.timestamp), 'MMM dd, HH:mm:ss')}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* API Key Management Placeholder */}
				<div className="mt-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
					<div className="flex items-start gap-4">
						<div className="p-3 bg-purple-500/10 rounded-lg">
							<Settings className="w-6 h-6 text-purple-500" />
						</div>
						<div className="flex-1">
							<h3 className="text-lg font-semibold mb-2">Provider API Key Management</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Comprehensive API key management for all providers will be available soon.
								This will include key rotation, expiration tracking, and usage analytics.
							</p>
							<a
								href="/settings/api-keys"
								className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 rounded-lg transition-colors text-sm font-medium"
							>
								<Settings className="w-4 h-4" />
								Go to API Keys (Coming Soon)
							</a>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

export default ProviderHealthPage;
