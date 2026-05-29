type RulePatternType = 'regex' | 'keyword' | 'contains' | 'starts_with' | 'ends_with' | 'startswith' | 'endswith';
type RuleAction = 'block' | 'flag' | 'log' | 'warn' | 'allow';

const TO_API_PATTERN_TYPE: Record<string, string> = {
	starts_with: 'startswith',
	ends_with: 'endswith',
};

const FROM_API_PATTERN_TYPE: Record<string, string> = {
	startswith: 'starts_with',
	endswith: 'ends_with',
};

export function normalizeRulePayload(ruleData: Record<string, unknown>): Record<string, unknown> {
	const payload = { ...ruleData };

	if (typeof payload.pattern_type === 'string') {
		payload.pattern_type = TO_API_PATTERN_TYPE[payload.pattern_type] ?? payload.pattern_type;
	}

	if (payload.action === 'flag') {
		payload.action = 'warn';
	}

	if (typeof payload.priority === 'number') {
		payload.priority = Math.min(10, Math.max(1, payload.priority));
	}

	if (typeof payload.description === 'string') {
		payload.description = payload.description.trim();
	}

	return payload;
}

export function normalizeRuleFromApi(rule: Record<string, unknown>): Record<string, unknown> {
	const normalized = { ...rule };

	if (typeof normalized.pattern_type === 'string') {
		normalized.pattern_type =
			FROM_API_PATTERN_TYPE[normalized.pattern_type] ?? normalized.pattern_type;
	}

	if (normalized.action === 'flag') {
		normalized.action = 'warn';
	}

	return normalized;
}

export function normalizeRuleTestResult(result: Record<string, unknown>) {
	const matches = Boolean(result.match_found);
	const error = typeof result.error === 'string' ? result.error : null;

	return {
		matches,
		message: error ?? (matches ? 'Pattern matched' : 'Pattern did not match'),
	};
}

export type { RulePatternType, RuleAction };
