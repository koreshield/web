import { useState, useEffect } from 'react';
import { Activity, CheckCircle, Server, Zap, XCircle } from 'lucide-react';
import { useProviderHealth } from '../hooks/useApi';
import { wsClient, type ProviderHealthEvent, type WebSocketEvent } from '../lib/websocket-client';
import { AppPage, AppPageHeader, AppPageSection, AppStatCard, AppStatGrid, AppSurface } from '../components/AppPageLayout';
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

		const cleanupHealth = wsClient.on<ProviderHealthEvent>('provider_health_change', (_event: WebSocketEvent<ProviderHealthEvent>) => {
			// React Query auto-invalidates the cache on provider health changes
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

	const liveStatusBadge = wsConnected ? (
		<div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-2">
			<div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
			<span className="text-sm font-medium text-green-600">Live</span>
		</div>
	) : (
		<div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
			<div className="h-2 w-2 rounded-full bg-muted-foreground/60" />
			<span className="text-sm font-medium text-muted-foreground">Connecting...</span>
		</div>
	);

	return (
		<AppPage>
			<AppPageHeader
				eyebrow="Infrastructure"
				eyebrowIcon={Activity}
				icon={Server}
				title="Provider Health Dashboard"
				description={wsConnected ? 'Live monitoring of LLM provider infrastructure' : 'LLM provider health — connect to WebSocket for live updates'}
				actions={liveStatusBadge}
			/>

			<AppStatGrid columns={3}>
				<AppStatCard label="Healthy" value={healthyCount} icon={CheckCircle} tone="text-emerald-400" detail="Operational providers" />
				<AppStatCard label="Down" value={downCount} icon={XCircle} tone="text-red-400" detail="Unavailable" />
				<AppStatCard label="Providers" value={configuredCount} icon={Zap} tone="text-sky-400" detail="Configured" />
			</AppStatGrid>

			<AppPageSection eyebrow="Status" title="Provider Status" variant="panel">
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
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
								Provider health becomes useful after you add at least one model provider in Koreshield configuration. Finish onboarding with API keys, rules, and your first protected request first, then return here for live provider status.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
							{Object.entries(providers).map(([name, provider]) => {
								return (
									<AppSurface key={name} className={`${getStatusBg(provider.status)} p-6`}>
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
									</AppSurface>
								);
							})}
						</div>
					)}
			</AppPageSection>

			{hasProviders && (
				<AppPageSection eyebrow="Routing" title="Provider Priority" variant="card">
					<div className="-mx-4 w-full overflow-hidden px-4 sm:mx-0 sm:px-0">
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
				</AppPageSection>
			)}
		</AppPage>
	);
}

export default ProviderHealthPage;
