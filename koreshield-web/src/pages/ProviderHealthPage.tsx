import { useState, useEffect } from 'react';
import { Activity, CheckCircle, Server, Zap, XCircle } from 'lucide-react';
import { useProviderHealth } from '../hooks/useApi';
import { wsClient, type ProviderHealthEvent, type WebSocketEvent } from '../lib/websocket-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Provider {
	name: string;
	status: 'healthy' | 'down' | 'disabled';
	priority: number;
	type: string | null;
	error?: string;
}

type ProviderHealthResponse = {
	providers?: Record<string, {
		enabled?: boolean;
		healthy?: boolean;
		priority?: number;
		type?: string | null;
		status?: string;
		error?: string;
	}>;
};

export function ProviderHealthPage() {
	const [wsConnected, setWsConnected] = useState(false);

	// Fetch provider health data
	const { data: healthData, isLoading, error } = useProviderHealth();
	const providersRaw = ((healthData as ProviderHealthResponse | undefined)?.providers) || {};
	const providers: Record<string, Provider> = Object.entries(providersRaw).reduce((acc, [name, provider]) => {
		if (provider?.enabled === false) {
			return acc;
		}
		const providerStatus = provider?.status || (provider?.healthy ? 'healthy' : 'down');
		acc[name] = {
			name,
			status: providerStatus === 'healthy' ? 'healthy' : providerStatus === 'disabled' ? 'disabled' : 'down',
			priority: provider?.priority ?? 0,
			type: provider?.type ?? null,
			error: provider?.error,
		};
		return acc;
	}, {} as Record<string, Provider>);

	// WebSocket real-time updates
	useEffect(() => {
		wsClient.connect();
		// eslint-disable-next-line react-hooks/set-state-in-effect
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

	// Transform data for priority chart
	const priorityChartData = Object.entries(providers).map(([name, provider]) => ({
		name: name.charAt(0).toUpperCase() + name.slice(1),
		priority: provider.priority,
		status: provider.status,
	}));

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'healthy': return 'text-green-500';
			case 'down': return 'text-red-500';
			case 'disabled': return 'text-muted-foreground';
			default: return 'text-muted-foreground';
		}
	};

	const getStatusBg = (status: string) => {
		switch (status) {
			case 'healthy': return 'bg-green-500/10 border-green-500/50';
			case 'down': return 'bg-red-500/10 border-red-500/50';
			case 'disabled': return 'bg-muted/40 border-border';
			default: return 'bg-muted border-border';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'healthy': return <CheckCircle className="w-5 h-5" />;
			case 'down': return <XCircle className="w-5 h-5" />;
			default: return <Activity className="w-5 h-5" />;
		}
	};

	const getBarColor = (status: string) => {
		switch (status) {
			case 'healthy': return '#22c55e';
			case 'down': return '#ef4444';
			case 'disabled': return '#9ca3af';
			default: return '#6b7280';
		}
	};

	const summary = healthData as Record<string, unknown> | undefined;
	const healthyCount = typeof summary?.healthy_providers === 'number'
		? summary.healthy_providers
		: Object.values(providers).filter(p => p.status === 'healthy').length;
	const configuredCount = typeof summary?.enabled_providers === 'number'
		? summary.enabled_providers
		: Object.values(providers).length;
	const downCount = Math.max(0, configuredCount - healthyCount);
	const hasProviders = configuredCount > 0;

	return (
		<div className="bg-background">
			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
								<Server className="w-8 h-8 text-primary" />
								Provider Health Dashboard
							</h1>
							<p className="text-sm sm:text-base text-muted-foreground mt-1">
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
								<div className="flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg">
									<div className="w-2 h-2 bg-muted-foreground/60 rounded-full"></div>
									<span className="text-sm font-medium text-muted-foreground">Connecting...</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
				{/* Summary Stats */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
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
							<span className="text-sm font-medium text-muted-foreground">Down</span>
							<XCircle className="w-5 h-5 text-red-500" />
						</div>
						<div className="text-3xl font-bold text-red-600">{downCount}</div>
						<p className="text-xs text-muted-foreground mt-1">Unavailable</p>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Providers</span>
							<Zap className="w-5 h-5 text-blue-500" />
						</div>
						<div className="text-3xl font-bold">{configuredCount}</div>
						<p className="text-xs text-muted-foreground mt-1">Configured</p>
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
					) : error ? (
						<div className="rounded-lg border border-red-500/20 bg-card p-8">
							<h3 className="text-lg font-semibold mb-2 text-red-600">Unable to load provider health</h3>
							<p className="text-sm text-muted-foreground">
								The dashboard could not fetch provider status from the API. Retry after checking the backend connection and provider configuration.
							</p>
						</div>
					) : !hasProviders ? (
						<div className="rounded-lg border border-border bg-card p-8">
							<h3 className="text-lg font-semibold mb-2">No providers configured yet</h3>
							<p className="text-sm text-muted-foreground">
								Provider health becomes useful after you add at least one model provider in KoreShield configuration. Finish onboarding with API keys, rules, and your first protected request first, then return here for live provider status.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
							{Object.entries(providers).map(([name, provider]) => {
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
										</div>

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<span className="text-sm text-muted-foreground">Type</span>
												<span className="text-sm font-semibold">{provider.type || 'Unknown'}</span>
											</div>

											<div className="flex items-center justify-between">
												<span className="text-sm text-muted-foreground">Priority</span>
												<span className="text-sm font-semibold">{provider.priority}</span>
											</div>

											{provider.error && (
												<div className="pt-2 border-t border-border text-xs text-red-600">
													{provider.error}
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Priority Comparison Chart */}
				{hasProviders && (
					<div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-8">
						<h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
							<Activity className="w-5 h-5" />
							Provider Priority
						</h2>
						<div className="w-full overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
						<ResponsiveContainer width="100%" height={300} minHeight={300} minWidth={0}>
							<BarChart data={priorityChartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="name" className="text-sm" />
								<YAxis label={{ value: 'Priority', angle: -90, position: 'insideLeft' }} />
								<Tooltip
									contentStyle={{
										backgroundColor: 'hsl(var(--card))',
										border: '1px solid hsl(var(--border))',
										borderRadius: '8px'
									}}
								/>
								<Bar dataKey="priority" radius={[8, 8, 0, 0]}>
									{priorityChartData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			)}
		</main>
	</div>
);
}

export default ProviderHealthPage;
