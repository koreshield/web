import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Shield, Download, Clock, TrendingUp, Activity } from 'lucide-react';
import { useRecentAttacks } from '../hooks/useApi';
import { AttackDetailModal } from '../components/AttackDetailModal';
import { ThreatTypeBreakdown, ThreatTimeline } from '../components/ThreatAnalytics';
import { AppPage, AppPageHeader, AppPageSection, AppStatCard, AppStatGrid, AppSurface } from '../components/AppPageLayout';
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
	// Normalise raw API log records into the Attack interface.
	// The backend returns `attack_type` (not `threat_type`) and has no `confidence` field.
	const initialAttacks: Attack[] = ((attacksData as any)?.logs || []).map((log: any) => ({
		// eslint-disable-next-line react-hooks/purity
		id: log.id || log.request_id || String(Math.random()),
		timestamp: log.timestamp || log.created_at || new Date().toISOString(),
		threat_type: log.threat_type || log.attack_type || 'Unknown',
		confidence: typeof log.confidence === 'number'
			? log.confidence
			: typeof log.risk_score === 'number'
				? log.risk_score / 100
				: 0,
		content_preview: log.content_preview || log.prompt_preview || `${log.attack_type || 'Threat'} detected`,
		action_taken: log.action_taken || (log.blocked ? 'blocked' : 'warned'),
		severity: log.severity,
		metadata: log.metadata,
	}));

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
		const key = threat.threat_type || 'Unknown';
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

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
				eyebrow="Real-time"
				eyebrowIcon={Activity}
				icon={Shield}
				title="Live Threat Monitoring"
				description="Real-time security threat detection and analysis"
				actions={liveStatusBadge}
			/>

			<AppStatGrid columns={3}>
				<AppStatCard label="Total Threats" value={stats.total} icon={TrendingUp} tone="text-sky-400" detail={`Last ${timeRange}`} />
				<AppStatCard
					label="Blocked"
					value={stats.blocked}
					icon={Shield}
					tone="text-red-400"
					detail={stats.total > 0 ? `${((stats.blocked / stats.total) * 100).toFixed(1)}% of total` : '0%'}
				/>
				<AppStatCard label="Critical" value={stats.critical} icon={AlertTriangle} tone="text-amber-400" detail="High priority threats" />
			</AppStatGrid>

			<div className="mb-8 grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<AppSurface className="overflow-hidden p-0">
							{/* Controls */}
							<div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
								<h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
									<Shield className="w-5 h-5" />
									Attack Feed
								</h2>

								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto w-full sm:w-auto">
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
															<span>Confidence: {((threat.confidence ?? 0) * 100).toFixed(0)}%</span>
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
					</AppSurface>
				</div>

				<div className="dashboard-card rounded-[2rem] lg:col-span-1 [&>*]:border-0 [&>*]:bg-transparent">
					<ThreatTypeBreakdown data={threatTypeData} />
				</div>
			</div>

			{filteredThreats.length > 0 && (
				<AppPageSection variant="card" className="[&>*]:border-0 [&>*]:bg-transparent">
					<ThreatTimeline attacks={filteredThreats} />
				</AppPageSection>
			)}

			<AttackDetailModal
				attack={selectedAttack}
				isOpen={selectedAttack !== null}
				onClose={() => setSelectedAttack(null)}
			/>
		</AppPage>
	);
}

function getSeverityFromConfidence(confidence: number | undefined | null): 'critical' | 'high' | 'medium' | 'low' {
	const c = confidence ?? 0;
	if (c >= 0.9) return 'critical';
	if (c >= 0.7) return 'high';
	if (c >= 0.5) return 'medium';
	return 'low';
}

export default ThreatMonitoringPage;
