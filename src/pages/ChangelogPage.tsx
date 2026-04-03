import { SEOMeta } from '../components/SEOMeta';

type ChangeCategory = 'Added' | 'Improved' | 'Fixed' | 'Security' | 'Infra';

type ChangelogEntry = {
	date: string;
	title: string;
	category: ChangeCategory;
	summary: string;
	customerImpact: string;
	items: string[];
};

type ChangelogBatch = {
	label: string;
	timeframe: string;
	overview: string;
	stats: Array<{ label: string; value: string }>;
	entries: ChangelogEntry[];
};

const CATEGORY_STYLES: Record<ChangeCategory, string> = {
	Added: 'bg-emerald-500 text-black',
	Improved: 'bg-sky-500 text-white',
	Fixed: 'bg-amber-500 text-black',
	Security: 'bg-rose-500 text-white',
	Infra: 'bg-violet-500 text-white',
};

const CHANGELOG_BATCHES: ChangelogBatch[] = [
	{
		label: 'April 2026 Roundup',
		timeframe: 'April 2026',
		overview:
			'April focused on operational trust: live status, provider health, account lifecycle hardening, richer alerting, and cleaner dashboard flows for customers using KoreShield day to day.',
		stats: [
			{ label: 'Curated updates', value: '7' },
			{ label: 'Customer-facing fixes', value: '4' },
			{ label: 'Operational upgrades', value: '3' },
		],
		entries: [
			{
				date: '2026-04-03',
				title: 'Live status now reflects real provider routing health',
				category: 'Infra',
				summary:
					'Status reporting now pulls richer backend component data so the public status page can show live provider routes, degraded states, configured credentials, and current component health.',
				customerImpact:
					'Customers can see whether provider routing is healthy in real time instead of relying on a static snapshot.',
				items: [
					'Added detailed provider route cards for DeepSeek, Gemini, and Azure OpenAI.',
					'Improved the status summary so core systems, provider routing, and live counters stay aligned.',
					'Expanded status diagnostics to surface initialized routes, response times, and missing credential states.',
				],
			},
			{
				date: '2026-04-03',
				title: 'Telegram alerting now carries operational detail',
				category: 'Improved',
				summary:
					'Alert delivery was expanded beyond surface-level events so KoreShield operators can trace scans, batch work, provider failures, and report processing from one alert stream.',
				customerImpact:
					'Faster incident response when scan batches, report jobs, or provider routes drift out of expected health.',
				items: [
					'Added richer event payloads for prompt scans, RAG scans, report jobs, and provider health changes.',
					'Improved operational alert coverage for failed deliveries and provider transitions.',
					'Connected status-relevant backend events into the same monitoring flow used for delivery alerts.',
				],
			},
			{
				date: '2026-04-03',
				title: 'Mobile dashboard shell and public layout cleanup',
				category: 'Fixed',
				summary:
					'The authenticated shell and public navigation were cleaned up for smaller screens so the dashboard, marketing pages, and mobile drawer behave consistently.',
				customerImpact:
					'The app is easier to navigate on phones and smaller laptops without overlapping navigation or broken route shells.',
				items: [
					'Resolved route and layout conflicts between the latest app shell and mobile navigation work.',
					'Kept the updated mobile marketing drawer and dashboard layout behavior intact.',
					'Cleaned up top-level routing so public and authenticated views stay separated cleanly.',
				],
			},
			{
				date: '2026-04-02',
				title: 'Account recovery and billing flows were hardened',
				category: 'Security',
				summary:
					'Password reset, session handling, logout, and billing state handling now behave more like a production SaaS instead of a partial demo flow.',
				customerImpact:
					'Teams can recover accounts, manage billing, and keep session state consistent without hidden backend gaps.',
				items: [
					'Completed the backend forgot-password and reset-password flow.',
					'Improved billing checkout behavior when product currency mismatches occur in Polar.',
					'Strengthened account lifecycle tests around signup, logout, and billing ownership.',
				],
			},
		],
	},
	{
		label: 'March 2026 Roundup',
		timeframe: 'March 2026',
		overview:
			'March focused on platform depth: RAG evidence visibility, runtime tool security, detector hardening, enterprise billing, and clearer onboarding for customers integrating KoreShield into production systems.',
		stats: [
			{ label: 'Curated updates', value: '8' },
			{ label: 'Security upgrades', value: '5' },
			{ label: 'Integration improvements', value: '3' },
		],
		entries: [
			{
				date: '2026-03-25',
				title: 'Password reset moved from UI-only to end-to-end',
				category: 'Added',
				summary:
					'The password reset experience shipped as a full product flow across dashboard UI and backend management APIs instead of stopping at page design.',
				customerImpact:
					'Administrators can now complete password recovery without manual support or hidden backend setup.',
				items: [
					'Added reset password and forgot password support in the dashboard.',
					'Backed the flow with real management endpoints and token handling.',
					'Improved login feedback after successful password reset.',
				],
			},
			{
				date: '2026-03-23',
				title: 'Runtime tool security and governed sessions expanded',
				category: 'Security',
				summary:
					'KoreShield now goes beyond prompt scanning by evaluating risky tool calls, provider trust context, approval workflows, and suspicious tool chains in agentic flows.',
				customerImpact:
					'Customers evaluating agents and tool use can apply policy-backed review flows instead of trusting raw tool execution.',
				items: [
					'Added runtime tool scan and policy-backed allow, warn, and block decisions.',
					'Introduced governed runtime sessions and review workflows for risky operations.',
					'Expanded confused-deputy and trust-aware tool heuristics.',
				],
			},
			{
				date: '2026-03-22',
				title: 'Prompt and RAG detection were hardened',
				category: 'Security',
				summary:
					'Detector normalization, prompt-injection pattern coverage, indirect prompt-injection analysis, and RAG heuristics all received major upgrades.',
				customerImpact:
					'KoreShield is better at catching evasive instructions, poisoning attempts, and retrieved-document abuse before content reaches a model.',
				items: [
					'Added stronger normalization and raw plus normalized scanning paths.',
					'Expanded the detector corpus for prompt override, leakage, and exfiltration attempts.',
					'Improved RAG analysis with query-document mismatch and directive-density signals.',
				],
			},
			{
				date: '2026-03-16',
				title: 'Hosted billing and subscription management were introduced',
				category: 'Added',
				summary:
					'KoreShield added Polar-backed billing flows so hosted pricing, checkout, and customer account state can be managed inside the product.',
				customerImpact:
					'Hosted customers now have a clearer path from evaluation to paid plan selection and entitlement management.',
				items: [
					'Added Polar checkout and webhook handling for hosted billing.',
					'Improved plan metadata handling and subscription state mirroring.',
					'Aligned pricing and checkout flows with hosted and enterprise packaging.',
				],
			},
		],
	},
];

function ChangelogPage() {
	return (
		<div className="min-h-screen bg-background text-foreground pt-24 pb-20 transition-colors">
			<SEOMeta
				title="Changelog | KoreShield"
				description="Manual, curated release notes for KoreShield platform updates, security improvements, and operational milestones."
			/>

			<div className="max-w-6xl mx-auto px-6">
				<section className="mb-16">
					<div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
						Manual Release Notes
					</div>
					<h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
						Changelog
					</h1>
					<p className="mt-4 max-w-3xl text-lg text-muted-foreground">
						Curated updates for customers, operators, and buyers who want the real story of what changed in KoreShield.
						We summarize product, security, infrastructure, and onboarding work in monthly batches instead of publishing raw commit noise.
					</p>
				</section>

				<div className="space-y-16">
					{CHANGELOG_BATCHES.map((batch) => (
						<section key={batch.label} className="space-y-8">
							<div className="rounded-3xl border border-border bg-card/70 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
								<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
									<div className="max-w-3xl">
										<p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
											{batch.timeframe}
										</p>
										<h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
											{batch.label}
										</h2>
										<p className="mt-4 text-base leading-7 text-muted-foreground">
											{batch.overview}
										</p>
									</div>

									<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
										{batch.stats.map((stat) => (
											<div
												key={stat.label}
												className="min-w-[140px] rounded-2xl border border-white/[0.06] bg-background/60 px-4 py-4"
											>
												<div className="text-2xl font-bold text-foreground">{stat.value}</div>
												<div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
													{stat.label}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>

							<div className="space-y-6">
								{batch.entries.map((entry) => (
									<article
										key={`${entry.date}-${entry.title}`}
										className="rounded-3xl border border-border bg-card/50 p-7 transition-colors hover:border-primary/25"
									>
										<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
											<div className="max-w-3xl">
												<div className="flex flex-wrap items-center gap-3">
													<span
														className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${CATEGORY_STYLES[entry.category]}`}
													>
														{entry.category}
													</span>
													<span className="text-xs font-mono text-muted-foreground">
														{entry.date}
													</span>
												</div>
												<h3 className="mt-4 text-2xl font-semibold text-foreground">
													{entry.title}
												</h3>
												<p className="mt-3 text-base leading-7 text-muted-foreground">
													{entry.summary}
												</p>
											</div>

											<div className="w-full max-w-sm rounded-2xl border border-primary/15 bg-primary/5 p-4">
												<div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
													Customer Impact
												</div>
												<p className="mt-2 text-sm leading-6 text-foreground/85">
													{entry.customerImpact}
												</p>
											</div>
										</div>

										<ul className="mt-6 space-y-3">
											{entry.items.map((item) => (
												<li key={item} className="flex items-start gap-3 text-sm leading-6 text-foreground/85">
													<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
													<span>{item}</span>
												</li>
											))}
										</ul>
									</article>
								))}
							</div>
						</section>
					))}
				</div>
			</div>
		</div>
	);
}

export default ChangelogPage;
