export type PublicPlanId = 'free' | 'growth' | 'scale' | 'enterprise';
export type HostedPlanId = 'growth' | 'scale';
export type BillingInterval = 'monthly' | 'annual';

export type PricingPlan = {
	id: PublicPlanId;
	name: string;
	badge?: string;
	description: string;
	monthlyPriceLabel: string;
	annualPriceLabel?: string;
	monthlyPriceValue: number | null;
	annualPriceValue: number | null;
	annualSavingsLabel?: string;
	includedRequests: string;
	overage?: string;
	retention: string;
	cta: string;
	checkoutSlug?: HostedPlanId;
	popular?: boolean;
	features: string[];
	limitations?: string[];
};

export const PRICING_FAQS = [
	{
		question: 'Does Koreshield store my prompts or responses?',
		answer:
			'No. Koreshield is zero-log by default. Requests and responses are inspected in memory and discarded immediately. Nothing is retained unless you explicitly configure a retention policy on Scale or Enterprise.',
	},
	{
		question: 'How long does integration actually take?',
		answer:
			'Under 30 minutes for most teams. You change one URL in your LLM client configuration. No code rewrite, no SDK migration, no architectural changes required.',
	},
	{
		question: 'How do you bill?',
		answer:
			'You pay a fixed monthly platform fee that includes a block of protected requests. If you exceed that block, overages are billed at £12 per 100,000 requests. Annual plans apply a flat 20% discount.',
	},
	{
		question: 'What is a protected request?',
		answer:
			'One protected request equals one screened AI interaction routed through Koreshield. Standard RAG scans are bundled at the per-request rate.',
	},
	{
		question: 'Do you charge per seat?',
		answer:
			'No. Koreshield pricing is built around AI traffic, not headcount. Your entire product, security, and engineering team can access the platform on paid plans.',
	},
	{
		question: 'How do overages work?',
		answer:
			'Overages are billed at £12 per 100,000 protected requests beyond your monthly plan limit. You can monitor usage in real time from the dashboard.',
	},
	{
		question: 'What about RAG scanning?',
		answer:
			'RAG scanning is included in all plans. Indirect prompt injection via retrieved documents is one of the most common attack vectors in production LLM systems, so we treat it as a core capability, not an add-on.',
	},
	{
		question: 'What is included on Enterprise?',
		answer:
			'VPC, private, or self-hosted deployment, SSO and SAML, SIEM export, custom retention and SLA, and dedicated onboarding and security review support. Pricing is scoped to your protected-request volume and deployment requirements.',
	},
	{
		question: 'Is annual pricing available?',
		answer:
			'Yes. Annual plans apply a flat 20% discount across Dev, Growth, and Scale tiers. Enterprise contracts are scoped individually.',
	},
];

export const PRICING_PLANS: PricingPlan[] = [
	{
		id: 'free',
		name: 'Dev',
		description: 'For internal evaluation and prototyping.',
		monthlyPriceLabel: '£0',
		monthlyPriceValue: 0,
		annualPriceValue: 0,
		includedRequests: '10,000 protected requests/month',
		retention: '7-day retention',
		cta: 'Start building',
		features: [
			'Baseline prompt and RAG screening',
			'Basic dashboard visibility',
			'Hosted setup for fast evaluation',
			'Core logs and recent scan history',
		],
		limitations: [
			'No SSO, SIEM export, or advanced governance',
			'No custom retention or enterprise support terms',
		],
	},
	{
		id: 'growth',
		name: 'Growth',
		badge: 'Most Popular',
		description: "For teams shipping LLMs in production who can't afford a breach.",
		monthlyPriceLabel: '£99',
		annualPriceLabel: '£950',
		monthlyPriceValue: 99,
		annualPriceValue: 950,
		annualSavingsLabel: 'Save £238/year',
		includedRequests: '100,000 protected requests/month',
		overage: '£12 per extra 100,000 protected requests',
		retention: '30-day retention',
		cta: 'Start for £99',
		checkoutSlug: 'growth',
		popular: true,
		features: [
			'Advanced prompt and RAG screening',
			'Policies and alerts',
			'API key management',
			'Teams and collaboration',
			'Basic reports and billing visibility',
			'Email support',
		],
	},
	{
		id: 'scale',
		name: 'Scale',
		description: 'For serious production usage, governance, and higher-volume protected traffic.',
		monthlyPriceLabel: '£399',
		annualPriceLabel: '£3,830',
		monthlyPriceValue: 399,
		annualPriceValue: 3830,
		annualSavingsLabel: 'Save £958/year',
		includedRequests: '1,000,000 protected requests/month',
		overage: '£12 per extra 100,000 protected requests',
		retention: '90-day retention',
		cta: 'Start for £399',
		checkoutSlug: 'scale',
		features: [
			'Everything in Growth',
			'RBAC and audit logs',
			'Advanced analytics and reporting',
			'Provider health visibility',
			'Priority support',
			'Operational governance for larger teams',
		],
	},
	{
		id: 'enterprise',
		name: 'Enterprise',
		description: 'Contract-backed protection for regulated and high-volume AI deployments.',
		monthlyPriceLabel: 'From £1,500',
		annualPriceLabel: 'From £18,000',
		monthlyPriceValue: 1500,
		annualPriceValue: 18000,
		includedRequests: 'Custom protected-request volume',
		retention: 'Custom retention',
		cta: 'Get a scoped quote',
		features: [
			'Everything in Scale',
			'SSO and SAML',
			'SIEM export',
			'VPC, private, or self-hosted deployment',
			'Custom retention and SLA',
			'Dedicated onboarding and security review support',
		],
	},
];

export const HOSTED_PLAN_DISPLAY_BY_INTERNAL_SLUG: Record<string, HostedPlanId | 'free'> = {
	free: 'free',
	startup: 'growth',
	growth: 'growth',
	scale: 'scale',
	dev: 'free',
};

export const INTERNAL_HOSTED_PLAN_IDS: Record<HostedPlanId, { monthlyEnv: string; annualEnv: string }> = {
	growth: {
		monthlyEnv: 'VITE_POLAR_GROWTH_PRODUCT_ID',
		annualEnv: 'VITE_POLAR_GROWTH_ANNUAL_PRODUCT_ID',
	},
	scale: {
		monthlyEnv: 'VITE_POLAR_STARTUP_PRODUCT_ID',
		annualEnv: 'VITE_POLAR_STARTUP_ANNUAL_PRODUCT_ID',
	},
};

export function getPlanById(planId: PublicPlanId) {
	return PRICING_PLANS.find((plan) => plan.id === planId);
}

export function getHostedPlanBySlug(slug: string | null | undefined) {
	if (!slug) return getPlanById('free');
	if (slug === 'enterprise') return getPlanById('enterprise');
	const mapped = HOSTED_PLAN_DISPLAY_BY_INTERNAL_SLUG[slug] || 'free';
	return getPlanById(mapped as PublicPlanId);
}

export function getHostedCheckoutProductId(
	planId: HostedPlanId,
	interval: BillingInterval,
) {
	const envKeys = INTERNAL_HOSTED_PLAN_IDS[planId];
	return interval === 'annual'
		? import.meta.env[envKeys.annualEnv]
		: import.meta.env[envKeys.monthlyEnv];
}
