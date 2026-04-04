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
		question: 'How do you bill?',
		answer:
			'KoreShield uses a platform-fee-plus-usage model. Paid hosted plans include a block of protected requests each month, and overages are billed on top of that included usage. Enterprise plans are sold through annual contracts.',
	},
	{
		question: 'What is a protected request?',
		answer:
			'One protected request is one screened AI interaction routed through KoreShield. A proxied chat completion counts as one protected request. Standard RAG scans are bundled fairly per request, with larger scans consuming additional request units once they exceed plan thresholds.',
	},
	{
		question: 'Do you charge per seat?',
		answer:
			'No. KoreShield is priced around protected usage, not seat counts. Paid hosted plans include collaborative access for engineering, product, and security teams without making seats the primary billing meter.',
	},
	{
		question: 'How do overages work?',
		answer:
			'Growth includes 100,000 protected requests and charges £12 per additional 100,000. Scale includes 1,000,000 protected requests and charges £8 per additional 100,000. Enterprise volume is handled contractually.',
	},
	{
		question: 'What about RAG scanning?',
		answer:
			'RAG scanning is included within the protected-request model up to a fair bundled threshold per request, such as up to 20 documents or a capped total context size. Bulk or unusually large scans can consume additional request units.',
	},
	{
		question: 'What is included on Enterprise?',
		answer:
			'Enterprise is where we reserve advanced identity, deployment, and governance controls such as SSO/SAML, SIEM export, private or self-hosted deployment, custom retention, SLA commitments, dedicated onboarding, and security review support.',
	},
	{
		question: 'Is annual pricing available?',
		answer:
			'Yes. Growth and Scale use a flat 20% annual discount compared with their monthly equivalent. Enterprise contracts are typically annual by default.',
	},
];

export const PRICING_PLANS: PricingPlan[] = [
	{
		id: 'free',
		name: 'Free',
		description: 'For evaluation, internal prototypes, and the first protected AI workflows.',
		monthlyPriceLabel: '£0',
		monthlyPriceValue: 0,
		annualPriceValue: 0,
		includedRequests: '10,000 protected requests/month',
		retention: '7-day retention',
		cta: 'Start Free',
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
		description: 'For startups and small teams shipping AI features into real production traffic.',
		monthlyPriceLabel: '£99',
		annualPriceLabel: '£950',
		monthlyPriceValue: 99,
		annualPriceValue: 950,
		annualSavingsLabel: 'Save £238/year',
		includedRequests: '100,000 protected requests/month',
		overage: '£12 per extra 100,000 protected requests',
		retention: '30-day retention',
		cta: 'Choose Growth',
		checkoutSlug: 'growth',
		popular: true,
		features: [
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
		description: 'For serious production usage, governance, and higher-volume protected AI traffic.',
		monthlyPriceLabel: '£399',
		annualPriceLabel: '£3,830',
		monthlyPriceValue: 399,
		annualPriceValue: 3830,
		annualSavingsLabel: 'Save £958/year',
		includedRequests: '1,000,000 protected requests/month',
		overage: '£8 per extra 100,000 protected requests',
		retention: '90-day retention',
		cta: 'Choose Scale',
		checkoutSlug: 'scale',
		features: [
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
		description: 'For regulated, high-volume, or security-sensitive deployments that need contract-backed controls.',
		monthlyPriceLabel: 'From £1,500',
		annualPriceLabel: 'From £18,000',
		monthlyPriceValue: 1500,
		annualPriceValue: 18000,
		includedRequests: 'Custom protected-request volume',
		retention: 'Custom retention',
		cta: 'Talk to Sales',
		features: [
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
	growth: 'scale',
};

export const INTERNAL_HOSTED_PLAN_IDS: Record<HostedPlanId, { monthlyEnv: string; annualEnv: string }> = {
	growth: {
		monthlyEnv: 'VITE_POLAR_STARTUP_PRODUCT_ID',
		annualEnv: 'VITE_POLAR_STARTUP_ANNUAL_PRODUCT_ID',
	},
	scale: {
		monthlyEnv: 'VITE_POLAR_GROWTH_PRODUCT_ID',
		annualEnv: 'VITE_POLAR_GROWTH_ANNUAL_PRODUCT_ID',
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
