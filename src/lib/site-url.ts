/** The sole canonical public marketing origin. */
export const PRIMARY_SITE_URL = 'https://koreshield.ai';
export const ALIAS_SITE_URL = PRIMARY_SITE_URL;

export function resolveSiteOrigin(hostname?: string): string {
	void hostname;
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

/** Canonicals always consolidate public pages onto koreshield.ai. */
export function resolveCanonicalUrl(explicit?: string): string {
	if (explicit) {
		return explicit;
	}
	if (typeof window === 'undefined') {
		return PRIMARY_SITE_URL;
	}
	return siteUrl(window.location.pathname);
}
