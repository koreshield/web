/**
 * Authentication service for KoreShield admin UI.
 * Uses secure HttpOnly cookie sessions with in-memory bearer fallback.
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
const USER_STORAGE_KEY = 'admin_user';
const MFA_STORAGE_KEY = 'admin_mfa_challenge';

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
let inMemoryToken: string | null = null;

function persistSession(user: AuthUser, token?: string | null) {
	inMemoryToken = token ?? null;
	sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
	clearAuthenticatedQueryCache();
	eventEmitter.emit('login');
}

function clearSession() {
	inMemoryToken = null;
	sessionStorage.removeItem(USER_STORAGE_KEY);
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
		// Clear local state first — UI updates immediately
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
			// Network error — local session already cleared. Cookie expires naturally.
		}
	},

	isAuthenticated(): boolean {
		return Boolean(inMemoryToken || sessionStorage.getItem(USER_STORAGE_KEY));
	},

	async restoreSession(force = false): Promise<boolean> {
		// Always validate with backend - don't trust stale sessionStorage
		// This prevents logout-on-refresh bug where old data causes false auth checks
		try {
			const response = await fetch(`${API_BASE_URL}/v1/management/me`, {
				method: 'GET',
				credentials: 'include',
			});
			if (!response.ok) {
				clearSession();
				return false;
			}
			const data = await response.json();
			if (!data?.user) {
				clearSession();
				return false;
			}
			persistSession(data.user, inMemoryToken);
			return true;
		} catch {
			// Network error - if we have local data, trust it temporarily.
			// Forced checks still hit the backend first, but can fall back to cached
			// state when the network itself is the only failure mode.
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
		const userStr = sessionStorage.getItem(USER_STORAGE_KEY);
		return userStr ? JSON.parse(userStr) : null;
	},

	getPendingMfaChallenge(): PendingMFAChallenge | null {
		const raw = sessionStorage.getItem(MFA_STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
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
		persistSession(user, token);
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
