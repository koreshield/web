import { useState, useEffect } from 'react';
import { FileText, Search, Download, Filter, User, Activity, Shield, Workflow, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../components/ToastNotification';
import { SEOMeta } from '../components/SEOMeta';
import { api } from '../lib/api-client';

interface AuditLog {
	id: string;
	timestamp: string;
	user_email: string;
	action: string;
	resource_type: string;
	resource_id: string;
	status: 'success' | 'failure';
	ip_address: string;
	user_agent: string;
	details: Record<string, unknown>;
	severity: 'low' | 'medium' | 'high' | 'critical';
	is_tool_runtime: boolean;
	is_rag_scan: boolean;
	tool_name?: string;
	risk_class?: string;
	review_required?: boolean;
	decision_action?: string;
	summary?: string;
}

interface RuntimeReview {
	ticket_id: string;
	session_id?: string;
	tool_name?: string;
	risk_class?: string;
	action?: string;
	status: string;
	reasons: string[];
	sequence_matches: Array<{ name: string; severity: string }>;
	created_at: string;
}

interface RuntimeSession {
	session_id: string;
	state: string;
	agent_id?: string;
	intent?: string;
	tool_call_count: number;
	review_count: number;
	blocked_count: number;
	pending_reviews: number;
	recent_tools: string[];
}

interface AuditLogsResponse {
	logs?: Array<Record<string, unknown>>;
}

interface RuntimeReviewsResponse {
	reviews?: RuntimeReview[];
}

interface RuntimeSessionsResponse {
	sessions?: RuntimeSession[];
}

interface RuntimeReviewDecisionResponse {
	session_id?: string;
}

function toStringValue(value: unknown, fallback: string): string {
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	return fallback;
}

function toStatusValue(value: unknown): AuditLog['status'] {
	return value === 'failure' ? 'failure' : 'success';
}

function toSeverityValue(value: unknown, fallback: AuditLog['severity']): AuditLog['severity'] {
	if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') {
		return value;
	}
	return fallback;
}

function toBooleanValue(value: unknown, fallback = false): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

export default function AuditLogsPage() {
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [reviews, setReviews] = useState<RuntimeReview[]>([]);
	const [sessions, setSessions] = useState<RuntimeSession[]>([]);
	const [reviewLoading, setReviewLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [filterAction, setFilterAction] = useState<string>('all');
	const [filterStatus, setFilterStatus] = useState<string>('all');
	const [filterSeverity, setFilterSeverity] = useState<string>('all');
	const [loading, setLoading] = useState(true);
	const [showFilters, setShowFilters] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const toast = useToast();

	useEffect(() => {
		const normalize = (entry: Record<string, unknown>, index: number): AuditLog => {
			const level = (entry.level || entry.severity || 'info').toString().toLowerCase();
			const severity = level === 'error' ? 'high' : level === 'warn' ? 'medium' : 'low';
			const details = (entry.details || entry.attack_details || entry) as Record<string, unknown>;
			const toolAnalysis = (details.tool_analysis || {}) as Record<string, unknown>;
			const policyResult = (details.policy_result || {}) as Record<string, unknown>;
			const threatReferences = Array.isArray(details.threat_references)
				? details.threat_references as Array<Record<string, unknown>>
				: [];
			const isToolRuntime = entry.path === '/v1/tools/scan'
				|| entry.event === 'tool_call_evaluated'
				|| entry.attack_type === 'tool_call_security'
				|| !!toolAnalysis.tool_name;
			const isRagScan = entry.path === '/v1/rag/scan'
				|| entry.endpoint === '/v1/rag/scan'
				|| entry.attack_type === 'indirect_injection';
			const toolName = toolAnalysis.tool_name || entry.tool_name || entry.model || undefined;
			const riskClass = toolAnalysis.risk_class || entry.risk_class || policyResult.risk_class || undefined;
			const reviewRequired = toolAnalysis.review_required ?? entry.review_required ?? policyResult.review_required ?? false;
			const decisionAction = entry.action_taken || entry.action || policyResult.action || (entry.is_blocked ? 'blocked' : undefined);
			const firstThreatReference = threatReferences[0];
			const firstThreatExcerpt = typeof firstThreatReference?.excerpt === 'string' ? firstThreatReference.excerpt : undefined;
			const summary = isToolRuntime
				? `${toolName || 'tool'} ${decisionAction || 'evaluated'}${riskClass ? ` · ${riskClass}` : ''}${reviewRequired ? ' · review required' : ''}`
				: isRagScan
					? `RAG scan flagged ${details.total_threats_found || entry.total_threats_found || 'threats'}${firstThreatExcerpt ? ` · ${firstThreatExcerpt}` : ''}`
				: undefined;
			return {
				id: toStringValue(entry.id || entry.request_id || entry.scan_id || entry.event_id, String(index)),
				timestamp: toStringValue(entry.timestamp || entry.time || entry.created_at, new Date().toISOString()),
				user_email: toStringValue(entry.user_email || entry.email || entry.user || entry.user_id, 'system'),
				action: isToolRuntime ? 'tool_runtime' : toStringValue(entry.action || entry.event || entry.message, 'event'),
				resource_type: isToolRuntime ? 'tool_call' : toStringValue(entry.resource_type || entry.resource, 'system'),
				resource_id: toStringValue(entry.resource_id || entry.id, '-'),
				status: toStatusValue(entry.status || (level === 'error' ? 'failure' : 'success')),
				ip_address: toStringValue(entry.ip || entry.client_ip || entry.user_ip, '-'),
				user_agent: toStringValue(entry.user_agent || entry.ua, '-'),
				details,
				severity: toSeverityValue(entry.severity || toolAnalysis.risk_class, severity),
				is_tool_runtime: isToolRuntime,
				is_rag_scan: isRagScan,
				tool_name: typeof toolName === 'string' ? toolName : undefined,
				risk_class: typeof riskClass === 'string' ? riskClass : undefined,
				review_required: toBooleanValue(reviewRequired),
				decision_action: typeof decisionAction === 'string' ? decisionAction : undefined,
				summary,
			};
		};

			const fetchLogs = async () => {
			setLoading(true);
			setErrorMessage(null);
			try {
					const [auditResponse, reviewResponse, sessionResponse] = await Promise.all([
						api.getAuditLogs(200, 0) as Promise<AuditLogsResponse>,
						api.getRuntimeReviews(25, 'pending') as Promise<RuntimeReviewsResponse>,
						api.getRuntimeSessions(25) as Promise<RuntimeSessionsResponse>,
					]);
				const entries = (auditResponse?.logs || []).map(normalize);
				setLogs(entries);
				setReviews(reviewResponse?.reviews || []);
				setSessions(sessionResponse?.sessions || []);
			} catch (error) {
				console.error('Failed to load audit logs', error);
				setErrorMessage('Unable to load audit logs from the server.');
			} finally {
				setLoading(false);
				setReviewLoading(false);
			}
		};

		void fetchLogs();
	}, []);

	const handleReviewDecision = async (ticketId: string, decision: 'approved' | 'rejected') => {
		try {
			const decidedReview = await api.decideRuntimeReview(
				ticketId,
				decision,
				`Decision recorded from audit dashboard: ${decision}`
			) as RuntimeReviewDecisionResponse;
			setReviews((current) => current.filter((review) => review.ticket_id !== ticketId));
			if (decidedReview?.session_id) {
				setSessions((current) => current.map((session) => {
					if (session.session_id !== decidedReview.session_id) {
						return session;
					}
					return {
						...session,
						state: decision === 'approved' ? 'active' : 'suspended',
						pending_reviews: Math.max(0, session.pending_reviews - 1),
					};
				}));
			}
			toast.success(`Runtime review ${decision}.`);
		} catch (error) {
			console.error('Failed to decide runtime review', error);
			toast.error(`Unable to ${decision} runtime review.`);
		}
	};

	const filteredLogs = logs.filter((log) => {
		const matchesSearch =
			log.user_email.toLowerCase().includes(search.toLowerCase()) ||
			log.action.toLowerCase().includes(search.toLowerCase()) ||
			log.resource_type.toLowerCase().includes(search.toLowerCase()) ||
			log.ip_address.includes(search);

		const matchesAction =
			filterAction === 'all'
			|| (filterAction === 'tool_runtime' && log.is_tool_runtime)
			|| (filterAction === 'rag_scan' && log.is_rag_scan)
			|| (filterAction === 'review_required' && log.review_required)
			|| (filterAction === 'blocked' && (log.decision_action === 'blocked' || log.status === 'failure'))
			|| log.action.includes(filterAction);
		const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
		const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;

		return matchesSearch && matchesAction && matchesStatus && matchesSeverity;
	});

	const handleExport = (format: 'csv' | 'json') => {
		toast.success(`Exporting ${filteredLogs.length} logs as ${format.toUpperCase()}...`);
		// Export logic would go here
	};

	const getStatusColor = (status: string) => {
		return status === 'success'
			? 'text-green-600 bg-green-50 border-green-200'
			: 'text-red-600 bg-red-50 border-red-200';
	};

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical': return 'text-red-600 bg-red-50';
			case 'high': return 'text-orange-600 bg-orange-50';
			case 'medium': return 'text-yellow-600 bg-yellow-50';
			case 'low': return 'text-blue-600 bg-blue-50';
			default: return 'text-muted-foreground bg-muted';
		}
	};

	const runtimeToolLogs = logs.filter((log) => log.is_tool_runtime);
	const ragScanLogs = logs.filter((log) => log.is_rag_scan);
	const reviewRequiredLogs = runtimeToolLogs.filter((log) => log.review_required);
	const blockedToolLogs = runtimeToolLogs.filter((log) => log.decision_action === 'blocked' || log.status === 'failure');
	const activeSessions = sessions.filter((session) => session.state === 'active');
	const suspendedSessions = sessions.filter((session) => session.state === 'suspended');

	return (
		<div className="min-h-screen bg-background pt-20 pb-12">
			<SEOMeta
				title="Audit & Compliance Logs | KoreShield"
				description="View and analyze audit logs for compliance and security monitoring"
			/>

			<div className="max-w-7xl mx-auto px-6">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-4">
						<FileText className="w-8 h-8 text-electric-green" />
						<h1 className="text-4xl font-bold text-foreground">Audit & Compliance Logs</h1>
					</div>
					<p className="text-muted-foreground">
						Monitor all system activities, track compliance requirements, and detect security anomalies.
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid md:grid-cols-4 gap-6 mb-8">
					<div className="bg-card rounded-xl p-6 border border-border">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-muted-foreground">Total Events</span>
							<Activity className="w-5 h-5 text-blue-500" />
						</div>
						<div className="text-2xl font-bold text-foreground">{logs.length}</div>
					</div>
					<div className="bg-card rounded-xl p-6 border border-border">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-muted-foreground">Success Rate</span>
							<Activity className="w-5 h-5 text-green-500" />
						</div>
						<div className="text-2xl font-bold text-foreground">
							{logs.length === 0 ? '0%' : `${Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100)}%`}
						</div>
					</div>
					<div className="bg-card rounded-xl p-6 border border-border">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-muted-foreground">Runtime Tool Events</span>
							<Workflow className="w-5 h-5 text-amber-500" />
						</div>
						<div className="text-2xl font-bold text-foreground">
							{runtimeToolLogs.length}
						</div>
					</div>
					<div className="bg-card rounded-xl p-6 border border-border">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-muted-foreground">Review Required</span>
							<Eye className="w-5 h-5 text-purple-500" />
						</div>
						<div className="text-2xl font-bold text-foreground">
							{reviewRequiredLogs.length}
						</div>
					</div>
				</div>

				<div className="bg-card rounded-xl p-6 border border-border mb-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h2 className="text-lg font-semibold text-foreground">RAG Evidence Visibility</h2>
							<p className="text-sm text-muted-foreground">
								Indirect prompt injection findings now log the suspicious excerpt and document reference so reviews can point to concrete evidence instead of a generic flag.
							</p>
						</div>
						<div className="text-right">
							<div className="text-xs uppercase tracking-wide text-muted-foreground">RAG scan events</div>
							<div className="text-2xl font-bold text-foreground">{ragScanLogs.length}</div>
						</div>
					</div>
				</div>

				<div className="grid md:grid-cols-3 gap-6 mb-8">
					<div className="bg-card rounded-xl p-6 border border-border">
						<div className="flex items-center gap-3 mb-3">
							<Shield className="w-5 h-5 text-electric-green" />
							<h2 className="text-lg font-semibold text-foreground">Tool Runtime Focus</h2>
						</div>
						<p className="text-sm text-muted-foreground">
							KoreShield now records server-side tool scan decisions here so runtime enforcement is visible alongside normal audit history.
						</p>
					</div>
					<div className="bg-card rounded-xl p-6 border border-border">
						<div className="text-sm text-muted-foreground mb-2">Blocked Tool Calls</div>
						<div className="text-2xl font-bold text-foreground">{blockedToolLogs.length}</div>
						<p className="text-sm text-muted-foreground mt-2">High-trust failures and low-trust delegated tool calls are highlighted here.</p>
					</div>
					<div className="bg-card rounded-xl p-6 border border-border">
						<div className="text-sm text-muted-foreground mb-2">Unique Actors</div>
						<div className="text-2xl font-bold text-foreground">{new Set(logs.map(l => l.user_email)).size}</div>
						<p className="text-sm text-muted-foreground mt-2">Includes API-key scoped and user-scoped runtime events.</p>
					</div>
				</div>

				<div className="grid lg:grid-cols-2 gap-6 mb-8">
					<div className="bg-card rounded-xl border border-border overflow-hidden">
						<div className="px-6 py-4 border-b border-border flex items-center justify-between">
							<div>
								<h2 className="text-lg font-semibold text-foreground">Pending Runtime Reviews</h2>
								<p className="text-sm text-muted-foreground">High-risk tool calls waiting for explicit approval or rejection.</p>
							</div>
							<span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-700">
								{reviews.length} pending
							</span>
						</div>
						<div className="p-6 space-y-4">
							{reviewLoading ? (
								<div className="text-sm text-muted-foreground">Loading runtime reviews...</div>
							) : reviews.length === 0 ? (
								<div className="text-sm text-muted-foreground">No runtime reviews are waiting right now.</div>
							) : reviews.map((review) => (
								<div key={review.ticket_id} className="rounded-lg border border-border p-4 bg-background/50">
									<div className="flex items-start justify-between gap-4 mb-3">
										<div>
											<div className="font-medium text-foreground">{review.tool_name || 'tool call'}</div>
											<div className="text-xs text-muted-foreground font-mono mt-1">{review.ticket_id}</div>
										</div>
										<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(review.risk_class || 'medium')}`}>
											{review.risk_class || 'medium'}
										</span>
									</div>
									<p className="text-sm text-muted-foreground mb-3">
										{review.reasons[0] || 'Runtime review required for this tool call.'}
									</p>
									{review.sequence_matches.length > 0 && (
										<div className="text-xs text-amber-700 dark:text-amber-400 mb-3">
											Sequence flags: {review.sequence_matches.map((match) => match.name).join(', ')}
										</div>
									)}
									<div className="flex gap-2">
										<button
											onClick={() => handleReviewDecision(review.ticket_id, 'approved')}
											className="px-3 py-2 rounded-lg bg-electric-green hover:bg-electric-green/90 text-black text-sm font-medium transition-colors"
										>
											Approve
										</button>
										<button
											onClick={() => handleReviewDecision(review.ticket_id, 'rejected')}
											className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
										>
											Reject
										</button>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="bg-card rounded-xl border border-border overflow-hidden">
						<div className="px-6 py-4 border-b border-border">
							<h2 className="text-lg font-semibold text-foreground">Runtime Sessions</h2>
							<p className="text-sm text-muted-foreground">KoreShield session governance for MCP-style or agent-driven tool execution.</p>
						</div>
						<div className="p-6">
							<div className="grid grid-cols-3 gap-4 mb-4">
								<div>
									<div className="text-xs uppercase tracking-wide text-muted-foreground">Active</div>
									<div className="text-2xl font-bold text-foreground">{activeSessions.length}</div>
								</div>
								<div>
									<div className="text-xs uppercase tracking-wide text-muted-foreground">Suspended</div>
									<div className="text-2xl font-bold text-foreground">{suspendedSessions.length}</div>
								</div>
								<div>
									<div className="text-xs uppercase tracking-wide text-muted-foreground">Pending Reviews</div>
									<div className="text-2xl font-bold text-foreground">{sessions.reduce((sum, session) => sum + session.pending_reviews, 0)}</div>
								</div>
							</div>
							<div className="space-y-3">
								{sessions.length === 0 ? (
									<div className="text-sm text-muted-foreground">No runtime sessions have been created yet.</div>
								) : sessions.slice(0, 5).map((session) => (
									<div key={session.session_id} className="rounded-lg border border-border p-4">
										<div className="flex items-start justify-between gap-4">
											<div>
												<div className="font-medium text-foreground">{session.agent_id || 'runtime session'}</div>
												<div className="text-xs text-muted-foreground font-mono mt-1">{session.session_id}</div>
												{session.intent && <div className="text-sm text-muted-foreground mt-2">{session.intent}</div>}
											</div>
											<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${session.state === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
												{session.state}
											</span>
										</div>
										<div className="grid grid-cols-3 gap-3 mt-4 text-sm text-muted-foreground">
											<div>{session.tool_call_count} calls</div>
											<div>{session.review_count} reviews</div>
											<div>{session.blocked_count} blocked</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Actions Bar */}
				<div className="bg-card rounded-xl p-6 border border-border mb-6">
					<div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
						<div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
							<div className="relative w-full sm:w-96">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
								<input
									type="text"
									placeholder="Search logs by user, action, IP..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-electric-green"
								/>
							</div>
							<button
								onClick={() => setShowFilters(!showFilters)}
								className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
							>
								<Filter className="w-5 h-5" />
								Filters {showFilters && <span className="text-xs">▼</span>}
							</button>
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => handleExport('csv')}
								className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
							>
								<Download className="w-5 h-5" />
								CSV
							</button>
							<button
								onClick={() => handleExport('json')}
								className="inline-flex items-center gap-2 px-4 py-2 bg-electric-green hover:bg-electric-green/90 text-black font-medium rounded-lg transition-colors"
							>
								<Download className="w-5 h-5" />
								JSON
							</button>
						</div>
					</div>

					{/* Filters Panel */}
					{showFilters && (
						<div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-muted-foreground mb-2">
									Action Type
								</label>
								<select
									value={filterAction}
									onChange={(e) => setFilterAction(e.target.value)}
									className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-electric-green"
								>
									<option value="all">All Actions</option>
									<option value="created">Created</option>
									<option value="updated">Updated</option>
									<option value="deleted">Deleted</option>
									<option value="login">Login</option>
									<option value="exported">Exported</option>
									<option value="tool_runtime">Tool Runtime</option>
									<option value="rag_scan">RAG Scan Findings</option>
									<option value="review_required">Review Required</option>
									<option value="blocked">Blocked Decisions</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-muted-foreground mb-2">
									Status
								</label>
								<select
									value={filterStatus}
									onChange={(e) => setFilterStatus(e.target.value)}
									className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-electric-green"
								>
									<option value="all">All Statuses</option>
									<option value="success">Success</option>
									<option value="failure">Failure</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-muted-foreground mb-2">
									Severity
								</label>
								<select
									value={filterSeverity}
									onChange={(e) => setFilterSeverity(e.target.value)}
									className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-electric-green"
								>
									<option value="all">All Severities</option>
									<option value="critical">Critical</option>
									<option value="high">High</option>
									<option value="medium">Medium</option>
									<option value="low">Low</option>
								</select>
							</div>
						</div>
					)}
				</div>

				{/* Audit Logs Table */}
				<div className="bg-card rounded-xl border border-border overflow-hidden">
					{loading ? (
						<div className="p-12 text-center text-muted-foreground">Loading audit logs...</div>
					) : errorMessage ? (
						<div className="p-12 text-center text-red-500">{errorMessage}</div>
					) : filteredLogs.length === 0 ? (
						<div className="p-12 text-center">
							<FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
							<p className="text-muted-foreground">No audit logs found</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-muted border-b border-border">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Timestamp
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											User
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Action
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Resource
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Summary
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Severity
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											IP Address
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{filteredLogs.map((log) => (
										<tr
											key={log.id}
											className={`hover:bg-muted/50 ${log.severity === 'critical' ? 'bg-red-50/30 dark:bg-red-900/10' : ''
												}`}
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
												{format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2">
													<User className="w-4 h-4 text-muted-foreground" />
													<span className="text-sm text-foreground">{log.user_email}</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<code className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
													{log.action}
												</code>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
												<div>{log.resource_type}</div>
												{log.tool_name && <div className="text-xs text-muted-foreground font-mono mt-1">{log.tool_name}</div>}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
												{log.summary ? (
													<div className="space-y-1">
														<div className="font-medium text-foreground">{log.summary}</div>
														{log.risk_class && (
															<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(log.risk_class)}`}>
																{log.risk_class}
															</span>
														)}
													</div>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(log.status)}`}>
													{log.status}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(log.severity)}`}>
													{log.severity}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
												{log.ip_address}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Footer Info */}
				<div className="mt-6 text-sm text-muted-foreground">
					<p>
						Showing {filteredLogs.length} of {logs.length} audit log entries.
						Retention policy: 90 days for standard logs, 365 days for compliance logs.
					</p>
				</div>
			</div>
		</div>
	);
}
