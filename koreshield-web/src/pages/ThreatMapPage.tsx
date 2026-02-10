import { useState, useEffect } from 'react';
import { MapPin, Activity, TrendingUp, Shield, Download } from 'lucide-react';
import { ThreatMap } from '../components/ThreatMap';
import { AttackVectorChart } from '../components/AttackVectorChart';
import { TopEndpointsWidget } from '../components/TopEndpointsWidget';
import { wsClient, type ThreatDetectedEvent, type WebSocketEvent } from '../lib/websocket-client';
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

const MOCK_THREAT_LOCATIONS: ThreatLocation[] = [
	{ id: '1', coordinates: [-74.006, 40.7128], country: 'United States', threatType: 'Prompt Injection', severity: 'critical', timestamp: new Date().toISOString() },
	{ id: '2', coordinates: [0.1278, 51.5074], country: 'United Kingdom', threatType: 'Data Exfiltration', severity: 'high', timestamp: new Date().toISOString() },
	{ id: '3', coordinates: [139.6917, 35.6895], country: 'Japan', threatType: 'Jailbreak', severity: 'medium', timestamp: new Date().toISOString() },
	{ id: '4', coordinates: [2.3522, 48.8566], country: 'France', threatType: 'PII Leakage', severity: 'high', timestamp: new Date().toISOString() },
	{ id: '5', coordinates: [13.405, 52.52], country: 'Germany', threatType: 'Malicious Code', severity: 'critical', timestamp: new Date().toISOString() },
	{ id: '6', coordinates: [151.2093, -33.8688], country: 'Australia', threatType: 'Prompt Injection', severity: 'medium', timestamp: new Date().toISOString() },
	{ id: '7', coordinates: [77.2090, 28.6139], country: 'India', threatType: 'Social Engineering', severity: 'low', timestamp: new Date().toISOString() },
	{ id: '8', coordinates: [-43.1729, -22.9068], country: 'Brazil', threatType: 'Data Exfiltration', severity: 'high', timestamp: new Date().toISOString() },
];

const MOCK_ATTACK_VECTORS = {
	'Prompt Injection': 145,
	'Data Exfiltration': 89,
	'Jailbreak': 67,
	'PII Leakage': 54,
	'Malicious Code': 43,
	'Social Engineering': 32,
	'Other': 18
};

const MOCK_TOP_ENDPOINTS: EndpointData[] = [
	{ endpoint: '/api/v1/chat/completions', attackCount: 234, lastAttack: new Date().toISOString(), severity: 'critical', blockedCount: 198 },
	{ endpoint: '/api/v1/embeddings', attackCount: 156, lastAttack: new Date().toISOString(), severity: 'high', blockedCount: 142 },
	{ endpoint: '/api/v1/completions', attackCount: 123, lastAttack: new Date().toISOString(), severity: 'high', blockedCount: 109 },
	{ endpoint: '/api/v1/search', attackCount: 98, lastAttack: new Date().toISOString(), severity: 'medium', blockedCount: 87 },
	{ endpoint: '/api/v1/analyze', attackCount: 76, lastAttack: new Date().toISOString(), severity: 'medium', blockedCount: 65 },
	{ endpoint: '/api/v1/summarize', attackCount: 54, lastAttack: new Date().toISOString(), severity: 'low', blockedCount: 48 },
	{ endpoint: '/api/v1/translate', attackCount: 43, lastAttack: new Date().toISOString(), severity: 'low', blockedCount: 39 },
	{ endpoint: '/api/v1/classify', attackCount: 32, lastAttack: new Date().toISOString(), severity: 'low', blockedCount: 28 },
];

export function ThreatMapPage() {
	const [threats, setThreats] = useState<ThreatLocation[]>(MOCK_THREAT_LOCATIONS);
	const [attackVectors, setAttackVectors] = useState(MOCK_ATTACK_VECTORS);
	const [topEndpoints, setTopEndpoints] = useState(MOCK_TOP_ENDPOINTS);
	const [wsConnected, setWsConnected] = useState(false);
	const [selectedThreat, setSelectedThreat] = useState<ThreatLocation | null>(null);

	useEffect(() => {
		wsClient.connect();
		setWsConnected(wsClient.isConnected());

		wsClient.subscribe(['threat_detected']);

		const cleanupConnection = wsClient.on('connection_established', () => {
			setWsConnected(true);
		});

		const cleanupThreats = wsClient.on<ThreatDetectedEvent>('threat_detected', (event: WebSocketEvent<ThreatDetectedEvent>) => {
			const newThreat: ThreatLocation = {
				id: event.data.threat_id,
				coordinates: [Math.random() * 360 - 180, Math.random() * 180 - 90],
				country: 'Unknown',
				threatType: event.data.attack_type,
				severity: event.data.severity,
				timestamp: event.timestamp
			};

			setThreats(prev => [newThreat, ...prev.slice(0, 49)]);
		});

		return () => {
			cleanupConnection();
			cleanupThreats();
		};
	}, []);

	const stats = {
		total: threats.length,
		critical: threats.filter(t => t.severity === 'critical').length,
		countries: new Set(threats.map(t => t.country)).size
	};

	const exportData = () => {
		const data = {
			threats,
			attackVectors,
			topEndpoints,
			exportedAt: new Date().toISOString()
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
		<div className="min-h-screen bg-background">
			<SEOMeta
				title="Threat Map | KoreShield"
				description="Real-time geographic visualization of security threats and attack patterns"
			/>

			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold flex items-center gap-3">
								<MapPin className="w-8 h-8 text-primary" />
								Global Threat Map
							</h1>
							<p className="text-muted-foreground mt-1">
								Real-time geographic visualization of security threats
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
							<button
								onClick={exportData}
								className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
							>
								<Download className="w-4 h-4" />
								Export Data
							</button>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Total Threats</span>
							<Activity className="w-5 h-5 text-blue-500" />
						</div>
						<div className="text-3xl font-bold">{stats.total}</div>
						<p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
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
							<span className="text-sm font-medium text-muted-foreground">Countries</span>
							<TrendingUp className="w-5 h-5 text-green-500" />
						</div>
						<div className="text-3xl font-bold">{stats.countries}</div>
						<p className="text-xs text-muted-foreground mt-1">Affected regions</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
					<div className="lg:col-span-2">
						<div className="bg-card border border-border rounded-lg p-6">
							<h2 className="text-xl font-semibold mb-4">Geographic Threat Distribution</h2>
							<div className="h-[500px]">
								<ThreatMap
									threats={threats}
									onMarkerClick={setSelectedThreat}
								/>
							</div>
						</div>
					</div>

					<div className="lg:col-span-1">
						<AttackVectorChart data={attackVectors} />
					</div>
				</div>

				<TopEndpointsWidget endpoints={topEndpoints} />
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
