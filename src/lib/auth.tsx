/**
 * Authentication service for Koreshield admin UI.
 *
 * Session persistence strategy (belt-and-suspenders):
 *   1. HttpOnly cookie (ks_access_token) - set by backend, sent automatically by browser.
 *      Requires SameSite=none;Secure for cross-site requests (koreshield.ai → api.koreshield.com).
 *   2. localStorage token (ks_auth_token) - stored by this module, sent as Authorization
 *      Bearer header. Survives page refresh and browser restart regardless of cookie state.
 *   3. localStorage user (ks_auth_user) - cached user profile, survives refresh so the UI
 *      can render immediately while the background /me validation runs.
 *
 * Both mechanisms are active simultaneously. The cookie is the security-first path; the
 * localStorage token is the reliability fallback that prevents logout-on-refresh.
 */
import { resolveApiBaseUrl } from './api-base';
import { clearAuthenticatedQueryCache } from './query-client';

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	role: string;
	status?: string;
	company?: string | null;
	job_title?: string | null;
	email_verified?: boolean;
}

export interface LoginResponse {
	token?: string;
	user: AuthUser;
	mfa_required?: boolean;
	challenge_token?: string;
	delivery?: string;
	expires_in_seconds?: number;
}

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const USER_STORAGE_KEY = 'ks_auth_user';        // localStorage - survives refresh + cross-tab
const TOKEN_STORAGE_KEY = 'ks_auth_token';      // localStorage - survives refresh + cross-tab
const MFA_STORAGE_KEY = 'admin_mfa_challenge';  // sessionStorage - intentionally tab-scoped
const LEGACY_USER_KEY = 'admin_user';           // old sessionStorage key - migrated on init

// One-time migration: move existing sessionStorage session into localStorage so
// users who were already logged in don't get kicked out on first load after this deploy.
try {
	const legacyUser = sessionStorage.getItem(LEGACY_USER_KEY);
	if (legacyUser && !localStorage.getItem(USER_STORAGE_KEY)) {
		localStorage.setItem(USER_STORAGE_KEY, legacyUser);
	}
	sessionStorage.removeItem(LEGACY_USER_KEY);
} catch {
	// Private browsing / storage blocked - ignore
}

export interface PendingMFAChallenge {
	challengeToken: string;
	user: AuthUser;
	delivery: string;
	expiresInSeconds: number;
}

export type AuthFlowResult =
	| { status: 'authenticated'; user: AuthUser }
	| { status: 'mfa_required'; user: AuthUser; challenge: PendingMFAChallenge };

type AuthEventType = 'login' | 'logout';
type AuthEventHandler = () => void;

class AuthEventEmitter {
	private handlers: Map<AuthEventType, Set<AuthEventHandler>> = new Map();

	on(event: AuthEventType, handler: AuthEventHandler) {
		if (!this.handlers.has(event)) {
			this.handlers.set(event, new Set());
		}
		this.handlers.get(event)!.add(handler);
	}

	off(event: AuthEventType, handler: AuthEventHandler) {
		const handlers = this.handlers.get(event);
		if (handlers) {
			handlers.delete(handler);
		}
	}

	emit(event: AuthEventType) {
		const handlers = this.handlers.get(event);
		if (handlers) {
			handlers.forEach(handler => handler());
		}
	}
}

const eventEmitter = new AuthEventEmitter();

// Rehydrate token from localStorage on module init so page refreshes don't lose it.
let inMemoryToken: string | null = (() => {
	try {
		return localStorage.getItem(TOKEN_STORAGE_KEY) ?? null;
	} catch {
		return null; // Private browsing / storage blocked
	}
})();

function persistSession(user: AuthUser, token?: string | null) {
	// Update in-memory reference
	if (token !== undefined) {
		inMemoryToken = token ?? null;
	}
	// Persist token to localStorage so it survives page refresh.
	// If token is null (cookie-only flow after restoreSession), we keep whatever
	// token was already in localStorage - don't overwrite a valid stored token with null.
	try {
		if (inMemoryToken) {
			localStorage.setItem(TOKEN_STORAGE_KEY, inMemoryToken);
		}
		// Always persist user - needed for getCurrentUser() immediately after refresh
		localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
	} catch {
		// Storage quota or private browsing - fall back silently
	}
	clearAuthenticatedQueryCache();
	eventEmitter.emit('login');
}

function clearSession() {
	inMemoryToken = null;
	try {
		localStorage.removeItem(TOKEN_STORAGE_KEY);
		localStorage.removeItem(USER_STORAGE_KEY);
	} catch {
		// Ignore
	}
	clearAuthenticatedQueryCache();
}

function persistPendingMfa(challenge: PendingMFAChallenge) {
	sessionStorage.setItem(MFA_STORAGE_KEY, JSON.stringify(challenge));
}

function clearPendingMfa() {
	sessionStorage.removeItem(MFA_STORAGE_KEY);
}

export const authService = {
	async login(email: string, password: string): Promise<AuthFlowResult> {
		const response = await fetch(`${API_BASE_URL}/v1/management/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ email, password })
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ detail: 'Invalid credentials' }));
			throw new Error(error.detail || 'Login failed');
		}

		const data: LoginResponse = await response.json();
		if (data.mfa_required && data.challenge_token) {
			const challenge = {
				challengeToken: data.challenge_token,
				user: data.user,
				delivery: data.delivery || 'email',
				expiresInSeconds: data.expires_in_seconds || 600,
			};
			clearSession();
			persistPendingMfa(challenge);
			return { status: 'mfa_required', user: data.user, challenge };
		}
		clearPendingMfa();
		persistSession(data.user, data.token);
		return { status: 'authenticated', user: data.user };
	},

	async logout(): Promise<void> {
		// Clear local state first - UI updates immediately
		clearSession();
		clearPendingMfa();
		eventEmitter.emit('logout');

		// Await backend so the HttpOnly cookie is properly cleared
		// before the caller navigates away
		try {
			await fetch(`${API_BASE_URL}/v1/management/logout`, {
				method: 'POST',
				credentials: 'include',
			});
		} catch {
			// Network error - local session already cleared. Cookie expires naturally.
		}
	},

	isAuthenticated(): boolean {
		try {
			return Boolean(inMemoryToken || localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(USER_STORAGE_KEY));
		} catch {
			return Boolean(inMemoryToken);
		}
	},

	async restoreSession(force = false): Promise<boolean> {
		// Belt-and-suspenders session validation:
		//   • credentials: 'include' → sends the HttpOnly ks_access_token cookie (cross-site: SameSite=none;Secure)
		//   • Authorization header   → sends the localStorage token as a Bearer token fallback
		//
		// The header fallback is critical: if the cross-site cookie isn't sent (e.g. browser
		// SameSite policy, third-party cookie restrictions), the header keeps the user logged in.
		const storedToken = inMemoryToken ?? (() => {
			try { return localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
		})();

		const headers: Record<string, string> = {};
		if (storedToken) {
			headers['Authorization'] = `Bearer ${storedToken}`;
		}

		try {
			const response = await fetch(`${API_BASE_URL}/v1/management/me`, {
				method: 'GET',
				credentials: 'include',
				headers,
			});
			if (!response.ok) {
				// 401 → session is genuinely invalid, clear everything
				clearSession();
				return false;
			}
			const data = await response.json();
			if (!data?.user) {
				clearSession();
				return false;
			}
			// Keep the existing token (don't overwrite with null just because /me
			// doesn't re-issue one - the token we sent is still valid)
			persistSession(data.user, storedToken ?? undefined);
			return true;
		} catch {
			// Network/CORS error - don't clear the session, just fall back to
			// cached state so a momentary connectivity blip doesn't log users out.
			console.warn(
				force
					? 'Forced session validation failed due to network error; using cached session data when available'
					: 'Session restore failed due to network error'
			);
			if (this.isAuthenticated()) {
				console.warn('Using cached session data');
				return true;
			}
			return false;
		}
	},

	getCurrentUser(): AuthUser | null {
		try {
			const userStr = localStorage.getItem(USER_STORAGE_KEY);
			return userStr ? JSON.parse(userStr) : null;
		} catch {
			return null;
		}
	},

	getPendingMfaChallenge(): PendingMFAChallenge | null {
		try {
			const raw = sessionStorage.getItem(MFA_STORAGE_KEY);
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	},

	clearPendingMfaChallenge(): void {
		clearPendingMfa();
	},

	async verifyMfaCode(code: string): Promise<AuthUser> {
		const challenge = this.getPendingMfaChallenge();
		if (!challenge) {
			throw new Error('No admin verification challenge is in progress');
		}

		const response = await fetch(`${API_BASE_URL}/v1/management/mfa/verify`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ challenge_token: challenge.challengeToken, code }),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ detail: 'Verification failed' }));
			throw new Error(error.detail || 'Verification failed');
		}

		const data: LoginResponse = await response.json();
		clearPendingMfa();
		persistSession(data.user, data.token);
		return data.user;
	},

	async resendMfaCode(): Promise<void> {
		const challenge = this.getPendingMfaChallenge();
		if (!challenge) {
			throw new Error('No admin verification challenge is in progress');
		}

		const response = await fetch(`${API_BASE_URL}/v1/management/mfa/resend`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ challenge_token: challenge.challengeToken }),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ detail: 'Unable to resend code' }));
			throw new Error(error.detail || 'Unable to resend code');
		}

		const data = await response.json().catch(() => ({}));
		persistPendingMfa({
			...challenge,
			expiresInSeconds: Number(data.expires_in_seconds || challenge.expiresInSeconds),
		});
	},

	getToken(): string | null {
		return inMemoryToken;
	},

	setSession(user: AuthUser, token?: string | null) {
		persistSession(user, token ?? undefined);
	},

	async forgotPassword(email: string): Promise<void> {
		const response = await fetch(`${API_BASE_URL}/v1/management/forgot-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email })
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ detail: 'Request failed' }));
			throw new Error(error.detail || 'Failed to send reset email');
		}
	},

	async resetPassword(token: string, newPassword: string): Promise<void> {
		const response = await fetch(`${API_BASE_URL}/v1/management/reset-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token, new_password: newPassword })
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ detail: 'Request failed' }));
			throw new Error(error.detail || 'Failed to reset password');
		}
	},

	async initializeGitHubOAuth(redirectUrl?: string): Promise<{ auth_url: string; state: string }> {
		const response = await fetch(`${API_BASE_URL}/v1/management/oauth/github/login?redirect_url=${encodeURIComponent(redirectUrl || '/dashboard')}`, {
			method: 'GET',
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ detail: 'GitHub OAuth not configured' }));
			throw new Error(error.detail || 'Failed to initialize GitHub OAuth');
		}

		return response.json();
	},

	async initializeGoogleOAuth(redirectUrl?: string): Promise<{ auth_url: string; state: string }> {
		const response = await fetch(`${API_BASE_URL}/v1/management/oauth/google/login?redirect_url=${encodeURIComponent(redirectUrl || '/dashboard')}`, {
			method: 'GET',
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ detail: 'Google OAuth not configured' }));
			throw new Error(error.detail || 'Failed to initialize Google OAuth');
		}

		return response.json();
	},

	async handleGitHubCallback(code: string, state: string): Promise<AuthFlowResult> {
		const response = await fetch(`${API_BASE_URL}/v1/management/oauth/github/callback`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ code, state })
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ detail: 'GitHub callback failed' }));
			throw new Error(error.detail || 'GitHub login failed');
		}

		const data: LoginResponse = await response.json();
		if (data.mfa_required && data.challenge_token) {
			const challenge = {
				challengeToken: data.challenge_token,
				user: data.user,
				delivery: data.delivery || 'email',
				expiresInSeconds: data.expires_in_seconds || 600,
			};
			clearSession();
			persistPendingMfa(challenge);
			return { status: 'mfa_required', user: data.user, challenge };
		}
		clearPendingMfa();
		persistSession(data.user, data.token);
		return { status: 'authenticated', user: data.user };
	},

	async handleGoogleCallback(code: string, state: string): Promise<AuthFlowResult> {
		const response = await fetch(`${API_BASE_URL}/v1/management/oauth/google/callback`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ code, state })
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ detail: 'Google callback failed' }));
			throw new Error(error.detail || 'Google login failed');
		}

		const data: LoginResponse = await response.json();
		if (data.mfa_required && data.challenge_token) {
			const challenge = {
				challengeToken: data.challenge_token,
				user: data.user,
				delivery: data.delivery || 'email',
				expiresInSeconds: data.expires_in_seconds || 600,
			};
			clearSession();
			persistPendingMfa(challenge);
			return { status: 'mfa_required', user: data.user, challenge };
		}
		clearPendingMfa();
		persistSession(data.user, data.token);
		return { status: 'authenticated', user: data.user };
	},

	on(event: AuthEventType, handler: AuthEventHandler) {
		eventEmitter.on(event, handler);
	},

	off(event: AuthEventType, handler: AuthEventHandler) {
		eventEmitter.off(event, handler);
	}
};
