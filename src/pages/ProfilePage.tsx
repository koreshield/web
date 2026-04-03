import { User, Mail, Shield, Building, CreditCard, Rocket, BookOpen, Key } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api-client';
import { useAuthState } from '../hooks/useAuthState';

type BillingAccountSummary = {
	plan_slug?: string;
	plan_name?: string | null;
	status?: string;
	subscription_status?: string | null;
	billing_email?: string | null;
};

export function ProfilePage() {
	const { user } = useAuthState();
	const [billing, setBilling] = useState<BillingAccountSummary | null>(null);
	const [billingState, setBillingState] = useState<'loading' | 'ready' | 'error'>('loading');

	useEffect(() => {
		if (!user) {
			return;
		}

		let active = true;
		void api.getBillingAccount()
			.then((account) => {
				if (!active) {
					return;
				}
				setBilling(account as BillingAccountSummary);
				setBillingState('ready');
			})
			.catch(() => {
				if (!active) {
					return;
				}
				setBillingState('error');
			});

		return () => {
			active = false;
		};
	}, [user]);

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<p className="text-muted-foreground">Please log in to view your profile.</p>
			</div>
		);
	}

	return (
		<div>
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<User className="w-6 h-6 text-primary" />
						</div>
						<div>
							<h1 className="text-2xl font-bold">User Profile</h1>
							<p className="text-sm text-muted-foreground">
								Manage your account settings, billing state, and onboarding progress.
							</p>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-card border border-border rounded-lg shadow-sm">
					<div className="p-6 border-b border-border">
						<h2 className="text-lg font-semibold">Personal Information</h2>
						<p className="text-sm text-muted-foreground">
							Basic details about your account.
						</p>
					</div>
					<div className="p-6 space-y-6">
						<div className="grid gap-3 sm:gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<User className="w-4 h-4" /> Full Name
								</label>
								<div className="p-3 bg-muted rounded-md text-foreground font-medium">
									{user.name}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Mail className="w-4 h-4" /> Email Address
								</label>
								<div className="p-3 bg-muted rounded-md text-foreground font-medium">
									{user.email}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Shield className="w-4 h-4" /> Role
								</label>
								<div className="p-3 bg-muted rounded-md text-foreground font-medium capitalize">
									{user.role}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Building className="w-4 h-4" /> Account Status
								</label>
								<div className="flex items-center gap-2 p-3 bg-muted rounded-md text-foreground font-medium capitalize">
									<span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
									{user.status || 'unknown'}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6">
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
						<div className="flex-1">
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<CreditCard className="w-5 h-5 text-primary" />
								Billing
							</h2>
							<p className="text-sm text-muted-foreground mt-1">
								Manage your subscription, invoices, and customer portal access.
							</p>
							<div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
								<div className="rounded-lg bg-muted p-3">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">Plan</div>
									<div className="mt-1 font-medium">
										{billingState === 'ready' ? (billing?.plan_name || billing?.plan_slug || 'Free') : billingState === 'loading' ? 'Loading…' : 'Unavailable'}
									</div>
								</div>
								<div className="rounded-lg bg-muted p-3">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">Subscription status</div>
									<div className="mt-1 font-medium capitalize">
										{billingState === 'ready' ? (billing?.subscription_status || billing?.status || 'inactive') : billingState === 'loading' ? 'Loading…' : 'Unavailable'}
									</div>
								</div>
							</div>
						</div>
						<Link
							to="/billing"
							className="w-full sm:w-auto inline-flex items-center justify-center sm:justify-start px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
						>
							Open billing
						</Link>
					</div>
				</div>

				<div className="mt-6 bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6">
					<h2 className="text-lg font-semibold mb-4">Getting started</h2>
					<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
						<Link to="/getting-started" className="rounded-lg border border-border p-4 hover:border-primary/40 transition-colors">
							<Rocket className="w-5 h-5 text-primary mb-3" />
							<div className="font-medium">Integration guide</div>
							<p className="text-sm text-muted-foreground mt-2">See the exact steps clients take to connect their app to KoreShield.</p>
						</Link>
						<Link to="/settings/api-keys" className="rounded-lg border border-border p-4 hover:border-primary/40 transition-colors">
							<Key className="w-5 h-5 text-primary mb-3" />
							<div className="font-medium">Server API keys</div>
							<p className="text-sm text-muted-foreground mt-2">Create the credentials your backend or gateway will use.</p>
						</Link>
						<a href="https://docs.koreshield.com/docs/getting-started/quick-start/" target="_blank" rel="noreferrer" className="rounded-lg border border-border p-4 hover:border-primary/40 transition-colors">
							<BookOpen className="w-5 h-5 text-primary mb-3" />
							<div className="font-medium">Public docs</div>
							<p className="text-sm text-muted-foreground mt-2">Open the published docs if you want the broader setup guide.</p>
						</a>
					</div>
				</div>
			</main>
		</div>
	);
}
