import { SEOMeta } from '../components/SEOMeta';

type ChangeCategory = 'Added' | 'Improved' | 'Fixed' | 'Security' | 'Infra';

type ChangelogEntry = {
	date: string;
	title: string;
	category: ChangeCategory;
	summary: string;
	customerImpact: string;
	items: string[];
	isMajor?: boolean;
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
	{
		label: 'February 2026 Roundup',
		timeframe: 'February 2026',
		overview:
			'February focused on hardening the scanning pipeline, expanding analytics, and making the dashboard more useful for teams who depend on KoreShield in daily operations.',
		stats: [
			{ label: 'Curated updates', value: '7' },
			{ label: 'Security upgrades', value: '3' },
			{ label: 'Dashboard improvements', value: '3' },
		],
		entries: [
			{
				date: '2026-02-10',
				title: 'v0.3.0: Web Platform & Dashboard Launch',
				isMajor: true,
				category: 'Added',
				summary:
					'The KoreShield hosted web platform launched with a comprehensive monitoring and management dashboard, marking the transition from API-only to a fully integrated product.',
				customerImpact:
					'Customers can now monitor threats, manage API keys, audit activity, and test policies through a dedicated dashboard, with no custom tooling required.',
				items: [
					'Live Threat Monitoring: real-time threat detection and visualization across all protected endpoints.',
					'Provider Health Dashboard: monitor LLM provider status and performance.',
					'API Key Management: secure key rotation and access control.',
					'Audit Logs: complete compliance and activity tracking.',
					'Interactive Playground: test and validate security policies.',
				],
			},
			{
				date: '2026-02-27',
				title: 'Advanced analytics now surfaces per-endpoint threat breakdowns',
				category: 'Added',
				summary:
					'The analytics section was extended so operators can drill into threat patterns at the endpoint level, not just the account level.',
				customerImpact:
					'Teams can now identify which specific API endpoints or application surfaces are generating the most security events.',
				items: [
					'Added per-endpoint request volume and threat-rate breakdowns.',
					'Introduced time-series views for blocked vs. flagged requests per endpoint.',
					'Improved filtering to scope analytics by endpoint, provider, and policy.',
				],
			},
			{
				date: '2026-02-25',
				title: 'RAG scan evidence is now surfaced in the dashboard',
				category: 'Improved',
				summary:
					'Operators can now see exactly which retrieved documents triggered a RAG security signal, rather than seeing a binary block result.',
				customerImpact:
					'Security teams get actionable attribution when KoreShield flags a RAG retrieval flow, making it easier to tune policies and explain decisions.',
				items: [
					'Added document-level evidence cards to RAG scan results in the dashboard.',
					'Improved scan result payloads to include chunk index and retrieval score context.',
					'Expanded audit log entries for RAG events with evidence references.',
				],
			},
			{
				date: '2026-02-20',
				title: 'Prompt injection detector expanded with evasion patterns',
				category: 'Security',
				summary:
					'The prompt injection detector was updated with a broader pattern corpus targeting obfuscation, role override, and context manipulation evasion techniques.',
				customerImpact:
					'KoreShield catches more sophisticated injection attempts that use encoding, synonym substitution, or multi-step manipulation to bypass simpler detectors.',
				items: [
					'Added detection patterns for Base64-encoded instruction injection.',
					'Improved role-override detection to cover persona and instruction-reversal attacks.',
					'Expanded context manipulation heuristics for multi-turn evasion chains.',
				],
			},
			{
				date: '2026-02-14',
				title: 'Policy engine now supports threshold-based alert suppression',
				category: 'Improved',
				summary:
					'Policies can now be configured with alert suppression thresholds so operators are not overwhelmed by high-volume, low-severity signals.',
				customerImpact:
					'Teams operating at scale can filter out alert noise while maintaining full scan coverage and audit trail completeness.',
				items: [
					'Added per-policy minimum severity and rate thresholds for alert delivery.',
					'Improved policy configuration UI to expose suppression controls.',
					'Maintained full audit log retention even for suppressed alerts.',
				],
			},
			{
				date: '2026-02-08',
				title: 'Provider health visibility extended to latency percentiles',
				category: 'Added',
				summary:
					'The provider health section now shows p50, p95, and p99 response-time distributions in addition to error rates.',
				customerImpact:
					'Teams running latency-sensitive AI workloads can now see tail latency behavior per provider without exporting data to an external APM tool.',
				items: [
					'Added p50, p95, and p99 latency charts to provider health cards.',
					'Improved error-rate displays to differentiate timeout errors from authentication failures.',
					'Connected provider health data to the alert system so latency spikes can trigger Telegram notifications.',
				],
			},
			{
				date: '2026-02-03',
				title: 'Team invite and permission management shipped',
				category: 'Added',
				summary:
					'KoreShield now supports multi-member teams with role-based access so administrators can invite colleagues and assign permissions without sharing credentials.',
				customerImpact:
					'Security and engineering teams can collaborate inside the dashboard with appropriate access boundaries instead of sharing a single account.',
				items: [
					'Added team invite flow with email-based onboarding.',
					'Introduced role assignments for Admin, Developer, and Viewer access levels.',
					'Improved team management page with member listing, role editing, and revocation.',
				],
			},
		],
	},
	{
		label: 'January 2026 Roundup',
		timeframe: 'January 2026',
		overview:
			'January established the foundation for the hosted platform: authentication, the initial dashboard, API key management, and the first real scan pipeline wired end-to-end.',
		stats: [
			{ label: 'Curated updates', value: '5' },
			{ label: 'Foundation features', value: '4' },
			{ label: 'Security improvements', value: '2' },
		],
		entries: [
			{
				date: '2026-01-28',
				title: 'Dashboard shell and core navigation went live',
				category: 'Added',
				summary:
					'The authenticated dashboard shell launched with sidebar navigation, theme switching, and a persistent layout for the metrics, alerts, policies, and settings sections.',
				customerImpact:
					'Customers can now log into a real product interface instead of interacting with KoreShield only through the API.',
				items: [
					'Launched the authenticated app shell with route-based navigation.',
					'Added dark and light theme support with persistent preference storage.',
					'Introduced the dashboard metrics overview page with live protected-request counts.',
				],
			},
			{
				date: '2026-01-24',
				title: 'API key management available in the dashboard',
				category: 'Added',
				summary:
					'Customers can now create, name, rotate, and revoke server API keys directly from the dashboard without making raw API calls.',
				customerImpact:
					'Integration is faster and safer because teams no longer need to share raw tokens out of band to onboard new services.',
				items: [
					'Added API key creation with optional name and expiry.',
					'Introduced key revocation and rotation from the dashboard.',
					'Improved key listing with last-used timestamps and scope labels.',
				],
			},
			{
				date: '2026-01-18',
				title: 'Prompt scan pipeline wired end-to-end',
				category: 'Security',
				summary:
					'The core prompt screening pipeline, from request receipt through detector evaluation to audit log write and policy decision, was completed and validated in a staging environment.',
				customerImpact:
					'KoreShield can now intercept, evaluate, and enforce policy on real AI requests rather than running synthetic simulations.',
				items: [
					'Completed the synchronous scan path from API ingress to policy enforcement.',
					'Added audit log writes for every scan decision with full detector payloads.',
					'Validated the pipeline under realistic throughput on a staging cluster.',
				],
			},
			{
				date: '2026-01-12',
				title: 'JWT authentication and user registration completed',
				category: 'Security',
				summary:
					'The user authentication system was completed with registration, login, JWT issuance, and refresh token handling.',
				customerImpact:
					'Customers can create and manage accounts with proper session security instead of relying on long-lived static tokens.',
				items: [
					'Completed registration, login, and logout flows with JWT and refresh tokens.',
					'Added email verification step to the signup flow.',
					'Implemented token expiry, rotation, and revocation on logout.',
				],
			},
			{
				date: '2026-01-05',
				title: 'Public marketing site launched',
				category: 'Added',
				summary:
					'The public KoreShield website launched with the landing page, pricing page, documentation links, and basic contact flow.',
				customerImpact:
					'Prospective customers can evaluate KoreShield, compare plans, and start the signup process without needing a direct introduction.',
				items: [
					'Launched landing page with feature overview and integration code samples.',
					'Published pricing page with plan comparisons and FAQ.',
					'Added contact and support channels with email routing.',
				],
			},
		],
	},
	{
		label: 'December 2025 Roundup',
		timeframe: 'December 2025',
		overview:
			'December was the initial build sprint: infrastructure setup, the backend framework, the first detector implementations, and the foundational architecture that KoreShield runs on today.',
		stats: [
			{ label: 'Curated updates', value: '5' },
			{ label: 'Infrastructure milestones', value: '3' },
			{ label: 'Core features shipped', value: '2' },
		],
		entries: [
			{
				date: '2025-12-31',
				title: 'v0.2.0: Research Paper Preprint Release',
				isMajor: true,
				category: 'Added',
				summary:
					'KoreShield published a comprehensive research preprint on LLM security and indirect prompt injection taxonomy, establishing the theoretical foundation for the platform\'s detection approach.',
				customerImpact:
					'The published framework gives customers and prospects a rigorous, peer-reviewed basis for evaluating KoreShield\'s security model.',
				items: [
					'Released preprint: "LLM Firewall: A Novel Taxonomy of Indirect Prompt Injection Attacks in Enterprise RAG Systems".',
					'Introduced the 5-dimensional threat classification framework underpinning KoreShield\'s detectors.',
					'Documented attack vectors and defense mechanisms with empirical analysis.',
					'Published on Academia.edu for open peer review.',
				],
			},
			{
				date: '2025-12-28',
				title: 'Production infrastructure provisioned on VPS with Caddy and Docker',
				category: 'Infra',
				summary:
					'The production environment was provisioned with a Docker Compose stack, Caddy reverse proxy with automatic TLS, PostgreSQL, and Redis, ready for the first real deployment.',
				customerImpact:
					'KoreShield has a stable, self-hosted production foundation with HTTPS and proper service isolation from day one.',
				items: [
					'Set up Docker Compose production stack with API, web, database, and cache services.',
					'Configured Caddy for automatic TLS with HTTPS routing for koreshield.ai and api.koreshield.ai.',
					'Provisioned PostgreSQL with persistent volumes and Redis for session and rate-limit storage.',
				],
			},

			{
				date: '2025-12-22',
				title: 'First detector implementations: prompt injection and PII leakage',
				category: 'Security',
				summary:
					'The first two production-grade security detectors landed: a prompt injection classifier and a PII leakage detector covering common personal data patterns.',
				customerImpact:
					'KoreShield can intercept prompt injection attacks and flag responses that might expose personal information from the first integration.',
				items: [
					'Implemented baseline prompt injection detector with pattern matching and heuristic scoring.',
					'Added PII leakage detector covering email, phone, SSN, and credit card patterns.',
					'Integrated both detectors into the scan pipeline with configurable severity thresholds.',
				],
			},
			{
				date: '2025-12-16',
				title: 'Backend API framework and database schema established',
				category: 'Added',
				summary:
					'The Python backend was built on FastAPI with the initial database schema, migration tooling, and health check infrastructure that all subsequent features are layered on top of.',
				customerImpact:
					'KoreShield\'s backend is structured for extensibility and production reliability from the start, not retrofitted later.',
				items: [
					'Bootstrapped FastAPI application with structured routing and middleware.',
					'Designed and migrated initial database schema covering users, scans, policies, and audit logs.',
					'Added Alembic for versioned database migrations and health check endpoints.',
				],
			},
			{
				date: '2025-12-08',
				title: 'KoreShield project initiated and monorepo structure set up',
				category: 'Added',
				summary:
					'The KoreShield monorepo was created with the initial project structure for the backend API, web frontend, Python SDK, JavaScript SDK, documentation site, and blog.',
				customerImpact:
					'All KoreShield components share a single versioned repository, making it straightforward for contributors and integrations to stay aligned.',
				items: [
					'Created monorepo with koreshield (API), koreshield-web (frontend), koreshield-python-sdk, koreshield-js-sdk, koreshield-docs, and koreshield-blog.',
					'Set up shared tooling including linting, formatting, and CI configuration.',
					'Defined core architectural principles: scan-first, provider-agnostic, policy-driven.',
				],
			},
		],
	},
	{
		label: 'November 2025 Roundup',
		timeframe: 'November 2025',
		overview:
			'November marked the public launch of KoreShield with its first stable release: multi-provider LLM support, real-time prompt injection detection, and foundational SDK integrations.',
		stats: [
			{ label: 'Curated updates', value: '1' },
			{ label: 'Launch milestones', value: '1' },
		],
		entries: [
			{
				date: '2025-11-15',
				title: 'v0.1.0: Initial Release',
				isMajor: true,
				category: 'Added',
				summary:
					'KoreShield\'s first public release shipped with core LLM security features: multi-provider support, real-time prompt injection detection, Python and JavaScript SDKs, basic RAG context scanning, and Docker-based deployment.',
				customerImpact:
					'Developers can immediately protect LLM applications across OpenAI, Anthropic, and DeepSeek with a drop-in SDK, with no infrastructure changes required.',
				items: [
					'Multi-provider LLM support: OpenAI, Anthropic, and DeepSeek out of the box.',
					'Real-time prompt injection detection on every request.',
					'Python and JavaScript SDKs published for easy integration.',
					'Basic RAG context scanning to catch retrieved-document abuse.',
					'Docker-based deployment for self-hosted production use.',
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
													{entry.isMajor && (
														<span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black">
															Major
														</span>
													)}
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
