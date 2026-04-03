import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './api-base';

describe('resolveApiBaseUrl', () => {
	it('defaults to same-origin when no explicit API host is provided', () => {
		expect(resolveApiBaseUrl()).toBe('');
		expect(resolveApiBaseUrl('')).toBe('');
		expect(resolveApiBaseUrl('/')).toBe('');
	});

	it('removes a trailing slash from explicit API hosts', () => {
		expect(resolveApiBaseUrl('https://api.koreshield.com/')).toBe('https://api.koreshield.com');
	});
});
