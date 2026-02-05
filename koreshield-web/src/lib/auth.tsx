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
    access_token: string;
    token_type: string;
    expires_in: number;
    user: AuthUser;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.koreshield.com';

export const authService = {
    /**
     * Login with Railway backend
     */
    async login(email: string, password: string): Promise<AuthUser> {
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
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
        localStorage.setItem('admin_token', data.access_token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        localStorage.setItem('token_expires_at', String(Date.now() + data.expires_in * 1000));

        return data.user;
    },

    /**
     * Logout - clear stored credentials
     */
    logout(): void {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('token_expires_at');
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
    }
};
