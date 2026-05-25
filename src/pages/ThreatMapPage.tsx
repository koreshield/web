import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Activity, TrendingUp, Shield, Download, Loader2 } from 'lucide-react';
import { ThreatMap } from '../components/ThreatMap';
import { AttackVectorChart } from '../components/AttackVectorChart';
import { TopEndpointsWidget } from '../components/TopEndpointsWidget';
import { wsClient, type ThreatDetectedEvent, type WebSocketEvent } from '../lib/websocket-client';
import { api } from '../lib/api-client';
import { SEOMeta } from '../components/SEOMeta';
import { AppCallout, AppPage, AppPageHeader, AppPageSection, AppPrimaryButton, AppStatCard, AppStatGrid, AppSurface } from '../components/AppPageLayout';
import { format } from 'date-fns';

interface ThreatLocation {
	id: string;
	coordinates: [number, number];
	country: string;
	threatType: string;
	severity: 'critical' | 'high' | 'medium' | 'low';
	timestamp: string;
}

interface EndpointData {
	endpoint: string;
	attackCount: number;
	lastAttack: string;
	severity: 'critical' | 'high' | 'medium' | 'low';
	blockedCount: number;
}

type TimeRange = '7d' | '30d' | '90d';

export function ThreatMapPage() {
	const [threats, setThreats] = useState<ThreatLocation[]>([]);
	const [liveThreatEvents, setLiveThreatEvents] = useState(0);
	const [wsConnected, setWsConnected] = useState(() => wsClient.isConnected());
	const [selectedThreat, setSelectedThreat] = useState<ThreatLocation | null>(null);
	const [timeRange, setTimeRange] = useState<TimeRange>('7d');

	// Real attack vector distribution from backend
	const { data: attackVectorData, isLoading: loadingVectors } = useQuery({
		queryKey: ['attack-vectors', timeRange],
		queryFn: () => api.getAttackVectors(timeRange),
		refetchInterval: 30_000,
		retry: false,
	});

	// Real top targeted endpoints from backend
	const { data: topEndpointData, isLoading: loadingEndpoints } = useQuery({
		queryKey: ['top-endpoints', timeRange],
		queryFn: () => api.getTopEndpoints(timeRange, 10),
		refetchInterval: 30_000,
		retry: false,
	});

	// Transform API response → component prop shapes
	const attackVectors: Record<string, number> = {};
	if (Array.isArray(attackVectorData)) {
		for (const item of attackVectorData as Array<{ attack_type: string; count: number }>) {
			attackVectors[item.attack_type] = item.count;
		}
	}

	const topEndpoints: EndpointData[] = Array.isArray(topEndpointData)
		? (topEndpointData as Array<{
				endpoint: string;
				attack_count: number;
				blocked_count: number;
				last_attack: string | null;
				severity: 'critical' | 'high' | 'medium' | 'low';
		  }>).map(e => ({
				endpoint: e.endpoint,
				attackCount: e.attack_count,
				blockedCount: e.blocked_count,
				lastAttack: e.last_attack ?? new Date().toISOString(),
				severity: e.severity,
		  }))
		: [];

	// WebSocket for live threat map updates
	useEffect(() => {
		wsClient.connect();
		wsClient.subscribe(['threat_detected']);

		const cleanupConnection = wsClient.on('connection_established', () => {
			setWsConnected(true);
		});

		const cleanupThreats = wsClient.on<ThreatDetectedEvent>(
			'threat_detected',
			(event: WebSocketEvent<ThreatDetectedEvent>) => {
				setLiveThreatEvents(prev => prev + 1);
				const threatWithLocation = event.data as ThreatDetectedEvent & {
					latitude?: number;
					longitude?: number;
					country?: string;
				};
				if (
					typeof threatWithLocation.longitude !== 'number' ||
					typeof threatWithLocation.latitude !== 'number'
				) {
					return;
				}

				const newThreat: ThreatLocation = {
					id: event.data.threat_id,
					coordinates: [threatWithLocation.longitude, threatWithLocation.latitude],
					country: threatWithLocation.country || 'Unknown',
					threatType: event.data.attack_type,
					severity: event.data.severity,
					timestamp: event.timestamp,
				};
				setThreats(prev => [newThreat, ...prev.slice(0, 49)]);
			}
		);

		return () => {
			cleanupConnection();
			cleanupThreats();
		};
	}, []);

	const stats = {
		total: liveThreatEvents,
		critical: threats.filter(t => t.severity === 'critical').length,
		countries: new Set(threats.map(t => t.country)).size,
	};

	const exportData = () => {
		const data = {
			threats,
			attackVectors,
			topEndpoints,
			exportedAt: new Date().toISOString(),
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `threat-map-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const headerActions = (
		<div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
			<select
				value={timeRange}
				onChange={e => setTimeRange(e.target.value as TimeRange)}
				className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="7d">Last 7 days</option>
				<option value="30d">Last 30 days</option>
				<option value="90d">Last 90 days</option>
			</select>

			{wsConnected ? (
				<div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-2">
					<div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
					<span className="text-sm font-medium text-green-600">Live</span>
				</div>
			) : (
				<div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
					<div className="h-2 w-2 rounded-full bg-muted-foreground/60" />
					<span className="text-sm font-medium text-muted-foreground">Connecting...</span>
				</div>
			)}

			<AppPrimaryButton onClick={exportData} className="w-full sm:w-auto">
				<Download className="h-4 w-4" />
				Export Data
			</AppPrimaryButton>
		</div>
	);

	return (
		<>
			<SEOMeta
				title="Threat Map"
				description="Real-time geographic visualization of security threats and attack patterns"
			/>

			<AppPage>
				<AppPageHeader
					eyebrow="Geographic intel"
					eyebrowIcon={Activity}
					icon={MapPin}
					title="Global Threat Map"
					description="Real-time geographic visualization of security threats"
					actions={headerActions}
				/>

				<AppCallout variant="info">
					The map updates in <strong>real-time</strong> via WebSocket as threats are detected. Attack vector statistics and top endpoints reflect <strong>live tenant data</strong>. Geographic markers appear only when source events include location metadata.
				</AppCallout>

				<AppStatGrid columns={3}>
					<AppStatCard label="Live Threats" value={stats.total} icon={Activity} tone="text-sky-400" detail="Current live session" />
					<AppStatCard label="Critical" value={stats.critical} icon={Shield} tone="text-red-400" detail="High priority threats" />
					<AppStatCard label="Attack Types" value={Object.keys(attackVectors).length} icon={TrendingUp} tone="text-emerald-400" detail="Distinct attack categories" />
				</AppStatGrid>

				<div className="mb-8 grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<AppPageSection eyebrow="Map" title="Geographic Threat Distribution" description="Map populates in real-time as threats are detected via WebSocket." variant="card">
							<div className="h-[300px] w-full overflow-hidden sm:h-[500px]">
								<ThreatMap threats={threats} onMarkerClick={setSelectedThreat} />
							</div>
						</AppPageSection>
					</div>

					<div className="lg:col-span-1">
						{loadingVectors ? (
							<AppSurface className="flex h-64 items-center justify-center">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</AppSurface>
						) : (
							<div className="dashboard-card rounded-[2rem] [&>*]:border-0 [&>*]:bg-transparent">
								<AttackVectorChart data={attackVectors} />
							</div>
						)}
					</div>
				</div>

				{loadingEndpoints ? (
					<AppSurface className="mb-8 flex h-40 items-center justify-center">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</AppSurface>
				) : (
					<div className="dashboard-card mb-8 rounded-[2rem] [&>*]:border-0 [&>*]:bg-transparent">
						<TopEndpointsWidget endpoints={topEndpoints} />
					</div>
				)}
			</AppPage>

			{selectedThreat && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={() => setSelectedThreat(null)}
				>
					<div className="mx-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
						<AppSurface>
						<h3 className="text-lg font-semibold mb-4">Threat Details</h3>
						<div className="space-y-3">
							<div>
								<span className="text-sm text-muted-foreground">Location</span>
								<p className="font-medium">{selectedThreat.country}</p>
							</div>
							<div>
								<span className="text-sm text-muted-foreground">Threat Type</span>
								<p className="font-medium">{selectedThreat.threatType}</p>
							</div>
							<div>
								<span className="text-sm text-muted-foreground">Severity</span>
								<p className="font-medium capitalize">{selectedThreat.severity}</p>
							</div>
							<div>
								<span className="text-sm text-muted-foreground">Timestamp</span>
								<p className="font-medium">{format(new Date(selectedThreat.timestamp), 'PPpp')}</p>
							</div>
						</div>
						<AppPrimaryButton onClick={() => setSelectedThreat(null)} className="mt-6 w-full">
							Close
						</AppPrimaryButton>
						</AppSurface>
					</div>
				</div>
			)}
		</>
	);
}

export default ThreatMapPage;
