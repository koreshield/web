import { describe, expect, it } from 'vitest';
import {
	ALIAS_SITE_URL,
	PRIMARY_SITE_URL,
	resolveCanonicalUrl,
	resolveSiteOrigin,
	siteUrl,
} from './site-url';

describe('resolveSiteOrigin', () => {
	it('maps every public hostname to the canonical origin', () => {
		expect(resolveSiteOrigin('koreshield.ai')).toBe(PRIMARY_SITE_URL);
		expect(resolveSiteOrigin('koreshield.com')).toBe(PRIMARY_SITE_URL);
	});
});

describe('siteUrl', () => {
	it('builds canonical URLs', () => {
		expect(siteUrl('/pricing', '', '', PRIMARY_SITE_URL)).toBe('https://koreshield.ai/pricing');
		expect(siteUrl('/pricing', '', '', ALIAS_SITE_URL)).toBe('https://koreshield.ai/pricing');
	});
});

describe('resolveCanonicalUrl', () => {
	it('honours explicit canonical URLs', () => {
		expect(resolveCanonicalUrl('https://koreshield.ai/blog/post')).toBe(
			'https://koreshield.ai/blog/post',
		);
	});

	it('canonicalizes koreshield.com pages onto koreshield.ai', () => {
		const original = window.location;
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: {
				hostname: 'koreshield.com',
				pathname: '/pricing',
				search: '',
				hash: '',
				href: 'https://koreshield.com/pricing',
			},
		});

		expect(resolveCanonicalUrl()).toBe('https://koreshield.ai/pricing');

		Object.defineProperty(window, 'location', {
			configurable: true,
			value: original,
		});
	});

	it('keeps koreshield.ai self-canonical', () => {
		const original = window.location;
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: {
				hostname: 'koreshield.ai',
				pathname: '/docs',
				search: '',
				hash: '',
				href: 'https://koreshield.ai/docs',
			},
		});

		expect(resolveCanonicalUrl()).toBe('https://koreshield.ai/docs');

		Object.defineProperty(window, 'location', {
			configurable: true,
			value: original,
		});
	});
});
