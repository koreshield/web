import emailjs from '@emailjs/browser';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { useToast } from '../components/ToastNotification';
import { authService } from '../lib/auth';
import {
	type BillingInterval,
	type PublicPlanId,
	PRICING_FAQS,
	PRICING_PLANS,
} from '../lib/pricing';
import { SEOConfig } from '../lib/seo-config';

const enterprisePlan = PRICING_PLANS.find((plan) => plan.id === 'enterprise');
const freePlan = PRICING_PLANS.find((plan) => plan.id === 'free');
const guardedEmailJsConfig = {
	serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined,
	templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined,
	publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined,
};

export default function PricingPage() {
	const navigate = useNavigate();
	const [billingPeriod, setBillingPeriod] = useState<BillingInterval>('monthly');
	const [openFaq, setOpenFaq] = useState<number | null>(null);

	const handlePlanAction = (planId: PublicPlanId) => {
		if (planId === 'free') {
			navigate('/signup?plan=free');
			return;
		}

		if (planId === 'enterprise') {
			document.getElementById('contact-sales')?.scrollIntoView({ behavior: 'smooth' });
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

			<section className="px-4 py-20">
				<div className="mx-auto max-w-7xl text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<p className="mx-auto mb-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
							Platform fee plus protected usage
						</p>
						<h1 className="text-5xl font-bold tracking-tight md:text-7xl">
							Secure every AI request before it reaches the model.
						</h1>
						<p className="mx-auto mt-6 max-w-4xl text-lg text-muted-foreground md:text-2xl">
							KoreShield pricing scales with protected requests, not seats. Start free, ship fast, and upgrade as your AI traffic, governance, and retention needs grow.
						</p>

						<div className="mt-10 flex items-center justify-center gap-4">
							<span className={`text-lg font-medium ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
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
							<span className={`text-lg font-medium ${billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
								Annual <span className="ml-2 text-sm font-semibold text-electric-green">Save 20%</span>
							</span>
						</div>

						<div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground sm:flex-row">
							<span>1 protected request = 1 screened AI interaction routed through KoreShield.</span>
							<span className="hidden sm:inline">•</span>
							<span>Standard RAG scans are bundled fairly per request.</span>
						</div>
					</motion.div>
				</div>
			</section>

			<section className="px-4 pb-10">
				<div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr,1.1fr]">
					<div className="rounded-3xl border border-primary/20 bg-primary/5 p-8">
						<h2 className="text-2xl font-bold">Why this model fits KoreShield</h2>
						<p className="mt-4 text-muted-foreground">
							KoreShield is priced around security per AI transaction. You pay a fixed platform fee, get a block of protected requests each month, and only pay overages as your protected traffic grows.
						</p>
						<ul className="mt-6 space-y-3 text-sm text-foreground/85">
							<li>Protected requests are the primary meter, not seats or model tokens.</li>
							<li>Paid plans include collaborative access for product, security, and engineering teams.</li>
							<li>Enterprise reserves SSO, SIEM export, private deployment, custom retention, SLA, and onboarding support.</li>
							<li>Annual plans use a flat 20% discount for easier forecasting.</li>
						</ul>
					</div>

					<div className="grid gap-6 md:grid-cols-3">
						{PRICING_PLANS.map((plan, index) => {
							const price = billingPeriod === 'annual' && plan.annualPriceLabel ? plan.annualPriceLabel : plan.monthlyPriceLabel;
							const periodLabel = plan.id === 'enterprise'
								? billingPeriod === 'annual'
									? '/year'
									: '/month'
								: plan.id === 'free'
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
											<p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
										</div>
										{plan.badge ? (
											<span className="rounded-full bg-electric-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-electric-green">
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
				</div>
			</section>

			<section className="bg-muted/30 px-4 py-20">
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
									['Basic reports', '—', 'Included', 'Included', 'Included'],
									['RBAC and audit logs', '—', '—', 'Included', 'Included'],
									['Advanced analytics and provider health', '—', '—', 'Included', 'Included'],
									['SSO / SAML', '—', '—', '—', 'Included'],
									['SIEM export and custom retention', '—', '—', '—', 'Included'],
									['Private or self-hosted deployment', '—', '—', '—', 'Included'],
								].map(([label, free, growth, scale, enterprise]) => (
									<tr key={label}>
										<td className="p-4 font-medium text-foreground/85">{label}</td>
										<td className="p-4 text-center text-muted-foreground">{free}</td>
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

			<section className="px-4 py-20" id="faq">
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

			<section className="bg-muted/40 px-4 py-20" id="contact-sales">
				<div className="mx-auto max-w-2xl">
					<div className="mb-12 text-center">
						<h2 className="text-3xl font-bold tracking-tight">Talk to the team</h2>
						<p className="mt-4 text-muted-foreground">
							Tell us your stack, your expected protected request volume, and your governance requirements. We will help you choose the right hosted or enterprise path.
						</p>
					</div>
					<ContactSalesForm />
				</div>
			</section>
		</div>
	);
}

function ContactSalesForm() {
	const toast = useToast();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		company: '',
		tier: 'scale',
		message: '',
	});

	const emailAvailable =
		Boolean(guardedEmailJsConfig.serviceId) &&
		Boolean(guardedEmailJsConfig.templateId) &&
		Boolean(guardedEmailJsConfig.publicKey);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setLoading(true);

		const payload = {
			name: formData.name,
			email: formData.email,
			company: formData.company,
			tier: formData.tier,
			message: formData.message,
		};

		try {
			if (!emailAvailable) {
				throw new Error('Sales email integration is not configured in this environment. Please email hello@koreshield.com directly.');
			}

			await emailjs.send(
				guardedEmailJsConfig.serviceId!,
				guardedEmailJsConfig.templateId!,
				payload,
				guardedEmailJsConfig.publicKey!,
			);

			toast.success('Thanks for reaching out', 'The KoreShield team will follow up with the right hosted or enterprise path.');
			setFormData({
				name: '',
				email: '',
				company: '',
				tier: 'scale',
				message: '',
			});
		} catch (error: unknown) {
			const message = error instanceof Error
				? error.message
				: 'Something went wrong. Please email hello@koreshield.com directly.';
			toast.error('Unable to send', message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-xl">
			<div className="mb-6 grid gap-6 md:grid-cols-2">
				<div>
					<label htmlFor="pricing-name" className="mb-2 block text-sm font-medium text-foreground/80">
						Full name *
					</label>
					<input
						id="pricing-name"
						type="text"
						required
						value={formData.name}
						onChange={(event) => setFormData({ ...formData, name: event.target.value })}
						className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground transition-colors"
					/>
				</div>
				<div>
					<label htmlFor="pricing-email" className="mb-2 block text-sm font-medium text-foreground/80">
						Email address *
					</label>
					<input
						id="pricing-email"
						type="email"
						required
						value={formData.email}
						onChange={(event) => setFormData({ ...formData, email: event.target.value })}
						className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground transition-colors"
					/>
				</div>
			</div>

			<div className="mb-6 grid gap-6 md:grid-cols-2">
				<div>
					<label htmlFor="pricing-company" className="mb-2 block text-sm font-medium text-foreground/80">
						Company name *
					</label>
					<input
						id="pricing-company"
						type="text"
						required
						value={formData.company}
						onChange={(event) => setFormData({ ...formData, company: event.target.value })}
						className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground transition-colors"
					/>
				</div>
				<div>
					<label htmlFor="pricing-tier" className="mb-2 block text-sm font-medium text-foreground/80">
						Interested in
					</label>
					<select
						id="pricing-tier"
						value={formData.tier}
						onChange={(event) => setFormData({ ...formData, tier: event.target.value })}
						className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground transition-colors"
					>
						<option value={freePlan?.id}>Free</option>
						<option value="growth">Growth</option>
						<option value="scale">Scale</option>
						<option value={enterprisePlan?.id}>Enterprise</option>
						<option value="other">Just exploring</option>
					</select>
				</div>
			</div>

			<div className="mb-6">
				<label htmlFor="pricing-message" className="mb-2 block text-sm font-medium text-foreground/80">
					Tell us about your needs
				</label>
				<textarea
					id="pricing-message"
					rows={5}
					value={formData.message}
					onChange={(event) => setFormData({ ...formData, message: event.target.value })}
					className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground transition-colors"
					placeholder="Expected protected request volume, AI providers, RAG usage, compliance requirements, and anything else we should know."
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-lg border-2 border-emerald-600 bg-electric-green px-6 py-3 font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? 'Sending...' : 'Talk to Sales'}
			</button>

			<p className="mt-4 text-center text-sm text-muted-foreground">
				By submitting this form, you agree to our{' '}
				<Link to="/privacy-policy" className="text-electric-green hover:underline">
					Privacy Policy
				</Link>
				.
			</p>
		</form>
	);
}
