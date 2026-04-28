import { useMemo, useState } from 'react';
import { Activity, Shield, AlertTriangle, CheckCircle, Rocket, Code, BookOpen, ArrowRight, Key, Users, ScanSearch, Plus, Copy, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStats, useRecentAttacks } from '../hooks/useApi';
import { useAuthState } from '../hooks/useAuthState';
import { AttackDetailModal } from '../components/AttackDetailModal';
import { ThreatTypeBreakdown, ThreatTimeline, ThreatSummary } from '../components/ThreatAnalytics';
import { api } from '../lib/api-client';
export function DashboardPage() {
	const { user } = useAuthState();
	const [selectedAttack, setSelectedAttack] = useState<any>(null);
	const isAdmin = user?.role === 'owner' || user?.role === 'admin';

	// Inline API key generation state
	const [showKeyForm, setShowKeyForm] = useState(false);
	const [keyName, setKeyName] = useState('');
	const [generatedKey, setGeneratedKey] = useState<string | null>(null);
	const [copiedKey, setCopiedKey] = useState(false);
	const queryClient = useQueryClient();
	const generateKeyMutation = useMutation({
		mutationFn: (name: string) => api.generateApiKey({ name }) as Promise<{ api_key: string }>,
		onSuccess: (data) => {
			setGeneratedKey(data.api_key);
			setKeyName('');
			void queryClient.invalidateQueries({ queryKey: ['api-keys'] });
		},
	});
	const handleCopyKey = () => {
		if (!generatedKey) return;
		void navigator.clipboard.writeText(generatedKey);
		setCopiedKey(true);
		setTimeout(() => setCopiedKey(false), 2000);
	};
	const integrationSnippet = useMemo(
		() => `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.koreshield.com/v1',
  apiKey: process.env.KORESHIELD_API_KEY
});`,
		[],
	);

	// Data fetching
	const { data: stats, isLoading: statsLoading, error: statsError } = useStats();
	const { data: attacksData, isLoading: attacksLoading } = useRecentAttacks(10);

	const loading = statsLoading || attacksLoading;

	// Prefer recent_threats from stats endpoint (all-time, grouped query);
	// fall back to the audit-log endpoint for backwards compatibility.
	const statsAny = stats as any;
	const recentThreatsFromStats: any[] = (statsAny?.recent_threats ?? []).map((t: any) => {
		const details = (t.attack_details ?? {}) as Record<string, any>;
		return {
			...t,
			// Normalise field names so the existing render logic works unchanged
			threat_type: t.threat_type ?? details.threat_type ?? t.attack_type ?? 'Unknown',
			action_taken: t.action_taken ?? details.action ?? (t.is_blocked ? 'blocked' : 'flagged'),
			confidence: t.confidence ?? details.confidence ?? details.score ?? null,
			content_preview:
				t.content_preview ??
				details.content_preview ??
				details.input_preview ??
				(typeof details.input === 'string' ? (details.input as string).slice(0, 120) : null),
		};
	});
	const recentThreatsFromAudit = (((attacksData as any)?.logs) || []).filter((entry: any) =>
		Boolean(entry?.attack_detected || entry?.is_blocked || entry?.status === 'failure')
	);
	const recentAttacks = recentThreatsFromStats.length > 0
		? recentThreatsFromStats
		: recentThreatsFromAudit;

	// Prefer attack_type_distribution from stats (all-time aggregate);
	// fall back to computing counts from the local recent-attacks list.
	const attackTypeDistribution: Array<{ type: string; count: number }> = statsAny?.attack_type_distribution ?? [];
	const attackTypeCounts: Record<string, number> = attackTypeDistribution.length > 0
		? Object.fromEntries(attackTypeDistribution.map((d: any) => [d.type ?? 'Unknown', d.count ?? 0]))
		: recentAttacks.reduce((acc: Record<string, number>, attack: any) => {
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
						Connected to KoreShield API
					</span>
				</div>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
				<Link to="/settings/api-keys" className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group">
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
								Everything you need to protect your first integration is right here. Generate a key, review your protection rules, and copy the integration snippet without bouncing between pages.
							</p>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
								{/* Step 1 — inline key creator */}
								<div className="bg-background border border-border rounded-lg p-4">
									<div className="flex items-center gap-2 mb-2">
										<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
										<h3 className="font-semibold text-sm">Get Your Token</h3>
									</div>
									{generatedKey ? (
										<div>
											<p className="text-xs text-green-600 font-medium mb-2">Key generated! Copy it now — it won't be shown again.</p>
											<div className="flex items-center gap-1 bg-muted rounded p-2 mb-2">
												<code className="text-[10px] font-mono flex-1 break-all">{generatedKey}</code>
												<button onClick={handleCopyKey} className="shrink-0 p-1 rounded hover:bg-primary/10 text-primary" title="Copy key">
													{copiedKey ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
												</button>
											</div>
											<button onClick={() => { setGeneratedKey(null); setShowKeyForm(false); }} className="text-[10px] text-muted-foreground hover:text-foreground">
												I've saved it securely ✓
											</button>
										</div>
									) : showKeyForm ? (
										<div>
											<div className="flex gap-1 mb-2">
												<input
													type="text"
													placeholder="Key name (e.g. production)"
													value={keyName}
													onChange={(e) => setKeyName(e.target.value)}
													onKeyDown={(e) => e.key === 'Enter' && keyName.trim() && generateKeyMutation.mutate(keyName.trim())}
													className="flex-1 px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
													autoFocus
												/>
												<button onClick={() => setShowKeyForm(false)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
													<X className="w-3.5 h-3.5" />
												</button>
											</div>
											<button
												onClick={() => keyName.trim() && generateKeyMutation.mutate(keyName.trim())}
												disabled={!keyName.trim() || generateKeyMutation.isPending}
												className="w-full py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
											>
												{generateKeyMutation.isPending ? 'Generating…' : 'Generate key'}
											</button>
											{generateKeyMutation.isError && (
												<p className="mt-1 text-[10px] text-red-500">Failed to generate key. Try again.</p>
											)}
										</div>
									) : (
										<div>
											<p className="text-xs text-muted-foreground mb-3">
												Create the key your application will use to send protected traffic through KoreShield.
											</p>
											<button
												onClick={() => setShowKeyForm(true)}
												className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
											>
												<Plus className="w-3 h-3" /> Generate API key
											</button>
										</div>
									)}
								</div>

								<div className="bg-background border border-border rounded-lg p-4">
									<div className="flex items-center gap-2 mb-2">
										<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
										<h3 className="font-semibold text-sm">Configure Policies</h3>
									</div>
									<p className="text-xs text-muted-foreground mb-3">
										{isAdmin
											? 'Review the default protections and tailor policy behavior for your workspace.'
											: 'Review the active protections in your workspace and coordinate any changes with an admin.'}
									</p>
									<Link
										to={isAdmin ? '/policies' : '/rules'}
										className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
									>
										{isAdmin ? 'Go to Policies' : 'Review Rules'} <ArrowRight className="w-3 h-3" />
									</Link>
								</div>

								<div className="bg-background border border-border rounded-lg p-4">
									<div className="flex items-center gap-2 mb-2">
										<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div>
										<h3 className="font-semibold text-sm">Send Requests</h3>
									</div>
									<p className="text-xs text-muted-foreground mb-3">
										Copy the exact request shape your backend needs, then validate it against the quick-start docs.
									</p>
									<Link to="/docs/getting-started/quick-start" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
										Open integration guide <BookOpen className="w-3 h-3" />
									</Link>
								</div>
							</div>

							<div className="bg-background border border-border rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<Code className="w-4 h-4 text-primary shrink-0" />
									<h3 className="font-semibold text-xs">Quick Integration</h3>
								</div>
								<pre className="bg-muted p-3 rounded text-[11px] overflow-x-auto text-muted-foreground">
									{integrationSnippet}
								</pre>
								<div className="mt-3 flex flex-col sm:flex-row gap-2">
									<button
										onClick={() => { setShowKeyForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
										className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
									>
										<Plus className="w-3.5 h-3.5" /> Generate API key
									</button>
									<Link
										to="/docs/getting-started/quick-start"
										className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
									>
										View integration guide
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{loading ? (
				<>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						{Array.from({ length: 4 }).map((_, index) => (
							<div key={index} className="bg-card border border-border rounded-lg p-5 animate-pulse">
								<div className="h-3 w-20 bg-muted rounded mb-4" />
								<div className="h-8 w-16 bg-muted rounded" />
							</div>
						))}
					</div>
					<div className="bg-card border border-border rounded-lg p-6">
						<div className="h-5 w-32 bg-muted rounded mb-4 animate-pulse" />
						<div className="space-y-3">
							{Array.from({ length: 3 }).map((_, index) => (
								<div key={index} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
							))}
						</div>
					</div>
				</>
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
											{(attack.action_taken === 'blocked' || attack.is_blocked || attack.status === 'failure') ? (
												<AlertTriangle className="w-4 h-4 text-red-500" />
											) : (
												<CheckCircle className="w-4 h-4 text-yellow-500" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-0.5">
												<span className="text-sm font-medium">{attack.threat_type || 'Unknown'}</span>
												<span className={`text-xs px-1.5 py-0.5 rounded-full ${
													(attack.action_taken === 'blocked' || attack.is_blocked || attack.status === 'failure')
														? 'bg-red-500/10 text-red-500'
														: 'bg-yellow-500/10 text-yellow-500'
												}`}>
													{attack.action_taken || (attack.is_blocked || attack.status === 'failure' ? 'blocked' : 'flagged')}
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
