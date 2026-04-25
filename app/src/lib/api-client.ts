
import axios from "axios";
import { authClient } from "./auth-client";

// VITE_API_URL is the canonical name. VITE_API_BASE_URL is accepted for backward compat.
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token from Better Auth session
apiClient.interceptors.request.use(async (config) => {
    try {
        // Fetch current session from Better Auth
        const { data } = await authClient.getSession();
        if (data?.session?.token) {
            config.headers.Authorization = `Bearer ${data.session.token}`;
        }
    } catch (e) {
        // Silent fail if no session (request might fail with 401 later)
    }
    return config;
});

export interface Stats {
    requests_total: number;
    requests_allowed: number;
    requests_blocked: number;
    attacks_detected: number;
    errors: number;
}

export interface SecurityConfig {
    sensitivity: "low" | "medium" | "high";
    default_action: "block" | "allow" | "flag";
    features?: {
        sanitization: boolean;
        detection: boolean;
        policy_enforcement: boolean;
    };
}

export const koreshieldApi = {
    getHealth: async () => {
        const res = await apiClient.get("/health");
        return res.data;
    },

    getStats: async (): Promise<Stats> => {
        const res = await apiClient.get("/v1/management/stats");
        return res.data;
    },

    getConfig: async () => {
        const res = await apiClient.get("/v1/management/config");
        return res.data;
    },

    updateSecurityConfig: async (updates: Partial<SecurityConfig>) => {
        const res = await apiClient.patch("/v1/management/config/security", updates);
        return res.data;
    },


    getLogs: async (params: { limit?: number; offset?: number; level?: string } = {}) => {
        const res = await apiClient.get("/v1/management/logs", { params });
        return res.data;
    },

    getPolicies: async (): Promise<Policy[]> => {
        const res = await apiClient.get("/v1/management/policies");
        return res.data;
    },

    createPolicy: async (policy: Policy) => {
        const res = await apiClient.post("/v1/management/policies", policy);
        return res.data;
    },

    deletePolicy: async (id: string) => {
        const res = await apiClient.delete(`/v1/management/policies/${id}`);
        return res.data;
    },
};

export interface LogEntry {
    timestamp: string;
    level: string;
    event: string;
    request_id?: string;
    [key: string]: any;
}

export interface Policy {
    id: string;
    name: string;
    description: string;
    severity: string;
    roles: string[];
}
