/**
 * Simple authentication system using Railway backend
 * No third-party services needed
 */

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

export const authService = {
    /**
     * Login with Railway backend
     */
    async login(email: string, password: string): Promise<AuthUser> {
        const response = await fetch(`${API_BASE_URL}/v1/management/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Invalid credentials' }));
            throw new Error(error.detail || 'Login failed');
        }

        const data: LoginResponse = await response.json();

        // Store token and user info
        // SECURITY NOTE: Storing tokens in localStorage is susceptible to XSS.
        // We mitigate this via strict Content-Security-Policy (CSP) headers in index.html.
        // For higher security, consider refactoring to backend-set HttpOnly cookies.
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        // Default token expiration: 24 hours
        localStorage.setItem('token_expires_at', String(Date.now() + 24 * 60 * 60 * 1000));

        // Emit login event
        eventEmitter.emit('login');

        return data.user;
    },

    /**
     * Logout - clear stored credentials
     */
    logout(): void {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('token_expires_at');
        
        // Emit logout event
        eventEmitter.emit('logout');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const token = localStorage.getItem('admin_token');
        const expiresAt = localStorage.getItem('token_expires_at');

        if (!token || !expiresAt) {
            return false;
        }

        // Check if token is expired
        if (Date.now() > parseInt(expiresAt)) {
            this.logout();
            return false;
        }

        return true;
    },

    /**
     * Get current user info
     */
    getCurrentUser(): AuthUser | null {
        const userStr = localStorage.getItem('admin_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Get JWT token for API calls
     */
    getToken(): string | null {
        if (!this.isAuthenticated()) {
            return null;
        }
        return localStorage.getItem('admin_token');
    },

    /**
     * Register event handler
     */
    on(event: AuthEventType, handler: AuthEventHandler) {
        eventEmitter.on(event, handler);
    },

    /**
     * Unregister event handler
     */
    off(event: AuthEventType, handler: AuthEventHandler) {
        eventEmitter.off(event, handler);
    }
};
