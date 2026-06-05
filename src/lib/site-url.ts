/** Primary marketing host; koreshield.com is an equal alias on the same Pages deployment. */
export const PRIMARY_SITE_URL = 'https://koreshield.ai';
export const ALIAS_SITE_URL = 'https://koreshield.com';

export const SITE_HOSTNAMES = {
	primary: ['koreshield.ai', 'www.koreshield.ai'],
	alias: ['koreshield.com', 'www.koreshield.com'],
} as const;

const PUBLIC_HOSTNAMES = new Set<string>([
	...SITE_HOSTNAMES.primary,
	...SITE_HOSTNAMES.alias,
]);

export function resolveSiteOrigin(hostname?: string): string {
	if (!hostname) {
		return PRIMARY_SITE_URL;
	}
	if (hostname === 'koreshield.com' || hostname === 'www.koreshield.com') {
		return ALIAS_SITE_URL;
	}
	return PRIMARY_SITE_URL;
}

export function siteUrl(pathname = '/', search = '', hash = '', origin = PRIMARY_SITE_URL): string {
	const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
	const suffix = `${search}${hash}`;
	if (path === '/' || path === '') {
		return suffix ? `${origin}${suffix}` : origin;
	}
	return `${origin}${path}${suffix}`;
}

/** Keep each public hostname self-canonical so verification bots on .com are not redirected to .ai. */
export function resolveCanonicalUrl(explicit?: string): string {
	if (explicit) {
		return explicit;
	}
	if (typeof window === 'undefined') {
		return PRIMARY_SITE_URL;
	}
	const { hostname, pathname, search, hash } = window.location;
	if (!PUBLIC_HOSTNAMES.has(hostname)) {
		return window.location.href;
	}
	return siteUrl(pathname, search, hash, resolveSiteOrigin(hostname));
}
