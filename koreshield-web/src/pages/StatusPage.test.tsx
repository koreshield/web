import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import StatusPage from './StatusPage';

const { getHealth, getStats, getProviderHealth, getOperationalStatus } = vi.hoisted(() => ({
	getHealth: vi.fn(),
	getStats: vi.fn(),
	getProviderHealth: vi.fn(),
	getOperationalStatus: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
	api: {
		getHealth,
		getStats,
		getProviderHealth,
		getOperationalStatus,
	},
}));

describe('StatusPage', () => {
	it('shows real status actions and live component messaging', async () => {
		getHealth.mockResolvedValue({ status: 'healthy', version: '0.1.0' });
		getStats.mockResolvedValue({
			status: 'healthy',
			version: '0.1.0',
			statistics: {
				requests_total: 42,
				requests_allowed: 38,
				requests_blocked: 4,
				attacks_detected: 4,
				errors: 0,
			},
			providers: {
				openai: { enabled: true, credentials_present: true, initialized: true, priority: 0, type: 'OpenAIProvider', status: 'initialized' },
			},
			total_providers: 1,
			enabled_providers: 1,
			initialized_providers: 1,
			components: {
				provider_routing: {
					status: 'operational',
					detail: 'All 1 initialized provider routes are healthy.',
				},
			},
		});
		getProviderHealth.mockResolvedValue({
			providers: {
				openai: { enabled: true, credentials_present: true, initialized: true, healthy: true, priority: 0, type: 'OpenAIProvider', status: 'healthy' },
			},
			total_providers: 1,
			enabled_providers: 1,
			healthy_providers: 1,
			initialized_providers: 1,
			configured: true,
		});
		getOperationalStatus.mockResolvedValue({
			status: 'healthy',
			version: '0.1.0',
			statistics: {
				requests_total: 42,
				requests_allowed: 38,
				requests_blocked: 4,
				attacks_detected: 4,
				errors: 0,
			},
			providers: {
				openai: { enabled: true, credentials_present: true, initialized: true, healthy: true, priority: 0, type: 'OpenAIProvider', status: 'healthy' },
			},
			components: {
				provider_routing: {
					status: 'operational',
					detail: 'All 1 initialized provider routes are healthy.',
				},
			},
			uptime_history: [
				{ date: '2026-04-20', uptime_percentage: 100, incidents: 0, sample_count: 12 },
				{ date: '2026-04-21', uptime_percentage: 100, incidents: 0, sample_count: 8 },
			],
			incidents: [
				{
					id: 'inc_live',
					title: 'Live monitoring remains healthy',
					severity: 'minor',
					status: 'resolved',
					affected_components: ['provider-routing'],
					created_at: '2026-04-21T10:00:00Z',
					updated_at: '2026-04-21T10:15:00Z',
					resolved_at: '2026-04-21T10:15:00Z',
					updates: [
						{
							message: 'No active disruption remains.',
							timestamp: '2026-04-21T10:15:00Z',
							status: 'resolved',
						},
					],
				},
			],
			maintenance_windows: [],
			evidence: {
				snapshot_count: 20,
				last_recorded_at: '2026-04-21T11:00:00Z',
			},
		});

		render(
			<HelmetProvider>
				<StatusPage />
			</HelmetProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText(/Protected requests observed/i)).toBeInTheDocument();
		});

		expect(screen.getByText('42')).toBeInTheDocument();
		expect(screen.getByText('4')).toBeInTheDocument();
		expect(screen.getAllByText('1').length).toBeGreaterThan(0);
		expect(screen.getByRole('link', { name: /Subscribe to Alerts/i })).toHaveAttribute(
			'href',
			expect.stringContaining('mailto:hello@koreshield.com'),
		);
		expect(screen.getByRole('link', { name: /RSS Feed/i })).toHaveAttribute('href', '/status-feed.xml');
		expect(screen.getByText(/All 1 initialized provider routes are healthy/i)).toBeInTheDocument();
		expect(screen.getByText(/Evidence last recorded/i)).toBeInTheDocument();
		expect(screen.getByText(/Live monitoring remains healthy/i)).toBeInTheDocument();
		expect(screen.getByText(/Live Provider Routes/i)).toBeInTheDocument();
		expect(screen.getByText(/Health check/i)).toBeInTheDocument();
	});
});
