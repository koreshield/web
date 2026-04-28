import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { authService } from '../lib/auth';
import {
	type BillingInterval,
	type PublicPlanId,
	PRICING_FAQS,
	PRICING_PLANS,
} from '../lib/pricing';
import { SEOConfig } from '../lib/seo-config';

const enterprisePlan = PRICING_PLANS.find((plan) => plan.id === 'enterprise');
const standardPlans = PRICING_PLANS.filter((plan) => plan.id !== 'enterprise');

const pricingStats = [
	{
		value: '$2.4M',
		label: 'Avg. AI breach cost',
		sub: 'IBM, 2025',
	},
	{
		value: 'Under 50ms',
		label: 'Latency overhead',
		sub: 'Inspection without slowdown',
	},
	{
		value: 'Zero-log',
		label: 'By default',
		sub: 'Nothing retained unless configured',
	},
	{
		value: '1 URL',
		label: 'Change required',
		sub: 'No code rewrite. Under 30 minutes.',
	},
];

export default function PricingPage() {
	const navigate = useNavigate();
	const [billingPeriod, setBillingPeriod] = useState<BillingInterval>('monthly');
	const [openFaq, setOpenFaq] = useState<number | null>(null);

	const handlePlanAction = (planId: PublicPlanId) => {
		if (planId === 'free') {
			navigate('/signup?plan=free');
			return;
		}

		const target = `/billing?plan=${encodeURIComponent(planId)}&period=${encodeURIComponent(billingPeriod)}&checkout=1`;
		if (authService.isAuthenticated()) {
			navigate(target);
			return;
		}

		navigate(`/signup?plan=${encodeURIComponent(planId)}&period=${encodeURIComponent(billingPeriod)}`);
	};

	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<SEOMeta {...SEOConfig.pricing} />

			{/* ── Hero ─────────────────────────────────────────────────────── */}
			<section className="px-4 pt-20 pb-0">
				<div className="mx-auto max-w-4xl text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<p className="mx-auto mb-6 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
							Platform fee plus protected usage
						</p>
						<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
							The firewall every LLM deployment is missing.
						</h1>
						<p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
							One URL change. Zero-log by default. Koreshield inspects every request and response before it completes, without touching your codebase.
						</p>
						<p className="mt-3 text-sm text-muted-foreground">
							Compatible with OpenAI, Anthropic, Gemini, and DeepSeek. Public SDK on PyPI and npm.
						</p>

						<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
							<Link
								to="/signup?plan=free"
								className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-semibold text-white transition-colors hover:bg-emerald-500"
							>
								Start for free
								<ArrowRight className="h-4 w-4" />
							</Link>
							<Link
								to="/demo"
								className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 font-semibold transition-colors hover:bg-muted"
							>
								Book a demo
							</Link>
						</div>

						<div className="mt-10 flex items-center justify-center gap-4">
							<span className={`text-base font-medium ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
								Monthly
							</span>
							<button
								type="button"
								onClick={() => setBillingPeriod((current) => (current === 'monthly' ? 'annual' : 'monthly'))}
								className="relative h-8 w-16 rounded-full border border-border bg-muted"
								aria-label="Toggle annual pricing"
							>
								<motion.div
									className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full border-2 border-electric-green bg-white shadow-lg"
									animate={{ x: billingPeriod === 'annual' ? 30 : 0 }}
									transition={{ type: 'spring', stiffness: 500, damping: 30 }}
								/>
							</button>
							<span className={`text-base font-medium ${billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
								Annual <span className="ml-2 text-sm font-semibold text-electric-green">Save 20%</span>
							</span>
						</div>
					</motion.div>
				</div>
			</section>

			{/* ── Stats bar ────────────────────────────────────────────────── */}
			<section className="mt-14 border-y border-border/50 bg-muted/20 py-10 px-4">
				<div className="mx-auto max-w-5xl">
					<div className="grid grid-cols-2 gap-6 md:grid-cols-4">
						{pricingStats.map((stat, i) => (
							<motion.div
								key={stat.label}
								initial={{ opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: i * 0.07 }}
								className="flex flex-col items-center text-center"
							>
								<span className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
									{stat.value}
								</span>
								<span className="mt-1 text-sm font-semibold text-foreground/80">{stat.label}</span>
								<span className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</span>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ── Pricing model explanation + plan cards ───────────────────── */}
			<section className="px-4 py-16">
				<div className="mx-auto max-w-7xl space-y-8">

					{/* Model explanation */}
					<div className="text-center">
						<h2 className="text-3xl font-bold">You pay for what you protect. Nothing more.</h2>
						<p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
							Most security tools charge per seat. Koreshield charges per protected request: a fixed monthly block with predictable overage pricing. Your costs scale with your AI traffic, not your headcount.
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							Paid plans include collaborative access for product, security, and engineering teams. Annual plans save 20%.
						</p>
					</div>

					{/* Standard plan cards */}
					<div className="grid gap-6 md:grid-cols-3">
						{standardPlans.map((plan, index) => {
							const price = billingPeriod === 'annual' && plan.annualPriceLabel ? plan.annualPriceLabel : plan.monthlyPriceLabel;
							const periodLabel = plan.id === 'free'
								? '/month'
								: billingPeriod === 'annual'
									? '/year'
									: '/month';

							return (
								<motion.article
									key={plan.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.45, delay: index * 0.08 }}
									className={`flex h-full flex-col rounded-3xl border bg-card p-8 shadow-lg ${plan.popular ? 'border-electric-green shadow-emerald-500/10' : 'border-border'}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<h3 className="text-2xl font-bold">{plan.name}</h3>
											<p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
										</div>
										{plan.badge ? (
											<span className="rounded-full bg-electric-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-electric-green whitespace-nowrap">
												{plan.badge}
											</span>
										) : null}
									</div>

									<div className="mt-6">
										<div className="flex items-end gap-2">
											<span className="text-4xl font-bold">{price}</span>
											<span className="pb-1 text-muted-foreground">{periodLabel}</span>
										</div>
										{billingPeriod === 'annual' && plan.annualSavingsLabel ? (
											<p className="mt-2 text-sm font-medium text-electric-green">{plan.annualSavingsLabel}</p>
										) : null}
									</div>

									<div className="mt-6 rounded-2xl bg-muted p-4">
										<div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Included usage</div>
										<div className="mt-2 text-base font-semibold">{plan.includedRequests}</div>
										<div className="mt-1 text-sm text-muted-foreground">{plan.retention}</div>
										{plan.overage ? <div className="mt-3 text-sm text-foreground/80">{plan.overage}</div> : null}
									</div>

									<ul className="mt-6 flex-1 space-y-3">
										{plan.features.map((feature) => (
											<li key={feature} className="flex items-start gap-3 text-sm text-foreground/85">
												<svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-electric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
												</svg>
												<span>{feature}</span>
											</li>
										))}
										{plan.limitations?.map((feature) => (
											<li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
												<svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
												</svg>
												<span>{feature}</span>
											</li>
										))}
									</ul>

									<button
										type="button"
										onClick={() => handlePlanAction(plan.id)}
										className={`mt-8 rounded-xl px-6 py-3 font-semibold transition-colors ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-border bg-background hover:bg-muted'}`}
									>
										{plan.cta}
									</button>
								</motion.article>
							);
						})}
					</div>

					{/* Enterprise */}
					<motion.div
						id="contact-sales"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45, delay: 0.3 }}
						className="rounded-3xl border border-primary/25 bg-card p-8 shadow-lg"
					>
						<div className="flex flex-col gap-8 lg:flex-row lg:items-center">
							<div className="flex-1">
								<div className="flex items-center gap-3">
									<span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Enterprise</span>
									<span className="text-xs text-muted-foreground">Special case, scoped to your requirements</span>
								</div>
								<h2 className="mt-4 text-2xl font-bold tracking-tight">{enterprisePlan?.description}</h2>
								<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
									We scope Enterprise around your protected-request volume, security requirements, identity stack, deployment model, retention needs, and support expectations.
								</p>
							</div>

							<div className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:w-56 xl:flex-row xl:w-auto">
								<div className="rounded-2xl border border-border bg-muted/60 p-5 sm:flex-1 lg:flex-none xl:flex-1">
									<div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">From</div>
									<div className="mt-1 text-3xl font-bold">{billingPeriod === 'annual' ? enterprisePlan?.annualPriceLabel : enterprisePlan?.monthlyPriceLabel}</div>
									<div className="mt-1 text-xs text-muted-foreground">{billingPeriod === 'annual' ? '/year, annual contract' : '/month, custom agreement'}</div>
								</div>
								<div className="rounded-2xl border border-border bg-muted/60 p-5 sm:flex-1 lg:flex-none xl:flex-1">
									<div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Included usage</div>
									<div className="mt-1 text-base font-semibold">{enterprisePlan?.includedRequests}</div>
									<div className="mt-1 text-xs text-muted-foreground">£12 per extra 100,000 protected requests</div>
								</div>
							</div>

							<div className="flex flex-col gap-4 lg:w-64">
								<ul className="space-y-2">
									{enterprisePlan?.features.map((feature) => (
										<li key={feature} className="flex items-start gap-2 text-sm text-foreground/85">
											<svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-electric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
											<span>{feature}</span>
										</li>
									))}
								</ul>
								<div className="flex flex-col gap-2 pt-2">
									<Link
										to="/demo"
										className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
									>
										Get a scoped quote
										<ArrowRight className="h-4 w-4" />
									</Link>
									<a
										href="mailto:hello@koreshield.com?subject=Enterprise%20plan%20enquiry"
										className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
									>
										<Mail className="h-3.5 w-3.5" />
										Email us directly
									</a>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			{/* ── Category callout ─────────────────────────────────────────── */}
			<section className="px-4 py-16 bg-muted/30">
				<div className="mx-auto max-w-4xl text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<h2 className="text-3xl font-bold tracking-tight md:text-4xl">
							The attack surface is growing faster than your security stack.
						</h2>
						<div className="mt-6 space-y-3 text-muted-foreground text-base leading-relaxed text-left max-w-3xl mx-auto">
							<p>Most teams are shipping LLMs into production with nothing between their app and the model. Prompt injection is the most exploited vulnerability in production LLM systems. The average cost of an AI-related data breach is $2.4M. Fewer than 35% of organisations have any dedicated LLM defence deployed. Agentic AI is the fastest-growing deployment pattern, and it is expanding the attack surface faster than most security teams can respond.</p>
							<p>Koreshield is an independent LLM security proxy, built by engineers who operated inside this problem before it had a product category. No legacy vendor roadmap. No multi-month implementation. No lock-in.</p>
						</div>
						<div className="mt-8">
							<Link
								to="/why-koreshield"
								className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 font-semibold transition-colors hover:bg-muted"
							>
								Read how it works
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</motion.div>
				</div>
			</section>

			{/* ── Feature gate table ───────────────────────────────────────── */}
			<section className="px-4 py-16">
				<div className="mx-auto max-w-7xl">
					<h2 className="text-center text-3xl font-bold">Feature gates by plan</h2>
					<div className="mt-10 overflow-x-auto rounded-3xl border border-border bg-card">
						<table className="w-full min-w-[760px]">
							<thead>
								<tr className="border-b border-border">
									<th className="p-4 text-left font-semibold">Capability</th>
									<th className="p-4 text-center font-semibold">Free</th>
									<th className="p-4 text-center font-semibold">Growth</th>
									<th className="p-4 text-center font-semibold">Scale</th>
									<th className="p-4 text-center font-semibold">Enterprise</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border text-sm">
								{[
									['Protected requests included', '10,000', '100,000', '1,000,000', 'Custom'],
									['Prompt and RAG screening', 'Baseline', 'Advanced', 'Advanced', 'Advanced + custom tuning'],
									['Teams', 'Basic', 'Included', 'Included', 'Included'],
									['Policies and alerts', 'Baseline', 'Included', 'Included', 'Included'],
									['Basic reports', 'N/A', 'Included', 'Included', 'Included'],
									['RBAC and audit logs', 'N/A', 'N/A', 'Included', 'Included'],
									['Advanced analytics and provider health', 'N/A', 'N/A', 'Included', 'Included'],
									['SSO / SAML', 'N/A', 'N/A', 'N/A', 'Included'],
									['SIEM export and custom retention', 'N/A', 'N/A', 'N/A', 'Included'],
									['Private or self-hosted deployment', 'N/A', 'N/A', 'N/A', 'Included'],
								].map(([label, dev, growth, scale, enterprise]) => (
									<tr key={label}>
										<td className="p-4 font-medium text-foreground/85">{label}</td>
										<td className="p-4 text-center text-muted-foreground">{dev}</td>
										<td className="p-4 text-center text-muted-foreground">{growth}</td>
										<td className="p-4 text-center text-muted-foreground">{scale}</td>
										<td className="p-4 text-center text-muted-foreground">{enterprise}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* ── FAQ ──────────────────────────────────────────────────────── */}
			<section className="bg-muted/20 px-4 py-16" id="faq">
				<div className="mx-auto max-w-4xl">
					<h2 className="text-center text-3xl font-bold">Frequently asked questions</h2>
					<div className="mt-10 space-y-4">
						{PRICING_FAQS.map((faq, index) => (
							<div key={faq.question} className="rounded-2xl border border-border bg-card">
								<button
									type="button"
									onClick={() => setOpenFaq((current) => (current === index ? null : index))}
									className="flex w-full items-center justify-between gap-4 p-6 text-left"
								>
									<span className="font-semibold">{faq.question}</span>
									<span className={`text-muted-foreground transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>⌄</span>
								</button>
								{openFaq === index ? (
									<div className="px-6 pb-6 text-muted-foreground">
										{faq.answer}
									</div>
								) : null}
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
