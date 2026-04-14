import { useState } from 'react';
import { Activity, Shield, AlertTriangle, CheckCircle, Rocket, Code, BookOpen, ArrowRight, Key, Users, ScanSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStats, useRecentAttacks } from '../hooks/useApi';
import { useAuthState } from '../hooks/useAuthState';
import { AttackDetailModal } from '../components/AttackDetailModal';
import { ThreatTypeBreakdown, ThreatTimeline, ThreatSummary } from '../components/ThreatAnalytics';
export function DashboardPage() {
	const { user } = useAuthState();
	const [selectedAttack, setSelectedAttack] = useState<any>(null);

	// Data fetching
	const { data: stats, isLoading: statsLoading, error: statsError } = useStats();
	const { data: attacksData, isLoading: attacksLoading } = useRecentAttacks(10);

	const loading = statsLoading || attacksLoading;
	const recentAttacks = (attacksData as any)?.logs || [];
	const attackTypeCounts = recentAttacks.reduce((acc: Record<string, number>, attack: any) => {
		const type = attack.threat_type || attack.attack_type || attack.type || 'Unknown';
		acc[type] = (acc[type] || 0) + 1;
		return acc;
	}, {});

	const isNewUser = !loading && (((stats as any)?.statistics?.requests_total ?? 0) === 0);

	if (statsError) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<div className="text-center">
					<AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
					<h2 className="text-xl font-bold mb-2">Failed to Connect</h2>
					<p className="text-muted-foreground mb-4">
						Unable to reach the KoreShield backend. Please check your connection.
					</p>
					<button
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

			{/* Page heading */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Welcome back{user?.name ? `, ${user.name}` : ''}.
				</p>
			</div>

			{/* Connected indicator */}
			<div className="mb-6">
				<div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
					<CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
					<span className="text-xs text-green-600 font-medium">
						Connected to KoreShield API — real-time data
					</span>
				</div>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
				<Link to="/api-key-management" className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group">
					<div className="flex items-center gap-3">
						<Key className="w-5 h-5 text-primary" />
						<div>
							<div className="font-semibold text-sm group-hover:text-primary transition-colors">API Keys</div>
							<div className="text-xs text-muted-foreground">Manage server tokens</div>
						</div>
					</div>
				</Link>
				<Link to="/policies" className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group">
					<div className="flex items-center gap-3">
						<Shield className="w-5 h-5 text-primary" />
						<div>
							<div className="font-semibold text-sm group-hover:text-primary transition-colors">Policies</div>
							<div className="text-xs text-muted-foreground">Security rules & actions</div>
						</div>
					</div>
				</Link>
				<Link to="/rag-security" className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group">
					<div className="flex items-center gap-3">
						<ScanSearch className="w-5 h-5 text-primary" />
						<div>
							<div className="font-semibold text-sm group-hover:text-primary transition-colors">RAG Scanner</div>
							<div className="text-xs text-muted-foreground">Scan retrieved docs</div>
						</div>
					</div>
				</Link>
				<Link to="/teams" className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group">
					<div className="flex items-center gap-3">
						<Users className="w-5 h-5 text-primary" />
						<div>
							<div className="font-semibold text-sm group-hover:text-primary transition-colors">Teams</div>
							<div className="text-xs text-muted-foreground">Manage collaborators</div>
						</div>
					</div>
				</Link>
			</div>

			{/* Getting Started Banner for New Users */}
			{isNewUser && (
				<div className="mb-8 bg-card border border-border rounded-lg p-6">
					<div className="flex items-start gap-4">
						<div className="p-3 bg-primary/10 rounded-lg shrink-0">
							<Rocket className="w-6 h-6 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<h2 className="text-lg font-bold mb-1">Welcome to KoreShield</h2>
							<p className="text-sm text-muted-foreground mb-5">
								Get started by integrating KoreShield into your application.
							</p>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
								<div className="bg-background border border-border rounded-lg p-4">
									<div className="flex items-center gap-2 mb-2">
										<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
										<h3 className="font-semibold text-sm">Get Your Token</h3>
									</div>
									<p className="text-xs text-muted-foreground mb-3">
										Use API keys for server-to-server integrations.
									</p>
									<Link to="/api-key-management" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
										Manage API Keys <ArrowRight className="w-3 h-3" />
									</Link>
								</div>

								<div className="bg-background border border-border rounded-lg p-4">
									<div className="flex items-center gap-2 mb-2">
										<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
										<h3 className="font-semibold text-sm">Configure Policies</h3>
									</div>
									<p className="text-xs text-muted-foreground mb-3">
										Set up security policies to define what threats to block.
									</p>
									<Link to="/policies" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
										Go to Policies <ArrowRight className="w-3 h-3" />
									</Link>
								</div>

								<div className="bg-background border border-border rounded-lg p-4">
									<div className="flex items-center gap-2 mb-2">
										<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div>
										<h3 className="font-semibold text-sm">Send Requests</h3>
									</div>
									<p className="text-xs text-muted-foreground mb-3">
										Route your LLM requests through KoreShield's proxy.
									</p>
									<Link to="/getting-started" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
										Open guide <BookOpen className="w-3 h-3" />
									</Link>
								</div>
							</div>

							<div className="bg-background border border-border rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<Code className="w-4 h-4 text-primary shrink-0" />
									<h3 className="font-semibold text-xs">Quick Integration</h3>
								</div>
								<pre className="bg-muted p-3 rounded text-[11px] overflow-x-auto text-muted-foreground">
									{`import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: '${window.location.origin}/v1',
  apiKey: process.env.KORESHIELD_API_KEY
});`}
								</pre>
							</div>
						</div>
					</div>
				</div>
			)}

			{loading ? (
				<div className="flex items-center justify-center py-20">
					<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
				</div>
			) : (
				<>
					{/* Stats Grid */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						<div className="bg-card border border-border rounded-lg p-5">
							<div className="flex items-center justify-between mb-3">
								<span className="text-xs font-medium text-muted-foreground">Total Requests</span>
								<Activity className="w-4 h-4 text-blue-500" />
							</div>
							<div className="text-2xl font-bold">
								{((stats as any)?.statistics?.requests_total || 0).toLocaleString()}
							</div>
						</div>

						<div className="bg-card border border-border rounded-lg p-5">
							<div className="flex items-center justify-between mb-3">
								<span className="text-xs font-medium text-muted-foreground">Blocked</span>
								<Shield className="w-4 h-4 text-red-500" />
							</div>
							<div className="text-2xl font-bold text-red-500">
								{(stats as any)?.statistics?.requests_blocked || 0}
							</div>
						</div>

						<div className="bg-card border border-border rounded-lg p-5">
							<div className="flex items-center justify-between mb-3">
								<span className="text-xs font-medium text-muted-foreground">Attacks</span>
								<AlertTriangle className="w-4 h-4 text-orange-500" />
							</div>
							<div className="text-2xl font-bold text-orange-500">
								{(stats as any)?.statistics?.attacks_detected || 0}
							</div>
						</div>

						<div className="bg-card border border-border rounded-lg p-5">
							<div className="flex items-center justify-between mb-3">
								<span className="text-xs font-medium text-muted-foreground">Allowed</span>
								<CheckCircle className="w-4 h-4 text-green-500" />
							</div>
							<div className="text-2xl font-bold text-green-500">
								{(stats as any)?.statistics?.requests_allowed || 0}
							</div>
						</div>
					</div>

					{/* Recent Threats */}
					<div className="bg-card border border-border rounded-lg p-6 mb-8">
						<h2 className="text-base font-semibold mb-4">Recent Threats</h2>
						<div className="space-y-2">
							{recentAttacks.length === 0 ? (
								<div className="text-center py-10 text-muted-foreground">
									<Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
									<p className="text-sm">No threats detected yet</p>
								</div>
							) : (
								recentAttacks.map((attack: any) => (
									<div
										key={attack.id}
										onClick={() => setSelectedAttack(attack)}
										className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors cursor-pointer"
									>
										<div className="mt-0.5 shrink-0">
											{attack.action_taken === 'blocked' ? (
												<AlertTriangle className="w-4 h-4 text-red-500" />
											) : (
												<CheckCircle className="w-4 h-4 text-yellow-500" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-0.5">
												<span className="text-sm font-medium">{attack.threat_type || 'Unknown'}</span>
												<span className={`text-xs px-1.5 py-0.5 rounded-full ${
													attack.action_taken === 'blocked'
														? 'bg-red-500/10 text-red-500'
														: 'bg-yellow-500/10 text-yellow-500'
												}`}>
													{attack.action_taken}
												</span>
												{attack.confidence != null && (
												<span className="text-xs text-muted-foreground">
													{(Number(attack.confidence) * 100).toFixed(0)}%
												</span>
												)}
											</div>
											<p className="text-xs text-muted-foreground truncate">{attack.content_preview}</p>
											<p className="text-[11px] text-muted-foreground/60 mt-0.5">
												{new Date(attack.timestamp).toLocaleString()}
											</p>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* Threat Analytics */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
						<ThreatTypeBreakdown data={attackTypeCounts} />
						<ThreatSummary
							totalRequests={(stats as any)?.statistics?.requests_total || 0}
							blockedRequests={(stats as any)?.statistics?.requests_blocked || 0}
							attacksDetected={(stats as any)?.statistics?.attacks_detected || 0}
							topThreatType={getTopThreatType(attackTypeCounts)}
						/>
					</div>

					{recentAttacks.length > 0 && (
						<ThreatTimeline attacks={recentAttacks} />
					)}
				</>
			)}

			<AttackDetailModal
				attack={selectedAttack}
				isOpen={selectedAttack !== null}
				onClose={() => setSelectedAttack(null)}
			/>
		</div>
	);
}

function getTopThreatType(attackTypes: Record<string, number>): string {
	const entries = Object.entries(attackTypes);
	if (entries.length === 0) return 'None';
	return entries.sort(([, a], [, b]) => b - a)[0][0];
}
