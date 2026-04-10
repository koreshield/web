import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api-client';
import {
	type BillingInterval,
	type HostedPlanId,
	PRICING_PLANS,
	getHostedCheckoutProductId,
	getHostedPlanBySlug,
} from '../lib/pricing';

type BillingAccount = {
	id: string;
	status: string;
	plan_slug: string;
	plan_name?: string | null;
	subscription_status?: string | null;
	current_period_end?: string | null;
	billing_email?: string | null;
	external_customer_id: string;
	metadata?: {
		recurring_interval?: string;
		active_meter_count?: number;
		granted_benefits?: unknown[];
		internal_unlimited?: boolean;
		protected_requests?: string;
		team_access?: string;
		retention?: string;
		support?: string;
	};
};

type BillingActionResponse = {
	url?: string;
};

type BillingAccountMetadata = {
	recurring_interval?: string;
	active_meter_count?: number;
	granted_benefits?: unknown[];
	internal_unlimited?: boolean;
	protected_requests?: string;
	team_access?: string;
	retention?: string;
	support?: string;
};

function normalizeBillingAccount(raw: unknown): BillingAccount | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}

	const value = raw as Record<string, unknown>;
	const metadataRaw =
		value.metadata && typeof value.metadata === 'object' ? (value.metadata as Record<string, unknown>) : {};
	const grantedBenefits = Array.isArray(metadataRaw.granted_benefits) ? metadataRaw.granted_benefits : [];
	const metadata: BillingAccountMetadata = {
		recurring_interval:
			typeof metadataRaw.recurring_interval === 'string' ? metadataRaw.recurring_interval : undefined,
		active_meter_count:
			typeof metadataRaw.active_meter_count === 'number' ? metadataRaw.active_meter_count : 0,
		granted_benefits: grantedBenefits,
		internal_unlimited: metadataRaw.internal_unlimited === true,
		protected_requests:
			typeof metadataRaw.protected_requests === 'string' ? metadataRaw.protected_requests : undefined,
		team_access: typeof metadataRaw.team_access === 'string' ? metadataRaw.team_access : undefined,
		retention: typeof metadataRaw.retention === 'string' ? metadataRaw.retention : undefined,
		support: typeof metadataRaw.support === 'string' ? metadataRaw.support : undefined,
	};

	return {
		id: typeof value.id === 'string' ? value.id : 'unknown',
		status: typeof value.status === 'string' ? value.status : 'inactive',
		plan_slug: typeof value.plan_slug === 'string' ? value.plan_slug : 'free',
		plan_name: typeof value.plan_name === 'string' ? value.plan_name : null,
		subscription_status:
			typeof value.subscription_status === 'string' ? value.subscription_status : null,
		current_period_end:
			typeof value.current_period_end === 'string' ? value.current_period_end : null,
		billing_email: typeof value.billing_email === 'string' ? value.billing_email : null,
		external_customer_id:
			typeof value.external_customer_id === 'string' ? value.external_customer_id : '',
		metadata,
	};
}

const hostedPlans = PRICING_PLANS.filter(
	(plan): plan is (typeof PRICING_PLANS)[number] & { id: HostedPlanId } =>
		plan.id === 'growth' || plan.id === 'scale',
);

export default function BillingPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [account, setAccount] = useState<BillingAccount | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [busyAction, setBusyAction] = useState<string | null>(null);
	const [checkoutNotice, setCheckoutNotice] = useState('');
	const [billingPeriod, setBillingPeriod] = useState<BillingInterval>(
		searchParams.get('period') === 'annual' ? 'annual' : 'monthly',
	);
	const autoCheckoutStarted = useRef(false);
	const billingUnavailable =
		error.includes('POLAR') ||
		error.includes('Polar') ||
		error.includes('not configured') ||
		error.includes('customer portal');

	const loadAccount = async () => {
		setError('');
		setLoading(true);
		try {
			const raw = await api.getBillingAccount();
			const data = normalizeBillingAccount(raw);
			if (!data) {
				throw new Error('Billing account payload was invalid');
			}
			setAccount(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to load billing account');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadAccount();
	}, []);

	useEffect(() => {
		setBillingPeriod(searchParams.get('period') === 'annual' ? 'annual' : 'monthly');
	}, [searchParams]);

	const handleCheckout = async (
		productId?: string,
		planId?: string | null,
		periodOverride?: BillingInterval,
	) => {
		if (!productId) {
			setError('Missing product ID. Set the VITE_POLAR_*_PRODUCT_ID environment variable first.');
			return;
		}

		setBusyAction(productId);
		setError('');
		try {
			const period = periodOverride || billingPeriod;
			const successUrl = new URL('/billing', window.location.origin);
			successUrl.searchParams.set('checkout', 'success');
			successUrl.searchParams.set('period', period);
			if (planId) {
				successUrl.searchParams.set('plan', planId);
			}

			const response = await api.createBillingCheckout(productId, successUrl.toString()) as BillingActionResponse;
			if (response?.url) {
				window.location.href = response.url;
				return;
			}
			throw new Error('Polar checkout URL was not returned');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to start checkout');
		} finally {
			setBusyAction(null);
		}
	};

	const handlePortal = async () => {
		setBusyAction('portal');
		setError('');
		try {
			const response = await api.createBillingPortal(`${window.location.origin}/billing`) as BillingActionResponse;
			if (response?.url) {
				window.location.href = response.url;
				return;
			}
			throw new Error('Polar customer portal URL was not returned');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to open customer portal');
		} finally {
			setBusyAction(null);
		}
	};

	const handleSync = async () => {
		setBusyAction('sync');
		setError('');
		try {
			const raw = await api.syncBillingAccount();
			const data = normalizeBillingAccount(raw);
			if (!data) {
				throw new Error('Billing sync payload was invalid');
			}
			setAccount(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to sync billing account');
		} finally {
			setBusyAction(null);
		}
	};

	useEffect(() => {
		if (searchParams.get('checkout') !== 'success') {
			return;
		}

		setCheckoutNotice('Payment completed. Syncing your account with Polar now.');
		void handleSync().finally(() => {
			setSearchParams((current) => {
				const next = new URLSearchParams(current);
				next.delete('checkout');
				return next;
			}, { replace: true });
		});
	}, [searchParams, setSearchParams]);

	useEffect(() => {
		if (loading || autoCheckoutStarted.current || searchParams.get('checkout') !== '1') {
			return;
		}

		const planId = searchParams.get('plan');
		const period = searchParams.get('period') === 'annual' ? 'annual' : 'monthly';
		const normalizedPlanId = planId === 'scale' ? 'scale' : planId === 'growth' ? 'growth' : null;
		const productId = normalizedPlanId ? getHostedCheckoutProductId(normalizedPlanId, period) : undefined;
		autoCheckoutStarted.current = true;
		void handleCheckout(productId, normalizedPlanId, period);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loading, searchParams]);

	const displayPlan = getHostedPlanBySlug(account?.plan_slug);
	const isInternalUnlimited = account?.metadata?.internal_unlimited === true;

	return (
		<div>
			<header className="border-b border-border bg-card">
				<div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 sm:py-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex-1">
							<h1 className="text-2xl font-bold sm:text-3xl">Billing</h1>
							<p className="mt-2 max-w-2xl text-xs text-muted-foreground sm:text-sm">
								Manage your KoreShield subscription, launch Polar checkout, and keep your account entitlement state in sync.
							</p>
						</div>
						<button
							onClick={() => void handleSync()}
							disabled={busyAction === 'sync'}
							className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 transition-colors hover:bg-muted disabled:opacity-60 sm:w-auto sm:justify-start"
						>
							<RefreshCw className={`h-4 w-4 ${busyAction === 'sync' ? 'animate-spin' : ''}`} />
							Refresh state
						</button>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto space-y-4 px-4 py-6 sm:space-y-8 sm:px-6 lg:px-8 sm:py-8">
				{error ? (
					<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive sm:text-sm">
						{error}
					</div>
				) : null}
				{billingUnavailable ? (
					<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 sm:text-sm">
						Hosted billing is not fully configured in this environment yet. You can still create your account, manage API keys, and finish product onboarding while checkout and portal access are being wired up.
					</div>
				) : null}
				<div className="rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground sm:text-sm">
					KoreShield presents hosted plans publicly as Free, Growth, and Scale. The current checkout mapping still uses your existing Polar product IDs underneath, so public plan names and billing wiring stay aligned without breaking the current integration.
				</div>

				<section className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1.1fr,0.9fr]">
					<div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
						<div className="mb-4 flex items-start gap-3 sm:mb-6 sm:items-center">
							<div className="rounded-lg bg-primary/10 p-2">
								<CreditCard className="h-5 w-5 text-primary" />
							</div>
							<div className="min-w-0 flex-1">
								<h2 className="text-lg font-semibold">Current account</h2>
								<p className="text-xs text-muted-foreground sm:text-sm">Local billing state mirrored from Polar.</p>
							</div>
						</div>

						{loading ? (
							<div className="text-xs text-muted-foreground sm:text-sm">Loading billing account...</div>
						) : (
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
								<div className="rounded-xl bg-muted p-4">
									<div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Plan</div>
									<div className="text-xl font-semibold">{displayPlan?.name || account?.plan_name || account?.plan_slug || 'Free'}</div>
								</div>
								<div className="rounded-xl bg-muted p-4">
									<div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Status</div>
									<div className="text-xl font-semibold capitalize">{account?.subscription_status || account?.status || 'inactive'}</div>
								</div>
								<div className="rounded-xl bg-muted p-4">
									<div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Billing email</div>
									<div className="text-sm font-medium break-all">{account?.billing_email || 'Not set yet'}</div>
								</div>
								<div className="rounded-xl bg-muted p-4">
									<div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Period end</div>
									<div className="text-sm font-medium">
										{account?.current_period_end ? new Date(account.current_period_end).toLocaleDateString() : 'No active cycle'}
									</div>
								</div>
							</div>
						)}

						<div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:gap-3">
							{isInternalUnlimited ? (
								<div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700 sm:text-sm">
									This KoreShield team account is provisioned with internal unlimited enterprise access. Hosted checkout and customer portal are not needed.
								</div>
							) : (
								<button
									onClick={() => void handlePortal()}
									disabled={busyAction === 'portal' || loading}
									className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto sm:justify-start"
								>
									<ArrowUpRight className="h-4 w-4" />
									Open customer portal
								</button>
							)}
							<div className="self-center text-xs text-muted-foreground">
								External customer ID: <span className="font-mono text-[10px] sm:text-xs">{account?.external_customer_id || 'pending'}</span>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
						<div className="mb-4 flex items-start gap-3 sm:mb-6 sm:items-center">
							<div className="rounded-lg bg-emerald-500/10 p-2">
								<ShieldCheck className="h-5 w-5 text-emerald-600" />
							</div>
							<div className="min-w-0 flex-1">
								<h2 className="text-lg font-semibold">Entitlements snapshot</h2>
								<p className="text-xs text-muted-foreground sm:text-sm">What the app currently understands about your Polar customer state.</p>
							</div>
						</div>
						<div className="space-y-2 text-xs sm:space-y-3 sm:text-sm">
							<div className="flex justify-between gap-4">
								<span className="text-muted-foreground">Recurring interval</span>
								<span className="font-medium capitalize">{account?.metadata?.recurring_interval || 'n/a'}</span>
							</div>
							<div className="flex justify-between gap-4">
								<span className="text-muted-foreground">Active meters</span>
								<span className="font-medium">{account?.metadata?.active_meter_count ?? 0}</span>
							</div>
							<div className="flex justify-between gap-4">
								<span className="text-muted-foreground">Granted benefits</span>
								<span className="font-medium">{account?.metadata?.granted_benefits?.length ?? 0}</span>
							</div>
							{isInternalUnlimited ? (
								<>
									<div className="flex justify-between gap-4">
										<span className="text-muted-foreground">Protected requests</span>
										<span className="font-medium">{account?.metadata?.protected_requests ?? 'unlimited'}</span>
									</div>
									<div className="flex justify-between gap-4">
										<span className="text-muted-foreground">Support</span>
										<span className="font-medium capitalize">{account?.metadata?.support ?? 'priority'}</span>
									</div>
								</>
							) : null}
						</div>
					</div>
				</section>

				<section className="space-y-4 sm:space-y-6">
					<div>
						<h2 className="text-lg font-semibold sm:text-xl">Upgrade plans</h2>
						<p className="mt-1 text-xs text-muted-foreground sm:text-sm">
							Hosted plans are sold as Growth and Scale. Polar product wiring stays in place under the hood while public pricing, feature gates, and overages follow the new request-based model.
						</p>
						{checkoutNotice ? <p className="mt-2 text-xs text-emerald-600 sm:text-sm">{checkoutNotice}</p> : null}
						{isInternalUnlimited ? (
							<p className="mt-2 text-xs text-emerald-600 sm:text-sm">
								This account is internally provisioned on unlimited Enterprise access, so hosted upgrades and Polar checkout are intentionally disabled.
							</p>
						) : null}
					</div>

					<div className="flex justify-center sm:justify-start">
						<div className="inline-flex rounded-xl border border-border bg-card p-1">
							<button
								onClick={() => setBillingPeriod('monthly')}
								className={`rounded-lg px-3 py-2 text-xs transition-colors sm:px-4 sm:text-sm ${billingPeriod === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
							>
								Monthly
							</button>
							<button
								onClick={() => setBillingPeriod('annual')}
								className={`rounded-lg px-3 py-2 text-xs transition-colors sm:px-4 sm:text-sm ${billingPeriod === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
							>
								Annual
							</button>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
						{hostedPlans.map((plan) => {
							const productId = getHostedCheckoutProductId(plan.id, billingPeriod);
							const missingProduct = !productId;
							return (
								<div key={plan.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<h3 className="text-lg font-semibold">{plan.name}</h3>
											<p className="mt-2 text-xs text-muted-foreground sm:text-sm">{plan.description}</p>
										</div>
										<div className="text-left sm:text-right">
											<div className="text-xs uppercase tracking-wide text-muted-foreground">{billingPeriod === 'annual' ? 'Annual' : 'Monthly'}</div>
											<div className="text-lg font-semibold">{billingPeriod === 'annual' ? plan.annualPriceLabel : plan.monthlyPriceLabel}</div>
										</div>
									</div>

									<div className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
										<div className="font-medium text-foreground">{plan.includedRequests}</div>
										<div className="mt-1">{plan.retention}</div>
										{plan.overage ? <div className="mt-2">{plan.overage}</div> : null}
									</div>

									<div className="mt-4 flex items-center justify-between gap-4">
										<div className="text-xs text-muted-foreground">
											{missingProduct ? 'Product ID missing' : 'Checkout ready'}
										</div>
										{productId ? (
											<span className="font-mono text-[10px] text-muted-foreground">{productId}</span>
										) : null}
									</div>

									<button
										onClick={() => void handleCheckout(productId, plan.id, billingPeriod)}
										disabled={busyAction === productId || missingProduct || isInternalUnlimited}
										className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 transition-colors hover:bg-muted disabled:opacity-60 sm:w-auto"
									>
										<ArrowUpRight className="h-4 w-4" />
										{isInternalUnlimited
											? 'Included with internal Enterprise access'
											: busyAction === productId
												? 'Opening checkout...'
												: `Choose ${plan.name}`}
									</button>
								</div>
							);
						})}
					</div>
				</section>
			</main>
		</div>
	);
}
