/**
 * Authentication service for KoreShield admin UI.
 * Uses secure HttpOnly cookie sessions with in-memory bearer fallback.
 */
import { resolveApiBaseUrl } from './api-base';

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	role: string;
	status?: string;
}

export interface LoginResponse {
	token?: string;
	user: AuthUser;
}

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const USER_STORAGE_KEY = 'admin_user';

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
	eventEmitter.emit('login');
}

function clearSession() {
	inMemoryToken = null;
	sessionStorage.removeItem(USER_STORAGE_KEY);
}

export const authService = {
	async login(email: string, password: string): Promise<AuthUser> {
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
		persistSession(data.user, data.token);
		return data.user;
	},

	logout(): void {
		clearSession();
		void fetch(`${API_BASE_URL}/v1/management/logout`, {
			method: 'POST',
			credentials: 'include',
		}).catch(() => undefined);
		eventEmitter.emit('logout');
	},

	isAuthenticated(): boolean {
		return Boolean(inMemoryToken || sessionStorage.getItem(USER_STORAGE_KEY));
	},

	async restoreSession(): Promise<boolean> {
		if (this.isAuthenticated()) {
			return true;
		}

		try {
			const response = await fetch(`${API_BASE_URL}/v1/management/me`, {
				method: 'GET',
				credentials: 'include',
			});
			if (!response.ok) {
				return false;
			}
			const data = await response.json();
			if (!data?.user) {
				return false;
			}
			persistSession(data.user);
			return true;
		} catch {
			return false;
		}
	},

	getCurrentUser(): AuthUser | null {
		const userStr = sessionStorage.getItem(USER_STORAGE_KEY);
		return userStr ? JSON.parse(userStr) : null;
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

	on(event: AuthEventType, handler: AuthEventHandler) {
		eventEmitter.on(event, handler);
	},

	off(event: AuthEventType, handler: AuthEventHandler) {
		eventEmitter.off(event, handler);
	}
};
