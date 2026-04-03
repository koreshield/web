import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import StatusPage from './StatusPage';

const { getHealth, getStats, getProviderHealth } = vi.hoisted(() => ({
	getHealth: vi.fn(),
	getStats: vi.fn(),
	getProviderHealth: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
	api: {
		getHealth,
		getStats,
		getProviderHealth,
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
				openai: { configured: true, priority: 0, type: 'OpenAIProvider' },
			},
			total_providers: 1,
		});
		getProviderHealth.mockResolvedValue({
			providers: {
				openai: { healthy: true, priority: 0, type: 'OpenAIProvider' },
			},
			total_providers: 1,
			healthy_providers: 1,
			configured: true,
		});

		render(
			<HelmetProvider>
				<StatusPage />
			</HelmetProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText(/Protected requests observed/i)).toBeInTheDocument();
		});

		expect(screen.getByRole('link', { name: /Subscribe to Alerts/i })).toHaveAttribute(
			'href',
			expect.stringContaining('mailto:status@koreshield.com'),
		);
		expect(screen.getByRole('link', { name: /RSS Feed/i })).toHaveAttribute('href', '/status-feed.xml');
		expect(screen.getByText(/Provider routing is active with 1 configured backend/i)).toBeInTheDocument();
	});
});
