export function resolveApiBaseUrl(value?: string) {
	const normalized = (value || '').trim();
	if (!normalized || normalized === '/') {
		if (typeof window === 'undefined') {
			return 'http://localhost:8000';
		}

		const { hostname, protocol } = window.location;
		if (hostname === 'localhost' || hostname === '127.0.0.1') {
			return 'http://localhost:8000';
		}

		const apiHost = hostname.startsWith('www.') ? `api.${hostname.slice(4)}` : `api.${hostname}`;
		return `${protocol}//${apiHost}`;
	}
	return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

export function resolveWebSocketBaseUrl(value?: string) {
	const apiBaseUrl = resolveApiBaseUrl(value);
	if (!apiBaseUrl) {
		if (typeof window === 'undefined') {
			return 'ws://localhost:8000';
		}
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		return `${protocol}//${window.location.host}`;
	}
	return apiBaseUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
}
