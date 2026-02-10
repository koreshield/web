import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Shield, Download, Clock, TrendingUp, Activity } from 'lucide-react';
import { useRecentAttacks } from '../hooks/useApi';
import { AttackDetailModal } from '../components/AttackDetailModal';
import { ThreatTypeBreakdown, ThreatTimeline } from '../components/ThreatAnalytics';
import { wsClient, type ThreatDetectedEvent, type WebSocketEvent } from '../lib/websocket-client';
import { format, formatDistanceToNow } from 'date-fns';

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type TimeRange = '24h' | '7d' | '30d';

interface Attack {
	id: string;
	timestamp: string;
	threat_type: string;
	confidence: number;
	content_preview: string;
	action_taken: 'blocked' | 'warned';
	severity?: 'critical' | 'high' | 'medium' | 'low';
	metadata?: Record<string, any>;
}

export function ThreatMonitoringPage() {
	const [selectedAttack, setSelectedAttack] = useState<Attack | null>(null);
	const [liveThreats, setLiveThreats] = useState<Attack[]>([]);
	const [autoScroll, setAutoScroll] = useState(true);
	const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
	const [timeRange] = useState<TimeRange>('24h');
	const [wsConnected, setWsConnected] = useState(false);
	const feedRef = useRef<HTMLDivElement>(null);

	// Fetch initial data
	const { data: attacksData, isLoading } = useRecentAttacks(50);
	const initialAttacks = (attacksData as any)?.logs || [];

	// WebSocket real-time updates
	useEffect(() => {
		wsClient.connect();
		setWsConnected(wsClient.isConnected());

		wsClient.subscribe(['threat_detected']);

		const cleanupConnection = wsClient.on('connection_established', () => {
			setWsConnected(true);
		});

		const cleanupThreats = wsClient.on<ThreatDetectedEvent>('threat_detected', (event: WebSocketEvent<ThreatDetectedEvent>) => {
			const newThreat: Attack = {
				id: event.data.threat_id,
				timestamp: event.timestamp,
				threat_type: event.data.attack_type,
				confidence: 0.85, // Default, should come from event
				content_preview: `${event.data.attack_type} attack detected`,
				action_taken: event.data.blocked ? 'blocked' : 'warned',
				severity: event.data.severity,
				metadata: { provider: event.data.provider, tenant_id: event.data.tenant_id }
			};

			setLiveThreats(prev => [newThreat, ...prev.slice(0, 49)]);
		});

		return () => {
			cleanupConnection();
			cleanupThreats();
		};
	}, []);

	// Auto-scroll effect
	useEffect(() => {
		if (autoScroll && feedRef.current && liveThreats.length > 0) {
			feedRef.current.scrollTop = 0;
		}
	}, [liveThreats, autoScroll]);

	// Merge initial and live threats
	const allThreats = [...liveThreats, ...initialAttacks];

	// Filter threats
	const filteredThreats = allThreats.filter(threat => {
		if (severityFilter !== 'all') {
			const severity = threat.severity || getSeverityFromConfidence(threat.confidence);
			if (severity !== severityFilter) return false;
		}
		// Time range filtering would require backend support or client-side date comparison
		return true;
	});

	// Calculate stats
	const stats = {
		total: filteredThreats.length,
		blocked: filteredThreats.filter(t => t.action_taken === 'blocked').length,
		critical: filteredThreats.filter(t => (t.severity || getSeverityFromConfidence(t.confidence)) === 'critical').length,
	};

	// Export functions
	const exportAsCSV = () => {
		const headers = 'ID,Timestamp,Threat Type,Confidence,Action,Severity\n';
		const rows = filteredThreats.map(t => {
			const severity = t.severity || getSeverityFromConfidence(t.confidence);
			return `${t.id},"${t.timestamp}",${t.threat_type},${t.confidence},${t.action_taken},${severity}`;
		}).join('\n');

		const blob = new Blob([headers + rows], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `threats-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};



	const threatTypeData = filteredThreats.reduce((acc, threat) => {
		acc[threat.threat_type] = (acc[threat.threat_type] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold flex items-center gap-3">
								<Activity className="w-8 h-8 text-primary" />
								Live Threat Monitoring
							</h1>
							<p className="text-muted-foreground mt-1">
								Real-time security threat detection and analysis
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
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Total Threats</span>
							<TrendingUp className="w-5 h-5 text-blue-500" />
						</div>
						<div className="text-3xl font-bold">{stats.total}</div>
						<p className="text-xs text-muted-foreground mt-1">Last {timeRange}</p>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Blocked</span>
							<Shield className="w-5 h-5 text-red-500" />
						</div>
						<div className="text-3xl font-bold text-red-600">{stats.blocked}</div>
						<p className="text-xs text-muted-foreground mt-1">
							{stats.total > 0 ? `${((stats.blocked / stats.total) * 100).toFixed(1)}% of total` : '0%'}
						</p>
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">Critical</span>
							<AlertTriangle className="w-5 h-5 text-orange-500" />
						</div>
						<div className="text-3xl font-bold text-orange-600">{stats.critical}</div>
						<p className="text-xs text-muted-foreground mt-1">High priority threats</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
					{/* Live Attack Feed */}
					<div className="lg:col-span-2">
						<div className="bg-card border border-border rounded-lg">
							{/* Controls */}
							<div className="p-4 border-b border-border flex flex-wrap items-center gap-4">
								<h2 className="text-lg font-semibold flex items-center gap-2">
									<Shield className="w-5 h-5" />
									Attack Feed
								</h2>

								<div className="flex items-center gap-2 ml-auto">
									<button
										onClick={() => setAutoScroll(!autoScroll)}
										className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${autoScroll ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
											}`}
									>
										Auto-scroll
									</button>

									<select
										value={severityFilter}
										onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
										className="px-3 py-1.5 bg-muted border border-border rounded-lg text-sm"
									>
										<option value="all">All Severities</option>
										<option value="critical">Critical</option>
										<option value="high">High</option>
										<option value="medium">Medium</option>
										<option value="low">Low</option>
									</select>

									<button
										onClick={exportAsCSV}
										className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
										title="Export as CSV"
									>
										<Download className="w-4 h-4" />
									</button>
								</div>
							</div>

							{/* Feed */}
							<div ref={feedRef} className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
								{isLoading ? (
									<div className="flex items-center justify-center py-12">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
									</div>
								) : filteredThreats.length === 0 ? (
									<div className="text-center py-12 text-muted-foreground">
										<Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
										<p>No threats detected</p>
									</div>
								) : (
									filteredThreats.map((threat) => {
										const severity = threat.severity || getSeverityFromConfidence(threat.confidence);
										const severityColors = {
											critical: 'border-red-500/50 bg-red-500/5',
											high: 'border-orange-500/50 bg-orange-500/5',
											medium: 'border-yellow-500/50 bg-yellow-500/5',
											low: 'border-blue-500/50 bg-blue-500/5'
										};

										return (
											<div
												key={threat.id}
												onClick={() => setSelectedAttack(threat)}
												className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:bg-muted/50 ${severityColors[severity as keyof typeof severityColors]}`}
											>
												<div className="flex items-start justify-between gap-4">
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 mb-1">
															<span className="font-semibold">{threat.threat_type}</span>
															<span className={`text-xs px-2 py-0.5 rounded-full ${threat.action_taken === 'blocked'
																? 'bg-red-500/20 text-red-600'
																: 'bg-yellow-500/20 text-yellow-600'
																}`}>
																{threat.action_taken}
															</span>
															<span className={`text-xs px-2 py-0.5 rounded-full ${severity === 'critical' ? 'bg-red-500/20 text-red-600' :
																severity === 'high' ? 'bg-orange-500/20 text-orange-600' :
																	severity === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
																		'bg-blue-500/20 text-blue-600'
																}`}>
																{severity}
															</span>
														</div>
														<p className="text-sm text-muted-foreground truncate mb-2">
															{threat.content_preview}
														</p>
														<div className="flex items-center gap-3 text-xs text-muted-foreground">
															<span className="flex items-center gap-1">
																<Clock className="w-3 h-3" />
																{formatDistanceToNow(new Date(threat.timestamp), { addSuffix: true })}
															</span>
															<span>Confidence: {(threat.confidence * 100).toFixed(0)}%</span>
														</div>
													</div>
													<AlertTriangle className={`w-5 h-5 flex-shrink-0 ${severity === 'critical' ? 'text-red-500' :
														severity === 'high' ? 'text-orange-500' :
															severity === 'medium' ? 'text-yellow-500' :
																'text-blue-500'
														}`} />
												</div>
											</div>
										);
									})
								)}
							</div>
						</div>
					</div>

					{/* Threat Type Breakdown */}
					<div className="lg:col-span-1">
						<ThreatTypeBreakdown data={threatTypeData} />
					</div>
				</div>

				{/* Timeline */}
				{filteredThreats.length > 0 && (
					<ThreatTimeline attacks={filteredThreats} />
				)}
			</main>

			{/* Attack Detail Modal */}
			<AttackDetailModal
				attack={selectedAttack}
				isOpen={selectedAttack !== null}
				onClose={() => setSelectedAttack(null)}
			/>
		</div>
	);
}

function getSeverityFromConfidence(confidence: number): 'critical' | 'high' | 'medium' | 'low' {
	if (confidence >= 0.9) return 'critical';
	if (confidence >= 0.7) return 'high';
	if (confidence >= 0.5) return 'medium';
	return 'low';
}

export default ThreatMonitoringPage;
