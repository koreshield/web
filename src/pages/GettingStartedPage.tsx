import { ArrowRight, BookOpen, CreditCard, Key, ScanSearch, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
	{
		title: 'Create a server credential',
		description: 'Generate an API key for your backend, worker, or gateway. Browser sessions are for dashboard access only.',
		href: '/settings/api-keys',
		icon: Key,
		linkLabel: 'Open API keys',
	},
	{
		title: 'Point your app at KoreShield',
		description: 'Send chat traffic to /v1/chat/completions and document scans to /v1/rag/scan or /v1/scan.',
		href: '/docs/getting-started/quick-start',
		icon: Shield,
		linkLabel: 'Read integration docs',
		external: true,
	},
	{
		title: 'Set your security baseline',
		description: 'Review policies, rules, alerts, and provider health so the first customer workload starts with clear controls.',
		href: '/policies',
		icon: ScanSearch,
		linkLabel: 'Configure policies',
	},
	{
		title: 'Invite the right people',
		description: 'Use teams and role-based pages so engineering, security, and operations can share ownership safely.',
		href: '/teams',
		icon: Users,
		linkLabel: 'Manage teams',
	},
	{
		title: 'Verify billing and plan scope',
		description: 'Hosted customers should complete checkout and sync billing before onboarding production traffic.',
		href: '/billing',
		icon: CreditCard,
		linkLabel: 'Open billing',
	},
];

export default function GettingStartedPage() {
	return (
		<div>
			<header className="border-b border-border bg-card">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Client onboarding</p>
					<h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">How clients actually use KoreShield</h1>
					<p className="mt-3 max-w-3xl text-xs sm:text-sm text-muted-foreground">
						KoreShield sits between your application and your model provider. Clients sign into the dashboard to manage access,
						policies, billing, and teams, then their server-side application sends protected traffic through the KoreShield API.
					</p>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
				<section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
					<div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
						<div className="text-sm font-semibold text-foreground">Dashboard users</div>
						<p className="mt-2 text-xs sm:text-sm text-muted-foreground">
							Use secure cookie sessions for the admin UI, account lifecycle, billing, API key management, and operational visibility.
						</p>
					</div>
					<div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
						<div className="text-sm font-semibold text-foreground">Server integrations</div>
						<p className="mt-2 text-xs sm:text-sm text-muted-foreground">
							Use generated API keys or a bearer token from your server-to-server environment. Do not put these credentials in the browser.
						</p>
					</div>
					<div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
						<div className="text-sm font-semibold text-foreground">Core traffic path</div>
						<p className="mt-2 text-xs sm:text-sm text-muted-foreground">
							Route prompt traffic through <code>/v1/chat/completions</code>, prompt checks through <code>/v1/scan</code>, and retrieved documents through <code>/v1/rag/scan</code>.
						</p>
					</div>
				</section>

				<section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
					<h2 className="text-lg sm:text-xl font-semibold">Onboarding checklist</h2>
					<p className="mt-2 text-xs sm:text-sm text-muted-foreground">
						The shortest path to value is: create one API key, make one successful protected request, then prove a malicious prompt or retrieved document gets flagged.
					</p>
					<div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
						{steps.map((step, index) => {
							const Icon = step.icon;
							const content = (
								<div className="rounded-xl border border-border p-4 sm:p-5 hover:border-primary/40 transition-colors h-full">
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
											{index + 1}
										</div>
										<Icon className="w-5 h-5 text-primary flex-shrink-0" />
									</div>
									<h3 className="mt-4 font-semibold text-sm sm:text-base">{step.title}</h3>
									<p className="mt-2 text-xs sm:text-sm text-muted-foreground">{step.description}</p>
									<div className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-primary">
										{step.linkLabel}
										<ArrowRight className="w-4 h-4" />
									</div>
								</div>
							);

							if (step.external) {
								return (
									<a key={step.title} href={step.href} target="_blank" rel="noreferrer">
										{content}
									</a>
								);
							}

							return (
								<Link key={step.title} to={step.href}>
									{content}
								</Link>
							);
						})}
					</div>
				</section>

				<section className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-[1.1fr,0.9fr]">
					<div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
						<h2 className="text-lg sm:text-xl font-semibold">Minimal integration example</h2>
						<p className="mt-2 text-xs sm:text-sm text-muted-foreground">
							This is the shape clients should understand first: point the OpenAI-compatible client at KoreShield and keep the real credential server-side.
						</p>
						<pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-3 sm:p-4 text-[10px] sm:text-xs leading-6">
{`import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.koreshield.com/v1',
  apiKey: process.env.KORESHIELD_API_KEY,
});

const response = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Summarize the attached customer notes.' },
  ],
});`}
						</pre>
					</div>

					<div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
						<h2 className="text-lg sm:text-xl font-semibold">Useful next pages</h2>
						<div className="mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm">
							<Link to="/dashboard" className="block rounded-lg border border-border p-3 sm:p-4 hover:border-primary/40 transition-colors">
								Dashboard
								<div className="mt-1 text-muted-foreground">Live request totals, threat history, and first-run getting-started banner.</div>
							</Link>
							<Link to="/audit-logs" className="block rounded-lg border border-border p-3 sm:p-4 hover:border-primary/40 transition-colors">
								Audit logs
								<div className="mt-1 text-muted-foreground">Review blocked prompts, runtime decisions, and operator actions.</div>
							</Link>
							<Link to="/provider-health" className="block rounded-lg border border-border p-3 sm:p-4 hover:border-primary/40 transition-colors">
								Provider health
								<div className="mt-1 text-muted-foreground">See whether the connected model providers are healthy before routing real traffic.</div>
							</Link>
						</div>
						<div className="mt-4 sm:mt-6 flex items-start sm:items-center gap-2 text-xs sm:text-sm text-muted-foreground">
							<BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
							Need the public docs too? <Link to="/docs" className="text-primary hover:underline">Open the docs</Link>
						</div>
						<p className="mt-4 text-[10px] sm:text-xs text-muted-foreground">
							Reports and tenant-level analytics may be limited to admin users. They are follow-up operator tools, not blockers for the first customer integration.
						</p>
					</div>
				</section>
			</main>
		</div>
	);
}
