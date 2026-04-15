import type { ChatCompletionRequest, ChatCompletionResponse, HealthCheckResponse, AttackStats } from '../types/api';
import { authService } from './auth';
import { resolveApiBaseUrl } from './api-base';

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

interface APIError {
	message: string;
	code: number;
	details?: unknown;
}

type JsonRecord = Record<string, unknown>;

interface ValidationErrorItem {
	msg?: string;
	message?: string;
}

class ApiClient {
	private baseUrl: string;
	private maxRetries: number = 3;
	private timeout: number = 30000;

	constructor() {
		this.baseUrl = API_BASE_URL;
		// SECURITY: No API keys stored client-side
		// All admin endpoints require JWT authentication from authService
		// Public endpoints (health checks) require no auth
		// This prevents key exposure in frontend bundles
	}

	private async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async fetch<T>(endpoint: string, options: RequestInit = {}, retries = this.maxRetries): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...(options.headers as Record<string, string>),
		};

		// Add JWT token if admin is authenticated
		// SECURITY: Only JWT tokens are used for authentication
		// No fallback to client-side API keys to prevent key exposure
		const adminToken = authService.getToken();
		if (adminToken) {
			headers['Authorization'] = `Bearer ${adminToken}`;
		}

		try {
			const response = await fetch(url, {
				...options,
				headers,
				credentials: 'include',
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMessage = this.getErrorMessage(response.status, errorData);
				const error = new Error(errorMessage) as Error & APIError;
				error.code = response.status;
				error.details = errorData.details || errorData.detail;

				// If 401, logout admin
				if (response.status === 401 && authService.isAuthenticated()) {
					authService.logout();
					window.location.href = '/login';
				}

				// Retry on 5xx errors
				if (response.status >= 500 && retries > 0) {
					await this.delay(1000 * (this.maxRetries - retries + 1));
					return this.fetch<T>(endpoint, options, retries - 1);
				}

				throw error;
			}

			const contentType = response.headers.get('content-type') || '';
			if (contentType.includes('text/plain')) {
				return await response.text() as unknown as T;
			}
			return await response.json();
		} catch (error) {
			clearTimeout(timeoutId);

			// Retry on network errors
			if (error instanceof Error && error.name !== 'AbortError' && retries > 0) {
				await this.delay(1000 * (this.maxRetries - retries + 1));
				return this.fetch<T>(endpoint, options, retries - 1);
			}

			console.error(`Request failed: ${endpoint}`, error);
			throw error;
		}
	}

	private getErrorMessage(status: number, errorData: unknown): string {
		const errorObject = typeof errorData === 'object' && errorData !== null ? errorData as JsonRecord : null;
		if (typeof errorObject?.error === 'string') return errorObject.error;
		if (typeof errorObject?.message === 'string') return errorObject.message;
		if (typeof errorObject?.detail === 'string') return errorObject.detail;
		if (Array.isArray(errorObject?.detail)) {
			const messages = (errorObject.detail as ValidationErrorItem[])
				.map((item) => item?.msg || item?.message)
				.filter(Boolean);
			if (messages.length) {
				return messages.join('; ');
			}
		}
		return `HTTP ${status}`;
	}

	async chatCompletion(payload: ChatCompletionRequest): Promise<ChatCompletionResponse> {
		return this.fetch<ChatCompletionResponse>('/v1/chat/completions', {
			method: 'POST',
			body: JSON.stringify(payload),
		});
	}

	async getHealth(): Promise<HealthCheckResponse> {
		return this.fetch<HealthCheckResponse>('/health');
	}

	async getStats(): Promise<AttackStats> {
		// Per-account stats scoped to the authenticated user — never platform-wide
		return this.fetch<AttackStats>('/v1/management/stats');
	}

	async getMetrics(): Promise<string> {
		return this.fetch('/metrics', {
			headers: { Accept: 'text/plain' }
		});
	}

	async getProviderHealth() {
		return this.fetch('/health/providers');
	}

	async getRecentAttacks(limit = 10) {
		return this.getAuditLogs(limit, 0);
	}

	async scanText(content: string, metadata?: JsonRecord) {
		return this.fetch('/v1/scan', {
			method: 'POST',
			body: JSON.stringify({ prompt: content, metadata }),
		});
	}

	async getAuditLogs(limit = 100, offset = 0, level?: string) {
		const params = new URLSearchParams({
			limit: String(limit),
			offset: String(offset),
		});
		if (level) {
			params.append('level', level);
		}
		return this.fetch(`/v1/management/logs?${params.toString()}`);
	}

	async getRuntimeReviews(limit = 50, status?: string) {
		const params = new URLSearchParams({ limit: String(limit) });
		if (status) {
			params.append('status', status);
		}
		return this.fetch(`/v1/tools/reviews?${params.toString()}`);
	}

	async decideRuntimeReview(ticketId: string, decision: 'approved' | 'rejected', note?: string) {
		return this.fetch(`/v1/tools/reviews/${ticketId}/decision`, {
			method: 'POST',
			body: JSON.stringify({ decision, note }),
		});
	}

	async getRuntimeSessions(limit = 50, status?: string) {
		const params = new URLSearchParams({ limit: String(limit) });
		if (status) {
			params.append('status', status);
		}
		return this.fetch(`/v1/tools/sessions?${params.toString()}`);
	}

	// Policy Management
	async getPolicies() {
		return this.fetch('/v1/management/policies');
	}

	async createPolicy(policy: JsonRecord) {
		return this.fetch('/v1/management/policies', {
			method: 'POST',
			body: JSON.stringify(policy),
		});
	}

	async updateMe(data: { name?: string; company?: string; job_title?: string }) {
		return this.fetch('/v1/management/me', {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	}

	async getBillingAccount() {
		return this.fetch('/v1/billing/account');
	}

	async syncBillingAccount() {
		return this.fetch('/v1/billing/sync', {
			method: 'POST',
		});
	}

	async createBillingCheckout(productId: string, successUrl?: string) {
		return this.fetch('/v1/billing/checkout', {
			method: 'POST',
			body: JSON.stringify({
				product_id: productId,
				success_url: successUrl,
			}),
		});
	}

	async createBillingPortal(returnUrl?: string) {
		return this.fetch('/v1/billing/portal', {
			method: 'POST',
			body: JSON.stringify({
				return_url: returnUrl,
			}),
		});
	}

	async deletePolicy(policyId: string) {
		return this.fetch(`/v1/management/policies/${policyId}`, {
			method: 'DELETE',
		});
	}

	// Phase 3: RBAC APIs
	async getUsers(params?: { search?: string; role?: string }) {
		const queryParams = new URLSearchParams(
			Object.entries(params ?? {}).flatMap(([key, value]) =>
				typeof value === 'string' && value ? [[key, value]] : [],
			),
		).toString();
		return this.fetch(`/v1/rbac/users${queryParams ? '?' + queryParams : ''}`);
	}

	async createUser(userData: JsonRecord) {
		return this.fetch('/v1/rbac/users', {
			method: 'POST',
			body: JSON.stringify(userData),
		});
	}

	async updateUser(userId: string, userData: JsonRecord) {
		return this.fetch(`/v1/rbac/users/${userId}`, {
			method: 'PUT',
			body: JSON.stringify(userData),
		});
	}

	async deleteUser(userId: string) {
		return this.fetch(`/v1/rbac/users/${userId}`, {
			method: 'DELETE',
		});
	}

	async getRoles() {
		return this.fetch('/v1/rbac/roles');
	}

	async createRole(roleData: JsonRecord) {
		return this.fetch('/v1/rbac/roles', {
			method: 'POST',
			body: JSON.stringify(roleData),
		});
	}

	async updateRole(roleId: string, roleData: JsonRecord) {
		return this.fetch(`/v1/rbac/roles/${roleId}`, {
			method: 'PUT',
			body: JSON.stringify(roleData),
		});
	}

	async deleteRole(roleId: string) {
		return this.fetch(`/v1/rbac/roles/${roleId}`, {
			method: 'DELETE',
		});
	}

	async getPermissions(category?: string) {
		const queryParams = category ? `?category=${category}` : '';
		return this.fetch(`/v1/rbac/permissions${queryParams}`);
	}

	// Phase 3: Reports APIs
	async getReports() {
		return this.fetch('/v1/reports');
	}

	async createReport(reportData: JsonRecord) {
		return this.fetch('/v1/reports', {
			method: 'POST',
			body: JSON.stringify(reportData),
		});
	}

	async updateReport(reportId: string, reportData: JsonRecord) {
		return this.fetch(`/v1/reports/${reportId}`, {
			method: 'PUT',
			body: JSON.stringify(reportData),
		});
	}

	async deleteReport(reportId: string) {
		return this.fetch(`/v1/reports/${reportId}`, {
			method: 'DELETE',
		});
	}

	async getReportTemplates() {
		return this.fetch('/v1/reports/templates');
	}

	async generateReport(reportId: string) {
		return this.fetch(`/v1/reports/${reportId}/generate`, {
			method: 'POST',
		});
	}

	async downloadReport(reportId: string) {
		const url = `${this.baseUrl}/v1/reports/${reportId}/download`;
		const headers: Record<string, string> = {};
		const adminToken = authService.getToken();
		if (adminToken) {
			headers.Authorization = `Bearer ${adminToken}`;
		}
		const response = await fetch(url, {
			method: 'GET',
			headers,
			credentials: 'include',
		});
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(this.getErrorMessage(response.status, errorData));
		}
		const blob = await response.blob();
		const disposition = response.headers.get('content-disposition') || '';
		const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
		return {
			blob,
			contentType: response.headers.get('content-type') || 'application/octet-stream',
			filename: filenameMatch?.[1] || `report-${reportId}`,
		};
	}

	// Phase 3: Teams APIs
	async getTeams(status?: string) {
		const queryParams = status ? `?status=${status}` : '';
		return this.fetch(`/v1/teams${queryParams}`);
	}

	async createTeam(teamData: JsonRecord) {
		return this.fetch('/v1/teams', {
			method: 'POST',
			body: JSON.stringify(teamData),
		});
	}

	async updateTeam(teamId: string, teamData: JsonRecord) {
		return this.fetch(`/v1/teams/${teamId}`, {
			method: 'PUT',
			body: JSON.stringify(teamData),
		});
	}

	async deleteTeam(teamId: string) {
		return this.fetch(`/v1/teams/${teamId}`, {
			method: 'DELETE',
		});
	}

	async getTeam(teamId: string) {
		return this.fetch(`/v1/teams/${teamId}`);
	}

	async getTeamMembers(teamId: string, role?: string) {
		const queryParams = role ? `?role=${role}` : '';
		return this.fetch(`/v1/teams/${teamId}/members${queryParams}`);
	}

	async updateMemberRole(teamId: string, memberId: string, role: string) {
		return this.fetch(`/v1/teams/${teamId}/members/${memberId}/role`, {
			method: 'POST',
			body: JSON.stringify({ role }),
		});
	}

	async removeMember(teamId: string, userId: string) {
		return this.fetch(`/v1/teams/${teamId}/members/${userId}`, {
			method: 'DELETE',
		});
	}

	async getTeamInvites(teamId: string, status?: string) {
		const queryParams = status ? `?status_filter=${status}` : '';
		return this.fetch(`/v1/teams/${teamId}/invites${queryParams}`);
	}

	async createTeamInvite(teamId: string, inviteData: { email: string; role: string }) {
		return this.fetch(`/v1/teams/${teamId}/invites`, {
			method: 'POST',
			body: JSON.stringify(inviteData),
		});
	}

	async addMember(teamId: string, memberData: { email: string; role: string }) {
		return this.fetch(`/v1/teams/${teamId}/members`, {
			method: 'POST',
			body: JSON.stringify(memberData),
		});
	}

	async cancelInvite(teamId: string, inviteId: string) {
		return this.fetch(`/v1/teams/${teamId}/invites/${inviteId}`, {
			method: 'DELETE',
		});
	}

	async getSharedDashboards(teamId: string, type?: string) {
		const queryParams = type ? `?dashboard_type=${type}` : '';
		return this.fetch(`/v1/teams/${teamId}/dashboards${queryParams}`);
	}

	async createSharedDashboard(teamId: string, dashboardData: JsonRecord) {
		return this.fetch(`/v1/teams/${teamId}/dashboards`, {
			method: 'POST',
			body: JSON.stringify(dashboardData),
		});
	}

	async deleteSharedDashboard(teamId: string, dashboardId: string) {
		return this.fetch(`/v1/teams/${teamId}/dashboards/${dashboardId}`, {
			method: 'DELETE',
		});
	}

	// API Key Management APIs
	async generateApiKey(data: { name: string; description?: string; expires_in_days?: number; expires_at?: string }) {
		return this.fetch('/v1/management/api-keys', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async getApiKeys() {
		return this.fetch('/v1/management/api-keys');
	}

	async revokeApiKey(keyId: string) {
		return this.fetch(`/v1/management/api-keys/${keyId}`, {
			method: 'DELETE',
		});
	}

	async getApiKey(keyId: string) {
		return this.fetch(`/v1/management/api-keys/${keyId}`);
	}

	// Rules Management APIs (custom detection rules)
	async getRules() {
		return this.fetch('/v1/management/rules');
	}

	async getRule(ruleId: string) {
		return this.fetch(`/v1/management/rules/${ruleId}`);
	}

	async createRule(ruleData: JsonRecord) {
		return this.fetch('/v1/management/rules', {
			method: 'POST',
			body: JSON.stringify(ruleData),
		});
	}

	async updateRule(ruleId: string, ruleData: JsonRecord) {
		return this.fetch(`/v1/management/rules/${ruleId}`, {
			method: 'PUT',
			body: JSON.stringify(ruleData),
		});
	}

	async deleteRule(ruleId: string) {
		return this.fetch(`/v1/management/rules/${ruleId}`, {
			method: 'DELETE',
		});
	}

	async testRule(ruleData: JsonRecord) {
		return this.fetch('/v1/management/rules/test', {
			method: 'POST',
			body: JSON.stringify(ruleData),
		});
	}

	// Alerts Management APIs
	async getAlertRules() {
		return this.fetch('/v1/management/alerts/rules');
	}

	async getAlertRule(ruleId: string) {
		return this.fetch(`/v1/management/alerts/rules/${ruleId}`);
	}

	async createAlertRule(ruleData: JsonRecord) {
		return this.fetch('/v1/management/alerts/rules', {
			method: 'POST',
			body: JSON.stringify(ruleData),
		});
	}

	async updateAlertRule(ruleId: string, ruleData: JsonRecord) {
		return this.fetch(`/v1/management/alerts/rules/${ruleId}`, {
			method: 'PUT',
			body: JSON.stringify(ruleData),
		});
	}

	async deleteAlertRule(ruleId: string) {
		return this.fetch(`/v1/management/alerts/rules/${ruleId}`, {
			method: 'DELETE',
		});
	}

	async getAlertChannels() {
		return this.fetch('/v1/management/alerts/channels');
	}

	async createAlertChannel(channelData: JsonRecord) {
		return this.fetch('/v1/management/alerts/channels', {
			method: 'POST',
			body: JSON.stringify(channelData),
		});
	}

	async updateAlertChannel(channelId: string, channelData: JsonRecord) {
		return this.fetch(`/v1/management/alerts/channels/${channelId}`, {
			method: 'PUT',
			body: JSON.stringify(channelData),
		});
	}

	async deleteAlertChannel(channelId: string) {
		return this.fetch(`/v1/management/alerts/channels/${channelId}`, {
			method: 'DELETE',
		});
	}

	async testAlertChannel(channelId: string) {
		return this.fetch('/v1/management/alerts/channels/test', {
			method: 'POST',
			body: JSON.stringify({ channel_id: channelId }),
		});
	}

	// Analytics APIs
	async getAnalyticsTenants() {
		return this.fetch('/v1/analytics/tenants');
	}

	async getCostAnalytics(params?: { start_date?: string; end_date?: string; provider?: string }) {
		const queryParams = new URLSearchParams();
		if (params?.start_date) queryParams.append('start_date', params.start_date);
		if (params?.end_date) queryParams.append('end_date', params.end_date);
		if (params?.provider) queryParams.append('provider', params.provider);
		const query = queryParams.toString();
		return this.fetch(`/v1/analytics/costs${query ? `?${query}` : ''}`);
	}

	async getCostSummary() {
		return this.fetch('/v1/analytics/costs/summary');
	}

	async getAttackVectors(timeRange: '7d' | '30d' | '90d' | '1y' | 'today' = '7d') {
		return this.fetch(`/v1/analytics/attack-vectors?time_range=${timeRange}`);
	}

	async getTopEndpoints(timeRange: '7d' | '30d' | '90d' | '1y' | 'today' = '7d', limit = 10) {
		return this.fetch(`/v1/analytics/top-endpoints?time_range=${timeRange}&limit=${limit}`);
	}

	async getProviderMetrics(timeRange: '7d' | '30d' | '90d' | '1y' | 'today' = '7d') {
		return this.fetch(`/v1/analytics/provider-metrics?time_range=${timeRange}`);
	}

	async getCompliancePosture() {
		return this.fetch('/v1/analytics/compliance-posture');
	}

	// Export functionality
	async exportData(type: 'csv' | 'pdf', endpoint: string, params?: JsonRecord) {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${authService.getToken()}`,
			},
			body: JSON.stringify({ format: type, ...params }),
		});

		if (!response.ok) {
			throw new Error(`Export failed: ${response.statusText}`);
		}

		const blob = await response.blob();
		return blob;
	}

	// RAG Security - Scan retrieved documents for indirect prompt injection
	async scanRAGContext(params: {
		user_query?: string;
		documents: Array<{
			id: string;
			content: string;
			metadata?: Record<string, unknown>;
			score?: number;
		}>;
		config?: {
			min_confidence?: number;
			enable_cross_document_analysis?: boolean;
			max_excerpt_length?: number;
		};
	}) {
		return this.fetch('/v1/rag/scan', {
			method: 'POST',
			body: JSON.stringify(params),
		});
	}

	async getRagScanHistory(limit = 20, offset = 0) {
		const params = new URLSearchParams({
			limit: String(limit),
			offset: String(offset),
		});
		return this.fetch(`/v1/rag/scans?${params.toString()}`);
	}

	async getRagScan(scanId: string) {
		return this.fetch(`/v1/rag/scans/${scanId}`);
	}

	async deleteRagScan(scanId: string) {
		return this.fetch(`/v1/rag/scans/${scanId}`, {
			method: 'DELETE',
		});
	}

	async clearRagScans() {
		return this.fetch('/v1/rag/scans', {
			method: 'DELETE',
		});
	}

	async downloadRagScanPack(scanId: string): Promise<Blob> {
		const url = `${this.baseUrl}/v1/rag/scans/${scanId}/pack`;
		const headers: Record<string, string> = {};
		const adminToken = authService.getToken();
		if (adminToken) {
			headers['Authorization'] = `Bearer ${adminToken}`;
		}
		const response = await fetch(url, {
			method: 'GET',
			headers,
			credentials: 'include',
		});
		if (!response.ok) {
			throw new Error(`Download failed: ${response.statusText}`);
		}
		return response.blob();
	}
}

export const api = new ApiClient();
