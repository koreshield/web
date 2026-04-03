export function resolveApiBaseUrl(value?: string) {
	const normalized = (value || '').trim();
	if (!normalized || normalized === '/') {
		return '';
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
