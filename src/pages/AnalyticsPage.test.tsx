import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AnalyticsPage } from './AnalyticsPage';

const { getAnalyticsTenants } = vi.hoisted(() => ({
	getAnalyticsTenants: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
	api: {
		getAnalyticsTenants,
	},
}));

describe('AnalyticsPage', () => {
	beforeEach(() => {
		getAnalyticsTenants.mockReset();
	});

	it('explains when tenant analytics are restricted to admins', async () => {
		const permissionError = Object.assign(new Error('Insufficient permissions'), { code: 403 });
		getAnalyticsTenants.mockRejectedValue(permissionError);

		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={['/analytics']}>
					<Routes>
						<Route path="/analytics" element={<AnalyticsPage />} />
						<Route path="/getting-started" element={<div>Getting Started</div>} />
						<Route path="/dashboard" element={<div>Dashboard</div>} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText(/Analytics require an admin seat/i)).toBeInTheDocument();
		});
		expect(screen.getByText(/Continue onboarding/i)).toBeInTheDocument();
	});
});
