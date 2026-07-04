import { useQuery } from '@tanstack/react-query';
import { SEOMeta } from '../components/SEOMeta';
import {
	Activity,
	AlertTriangle,
	ArrowUpRight,
	BarChart3,
	CalendarClock,
	CheckCircle2,
	Gauge,
	KeyRound,
	ShieldCheck,
	Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
	AppCallout,
	AppEmptyState,
	AppPage,
	AppPageError,
	AppPageHeader,
	AppPageLoading,
	AppPageSection,
	AppStatCard,
	AppStatGrid,
	AppSurface,
} from '../components/AppPageLayout';
import { api, type UsageSummary } from '../lib/api-client';

type UsageSummaryView = UsageSummary & {
	source?: 'realtime' | 'fallback';
};

const PLAN_LIMITS: Record<string, number | null> = {
	unpaid: 0,
	growth: 100_000,
	scale: 1_000_000,
	enterprise: null,
};

function formatNumber(value: number | null | undefined) {
	if (value === null || value === undefined) return 'Unlimited';
	return new Intl.NumberFormat('en-GB').format(value);
}

function formatDate(value: string | null | undefined) {
	if (!value) return 'Never';
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value));
}

function formatPercent(value: number | null) {
	if (value === null) return 'Unlimited';
	return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function usageTone(status: UsageSummary['limits']['status']) {
	if (status === 'limit_reached' || status === 'near_limit') return 'text-red-500';
	if (status === 'watch') return 'text-amber-500';
	return 'text-electric-green';
}

function getNextMonthStart() {
	const now = new Date();
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
}

function normalizePlanSlug(value: unknown) {
	const slug = typeof value === 'string' ? value.toLowerCase() : 'unpaid';
	if (slug.includes('enterprise')) return 'enterprise';
	if (slug.includes('scale') || slug.includes('business') || slug.includes('pro')) return 'scale';
	if (slug.includes('growth') || slug.includes('startup') || slug.includes('paid')) return 'growth';
	return 'unpaid';
}

function buildFallbackUsage(statsRaw: unknown, billingRaw: unknown, keysRaw: unknown): UsageSummaryView {
	const statsEnvelope = statsRaw && typeof statsRaw === 'object' ? statsRaw as Record<string, unknown> : {};
	const stats = statsEnvelope.statistics && typeof statsEnvelope.statistics === 'object'
		? statsEnvelope.statistics as Record<string, unknown>
		: {};
	const billing = billingRaw && typeof billingRaw === 'object' ? billingRaw as Record<string, unknown> : {};
	const planSlug = normalizePlanSlug(billing.plan_slug || billing.plan_name);
	const planLimit = PLAN_LIMITS[planSlug] ?? 0;
	const protectedRequests = typeof stats.requests_total === 'number' ? stats.requests_total : 0;
	const blocked = typeof stats.requests_blocked === 'number' ? stats.requests_blocked : 0;
	const attacks = typeof stats.attacks_detected === 'number' ? stats.attacks_detected : 0;
	const allowed = typeof stats.requests_allowed === 'number' ? stats.requests_allowed : Math.max(protectedRequests - blocked, 0);
	const percentUsed = planLimit ? Math.round((protectedRequests / planLimit) * 1000) / 10 : null;
	const remaining = planLimit === null ? null : Math.max(planLimit - protectedRequests, 0);
	const status = percentUsed === null
		? 'unlimited'
		: percentUsed >= 100
			? 'limit_reached'
			: percentUsed >= 95
				? 'near_limit'
				: percentUsed >= 80
					? 'watch'
					: 'ok';
	const now = new Date();
	const periodEnd = getNextMonthStart();
	const keys = Array.isArray(keysRaw)
		? keysRaw
		: keysRaw && typeof keysRaw === 'object' && Array.isArray((keysRaw as Record<string, unknown>).api_keys)
			? (keysRaw as Record<string, unknown>).api_keys as unknown[]
			: [];

	return {
		source: 'fallback',
		period: {
			start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString(),
			end: periodEnd.toISOString(),
			label: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(now),
		},
		plan: {
			slug: planSlug,
			name: typeof billing.plan_name === 'string' ? billing.plan_name : planSlug[0].toUpperCase() + planSlug.slice(1),
			protected_request_limit: planLimit,
			overage_unit_requests: planSlug === 'growth' || planSlug === 'scale' ? 100_000 : null,
			overage_unit_price_gbp: planSlug === 'growth' || planSlug === 'scale' ? 12 : null,
		},
		usage: {
			protected_requests: protectedRequests,
			requests_allowed: allowed,
			requests_blocked: blocked,
			attacks_detected: attacks,
			rag_scans: 0,
			tokens_total: 0,
			estimated_cost_gbp: 0,
		},
		limits: {
			protected_requests: planLimit,
			remaining,
			percent_used: percentUsed,
			status,
		},
		breakdown: {
			daily: [],
			by_api_key: keys.map((item, index) => {
				const key = item && typeof item === 'object' ? item as Record<string, unknown> : {};
				return {
					id: typeof key.id === 'string' ? key.id : `key-${index}`,
					name: typeof key.name === 'string' ? key.name : 'API key',
					key_prefix: typeof key.key_prefix === 'string' ? key.key_prefix : null,
					monthly_ceiling: typeof key.monthly_ceiling === 'number' ? key.monthly_ceiling : null,
					protected_requests: 0,
					requests_blocked: 0,
					attacks_detected: 0,
					last_used_at: typeof key.last_used_at === 'string' ? key.last_used_at : null,
				};
			}),
		},
		alerts: status === 'watch' || status === 'near_limit' || status === 'limit_reached'
			? [{ level: status === 'watch' ? 'warning' : 'critical', message: 'Your protected request allowance is getting close to its monthly limit.' }]
			: [],
	};
}

async function loadUsageSummary(): Promise<UsageSummaryView> {
	try {
		const usage = await api.getUsageSummary();
		return { ...usage, source: 'realtime' };
	} catch (err) {
		const error = err as { code?: number; message?: string };
		const isMissingEndpoint = error.code === 404 || error.message === 'Not Found';
		if (!isMissingEndpoint) {
			throw err;
		}

		const [stats, billing, keys] = await Promise.allSettled([
			api.getStats(),
			api.getBillingAccount(),
			api.getApiKeys(),
		]);

		if (stats.status === 'rejected' && billing.status === 'rejected' && keys.status === 'rejected') {
			throw err;
		}

		return buildFallbackUsage(
			stats.status === 'fulfilled' ? stats.value : null,
			billing.status === 'fulfilled' ? billing.value : null,
			keys.status === 'fulfilled' ? keys.value : null,
		);
	}
}

function ProgressBar({ usage }: { usage: UsageSummary }) {
	const percent = usage.limits.percent_used ?? 0;
	const safePercent = Math.min(Math.max(percent, 0), 100);
	const tone =
		usage.limits.status === 'limit_reached' || usage.limits.status === 'near_limit'
			? 'bg-red-500'
			: usage.limits.status === 'watch'
				? 'bg-amber-500'
				: 'bg-electric-green';

	return (
		<div>
			<div className="mb-3 flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="text-sm font-semibold text-muted-foreground">Protected requests this month</p>
					<p className="mt-1 text-4xl font-black tracking-[-0.05em]">
						{formatNumber(usage.usage.protected_requests)}
						<span className="ml-2 text-base font-semibold text-muted-foreground">
							/ {formatNumber(usage.plan.protected_request_limit)}
						</span>
					</p>
				</div>
				<div className="text-left sm:text-right">
					<p className={['text-2xl font-black tracking-[-0.04em]', usageTone(usage.limits.status)].join(' ')}>
						{formatPercent(usage.limits.percent_used)}
					</p>
					<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
						Resets {formatDate(usage.period.end)}
					</p>
				</div>
			</div>
			<div className="h-4 overflow-hidden rounded-full border border-border bg-background/70">
				<div className={['h-full rounded-full transition-all', tone].join(' ')} style={{ width: `${safePercent}%` }} />
			</div>
		</div>
	);
}

function DailyBars({ daily }: { daily: UsageSummary['breakdown']['daily'] }) {
	const max = Math.max(...daily.map((item) => item.protected_requests), 1);

	return (
		<div className="flex h-44 items-end gap-2">
			{daily.slice(-14).map((item) => {
				const height = Math.max((item.protected_requests / max) * 100, item.protected_requests > 0 ? 8 : 2);
				return (
					<div key={item.date} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
						<div className="relative flex h-36 w-full items-end">
							<div
								className="w-full rounded-t-lg bg-electric-green/70 shadow-[0_0_24px_rgba(18,194,150,0.16)] transition-colors group-hover:bg-electric-green"
								style={{ height: `${height}%` }}
							/>
						</div>
						<span className="truncate text-[10px] text-muted-foreground">
							{new Date(item.date).getDate()}
						</span>
					</div>
				);
			})}
		</div>
	);
}

function KeyUsageTable({ usage }: { usage: UsageSummary }) {
	const keys = usage.breakdown.by_api_key;
	if (keys.length === 0) {
		return (
			<AppEmptyState
				icon={KeyRound}
				title="No API keys have recorded traffic yet"
				description="Once protected requests pass through Koreshield, this page will show which key used them."
				action={
					<Link className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" to="/settings/api-keys">
						Create API key
					</Link>
				}
			/>
		);
	}

	return (
		<div className="overflow-hidden rounded-2xl border border-border">
			<div className="grid grid-cols-12 gap-4 border-b border-border bg-background/70 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
				<span className="col-span-5">Key</span>
				<span className="col-span-2 hidden sm:block">Used</span>
				<span className="col-span-2 hidden md:block">Ceiling</span>
				<span className="col-span-3 text-right">Last seen</span>
			</div>
			{keys.map((key) => (
				<div key={key.id} className="grid grid-cols-12 gap-4 border-b border-border/70 px-4 py-4 last:border-0">
					<div className="col-span-9 sm:col-span-5">
						<p className="font-semibold">{key.name}</p>
						<p className="mt-1 font-mono text-xs text-muted-foreground">{key.key_prefix || 'direct / unknown'}</p>
					</div>
					<p className="hidden font-mono text-sm sm:col-span-2 sm:block">{formatNumber(key.protected_requests)}</p>
					<p className="hidden font-mono text-sm text-muted-foreground md:col-span-2 md:block">
						{formatNumber(key.monthly_ceiling)}
					</p>
					<p className="col-span-3 text-right text-sm text-muted-foreground">{formatDate(key.last_used_at)}</p>
				</div>
			))}
		</div>
	);
}

export default function UsageLimitsPage() {
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['usage-summary'],
		queryFn: loadUsageSummary,
		refetchInterval: 60_000,
	});

	if (isLoading) {
		return <AppPageLoading label="Loading usage..." />;
	}

	if (error || !data) {
		return (
			<AppPageError
				title="Usage could not load"
				message={error instanceof Error ? error.message : 'The usage endpoint returned an invalid response.'}
				onRetry={() => void refetch()}
			/>
		);
	}

	const overageCopy =
		data.plan.overage_unit_requests && data.plan.overage_unit_price_gbp
			? `Overage: £${data.plan.overage_unit_price_gbp} per ${formatNumber(data.plan.overage_unit_requests)} extra protected requests.`
			: 'Upgrade before you hit the limit to keep production traffic moving.';

	return (
		<AppPage>
			<SEOMeta title="Usage Limits" noindex />
			<AppPageHeader
				eyebrow="Usage & limits"
				eyebrowIcon={Gauge}
				title="Know what is protected."
				description="Monthly allowance, remaining protected requests, API-key usage, and quota warnings in one place."
				actions={
					<>
						<Link
							to="/billing"
							className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
						>
							Manage plan <ArrowUpRight className="h-4 w-4" />
						</Link>
						<Link
							to="/settings/api-keys"
							className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-4 py-2 text-sm font-semibold hover:bg-muted/70"
						>
							API keys
						</Link>
					</>
				}
				stats={[
					{ label: 'Plan', value: data.plan.name },
					{ label: 'Status', value: data.limits.status.replace('_', ' '), tone: usageTone(data.limits.status) },
				]}
			/>

			{data.alerts.map((alert) => (
				<AppCallout key={alert.message} variant="warning">
					<div className="flex items-start gap-3">
						<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
						<span>{alert.message}</span>
					</div>
				</AppCallout>
			))}

			{data.source === 'fallback' && (
				<AppCallout variant="info">
					<div className="flex items-start gap-3">
						<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
						<span>
							Showing a compatibility view from existing dashboard stats while the new usage endpoint is unavailable.
						</span>
					</div>
				</AppCallout>
			)}

			<AppPageSection
				title={data.period.label}
				description={`${overageCopy} Counts update from request logs and reset each billing month.`}
				className="overflow-hidden"
			>
				<ProgressBar usage={data} />
			</AppPageSection>

			<AppStatGrid columns={4}>
				<AppStatCard
					label="Remaining"
					value={formatNumber(data.limits.remaining)}
					icon={CalendarClock}
					tone="text-electric-green"
					detail="Until the next monthly reset"
				/>
				<AppStatCard
					label="Blocked"
					value={formatNumber(data.usage.requests_blocked)}
					icon={ShieldCheck}
					tone="text-red-500"
					detail="Requests stopped by policy or detection"
				/>
				<AppStatCard
					label="Attacks"
					value={formatNumber(data.usage.attacks_detected)}
					icon={Zap}
					tone="text-amber-500"
					detail="Detected prompt, RAG, or data threats"
				/>
				<AppStatCard
					label="Tokens seen"
					value={formatNumber(data.usage.tokens_total)}
					icon={Activity}
					tone="text-primary"
					detail="Observed across protected traffic"
				/>
			</AppStatGrid>

			<div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
				<AppPageSection
					title="Usage by API key"
					description="See which production, staging, or local keys are consuming allowance."
					className="mb-0"
				>
					<KeyUsageTable usage={data} />
				</AppPageSection>

				<AppPageSection
					title="Daily pace"
					description="Last 14 recorded days in the current period."
					className="mb-0"
				>
					{data.breakdown.daily.length > 0 ? (
						<DailyBars daily={data.breakdown.daily} />
					) : (
						<AppSurface className="flex min-h-44 items-center justify-center text-center">
							<div>
								<BarChart3 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
								<p className="text-sm font-semibold">No protected requests yet</p>
								<p className="mt-1 text-xs text-muted-foreground">Traffic will appear here after your first request.</p>
							</div>
						</AppSurface>
					)}
				</AppPageSection>
			</div>

			<AppPageSection
				title="How usage is counted"
				description="One protected request is one AI interaction that enters Koreshield for inspection, policy checks, audit logging, or provider routing."
				variant="card"
				className="mt-8"
			>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<AppSurface>
						<CheckCircle2 className="mb-4 h-5 w-5 text-electric-green" />
						<h3 className="font-bold">Prompts and responses</h3>
						<p className="mt-1 text-2xl font-black">1 request</p>
						<p className="mt-2 text-sm text-muted-foreground">Each prompt or response scanned via the proxy counts as one protected request, whether it passes or gets blocked.</p>
					</AppSurface>
					<AppSurface>
						<CheckCircle2 className="mb-4 h-5 w-5 text-electric-green" />
						<h3 className="font-bold">RAG document scans</h3>
						<p className="mt-1 text-2xl font-black">25 per document</p>
						<p className="mt-2 text-sm text-muted-foreground">Each document in a RAG scan batch counts as 25 protected requests. Scanning 4 documents in one call uses 100 requests.</p>
					</AppSurface>
					<AppSurface>
						<CheckCircle2 className="mb-4 h-5 w-5 text-electric-green" />
						<h3 className="font-bold">VoiceGuard audio scans</h3>
						<p className="mt-1 text-2xl font-black">50 requests</p>
						<p className="mt-2 text-sm text-muted-foreground">Each audio scan consumes 50 protected requests to cover server-side transcription and speech threat analysis.</p>
					</AppSurface>
					<AppSurface>
						<CheckCircle2 className="mb-4 h-5 w-5 text-electric-green" />
						<h3 className="font-bold">Per-key ceilings</h3>
						<p className="mt-2 text-sm text-muted-foreground">Set monthly ceilings on API keys to keep test traffic from draining production allowance.</p>
					</AppSurface>
				</div>
			</AppPageSection>
		</AppPage>
	);
}
