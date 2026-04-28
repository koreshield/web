import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './api-base';

describe('resolveApiBaseUrl', () => {
	it('defaults to localhost API when no explicit API host is provided in SSR or local dev', () => {
		expect(resolveApiBaseUrl()).toBe('http://localhost:8000');
		expect(resolveApiBaseUrl('')).toBe('http://localhost:8000');
		expect(resolveApiBaseUrl('/')).toBe('http://localhost:8000');
	});

	it('removes a trailing slash from explicit API hosts', () => {
		expect(resolveApiBaseUrl('https://api.koreshield.ai/')).toBe('https://api.koreshield.ai');
	});
});
