import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Activity, TrendingUp, Shield, Download, Loader2 } from 'lucide-react';
import { ThreatMap } from '../components/ThreatMap';
import { AttackVectorChart } from '../components/AttackVectorChart';
import { TopEndpointsWidget } from '../components/TopEndpointsWidget';
import { wsClient, type ThreatDetectedEvent, type WebSocketEvent } from '../lib/websocket-client';
import { api } from '../lib/api-client';
import { SEOMeta } from '../components/SEOMeta';
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
				const newThreat: ThreatLocation = {
					id: event.data.threat_id,
					coordinates: [Math.random() * 360 - 180, Math.random() * 180 - 90],
					country: 'Unknown',
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
		total: threats.length,
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

	return (
		<div className="bg-background">
			<SEOMeta
				title="Threat Map | KoreShield"
				description="Real-time geographic visualization of security threats and attack patterns"
			/>

			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
								<MapPin className="w-8 h-8 text-primary" />
								Global Threat Map
							</h1>
							<p className="text-sm sm:text-base text-muted-foreground mt-1">
								Real-time geographic visualization of security threats
							</p>
						</div>
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
							{/* Time range selector */}
							<select
								value={timeRange}
								onChange={e => setTimeRange(e.target.value as TimeRange)}
								className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="7d">Last 7 days</option>
								<option value="30d">Last 30 days</option>
								<option value="90d">Last 90 days</option>
							</select>

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
							<button
								onClick={exportData}
								className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
							>
								<Download className="w-4 h-4" />
								Export Data
							</button>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
				{/* Data status notice */}
				<div className="mb-6 flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400 rounded-lg px-4 py-3 text-sm">
					<span className="mt-0.5 flex-shrink-0">ℹ</span>
					<span>The map updates in <strong>real-time</strong> via WebSocket as threats are detected. Attack vector statistics and top endpoints reflect <strong>sample data</strong> while live aggregation API endpoints are in development.</span>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Live Threats</span>
							<Activity className="w-5 h-5 text-blue-500" />
						</div>
						<div className="text-3xl font-bold">{stats.total}</div>
						<p className="text-xs text-muted-foreground mt-1">Current session</p>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Critical</span>
							<Shield className="w-5 h-5 text-red-500" />
						</div>
						<div className="text-3xl font-bold text-red-600">{stats.critical}</div>
						<p className="text-xs text-muted-foreground mt-1">High priority threats</p>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Attack Types</span>
							<TrendingUp className="w-5 h-5 text-green-500" />
						</div>
						<div className="text-3xl font-bold">{Object.keys(attackVectors).length}</div>
						<p className="text-xs text-muted-foreground mt-1">Distinct attack categories</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-8">
					<div className="lg:col-span-2">
						<div className="bg-card border border-border rounded-lg p-4 sm:p-6">
							<h2 className="text-lg sm:text-xl font-semibold mb-4">Geographic Threat Distribution</h2>
							<p className="text-xs text-muted-foreground mb-3">
								Map populates in real-time as threats are detected via WebSocket.
							</p>
							<div className="h-[300px] sm:h-[500px] w-full overflow-hidden">
								<ThreatMap threats={threats} onMarkerClick={setSelectedThreat} />
							</div>
						</div>
					</div>

					<div className="lg:col-span-1">
						{loadingVectors ? (
							<div className="bg-card border border-border rounded-lg p-6 flex items-center justify-center h-64">
								<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
							</div>
						) : (
							<AttackVectorChart data={attackVectors} />
						)}
					</div>
				</div>

				{loadingEndpoints ? (
					<div className="bg-card border border-border rounded-lg p-6 flex items-center justify-center h-40">
						<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<TopEndpointsWidget endpoints={topEndpoints} />
				)}
			</main>

			{selectedThreat && (
				<div
					className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
					onClick={() => setSelectedThreat(null)}
				>
					<div
						className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4"
						onClick={(e) => e.stopPropagation()}
					>
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
						<button
							onClick={() => setSelectedThreat(null)}
							className="mt-6 w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default ThreatMapPage;
