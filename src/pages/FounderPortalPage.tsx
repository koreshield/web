import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Activity,
	AlertTriangle,
	BadgeCheck,
	BarChart3,
	CheckCircle2,
	CreditCard,
	Database,
	KeyRound,
	Loader2,
	RefreshCw,
	Search,
	ShieldAlert,
	ShieldX,
	Trash2,
	TrendingUp,
	Users,
	XCircle,
	X,
} from 'lucide-react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { SEOMeta } from '../components/SEOMeta';
import { api } from '../lib/api-client';
import {
	AppPage,
	AppPageHeader,
	AppStatGrid,
	AppStatCard,
	AppPageSection,
	AppEmptyState,
	AppPrimaryButton,
	AppPageLoading,
	AppPageError,
} from '../components/AppPageLayout';

type Overview = {
	total_users: number;
	new_users_today: number;
	new_users_7d: number;
	active_users: number;
	verified_users: number;
	unverified_users: number;
	billing_accounts: number;
	paid_accounts: number;
	total_requests: number;
	requests_today: number;
	attacks_blocked: number;
	attacks_detected: number;
	api_keys: number;
	revoked_api_keys: number;
	block_rate: number;
};

type FounderOverviewResponse = {
	overview: Overview;
	daily_request_volume: Array<{ date: string; requests: number }>;
	attack_type_breakdown: Array<{ type: string; count: number }>;
	plan_distribution: Array<{ plan: string; count: number }>;
	generated_at: string;
};

type FounderAccessResponse = {
	allowed: boolean;
	role: string;
	email: string;
	source: 'role' | 'allowlist' | 'none';
};

type FounderUser = {
	id: string;
	email: string;
	name?: string | null;
	company?: string | null;
	role: string;
	status: string;
	auth_provider: string;
	email_verified: boolean;
	created_at?: string | null;
	first_login_at?: string | null;
	last_login_at?: string | null;
	request_count: number;
	api_key_count: number;
	plan_slug: string;
	plan_name?: string | null;
	subscription_status?: string | null;
	billing_status: string;
};

type FounderApiKey = {
	id: string;
	key_prefix: string;
	name: string;
	environment: string;
	owner_name?: string | null;
	owner_email: string;
	status: string;
	is_revoked: boolean;
	created_at?: string | null;
	last_used_at?: string | null;
	request_count: number;
	blocked_count: number;
	rate_limit_rpm?: number | null;
	monthly_ceiling?: number | null;
};

type FounderRequest = {
	id: string;
	request_id: string;
	timestamp?: string | null;
	endpoint: string;
	method: string;
	status_code: number;
	latency_ms: number;
	provider: string;
	model: string;
	user_email?: string | null;
	api_key_prefix?: string | null;
	api_key_name?: string | null;
	attack_type: string;
	confidence?: number | string | null;
	blocked: boolean;
	attack_detected: boolean;
	tokens_total: number;
	cost: number;
};

type FounderBillingAccount = {
	id: string;
	owner_email: string;
	owner_name?: string | null;
	status: string;
	plan_slug: string;
	plan_name?: string | null;
	subscription_status?: string | null;
	currency?: string | null;
	cancel_at_period_end: boolean;
	current_period_end?: string | null;
	updated_at?: string | null;
};

type FounderTeamMember = {
	id: string;
	email: string;
	name?: string | null;
	team: string;
	role: string;
	status: string;
	joined_at?: string | null;
};

type FounderUserDetail = {
	user: FounderUser | null;
	billing_account?: {
		id: string;
		status: string;
		plan_slug: string;
		plan_name?: string | null;
		subscription_status?: string | null;
		current_period_end?: string | null;
		updated_at?: string | null;
	} | null;
	api_keys: Array<Pick<FounderApiKey, 'id' | 'key_prefix' | 'name' | 'environment' | 'status' | 'created_at' | 'last_used_at'>>;
	requests: Array<Pick<FounderRequest, 'id' | 'request_id' | 'timestamp' | 'endpoint' | 'status_code' | 'latency_ms' | 'api_key_prefix' | 'attack_type' | 'blocked' | 'attack_detected'>>;
};

type FounderThreatsResponse = {
	attack_family_breakdown: Array<{ family: string; count: number }>;
	top_affected_keys: Array<{ api_key_id: string; prefix: string; name?: string | null; blocked_count: number }>;
	recent_blocked: Array<{
		id: string;
		timestamp?: string | null;
		attack_type?: string | null;
		provider?: string | null;
		model?: string | null;
		latency_ms?: number | null;
	}>;
	total_blocked: number;
	window_days: number;
};

type FounderAuditEntry = {
	id: string;
	timestamp?: string | null;
	actor: string;
	action: string;
	target_type?: string | null;
	target_id?: string | null;
	target_label?: string | null;
	result: string;
	ip_address?: string | null;
	detail?: string | null;
};

type FounderAuditResponse = {
	audit_logs: FounderAuditEntry[];
	total: number;
};

type PlanBreakdownItem = { plan: string; count: number; monthly_price: number; mrr_contribution: number };
type TopTenant = {
	user_id: string; email: string; name?: string | null; plan: string; billing_status: string;
	total_requests_30d: number; attacks_detected_30d: number; blocked_30d: number;
	block_rate_pct: number; last_seen?: string | null;
};
type DailyAttackPoint = { date: string; total_requests: number; attacks: number; blocked: number };
type AttackTypeItem = { type: string; count: number };

type FounderMetricsResponse = {
	revenue: {
		mrr: number; arr: number; arpu: number; paying_users: number; free_accounts: number;
		total_billing_accounts: number; paid_conversion_rate_pct: number;
		plan_breakdown: PlanBreakdownItem[];
	};
	retention: {
		dau: number; wau: number; mau: number; activated_users: number;
		activation_rate_pct: number; churn_risk_users: number;
		new_users_today: number; new_users_7d: number; new_users_30d: number;
		total_users: number; verified_users: number;
	};
	funnel: {
		signups: number; verified: number; activated: number; paid: number;
		signup_to_verified_pct: number; verified_to_activated_pct: number;
		activated_to_paid_pct: number; overall_conversion_pct: number;
	};
	teams: {
		total_teams: number; total_members: number; avg_team_size: number;
		paid_teams: number; new_teams_7d: number; new_teams_30d: number;
	};
	top_tenants: TopTenant[];
	attack_intel: {
		total_requests: number; total_blocked: number; total_attacks: number;
		requests_today: number; attacks_today: number;
		block_rate_pct: number; detection_rate_pct: number;
		attack_type_distribution: AttackTypeItem[];
		daily_attack_trend: DailyAttackPoint[];
	};
	generated_at: string;
};

const DONUT_COLORS = ['#dc2626', '#f59e0b', '#b45309', '#737373', '#0f766e', '#2563eb', '#7c3aed'];
const STANDARD_REFRESH_INTERVAL = 60_000;
const REQUEST_LOG_REFRESH_INTERVAL = 30_000;

function numberFormat(value: number | undefined) {
	return (value ?? 0).toLocaleString();
}

function dateLabel(value?: string | null) {
	if (!value) return 'Never';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function shortDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function badgeClass(kind: string) {
	const value = kind.toLowerCase();
	if (['active', 'allowed', 'owner', 'admin', 'production', 'verified', 'growth', 'paid'].includes(value)) {
		return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
	}
	if (['blocked', 'revoked', 'inactive', 'error', 'unverified'].includes(value)) {
		return 'bg-red-500/10 text-red-700 dark:text-red-300';
	}
	if (['ci', 'google', 'github', 'apple', 'internal'].includes(value)) {
		return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
	}
	if (['dev', 'local', 'free', 'email', 'user', 'member'].includes(value)) {
		return 'bg-muted text-muted-foreground';
	}
	return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
}

function Badge({ children }: { children: string }) {
	return (
		<span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${badgeClass(children)}`}>
			{children}
		</span>
	);
}

function ChartFrame({ children }: { children: (width: number) => ReactNode }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(0);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const updateWidth = () => {
			const nextWidth = Math.floor(container.getBoundingClientRect().width);
			setWidth(nextWidth > 0 ? nextWidth : 0);
		};

		updateWidth();
		const observer = new ResizeObserver(updateWidth);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	return (
		<div ref={containerRef} className="min-h-[320px] min-w-0">
			{width > 0 ? children(width) : <AppEmptyState icon={BarChart3} title="Preparing chart…" />}
		</div>
	);
}

function hasStatusCode(error: unknown, code: number) {
	return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === code;
}

export function FounderPortalPage() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState('');
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);
	const [deleteConfirmText, setDeleteConfirmText] = useState('');
	const accessQuery = useQuery({
		queryKey: ['founder-access'],
		queryFn: () => api.getFounderAccess() as Promise<FounderAccessResponse>,
		staleTime: 5 * 60 * 1000,
		retry: false,
		refetchOnWindowFocus: false,
	});
	const isFounder = Boolean(accessQuery.data?.allowed);
	const founderQueryOptions = {
		enabled: isFounder,
		retry: false,
		refetchOnWindowFocus: false,
	} as const;

	const overviewQuery = useQuery({
		queryKey: ['founder-overview'],
		queryFn: () => api.getFounderOverview() as Promise<FounderOverviewResponse>,
		refetchInterval: STANDARD_REFRESH_INTERVAL,
		...founderQueryOptions,
	});
	const usersQuery = useQuery({
		queryKey: ['founder-users', search],
		queryFn: () => api.getFounderUsers({ search, limit: 150 }) as Promise<{ users: FounderUser[]; total: number }>,
		refetchInterval: STANDARD_REFRESH_INTERVAL,
		...founderQueryOptions,
	});
	const apiKeysQuery = useQuery({
		queryKey: ['founder-api-keys'],
		queryFn: () => api.getFounderApiKeys(200) as Promise<{ api_keys: FounderApiKey[]; total: number }>,
		refetchInterval: STANDARD_REFRESH_INTERVAL,
		...founderQueryOptions,
	});
	const requestsQuery = useQuery({
		queryKey: ['founder-requests'],
		queryFn: () => api.getFounderRequests(50) as Promise<{ requests: FounderRequest[]; total: number }>,
		refetchInterval: REQUEST_LOG_REFRESH_INTERVAL,
		...founderQueryOptions,
	});
	const billingQuery = useQuery({
		queryKey: ['founder-billing'],
		queryFn: () => api.getFounderBilling(100) as Promise<{ billing_accounts: FounderBillingAccount[]; total: number }>,
		refetchInterval: STANDARD_REFRESH_INTERVAL,
		...founderQueryOptions,
	});
	const teamQuery = useQuery({
		queryKey: ['founder-team-members'],
		queryFn: () => api.getFounderTeamMembers(100) as Promise<{ team_members: FounderTeamMember[]; total: number }>,
		refetchInterval: STANDARD_REFRESH_INTERVAL,
		...founderQueryOptions,
	});
	const healthQuery = useQuery({
		queryKey: ['founder-health'],
		queryFn: () => api.getFounderHealth() as Promise<{ database: string; environment: string; generated_at: string }>,
		refetchInterval: STANDARD_REFRESH_INTERVAL,
		...founderQueryOptions,
	});
	const userDetailQuery = useQuery({
		queryKey: ['founder-user-detail', selectedUserId],
		queryFn: () => api.getFounderUser(selectedUserId!) as Promise<FounderUserDetail>,
		enabled: isFounder && Boolean(selectedUserId),
		refetchInterval: STANDARD_REFRESH_INTERVAL,
		retry: false,
		refetchOnWindowFocus: false,
	});
	const threatsQuery = useQuery({
		queryKey: ['founder-threats'],
		queryFn: () => api.getFounderThreats(25) as Promise<FounderThreatsResponse>,
		refetchInterval: STANDARD_REFRESH_INTERVAL,
		...founderQueryOptions,
	});
	const auditQuery = useQuery({
		queryKey: ['founder-audit'],
		queryFn: () => api.getFounderAudit(100) as Promise<FounderAuditResponse>,
		refetchInterval: 30_000,
		...founderQueryOptions,
	});
	const metricsQuery = useQuery({
		queryKey: ['founder-metrics'],
		queryFn: () => api.getFounderMetrics() as Promise<FounderMetricsResponse>,
		refetchInterval: STANDARD_REFRESH_INTERVAL,
		...founderQueryOptions,
	});

	const refreshAll = () => {
		void queryClient.invalidateQueries({ queryKey: ['founder-overview'] });
		void queryClient.invalidateQueries({ queryKey: ['founder-users'] });
		void queryClient.invalidateQueries({ queryKey: ['founder-api-keys'] });
		void queryClient.invalidateQueries({ queryKey: ['founder-requests'] });
		void queryClient.invalidateQueries({ queryKey: ['founder-billing'] });
		void queryClient.invalidateQueries({ queryKey: ['founder-team-members'] });
		void queryClient.invalidateQueries({ queryKey: ['founder-health'] });
		void queryClient.invalidateQueries({ queryKey: ['founder-threats'] });
		void queryClient.invalidateQueries({ queryKey: ['founder-audit'] });
		void queryClient.invalidateQueries({ queryKey: ['founder-metrics'] });
	};

	const revokeKeyMutation = useMutation({
		mutationFn: (keyId: string) => api.founderRevokeApiKey(keyId),
		onSuccess: refreshAll,
	});
	const resendVerificationMutation = useMutation({
		mutationFn: (userId: string) => api.founderResendVerification(userId),
		onSuccess: refreshAll,
	});
	const disableUserMutation = useMutation({
		mutationFn: (userId: string) => api.founderDisableUser(userId),
		onSuccess: () => {
			refreshAll();
			void queryClient.invalidateQueries({ queryKey: ['founder-user-detail', selectedUserId] });
		},
	});
	const reactivateUserMutation = useMutation({
		mutationFn: (userId: string) => api.founderReactivateUser(userId),
		onSuccess: () => {
			refreshAll();
			void queryClient.invalidateQueries({ queryKey: ['founder-user-detail', selectedUserId] });
		},
	});
	const syncBillingMutation = useMutation({
		mutationFn: (billingId: string) => api.founderSyncBilling(billingId),
		onSuccess: refreshAll,
	});
	const deleteUserMutation = useMutation({
		mutationFn: ({ userId, confirm }: { userId: string; confirm: boolean }) =>
			api.founderDeleteUser(userId, confirm),
		onSuccess: () => {
			refreshAll();
			void queryClient.invalidateQueries({ queryKey: ['founder-audit'] });
			setDeleteTarget(null);
			setDeleteConfirmText('');
			setSelectedUserId(null);
		},
	});

	const overview = overviewQuery.data?.overview;
	const metrics = metricsQuery.data;
	const users = usersQuery.data?.users ?? [];
	const apiKeys = apiKeysQuery.data?.api_keys ?? [];
	const requests = requestsQuery.data?.requests ?? [];
	const billingAccounts = billingQuery.data?.billing_accounts ?? [];
	const teamMembers = teamQuery.data?.team_members ?? [];

	const chartData = useMemo(
		() => (overviewQuery.data?.daily_request_volume ?? []).map(item => ({
			...item,
			label: shortDate(item.date),
		})),
		[overviewQuery.data],
	);
	const attackData = overviewQuery.data?.attack_type_breakdown ?? [];
	const isLoading = overviewQuery.isLoading || usersQuery.isLoading || apiKeysQuery.isLoading || requestsQuery.isLoading;
	const loadError = overviewQuery.error || usersQuery.error || apiKeysQuery.error || requestsQuery.error || threatsQuery.error || auditQuery.error;
	const founderApiNotDeployed = [
		overviewQuery.error,
		usersQuery.error,
		apiKeysQuery.error,
		requestsQuery.error,
		threatsQuery.error,
		billingQuery.error,
		teamQuery.error,
		healthQuery.error,
		auditQuery.error,
	].some(error => hasStatusCode(error, 404));

	if (accessQuery.isLoading) {
		return (
			<AppPage maxWidth="7xl" className="!max-w-5xl">
				<AppPageLoading label="Checking founder access…" />
			</AppPage>
		);
	}

	if (!isFounder) {
		return (
			<AppPage maxWidth="7xl" className="!max-w-5xl">
				<AppEmptyState
					icon={AlertTriangle}
					title="Founder access required"
					description="This private operating view is controlled by backend founder roles and access configuration. Ask an owner to grant founder access if this account should see it."
				/>
			</AppPage>
		);
	}

	if (loadError) {
		return (
			<AppPage maxWidth="7xl" className="!max-w-5xl">
				<AppPageError
					title="Founder portal could not load"
					message={
						founderApiNotDeployed
							? 'The dashboard is loaded, but the live API does not have the founder endpoints deployed yet. Deploy the backend that registers /v1/founder/*, then refresh this page.'
							: 'You may need founder access, admin MFA, or a reachable backend database.'
					}
				/>
			</AppPage>
		);
	}

	return (
		<AppPage maxWidth="7xl" className="!max-w-[1500px]">
			<SEOMeta title="Founder Portal" description="Private Koreshield founder operating dashboard." noindex />

			<AppPageHeader
				eyebrow="Live founder view"
				eyebrowIcon={Database}
				title="Founder Portal"
				description="Users, requests, API keys, billing, threats, and platform health from live Koreshield data."
				icon={Database}
				actions={
					<div className="flex flex-wrap items-center gap-3">
						<div className="rounded-xl border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
							<span className="font-semibold text-foreground">DB:</span> {healthQuery.data?.database ?? 'checking'}
						</div>
						<div className="rounded-xl border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
							<span className="font-semibold text-foreground">Env:</span> {healthQuery.data?.environment ?? 'unknown'}
						</div>
						<AppPrimaryButton onClick={refreshAll}>
							<RefreshCw className="h-4 w-4" />
							Refresh data
						</AppPrimaryButton>
					</div>
				}
			/>

			{isLoading ? (
				<AppPageLoading label="Loading founder data…" />
			) : null}

			<AppStatGrid columns={3} className="xl:grid-cols-6">
				<AppStatCard label="Total users" value={numberFormat(overview?.total_users)} icon={Users} detail={`${numberFormat(overview?.new_users_7d)} new in 7 days`} />
				<AppStatCard label="Total requests" value={numberFormat(overview?.total_requests)} icon={Activity} detail={`${numberFormat(overview?.requests_today)} today`} />
				<AppStatCard label="Attacks blocked" value={numberFormat(overview?.attacks_blocked)} icon={ShieldAlert} tone="text-red-400" detail={`${numberFormat(overview?.attacks_detected)} detected`} />
				<AppStatCard label="API keys" value={numberFormat(overview?.api_keys)} icon={KeyRound} detail={`${numberFormat(overview?.revoked_api_keys)} revoked`} />
				<AppStatCard label="Block rate" value={`${overview?.block_rate ?? 0}%`} icon={BarChart3} detail="of scanned requests" />
				<AppStatCard label="Billing accounts" value={numberFormat(overview?.billing_accounts)} icon={CreditCard} detail={`${numberFormat(overview?.paid_accounts)} paid accounts`} />
			</AppStatGrid>

				<div className="grid gap-6 xl:grid-cols-2">
					<AppPageSection title="Daily request volume">
						{chartData.length ? (
							<ChartFrame>
								{width => (
									<BarChart width={width} height={320} data={chartData}>
										<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
										<XAxis dataKey="label" tick={{ fontSize: 12 }} />
										<YAxis tick={{ fontSize: 12 }} />
										<Tooltip />
										<Bar dataKey="requests" fill="#2563eb" radius={[8, 8, 0, 0]} />
									</BarChart>
								)}
							</ChartFrame>
						) : <AppEmptyState icon={Database} title="No request volume data yet." />}
					</AppPageSection>
					<AppPageSection title="Attack type breakdown">
						{attackData.length ? (
							<ChartFrame>
								{width => (
									<PieChart width={width} height={320}>
										<Pie data={attackData} dataKey="count" nameKey="type" innerRadius={70} outerRadius={120} paddingAngle={2}>
											{attackData.map((_entry, index) => (
												<Cell key={`attack-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
											))}
										</Pie>
										<Tooltip />
										<Legend />
									</PieChart>
								)}
							</ChartFrame>
						) : <AppEmptyState icon={Database} title="No attack breakdown data yet." />}
					</AppPageSection>
				</div>

				{/* ── Business Metrics ──────────────────────────────────── */}
				{metrics && (
					<>
						{/* Revenue */}
						<AppStatGrid columns={4}>
							<AppStatCard label="MRR" value={`£${numberFormat(metrics.revenue.mrr)}`} icon={CreditCard} detail={`ARR: £${numberFormat(metrics.revenue.arr)}`} />
							<AppStatCard label="ARPU" value={`£${metrics.revenue.arpu}`} icon={BadgeCheck} detail={`${metrics.revenue.paying_users} paying customers`} />
							<AppStatCard label="Paid conversion" value={`${metrics.revenue.paid_conversion_rate_pct}%`} icon={TrendingUp} detail={`${metrics.revenue.free_accounts} still on free`} />
							<AppStatCard label="Teams" value={numberFormat(metrics.teams.total_teams)} icon={Users} detail={`${metrics.teams.avg_team_size} avg members · ${metrics.teams.paid_teams} paid`} />
						</AppStatGrid>

						{/* Retention & Funnel */}
						<div className="grid gap-6 xl:grid-cols-2">
							<AppPageSection title="User retention">
								<div className="grid grid-cols-3 gap-4 mb-4">
									{[
										{ label: 'DAU', value: metrics.retention.dau, sub: 'last 24 h' },
										{ label: 'WAU', value: metrics.retention.wau, sub: 'last 7 days' },
										{ label: 'MAU', value: metrics.retention.mau, sub: 'last 30 days' },
									].map(({ label, value, sub }) => (
										<div key={label} className="rounded-xl border border-border bg-muted/30 p-4 text-center">
											<div className="text-2xl font-bold">{numberFormat(value)}</div>
											<div className="mt-1 text-xs font-semibold text-primary">{label}</div>
											<div className="text-xs text-muted-foreground">{sub}</div>
										</div>
									))}
								</div>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between py-2 border-b border-border">
										<span className="text-muted-foreground">Activation rate</span>
										<span className="font-semibold">{metrics.retention.activation_rate_pct}% <span className="text-muted-foreground font-normal">({numberFormat(metrics.retention.activated_users)} of {numberFormat(metrics.retention.verified_users)} verified)</span></span>
									</div>
									<div className="flex justify-between py-2 border-b border-border">
										<span className="text-muted-foreground">Churn risk</span>
										<span className={`font-semibold ${metrics.retention.churn_risk_users > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{numberFormat(metrics.retention.churn_risk_users)} users inactive 30d+</span>
									</div>
									<div className="flex justify-between py-2 border-b border-border">
										<span className="text-muted-foreground">New users today</span>
										<span className="font-semibold">{numberFormat(metrics.retention.new_users_today)}</span>
									</div>
									<div className="flex justify-between py-2">
										<span className="text-muted-foreground">New users (30d)</span>
										<span className="font-semibold">{numberFormat(metrics.retention.new_users_30d)}</span>
									</div>
								</div>
							</AppPageSection>

							<AppPageSection title="Conversion funnel">
								<div className="space-y-3 mt-2">
									{[
										{ label: 'Signups', value: metrics.funnel.signups, pct: 100, color: 'bg-blue-500' },
										{ label: 'Email verified', value: metrics.funnel.verified, pct: metrics.funnel.signup_to_verified_pct, color: 'bg-primary' },
										{ label: 'Activated (made API call)', value: metrics.funnel.activated, pct: metrics.funnel.verified_to_activated_pct > 0 ? (metrics.funnel.activated / metrics.funnel.signups) * 100 : 0, color: 'bg-emerald-500' },
										{ label: 'Converted to paid', value: metrics.funnel.paid, pct: metrics.funnel.overall_conversion_pct, color: 'bg-violet-500' },
									].map(({ label, value, pct, color }) => (
										<div key={label}>
											<div className="flex justify-between text-sm mb-1">
												<span className="text-muted-foreground">{label}</span>
												<span className="font-semibold">{numberFormat(value)} <span className="text-muted-foreground font-normal text-xs">({pct.toFixed(1)}%)</span></span>
											</div>
											<div className="h-2 rounded-full bg-muted overflow-hidden">
												<div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
											</div>
										</div>
									))}
								</div>
								<div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
									<div className="rounded-lg bg-muted/40 p-3">
										<div className="text-muted-foreground text-xs mb-1">Verified → Activated</div>
										<div className="font-bold text-lg">{metrics.funnel.verified_to_activated_pct}%</div>
									</div>
									<div className="rounded-lg bg-muted/40 p-3">
										<div className="text-muted-foreground text-xs mb-1">Activated → Paid</div>
										<div className="font-bold text-lg">{metrics.funnel.activated_to_paid_pct}%</div>
									</div>
								</div>
							</AppPageSection>
						</div>

						{/* Plan breakdown + attack trend */}
						<div className="grid gap-6 xl:grid-cols-2">
							<AppPageSection title="Revenue by plan">
								<div className="space-y-2 mt-2">
									{metrics.revenue.plan_breakdown.filter(p => p.count > 0).map(p => (
										<div key={p.plan} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
											<div className="flex-1 min-w-0">
												<div className="flex justify-between text-sm">
													<span className="font-medium capitalize">{p.plan}</span>
													<span className="text-muted-foreground">{p.count} accounts</span>
												</div>
												<div className="flex justify-between text-xs text-muted-foreground mt-0.5">
													<span>£{p.monthly_price}/mo per seat</span>
													<span className={p.mrr_contribution > 0 ? 'text-emerald-600 font-semibold' : ''}>£{numberFormat(p.mrr_contribution)} MRR</span>
												</div>
											</div>
										</div>
									))}
									<div className="flex justify-between pt-3 font-bold text-sm">
										<span>Total MRR</span>
										<span className="text-emerald-600">£{numberFormat(metrics.revenue.mrr)}</span>
									</div>
								</div>
							</AppPageSection>

							<AppPageSection title="Attack trend (30 days)">
								{metrics.attack_intel.daily_attack_trend.length ? (
									<ChartFrame>
										{width => (
											<BarChart width={width} height={280} data={metrics.attack_intel.daily_attack_trend.map(d => ({ ...d, label: shortDate(d.date) }))}>
												<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
												<XAxis dataKey="label" tick={{ fontSize: 11 }} />
												<YAxis tick={{ fontSize: 11 }} />
												<Tooltip />
												<Legend />
												<Bar dataKey="total_requests" name="Requests" fill="#2563eb" radius={[4,4,0,0]} />
												<Bar dataKey="attacks" name="Attacks" fill="#dc2626" radius={[4,4,0,0]} />
												<Bar dataKey="blocked" name="Blocked" fill="#f59e0b" radius={[4,4,0,0]} />
											</BarChart>
										)}
									</ChartFrame>
								) : <AppEmptyState icon={Database} title="No attack trend data yet." />}
							</AppPageSection>
						</div>

						{/* Top tenants */}
						<AppPageSection title={`Top tenants by usage - last 30 days (${metrics.top_tenants.length})`}>
							{metrics.top_tenants.length ? (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-border text-left text-muted-foreground">
												<th className="py-3 pr-4 font-medium">User</th>
												<th className="py-3 pr-4 font-medium">Plan</th>
												<th className="py-3 pr-4 font-medium text-right">Requests</th>
												<th className="py-3 pr-4 font-medium text-right">Attacks</th>
												<th className="py-3 pr-4 font-medium text-right">Blocked</th>
												<th className="py-3 font-medium text-right">Block rate</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border">
											{metrics.top_tenants.map(t => (
												<tr key={t.user_id} className="hover:bg-muted/30 transition-colors">
													<td className="py-3 pr-4">
														<div className="font-medium truncate max-w-[200px]">{t.email}</div>
														{t.name && <div className="text-xs text-muted-foreground">{t.name}</div>}
													</td>
													<td className="py-3 pr-4"><Badge>{t.plan}</Badge></td>
													<td className="py-3 pr-4 text-right font-mono">{numberFormat(t.total_requests_30d)}</td>
													<td className="py-3 pr-4 text-right font-mono">{numberFormat(t.attacks_detected_30d)}</td>
													<td className="py-3 pr-4 text-right font-mono">{numberFormat(t.blocked_30d)}</td>
													<td className="py-3 text-right">
														<span className={`font-semibold ${t.block_rate_pct > 10 ? 'text-red-500' : t.block_rate_pct > 2 ? 'text-amber-500' : 'text-muted-foreground'}`}>
															{t.block_rate_pct}%
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : <AppEmptyState icon={Database} title="No tenant usage data yet." />}
						</AppPageSection>
					</>
				)}

				<AppPageSection title={`Users (${usersQuery.data?.total ?? users.length})`}>
					<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative w-full sm:max-w-md">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search users by email or name"
								className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>
						<p className="text-xs text-muted-foreground">Live account records. Raw secrets are never shown.</p>
					</div>
					<div className="overflow-x-auto">
							<table className="w-full min-w-[1220px] text-left text-sm">
							<thead className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground">
								<tr>
									<th className="py-3 pr-4">Email</th>
									<th className="py-3 pr-4">Name</th>
									<th className="py-3 pr-4">Role</th>
									<th className="py-3 pr-4">Auth</th>
									<th className="py-3 pr-4">Verified</th>
									<th className="py-3 pr-4">Plan</th>
									<th className="py-3 pr-4">Requests</th>
									<th className="py-3 pr-4">Keys</th>
									<th className="py-3 pr-4">First login</th>
									<th className="py-3 pr-4">Last login</th>
									<th className="py-3 pr-4">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{users.map(user => (
									<tr
										key={user.id}
										className="cursor-pointer align-middle transition hover:bg-muted/40"
										onClick={() => setSelectedUserId(user.id)}
									>
										<td className="py-3 pr-4 font-medium text-foreground">{user.email}</td>
										<td className="py-3 pr-4">{user.name || '-'}</td>
										<td className="py-3 pr-4"><Badge>{user.role}</Badge></td>
										<td className="py-3 pr-4"><Badge>{user.auth_provider}</Badge></td>
										<td className="py-3 pr-4">
											<span className="inline-flex items-center gap-1">
												{user.email_verified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
												{user.email_verified ? 'Verified' : 'Unverified'}
											</span>
										</td>
											<td className="py-3 pr-4"><Badge>{user.plan_slug || 'free'}</Badge></td>
											<td className="py-3 pr-4 font-mono">{numberFormat(user.request_count)}</td>
											<td className="py-3 pr-4 font-mono">{numberFormat(user.api_key_count)}</td>
											<td className="py-3 pr-4 text-muted-foreground">{dateLabel(user.first_login_at ?? user.created_at)}</td>
											<td className="py-3 pr-4 text-muted-foreground">{dateLabel(user.last_login_at)}</td>
										<td className="py-3 pr-4">
											<div className="flex flex-wrap gap-2">
													{!user.email_verified ? (
														<button
															onClick={(event) => {
																event.stopPropagation();
															resendVerificationMutation.mutate(user.id);
														}}
														className="rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
														>
															Resend
														</button>
													) : null}
													{user.status === 'active' ? (
														<button
															onClick={(event) => {
																event.stopPropagation();
																if (window.confirm(`Disable ${user.email}?`)) disableUserMutation.mutate(user.id);
														}}
														className="rounded-lg border border-red-500/30 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10"
														>
															Disable
														</button>
													) : (
														<button
															onClick={(event) => {
																event.stopPropagation();
																if (window.confirm(`Reactivate ${user.email}?`)) reactivateUserMutation.mutate(user.id);
															}}
															className="rounded-lg border border-emerald-500/30 px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10"
														>
															Reactivate
														</button>
													)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{!users.length ? <AppEmptyState icon={Database} title="No users found." /> : null}
				</AppPageSection>

				<AppPageSection title={`API Keys (${apiKeysQuery.data?.total ?? apiKeys.length})`}>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1000px] text-left text-sm">
							<thead className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground">
								<tr>
									<th className="py-3 pr-4">Key prefix</th>
									<th className="py-3 pr-4">Label</th>
									<th className="py-3 pr-4">Env</th>
									<th className="py-3 pr-4">Owner</th>
									<th className="py-3 pr-4">Status</th>
									<th className="py-3 pr-4">Requests</th>
									<th className="py-3 pr-4">Blocked</th>
									<th className="py-3 pr-4">Last used</th>
									<th className="py-3 pr-4">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{apiKeys.map(key => (
									<tr key={key.id}>
										<td className="py-3 pr-4 font-mono font-semibold">{key.key_prefix}</td>
										<td className="py-3 pr-4">{key.name}</td>
										<td className="py-3 pr-4"><Badge>{key.environment}</Badge></td>
										<td className="py-3 pr-4">
											<div className="font-medium">{key.owner_name || '-'}</div>
											<div className="text-xs text-muted-foreground">{key.owner_email}</div>
										</td>
										<td className="py-3 pr-4"><Badge>{key.status}</Badge></td>
										<td className="py-3 pr-4 font-mono">{numberFormat(key.request_count)}</td>
										<td className="py-3 pr-4 font-mono">{numberFormat(key.blocked_count)}</td>
										<td className="py-3 pr-4 text-muted-foreground">{dateLabel(key.last_used_at)}</td>
										<td className="py-3 pr-4">
											{key.status !== 'revoked' ? (
												<button
													onClick={() => {
														if (window.confirm(`Revoke ${key.key_prefix}?`)) revokeKeyMutation.mutate(key.id);
													}}
													className="rounded-lg border border-red-500/30 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10"
												>
													Revoke
												</button>
											) : <span className="text-xs text-muted-foreground">No action</span>}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{!apiKeys.length ? <AppEmptyState icon={Database} title="No API keys found." /> : null}
				</AppPageSection>

				<AppPageSection title={`Recent request log (${requests.length})`}>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1100px] text-left text-sm">
							<thead className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground">
								<tr>
									<th className="py-3 pr-4">Time</th>
									<th className="py-3 pr-4">Endpoint</th>
									<th className="py-3 pr-4">User</th>
									<th className="py-3 pr-4">API key</th>
									<th className="py-3 pr-4">Attack type</th>
									<th className="py-3 pr-4">Blocked</th>
									<th className="py-3 pr-4">Latency</th>
									<th className="py-3 pr-4">Provider</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{requests.map(request => (
									<tr key={request.id}>
										<td className="py-3 pr-4 text-muted-foreground">{dateLabel(request.timestamp)}</td>
										<td className="py-3 pr-4 font-mono">{request.endpoint}</td>
										<td className="py-3 pr-4">{request.user_email || '-'}</td>
										<td className="py-3 pr-4 font-mono">{request.api_key_prefix || '-'}</td>
										<td className="py-3 pr-4"><Badge>{request.attack_type}</Badge></td>
										<td className="py-3 pr-4"><Badge>{request.blocked ? 'blocked' : 'allowed'}</Badge></td>
										<td className="py-3 pr-4 font-mono">{request.latency_ms?.toFixed?.(1) ?? request.latency_ms}ms</td>
										<td className="py-3 pr-4">{request.provider} / {request.model}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{!requests.length ? <AppEmptyState icon={Database} title="No request logs yet." /> : null}
				</AppPageSection>

				<div className="grid gap-6 xl:grid-cols-2">
					<AppPageSection title={`Billing accounts (${billingQuery.data?.total ?? billingAccounts.length})`}>
						<div className="space-y-3">
							{billingAccounts.slice(0, 12).map(account => (
								<div key={account.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<div className="font-semibold">{account.owner_email}</div>
										<div className="mt-1 flex flex-wrap gap-2">
											<Badge>{account.plan_slug || 'free'}</Badge>
											<Badge>{account.status || 'inactive'}</Badge>
											{account.subscription_status ? <Badge>{account.subscription_status}</Badge> : null}
										</div>
									</div>
										<button
											onClick={() => syncBillingMutation.mutate(account.id)}
											disabled={syncBillingMutation.isPending}
											className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
										>
											{syncBillingMutation.isPending ? 'Syncing...' : 'Sync billing'}
										</button>
								</div>
							))}
						</div>
						{!billingAccounts.length ? <AppEmptyState icon={Database} title="No billing accounts found." /> : null}
					</AppPageSection>

					<AppPageSection title={`Team members (${teamQuery.data?.total ?? teamMembers.length})`}>
						<div className="space-y-3">
							{teamMembers.slice(0, 12).map(member => (
								<div key={member.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
									<div>
										<div className="font-semibold">{member.email}</div>
										<div className="text-sm text-muted-foreground">{member.team}</div>
									</div>
									<div className="flex gap-2">
										<Badge>{member.role}</Badge>
										<Badge>{member.status}</Badge>
									</div>
								</div>
							))}
						</div>
						{!teamMembers.length ? <AppEmptyState icon={Database} title="No team members found." /> : null}
					</AppPageSection>
				</div>

				{/* ── Threats Panel ─────────────────────────────────────── */}
				<AppPageSection title={`Threats - last ${threatsQuery.data?.window_days ?? 30} days (${(threatsQuery.data?.total_blocked ?? 0).toLocaleString()} blocked)`}>
					<div className="grid gap-6 xl:grid-cols-3">
						<div>
							<p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
								<ShieldX className="h-3.5 w-3.5" /> Attack families
							</p>
							{(threatsQuery.data?.attack_family_breakdown ?? []).length ? (
								<div className="space-y-2">
									{threatsQuery.data!.attack_family_breakdown.slice(0, 8).map(item => (
										<div key={item.family} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
											<span className="min-w-0 flex-1 truncate text-sm font-medium">{item.family}</span>
											<span className="text-sm font-bold text-red-500">{item.count.toLocaleString()}</span>
										</div>
									))}
								</div>
							) : <AppEmptyState icon={Database} title="No blocked attacks in this window yet." />}
						</div>
						<div>
							<p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
								<KeyRound className="h-3.5 w-3.5" /> Top targeted API keys
							</p>
							{(threatsQuery.data?.top_affected_keys ?? []).length ? (
								<div className="space-y-2">
									{threatsQuery.data!.top_affected_keys.map(key => (
										<div key={key.api_key_id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
											<div className="min-w-0">
												<div className="font-mono text-sm font-semibold">{key.prefix}</div>
												{key.name ? <div className="text-xs text-muted-foreground truncate">{key.name}</div> : null}
											</div>
											<span className="text-sm font-bold text-amber-500">{key.blocked_count}</span>
										</div>
									))}
								</div>
							) : <AppEmptyState icon={Database} title="No key-level threat data yet." />}
						</div>
						<div>
							<p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
								<AlertTriangle className="h-3.5 w-3.5" /> Recent blocked
							</p>
							{(threatsQuery.data?.recent_blocked ?? []).length ? (
								<div className="space-y-2 max-h-64 overflow-y-auto pr-1">
									{threatsQuery.data!.recent_blocked.slice(0, 10).map(r => (
										<div key={r.id} className="rounded-lg border border-border bg-background px-3 py-2">
											<div className="flex items-center justify-between gap-2">
												<span className="truncate text-xs font-medium text-red-500">{r.attack_type ?? 'unknown'}</span>
												<span className="shrink-0 text-xs text-muted-foreground">{r.latency_ms?.toFixed?.(0)}ms</span>
											</div>
											<div className="mt-1 text-xs text-muted-foreground">{dateLabel(r.timestamp)} · {r.provider}/{r.model}</div>
										</div>
									))}
								</div>
							) : <AppEmptyState icon={Database} title="No recent blocked attacks." />}
						</div>
					</div>
				</AppPageSection>

				{/* ── Admin Audit Log ────────────────────────────────────── */}
				<AppPageSection title={`Admin audit log (${auditQuery.data?.total ?? 0} entries)`}>
					{(auditQuery.data?.audit_logs ?? []).length ? (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[900px] text-left text-sm">
								<thead>
									<tr className="border-b border-border text-xs font-semibold uppercase tracking-widest text-muted-foreground">
										<th className="pb-3 pr-4">Time</th>
										<th className="pb-3 pr-4">Actor</th>
										<th className="pb-3 pr-4">Action</th>
										<th className="pb-3 pr-4">Target</th>
										<th className="pb-3 pr-4">Result</th>
										<th className="pb-3">IP</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{auditQuery.data!.audit_logs.map((entry, i) => (
										<tr key={`${entry.timestamp}-${i}`} className="hover:bg-muted/40">
											<td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">{dateLabel(entry.timestamp)}</td>
											<td className="py-2.5 pr-4 font-mono text-xs">{entry.actor}</td>
											<td className="py-2.5 pr-4"><Badge>{entry.action}</Badge></td>
											<td className="py-2.5 pr-4 text-xs">
												<span className="text-muted-foreground">{entry.target_type}:</span>{' '}
												<span className="font-medium">{entry.target_label || entry.target_id}</span>
											</td>
											<td className="py-2.5 pr-4"><Badge>{entry.result}</Badge></td>
											<td className="py-2.5 font-mono text-xs text-muted-foreground">{entry.ip_address}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<AppEmptyState icon={Database} title="No admin actions recorded yet. Disable, reactivate, revoke, and delete actions appear here with full audit trail." />
					)}
				</AppPageSection>

				<AppPageSection title="System health">
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="rounded-xl border border-border bg-background p-4">
							<div className="flex items-center gap-2 text-sm font-semibold"><Database className="h-4 w-4 text-primary" /> Database</div>
							<div className="mt-3"><Badge>{healthQuery.data?.database ?? 'checking'}</Badge></div>
						</div>
						<div className="rounded-xl border border-border bg-background p-4">
							<div className="flex items-center gap-2 text-sm font-semibold"><BadgeCheck className="h-4 w-4 text-primary" /> Environment</div>
							<div className="mt-3"><Badge>{healthQuery.data?.environment ?? 'unknown'}</Badge></div>
						</div>
						<div className="rounded-xl border border-border bg-background p-4">
							<div className="flex items-center gap-2 text-sm font-semibold"><RefreshCw className="h-4 w-4 text-primary" /> Last refresh</div>
							<p className="mt-3 text-sm text-muted-foreground">{dateLabel(healthQuery.data?.generated_at || overviewQuery.data?.generated_at)}</p>
						</div>
					</div>
				</AppPageSection>

			{/* ── Delete Confirmation Dialog ─────────────────────────────── */}
			{deleteTarget ? (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-card p-6 shadow-2xl">
						<div className="flex items-center gap-3 mb-4">
							<div className="rounded-full bg-red-500/10 p-2">
								<Trash2 className="h-5 w-5 text-red-500" />
							</div>
							<h2 className="text-lg font-bold text-foreground">Delete account permanently</h2>
						</div>
						<p className="text-sm text-muted-foreground mb-4">
							This will <span className="font-semibold text-foreground">permanently delete</span> the account for{' '}
							<span className="font-mono font-semibold text-red-500">{deleteTarget.email}</span>. All API keys will be revoked
							and request logs will be anonymised. This cannot be undone.
						</p>
						<p className="text-sm text-muted-foreground mb-3">
							Type <span className="font-mono font-semibold">DELETE</span> to confirm:
						</p>
						<input
							type="text"
							value={deleteConfirmText}
							onChange={e => setDeleteConfirmText(e.target.value)}
							placeholder="DELETE"
							className="w-full rounded-xl border border-red-500/40 bg-background px-4 py-2.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-500/40 mb-5"
						/>
						<div className="flex gap-3">
							<button
								onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}
								className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
							>
								Cancel
							</button>
							<button
								onClick={() => deleteUserMutation.mutate({ userId: deleteTarget.id, confirm: true })}
								disabled={deleteConfirmText !== 'DELETE' || deleteUserMutation.isPending}
								className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
							>
								{deleteUserMutation.isPending ? 'Deleting…' : 'Delete permanently'}
							</button>
						</div>
					</div>
				</div>
			) : null}

			{selectedUserId ? (
				<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedUserId(null)}>
					<aside
						className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-background shadow-2xl"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">User detail</p>
								<h2 className="mt-1 text-xl font-bold">{userDetailQuery.data?.user?.email || 'Loading user'}</h2>
							</div>
							<button
								onClick={() => setSelectedUserId(null)}
								className="rounded-full border border-border p-2 transition hover:bg-muted"
								aria-label="Close user detail"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<div className="space-y-6 p-6">
							{userDetailQuery.isLoading ? (
								<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
							) : userDetailQuery.data?.user ? (
								<>
									<div className="rounded-2xl border border-border bg-card p-5">
										<div className="grid gap-4 sm:grid-cols-2">
											<div>
												<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Name</p>
												<p className="mt-1 font-semibold">{userDetailQuery.data.user.name || '-'}</p>
											</div>
											<div>
												<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Company</p>
												<p className="mt-1 font-semibold">{userDetailQuery.data.user.company || '-'}</p>
											</div>
											<div>
												<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Role</p>
												<p className="mt-1"><Badge>{userDetailQuery.data.user.role}</Badge></p>
											</div>
											<div>
												<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Auth</p>
												<p className="mt-1"><Badge>{userDetailQuery.data.user.auth_provider}</Badge></p>
											</div>
											<div>
												<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Email</p>
												<p className="mt-1"><Badge>{userDetailQuery.data.user.email_verified ? 'verified' : 'unverified'}</Badge></p>
											</div>
												<div>
													<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Status</p>
													<p className="mt-1"><Badge>{userDetailQuery.data.user.status}</Badge></p>
												</div>
												<div>
													<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">First login</p>
													<p className="mt-1 font-semibold">{dateLabel(userDetailQuery.data.user.first_login_at ?? userDetailQuery.data.user.created_at)}</p>
												</div>
												<div>
													<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Last login</p>
													<p className="mt-1 font-semibold">{dateLabel(userDetailQuery.data.user.last_login_at)}</p>
												</div>
											</div>
										<div className="mt-5 flex flex-wrap gap-2">
											{!userDetailQuery.data.user.email_verified ? (
												<button
													onClick={() => resendVerificationMutation.mutate(userDetailQuery.data!.user!.id)}
													className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
												>
													Resend verification
												</button>
											) : null}
											{userDetailQuery.data.user.status === 'active' ? (
												<button
													onClick={() => {
														if (window.confirm(`Disable ${userDetailQuery.data!.user!.email}?`)) {
																	disableUserMutation.mutate(userDetailQuery.data!.user!.id);
															}
														}}
														className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/10"
												>
													Disable account
												</button>
											) : (
												<button
													onClick={() => {
														if (window.confirm(`Reactivate ${userDetailQuery.data!.user!.email}?`)) {
															reactivateUserMutation.mutate(userDetailQuery.data!.user!.id);
														}
													}}
													className="rounded-xl border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10"
												>
													Reactivate account
												</button>
											)}
											<button
												onClick={() => setDeleteTarget({ id: userDetailQuery.data!.user!.id, email: userDetailQuery.data!.user!.email })}
												className="rounded-xl border border-red-700/40 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-700/10 ml-auto"
											>
												Delete account…
											</button>
										</div>
									</div>

									<div className="rounded-2xl border border-border bg-card p-5">
										<h3 className="font-bold">Billing</h3>
										{userDetailQuery.data.billing_account ? (
											<div className="mt-3 flex flex-wrap items-center gap-2">
												<Badge>{userDetailQuery.data.billing_account.plan_slug}</Badge>
												<Badge>{userDetailQuery.data.billing_account.status}</Badge>
												{userDetailQuery.data.billing_account.subscription_status ? <Badge>{userDetailQuery.data.billing_account.subscription_status}</Badge> : null}
											</div>
										) : <p className="mt-3 text-sm text-muted-foreground">No billing account found.</p>}
									</div>

									<div className="rounded-2xl border border-border bg-card p-5">
										<h3 className="font-bold">API keys</h3>
										<div className="mt-3 space-y-2">
											{userDetailQuery.data.api_keys.map(key => (
												<div key={key.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
													<div>
														<div className="font-mono font-semibold">{key.key_prefix}</div>
														<div className="text-sm text-muted-foreground">{key.name}</div>
													</div>
													<div className="flex gap-2"><Badge>{key.environment}</Badge><Badge>{key.status}</Badge></div>
												</div>
											))}
											{!userDetailQuery.data.api_keys.length ? <AppEmptyState icon={Database} title="No API keys for this user." /> : null}
										</div>
									</div>

									<div className="rounded-2xl border border-border bg-card p-5">
										<h3 className="font-bold">Recent requests</h3>
										<div className="mt-3 space-y-2">
											{userDetailQuery.data.requests.map(request => (
												<div key={request.id} className="rounded-xl border border-border bg-background p-3">
													<div className="flex flex-wrap items-center justify-between gap-2">
														<div className="font-mono text-sm">{request.endpoint}</div>
														<div className="flex gap-2"><Badge>{request.attack_type}</Badge><Badge>{request.blocked ? 'blocked' : 'allowed'}</Badge></div>
													</div>
													<div className="mt-2 text-xs text-muted-foreground">
														{dateLabel(request.timestamp)} · {request.api_key_prefix || 'no key'} · {request.latency_ms?.toFixed?.(1) ?? request.latency_ms}ms
													</div>
												</div>
											))}
											{!userDetailQuery.data.requests.length ? <AppEmptyState icon={Database} title="No requests for this user yet." /> : null}
										</div>
									</div>
								</>
							) : (
								<AppEmptyState icon={Database} title="User not found." />
							)}
						</div>
					</aside>
				</div>
			) : null}
		</AppPage>
	);
}
