import { useEffect, useState } from 'react';
import { ArrowUpRight, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api-client';

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
	};
};

type BillingActionResponse = {
	url?: string;
};

const plans = [
	{
		name: 'Startup',
		monthlyProductId: import.meta.env.VITE_POLAR_STARTUP_PRODUCT_ID as string | undefined,
		annualProductId: import.meta.env.VITE_POLAR_STARTUP_ANNUAL_PRODUCT_ID as string | undefined,
		monthlyLabel: 'GBP monthly',
		annualLabel: 'GBP annual',
		description: 'Managed SaaS for teams protecting up to 1M requests each month.',
	},
	{
		name: 'Growth',
		monthlyProductId: import.meta.env.VITE_POLAR_GROWTH_PRODUCT_ID as string | undefined,
		annualProductId: import.meta.env.VITE_POLAR_GROWTH_ANNUAL_PRODUCT_ID as string | undefined,
		monthlyLabel: 'GBP monthly',
		annualLabel: 'GBP annual',
		description: 'Higher-volume hosted plan with more support and operational controls.',
	},
];

export default function BillingPage() {
	const [account, setAccount] = useState<BillingAccount | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [busyAction, setBusyAction] = useState<string | null>(null);
	const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

	const loadAccount = async () => {
		setError('');
		setLoading(true);
		try {
			const data = await api.getBillingAccount() as BillingAccount;
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

	const handleCheckout = async (productId?: string) => {
		if (!productId) {
			setError('Missing product ID. Set the VITE_POLAR_*_PRODUCT_ID environment variable first.');
			return;
		}

		setBusyAction(productId);
		setError('');
		try {
			const response = await api.createBillingCheckout(productId, `${window.location.origin}/billing`) as BillingActionResponse;
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
			const data = await api.syncBillingAccount() as BillingAccount;
			setAccount(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to sync billing account');
		} finally {
			setBusyAction(null);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border bg-card">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-start justify-between gap-4 flex-wrap">
						<div>
							<h1 className="text-3xl font-bold">Billing</h1>
							<p className="text-sm text-muted-foreground mt-2 max-w-2xl">
								Manage your KoreShield subscription, launch Polar checkout in GBP, and keep your account entitlement state in sync.
							</p>
						</div>
						<button
							onClick={() => void handleSync()}
							disabled={busyAction === 'sync'}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-60"
						>
							<RefreshCw className={`w-4 h-4 ${busyAction === 'sync' ? 'animate-spin' : ''}`} />
							Refresh state
						</button>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
				{error && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				)}

				<section className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6">
					<div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<div className="flex items-center gap-3 mb-6">
							<div className="p-2 rounded-lg bg-primary/10">
								<CreditCard className="w-5 h-5 text-primary" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">Current account</h2>
								<p className="text-sm text-muted-foreground">Local billing state mirrored from Polar.</p>
							</div>
						</div>

						{loading ? (
							<div className="text-sm text-muted-foreground">Loading billing account...</div>
						) : (
							<div className="grid sm:grid-cols-2 gap-4">
								<div className="rounded-xl bg-muted p-4">
									<div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Plan</div>
									<div className="text-xl font-semibold">{account?.plan_name || account?.plan_slug || 'Free'}</div>
								</div>
								<div className="rounded-xl bg-muted p-4">
									<div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Status</div>
									<div className="text-xl font-semibold capitalize">{account?.subscription_status || account?.status || 'inactive'}</div>
								</div>
								<div className="rounded-xl bg-muted p-4">
									<div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Billing email</div>
									<div className="text-sm font-medium break-all">{account?.billing_email || 'Not set yet'}</div>
								</div>
								<div className="rounded-xl bg-muted p-4">
									<div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Period end</div>
									<div className="text-sm font-medium">
										{account?.current_period_end ? new Date(account.current_period_end).toLocaleDateString() : 'No active cycle'}
									</div>
								</div>
							</div>
						)}

						<div className="mt-6 flex flex-wrap gap-3">
							<button
								onClick={() => void handlePortal()}
								disabled={busyAction === 'portal' || loading}
								className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
							>
								<ArrowUpRight className="w-4 h-4" />
								Open customer portal
							</button>
							<div className="text-xs text-muted-foreground self-center">
								External customer ID: <span className="font-mono">{account?.external_customer_id || 'pending'}</span>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<div className="flex items-center gap-3 mb-6">
							<div className="p-2 rounded-lg bg-emerald-500/10">
								<ShieldCheck className="w-5 h-5 text-emerald-600" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">Entitlements snapshot</h2>
								<p className="text-sm text-muted-foreground">What the app currently understands about your Polar customer state.</p>
							</div>
						</div>
						<div className="space-y-3 text-sm">
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
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<div>
						<h2 className="text-xl font-semibold">Upgrade plans</h2>
						<p className="text-sm text-muted-foreground mt-1">
							These buttons launch Polar checkout using the configured GBP product IDs for monthly or annual billing.
						</p>
					</div>

					<div className="inline-flex rounded-xl border border-border bg-card p-1">
						<button
							onClick={() => setBillingPeriod('monthly')}
							className={`px-4 py-2 rounded-lg text-sm transition-colors ${billingPeriod === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
						>
							Monthly
						</button>
						<button
							onClick={() => setBillingPeriod('annual')}
							className={`px-4 py-2 rounded-lg text-sm transition-colors ${billingPeriod === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
						>
							Annual
						</button>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						{plans.map((plan) => (
							<div key={plan.name} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
								<div className="flex items-center justify-between gap-4">
									<h3 className="text-lg font-semibold">{plan.name}</h3>
									{(billingPeriod === 'annual' ? plan.annualProductId : plan.monthlyProductId) ? (
										<span className="text-xs font-mono text-muted-foreground">
											{billingPeriod === 'annual' ? plan.annualProductId : plan.monthlyProductId}
										</span>
									) : (
										<span className="text-xs text-amber-600">Product ID missing</span>
									)}
								</div>
								<p className="text-sm text-muted-foreground mt-3">{plan.description}</p>
								<div className="mt-4 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
									{billingPeriod === 'annual' ? plan.annualLabel : plan.monthlyLabel}
								</div>
								<button
									onClick={() => void handleCheckout(billingPeriod === 'annual' ? plan.annualProductId : plan.monthlyProductId)}
									disabled={busyAction === (billingPeriod === 'annual' ? plan.annualProductId : plan.monthlyProductId)}
									className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-60"
								>
									<ArrowUpRight className="w-4 h-4" />
									{busyAction === (billingPeriod === 'annual' ? plan.annualProductId : plan.monthlyProductId) ? 'Opening checkout...' : `Choose ${plan.name}`}
								</button>
							</div>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}
