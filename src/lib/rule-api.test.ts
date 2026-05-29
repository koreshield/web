import { describe, expect, it } from 'vitest';
import { normalizeRuleFromApi, normalizeRulePayload, normalizeRuleTestResult } from './rule-api';

describe('rule-api', () => {
	it('maps UI pattern types to API values and clamps priority', () => {
		expect(
			normalizeRulePayload({
				name: 'Test',
				description: '  desc  ',
				pattern: 'foo',
				pattern_type: 'starts_with',
				action: 'flag',
				priority: 100,
			}),
		).toEqual({
			name: 'Test',
			description: 'desc',
			pattern: 'foo',
			pattern_type: 'startswith',
			action: 'warn',
			priority: 10,
		});
	});

	it('maps API pattern types back to UI values', () => {
		expect(
			normalizeRuleFromApi({
				id: '1',
				pattern_type: 'startswith',
				action: 'flag',
			}),
		).toEqual({
			id: '1',
			pattern_type: 'starts_with',
			action: 'warn',
		});
	});

	it('normalizes rule test responses', () => {
		expect(normalizeRuleTestResult({ match_found: true })).toEqual({
			matches: true,
			message: 'Pattern matched',
		});
		expect(normalizeRuleTestResult({ match_found: false, error: 'Invalid regex' })).toEqual({
			matches: false,
			message: 'Invalid regex',
		});
	});
});
