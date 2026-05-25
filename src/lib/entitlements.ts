import type { PublicPlanId } from './pricing';

export type PlanFeature =
	| 'dashboard'
	| 'api_keys'
	| 'usage'
	| 'billing'
	| 'settings'
	| 'rag_security'
	| 'voice_security'
	| 'threat_monitoring'
	| 'rules'
	| 'policies'
	| 'alerts'
	| 'teams'
	| 'reports'
	| 'audit_logs'
	| 'provider_health'
	| 'advanced_analytics'
	| 'cost_analytics'
	| 'rbac'
	| 'compliance_reports'
	| 'sso_saml'
	| 'siem_export'
	| 'custom_retention'
	| 'private_deployment';

const CORE_FEATURES: PlanFeature[] = [
	'dashboard',
	'api_keys',
	'usage',
	'billing',
	'settings',
	'rag_security',
	'threat_monitoring',
];

const GROWTH_FEATURES: PlanFeature[] = [
	...CORE_FEATURES,
	'voice_security',
	'rules',
	'policies',
	'alerts',
	'teams',
	'reports',
];

const SCALE_FEATURES: PlanFeature[] = [
	...GROWTH_FEATURES,
	'audit_logs',
	'provider_health',
	'advanced_analytics',
	'cost_analytics',
	'rbac',
];

const ENTERPRISE_FEATURES: PlanFeature[] = [
	...SCALE_FEATURES,
	'compliance_reports',
	'sso_saml',
	'siem_export',
	'custom_retention',
	'private_deployment',
];

export const PLAN_FEATURES: Record<PublicPlanId, PlanFeature[]> = {
	free: CORE_FEATURES,
	growth: GROWTH_FEATURES,
	scale: SCALE_FEATURES,
	enterprise: ENTERPRISE_FEATURES,
};

export const PLAN_NAMES: Record<PublicPlanId, string> = {
	free: 'Dev',
	growth: 'Growth',
	scale: 'Scale',
	enterprise: 'Enterprise',
};

export const FEATURE_LABELS: Record<PlanFeature, string> = {
	dashboard: 'Dashboard',
	api_keys: 'API keys',
	usage: 'Usage',
	billing: 'Billing',
	settings: 'Settings',
	rag_security: 'RAG Security',
	voice_security: 'Voice Security',
	threat_monitoring: 'Threat Monitoring',
	rules: 'Rules',
	policies: 'Policies',
	alerts: 'Alerts',
	teams: 'Teams',
	reports: 'Reports',
	audit_logs: 'Audit Logs',
	provider_health: 'Provider Health',
	advanced_analytics: 'Advanced Analytics',
	cost_analytics: 'Cost Analytics',
	rbac: 'RBAC',
	compliance_reports: 'Compliance Reports',
	sso_saml: 'SSO / SAML',
	siem_export: 'SIEM Export',
	custom_retention: 'Custom Retention',
	private_deployment: 'Private Deployment',
};

export const ROUTE_FEATURES: Array<{ prefix: string; feature: PlanFeature }> = [
	{ prefix: '/settings/api-keys', feature: 'api_keys' },
	{ prefix: '/usage', feature: 'usage' },
	{ prefix: '/billing', feature: 'billing' },
	{ prefix: '/settings', feature: 'settings' },
	{ prefix: '/rag-security', feature: 'rag_security' },
	{ prefix: '/voice-security', feature: 'voice_security' },
	{ prefix: '/threat-monitoring', feature: 'threat_monitoring' },
	{ prefix: '/threat-map', feature: 'threat_monitoring' },
	{ prefix: '/rules', feature: 'rules' },
	{ prefix: '/policies', feature: 'policies' },
	{ prefix: '/alerts', feature: 'alerts' },
	{ prefix: '/teams', feature: 'teams' },
	{ prefix: '/reports', feature: 'reports' },
	{ prefix: '/audit-logs', feature: 'audit_logs' },
	{ prefix: '/provider-health', feature: 'provider_health' },
	{ prefix: '/advanced-analytics', feature: 'advanced_analytics' },
	{ prefix: '/analytics', feature: 'advanced_analytics' },
	{ prefix: '/cost-analytics', feature: 'cost_analytics' },
	{ prefix: '/rbac', feature: 'rbac' },
	{ prefix: '/compliance-reports', feature: 'compliance_reports' },
];

const PLAN_ALIASES: Record<string, PublicPlanId> = {
	'': 'free',
	dev: 'free',
	developer: 'free',
	free: 'free',
	trial: 'free',
	startup: 'growth',
	paid: 'growth',
	growth: 'growth',
	scale: 'scale',
	pro: 'scale',
	business: 'scale',
	enterprise: 'enterprise',
};

export function normalizePlanSlug(value?: string | null): PublicPlanId {
	const normalized = (value ?? '').trim().toLowerCase().replace(/[_\s-]+/g, '_');
	return PLAN_ALIASES[normalized] ?? 'free';
}

export function minimumPlanForFeature(feature: PlanFeature): PublicPlanId {
	for (const plan of ['free', 'growth', 'scale', 'enterprise'] as const) {
		if (PLAN_FEATURES[plan].includes(feature)) return plan;
	}
	return 'enterprise';
}

export function planAllowsFeature(planSlug: string | null | undefined, feature?: PlanFeature) {
	if (!feature) return true;
	return PLAN_FEATURES[normalizePlanSlug(planSlug)].includes(feature);
}

export function featureForPath(pathname: string): PlanFeature | undefined {
	const match = ROUTE_FEATURES
		.filter(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))
		.sort((a, b) => b.prefix.length - a.prefix.length)[0];
	return match?.feature;
}
