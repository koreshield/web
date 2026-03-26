import emailjs from '@emailjs/browser';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { useToast } from '../components/ToastNotification';
import { authService } from '../lib/auth';
import { SEOConfig } from '../lib/seo-config';

const tiers = [
	/* COMMENTED: Community free tier hidden
	{
		name: 'Community',
		id: 'free',
		monthlyPrice: 0,
		yearlyPrice: 0,
		priceDisplay: '$0',
		description: 'Perfect for developers and small projects',
		features: [
			'Self-hosted deployment',
			'10,000 requests/month',
			'Community support',
			'All core security features',
			'50+ attack detection patterns',
			'Multi-provider support',
			'Basic monitoring',
			'Community license',
		],
		limitations: [
			'Self-managed infrastructure',
			'Community support only',
			'No SLA guarantee',
		],
		cta: 'Get Started',
		ctaLink: 'https://docs.koreshield.com/installation',
		popular: false,
	},
	COMMENTED */
	{
		name: 'Startup',
		id: 'startup',
		monthlyPrice: 299,
		yearlyPrice: 2870,
		priceDisplay: '$299',
		priceDetail: '/month',
		description: 'Managed SaaS for growing startups and scale-ups',
		features: [
			'Managed hosted KoreShield platform',
			'Up to 1M requests/month',
			'Email & chat support',
			'Advanced monitoring dashboard',
			'Custom detection rules',
			'Multi-tenancy support',
			'Compliance reports',
			'99.9% SLA',
			'Priority security updates',
		],
		cta: 'Get Started',
		ctaLink: '#contact-sales',
		popular: true,
	},
	{
		name: 'Growth',
		id: 'growth',
		monthlyPrice: 1999,
		yearlyPrice: 19190,
		priceDisplay: '$1,999',
		priceDetail: '/month',
		description: 'Managed SaaS for established businesses scaling AI',
		features: [
			'Everything in Startup',
			'Up to 10M requests/month',
			'Dedicated support engineer',
			'Custom integrations',
			'Advanced analytics',
			'SSO/SAML authentication',
			'API key management',
			'99.95% SLA',
			'Quarterly security reviews',
			'Custom training sessions',
		],
		cta: 'Choose Growth',
		ctaLink: '#contact-sales',
		popular: false,
	},
	{
		name: 'Enterprise',
		id: 'enterprise',
		monthlyPrice: null,
		yearlyPrice: null,
		priceDisplay: 'Custom',
		description: 'Annual licensing for self-hosted or private deployments with custom requirements',
		features: [
			'Everything in Growth',
			'Annual enterprise license',
			'Private or self-hosted deployment',
			'Usage bands or custom volume terms',
			'24/7 dedicated support',
			'Custom SLA agreements',
			'On-premise or VPC deployment',
			'Advanced compliance (SOC2, ISO 27001, HIPAA)',
			'Custom AI model support',
			'Dedicated account manager',
			'Custom contract terms',
			'Volume discounts',
		],
		cta: 'Contact Sales',
		ctaLink: '#contact-sales',
		popular: false,
	},
];

const faqs = [
	{
		question: 'How does the pricing work?',
		answer: 'Startup and Growth are managed SaaS plans priced by protected API requests per month, with higher tiers unlocking more support and operational features. Enterprise is priced separately as an annual commercial license for self-hosted or private deployment, with support and SLA terms tailored to the customer. All pricing is in US Dollars ($). We also accept payments in British Pounds (£). Prices exclude VAT and sales tax.',
	},
	{
		question: 'What counts as a request?',
		answer: 'Each API call to the /v1/chat/completions endpoint counts as one request. We count both successful completions and blocked security violations. Streaming requests count as a single request.',
	},
	{
		question: 'Can I switch between tiers?',
		answer: 'Yes. Hosted Startup and Growth customers can upgrade or downgrade between SaaS tiers as usage changes. Enterprise licensing is scoped separately because deployment model, support, and commercial terms are agreed in contract.',
	},
	{
		question: 'What happens if I exceed my request limit?',
		answer: 'Hosted customers receive alerts as they approach their monthly protected request limit. You can move up to the next SaaS tier or agree an overage arrangement. Enterprise customers are handled under their annual license terms instead of the standard hosted limits.',
	},
	{
		question: 'Do you offer a trial period?',
		answer: 'We offer pilot and evaluation access for qualified customers. Hosted trials and enterprise pilots are scoped with our team so we can match the right deployment path and security requirements.',
	},
	{
		question: 'What payment methods do you accept?',
		answer: 'Hosted SaaS plans can be paid by card or invoice, depending on account size. Enterprise annual licenses are typically invoiced and can be purchased through bank transfer or purchase order.',
	},
	{
		question: 'Do you offer discounts for non-profits or educational institutions?',
		answer: 'Yes! We offer 50% off paid tiers for registered non-profits and educational institutions. Please contact sales@koreshield.com with proof of your organisation\'s status.',
	},
	{
		question: 'What is your refund policy?',
		answer: 'Hosted plans can be cancelled at the end of the billing period unless otherwise agreed in writing. Enterprise annual licenses, onboarding, and support terms are handled contractually.',
	},
	{
		question: 'Can I use KoreShield for commercial projects?',
		answer: 'KoreShield core is proprietary. SDKs and documentation are MIT-licensed. Contact us for evaluation or pilot access.',
	},
	{
		question: 'Do you offer regional hosting?',
		answer: 'Yes, Enterprise customers can choose from UK, EU, or US data centres. We\'re also working on Asia-Pacific availability. All data remains in your chosen region for compliance purposes.',
	},
];

export default function PricingPage() {
	const navigate = useNavigate();
	const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
	const [openFaq, setOpenFaq] = useState<number | null>(null);

	const handleContactSales = () => {
		document.getElementById('contact-sales')?.scrollIntoView({ behavior: 'smooth' });
	};

	const handlePlanAction = (planId: string) => {
		if (planId === 'enterprise') {
			handleContactSales();
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

			{/* Hero Section */}
			<section className="py-20 px-4">
				<div className="max-w-7xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<h1 className="text-5xl md:text-7xl font-bold mb-6">
							<span className="text-foreground">
								Simple, <span className="text-electric-green">Transparent</span> Pricing
							</span>
						</h1>
						<p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-light">
							Hosted KoreShield is priced by protected request volume with feature-based tiers. Enterprise customers can license KoreShield annually for self-hosted or private deployment.
						</p>

						{/* Billing Toggle */}
						<div className="flex items-center justify-center gap-4 mb-12">
							<span className={`text-lg font-medium transition-colors ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
								Monthly
							</span>
							<button
								onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
								className="relative w-16 h-8 rounded-full transition-all cursor-pointer bg-muted border border-border"
							>
								<motion.div
									className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-lg bg-white dark:bg-white border-2 border-electric-green"
									animate={{ x: billingPeriod === 'annual' ? 30 : 0 }}
									transition={{ type: 'spring', stiffness: 500, damping: 30 }}
								/>
							</button>
							<span className={`text-lg font-medium transition-colors ${billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
								Annual
								<span className="ml-2 text-sm font-semibold text-electric-green">Save 20%</span>
							</span>
						</div>
					</motion.div>

					{/* Main Pricing Cards (Free, Startup, Growth) */}
					<div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
						{tiers.filter(t => t.id !== 'enterprise').map((tier, index) => {
							const displayPrice = tier.monthlyPrice === null ? tier.priceDisplay :
								billingPeriod === 'annual' && tier.yearlyPrice ?
									`$${tier.yearlyPrice.toLocaleString()}` :
									tier.priceDisplay;
							const priceDetail = tier.monthlyPrice === null ? '' :
								billingPeriod === 'annual' ? '/year' : tier.priceDetail;

							return (
								<motion.div
									key={tier.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: index * 0.1 }}
									className={`relative bg-card rounded-2xl border p-8 flex flex-col transition-colors ${tier.popular
										? 'border-electric-green shadow-xl shadow-emerald-500/10 scale-105'
										: 'border-border shadow-lg'
										}`}
								>
									{tier.popular && (
										<div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 bg-emerald-700 text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg border border-emerald-400">
											Most Popular
										</div>
									)}

									<div className="flex-1">
										<h3 className="text-2xl font-bold text-foreground mb-2">
											{tier.name}
										</h3>
										<div className="flex items-baseline mb-4">
											<span className="text-4xl font-bold text-foreground">
												{displayPrice}
											</span>
											{priceDetail && (
												<span className="text-muted-foreground ml-2">
													{priceDetail}
												</span>
											)}
										</div>
										{billingPeriod === 'annual' && tier.monthlyPrice && tier.yearlyPrice && (
											<p className="text-sm text-electric-green mb-2">
												Save ${(tier.monthlyPrice * 12 - tier.yearlyPrice).toLocaleString()}/year
											</p>
										)}
										<p className="text-muted-foreground mb-6">
											{tier.description}
										</p>

										<ul className="space-y-3 mb-8">
											{tier.features.map((feature) => (
												<li key={feature} className="flex items-start gap-3">
													<svg
														className="w-5 h-5 text-electric-green flex-shrink-0 mt-0.5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M5 13l4 4L19 7"
														/>
													</svg>
													<span className="text-sm text-foreground/80">
														{feature}
													</span>
												</li>
											))}
										</ul>
									</div>

									{tier.ctaLink.startsWith('#') ? (
										<button
											onClick={() => handlePlanAction(tier.id)}
											className="w-full py-3 px-6 rounded-lg font-semibold transition-all cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground border-0"
										>
											{tier.cta}
										</button>
									) : (
										<button
											type="button"
											onClick={() => handlePlanAction(tier.id)}
											className="w-full py-3 px-6 rounded-lg font-semibold transition-all text-center block cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground border-0"
										>
											{tier.cta}
										</button>
									)}
								</motion.div>
							);
						})}
					</div>

					{/* Enterprise Tier - Separate Section */}
					{(() => {
						const enterpriseTier = tiers.find(t => t.id === 'enterprise');
						if (!enterpriseTier) return null;

						return (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.3 }}
								className="max-w-6xl mx-auto"
							>
								<div className="bg-card border-2 border-electric-green/30 rounded-2xl shadow-2xl p-8 md:p-12">
									<div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
										{/* Left: Info & CTA */}
										<div className="md:w-2/5 flex-shrink-0">
											<span className="inline-block bg-electric-green/10 text-electric-green text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Enterprise</span>
											<h3 className="text-3xl font-bold text-foreground mb-3">
												Custom Pricing
											</h3>
											<p className="text-muted-foreground mb-6">
												{enterpriseTier.description}
											</p>
											<button
												onClick={handleContactSales}
												className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 px-8 py-3 rounded-lg font-semibold transition-all cursor-pointer shadow-md"
											>
												{enterpriseTier.cta}
											</button>
										</div>
										{/* Right: Features */}
										<div className="md:w-3/5">
											<ul className="grid md:grid-cols-2 gap-x-8 gap-y-4">
												{enterpriseTier.features.map((feature) => (
													<li key={feature} className="flex items-start gap-2">
														<svg
															className="w-5 h-5 text-electric-green flex-shrink-0 mt-0.5"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M5 13l4 4L19 7"
															/>
														</svg>
														<span className="text-sm text-foreground/80">
															{feature}
														</span>
													</li>
												))}
											</ul>
										</div>
									</div>
								</div>
							</motion.div>
						);
					})()}

					{/* Enterprise Note */}
					<p className="text-center text-muted-foreground mt-12">
						Startup and Growth are managed SaaS plans. Enterprise is sold on annual license with support and SLA terms. All prices are in US Dollars ($). We also accept British Pounds (£). Prices exclude VAT and sales tax.
					</p>
				</div>
			</section>

			{/* Feature Comparison Table */}
			<section className="py-20 px-4 bg-muted/30">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-3xl font-bold text-center text-foreground mb-12">
						Compare Features
					</h2>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-border">
									<th className="text-left p-4 font-semibold text-foreground">Feature</th>
									{tiers.map((tier) => (
										<th key={tier.id} className="text-center p-4 font-semibold text-foreground">
											{tier.name}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								<tr>
									<td className="p-4 text-foreground/80">Requests/month</td>
									<td className="p-4 text-center text-muted-foreground">1M</td>
									<td className="p-4 text-center text-muted-foreground">10M</td>
									<td className="p-4 text-center text-muted-foreground">Contracted</td>
								</tr>
								<tr>
									<td className="p-4 text-foreground/80">Deployment model</td>
									<td className="p-4 text-center text-muted-foreground">Managed SaaS</td>
									<td className="p-4 text-center text-muted-foreground">Managed SaaS</td>
									<td className="p-4 text-center text-muted-foreground">Self-hosted / Private</td>
								</tr>
								<tr>
									<td className="p-4 text-foreground/80">Support</td>
									<td className="p-4 text-center text-muted-foreground">Email & Chat</td>
									<td className="p-4 text-center text-muted-foreground">Dedicated</td>
									<td className="p-4 text-center text-muted-foreground">24/7 Dedicated</td>
								</tr>
								<tr>
									<td className="p-4 text-foreground/80">SLA</td>
									<td className="p-4 text-center text-muted-foreground">99.9%</td>
									<td className="p-4 text-center text-muted-foreground">99.95%</td>
									<td className="p-4 text-center text-muted-foreground">Custom</td>
								</tr>
								<tr>
									<td className="p-4 text-foreground/80">Custom rules</td>
									<td className="p-4 text-center">
										<svg className="w-5 h-5 text-electric-green mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
										</svg>
									</td>
									<td className="p-4 text-center">
										<svg className="w-5 h-5 text-electric-green mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
										</svg>
									</td>
									<td className="p-4 text-center">
										<svg className="w-5 h-5 text-electric-green mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
										</svg>
									</td>
								</tr>
								<tr>
									<td className="p-4 text-foreground/80">SOC2/ISO 27001</td>
									<td className="p-4 text-center">
										<svg className="w-5 h-5 text-muted-foreground/50 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</td>
									<td className="p-4 text-center">
										<svg className="w-5 h-5 text-muted-foreground/50 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</td>
									<td className="p-4 text-center">
										<svg className="w-5 h-5 text-electric-green mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
										</svg>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="py-20 px-4" id="faq">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl font-bold text-center text-foreground mb-12">
						Frequently Asked Questions
					</h2>

					<div className="space-y-4">
						{faqs.map((faq, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: index * 0.05 }}
								className="bg-card border border-border rounded-lg shadow-sm"
							>
								<button
									onClick={() => setOpenFaq(openFaq === index ? null : index)}
									className="w-full flex items-center justify-between p-6 text-left"
								>
									<span className="font-semibold text-foreground pr-8">
										{faq.question}
									</span>
									<svg
										className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''
											}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>
								{openFaq === index && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className="px-6 pb-6"
									>
										<p className="text-muted-foreground">{faq.answer}</p>
									</motion.div>
								)}
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Contact Sales Form */}
			<section className="py-20 px-4 bg-muted/40" id="contact-sales">
				<div className="max-w-2xl mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
							Talk to the team
						</h2>
						<p className="text-muted-foreground">
							Tell us your stack, your scale, and your security requirements. We will match you to the right plan.
						</p>
					</div>

					<ContactSalesForm />
				</div>
			</section>
		</div>
	);
}

function ContactSalesForm() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		company: '',
		tier: 'startup',
		message: '',
	});
	const [loading, setLoading] = useState(false);
	const toast = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		const payload = {
			name: formData.name,
			email: formData.email,
			company: formData.company,
			tier: formData.tier,
			message: formData.message,
		};

		try {
			await emailjs.send(
				import.meta.env.VITE_EMAILJS_SERVICE_ID,
				import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
				payload,
				import.meta.env.VITE_EMAILJS_PUBLIC_KEY
			);

			toast.success(
				'Thank you for your enquiry!',
				'Our sales team will contact you within 24 hours.'
			);

			setFormData({
				name: '',
				email: '',
				company: '',
				tier: 'startup',
				message: '',
			});
		} catch (err: any) {
			const msg = err?.text || err?.message || 'Something went wrong. Please try again or email hello@koreshield.com directly.';
			toast.error('Failed to send', msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl shadow-xl p-8">
			<div className="grid md:grid-cols-2 gap-6 mb-6">
				<div>
					<label htmlFor="name" className="block text-sm font-medium text-foreground/80 mb-2">
						Full Name *
					</label>
					<input
						type="text"
						id="name"
						required
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-electric-green focus:border-transparent bg-background text-foreground transition-colors"
					/>
				</div>
				<div>
					<label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-2">
						Email Address *
					</label>
					<input
						type="email"
						id="email"
						required
						value={formData.email}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-electric-green focus:border-transparent bg-background text-foreground transition-colors"
					/>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6 mb-6">
				<div>
					<label htmlFor="company" className="block text-sm font-medium text-foreground/80 mb-2">
						Company Name *
					</label>
					<input
						type="text"
						id="company"
						required
						value={formData.company}
						onChange={(e) => setFormData({ ...formData, company: e.target.value })}
						className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-electric-green focus:border-transparent bg-background text-foreground transition-colors"
					/>
				</div>
				<div>
					<label htmlFor="tier" className="block text-sm font-medium text-foreground/80 mb-2">
						Interested In
					</label>
					<select
						id="tier"
						value={formData.tier}
						onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
						className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-electric-green focus:border-transparent bg-background text-foreground transition-colors"
					>
						<option value="startup">Startup Tier</option>
						<option value="growth">Growth Tier</option>
						<option value="enterprise">Enterprise</option>
						<option value="other">Just exploring</option>
					</select>
				</div>
			</div>

			<div className="mb-6">
				<label htmlFor="message" className="block text-sm font-medium text-foreground/80 mb-2">
					Tell us about your needs
				</label>
				<textarea
					id="message"
					rows={4}
					value={formData.message}
					onChange={(e) => setFormData({ ...formData, message: e.target.value })}
					className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-electric-green focus:border-transparent bg-background text-foreground transition-colors"
					placeholder="What are your security requirements? Expected request volume? Any specific compliance needs?"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-electric-green hover:bg-emerald-dark text-white font-semibold py-3 px-6 rounded-lg transition-all cursor-pointer shadow-md hover:shadow-lg border-2 border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? 'Sending...' : 'Contact Sales'}
			</button>

			<p className="text-sm text-muted-foreground text-center mt-4">
				By submitting this form, you agree to our{' '}
				<Link to="/privacy-policy" className="text-electric-green hover:underline">
					Privacy Policy
				</Link>
			</p>
		</form>
	);
}
