// Subscription plan definitions for KoreShield LLM Security
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Community",
    price: 0,
    features: {
      maxProviders: 2, // Max LLM providers (OpenAI, Anthropic, etc.)
      maxMembers: 1,
      requestsPerMonth: 10000, // LLM requests protected per month
      retentionDays: 3, // Security event log retention
      prioritySupport: false,
      sso: false,
      auditLogs: false,
      advancedDetection: false, // ML-based threat detection
      customRules: false,
    },
  },
  ray: {
    name: "Starter",
    price: 29,
    polarProductId: process.env.POLAR_RAY_PRODUCT_ID,
    features: {
      maxProviders: 5,
      maxMembers: 3,
      requestsPerMonth: 100000,
      retentionDays: 30,
      prioritySupport: false,
      sso: false,
      auditLogs: false,
      advancedDetection: false,
      customRules: true,
    },
  },
  beam: {
    name: "Pro",
    price: 99,
    polarProductId: process.env.POLAR_BEAM_PRODUCT_ID,
    features: {
      maxProviders: 20,
      maxMembers: -1, // Unlimited
      requestsPerMonth: 1000000,
      retentionDays: 90,
      prioritySupport: true,
      sso: false,
      auditLogs: true,
      advancedDetection: true, // ML-based threat detection enabled
      customRules: true,
    },
  },
  pulse: {
    name: "Enterprise",
    price: 499,
    polarProductId: process.env.POLAR_PULSE_PRODUCT_ID,
    features: {
      maxProviders: -1, // Unlimited
      maxMembers: -1, // Unlimited
      requestsPerMonth: -1, // Unlimited
      retentionDays: 365,
      prioritySupport: true,
      sso: true,
      auditLogs: true,
      advancedDetection: true,
      customRules: true,
    },
  },
  // Internal plan - not shown in UI, manually assigned via database
  unlimited: {
    name: "Unlimited",
    price: 0,
    hidden: true,
    features: {
      maxProviders: 999999999,
      maxMembers: 999999999,
      requestsPerMonth: 999999999,
      retentionDays: 999999999,
      prioritySupport: true,
      sso: true,
      auditLogs: true,
      advancedDetection: true,
      customRules: true,
    },
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

export function calculatePlanCost(plan: SubscriptionPlan): number {
  return SUBSCRIPTION_PLANS[plan].price;
}

export function canUseFeature(
  plan: SubscriptionPlan,
  feature: keyof typeof SUBSCRIPTION_PLANS.free.features,
  currentUsage?: number,
): boolean {
  const planFeatures = SUBSCRIPTION_PLANS[plan].features;
  // @ts-ignore
  const limit = planFeatures[feature];

  if (limit === -1) return true; // Unlimited

  if (typeof limit === "number" && currentUsage !== undefined) {
    return currentUsage < limit;
  }

  return !!limit;
}

export function getPlanLimits(plan: SubscriptionPlan) {
  return SUBSCRIPTION_PLANS[plan].features;
}
