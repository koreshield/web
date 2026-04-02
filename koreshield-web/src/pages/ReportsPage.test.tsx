import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReportsPage } from './ReportsPage';

const { getReports, getReportTemplates, createReport, generateReport, deleteReport } = vi.hoisted(() => ({
	getReports: vi.fn(),
	getReportTemplates: vi.fn(),
	createReport: vi.fn(),
	generateReport: vi.fn(),
	deleteReport: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
	api: {
		getReports,
		getReportTemplates,
		createReport,
		generateReport,
		deleteReport,
	},
}));

describe('ReportsPage', () => {
	beforeEach(() => {
		getReports.mockReset();
		getReportTemplates.mockReset();
	});

	it('shows a clear admin access message when the API returns 403', async () => {
		const permissionError = Object.assign(new Error('Insufficient permissions'), { code: 403 });
		getReports.mockRejectedValue(permissionError);
		getReportTemplates.mockRejectedValue(permissionError);

		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={['/reports']}>
					<Routes>
						<Route path="/reports" element={<ReportsPage />} />
						<Route path="/getting-started" element={<div>Getting Started</div>} />
						<Route path="/dashboard" element={<div>Dashboard</div>} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText(/Reports require an admin seat/i)).toBeInTheDocument();
		});
		expect(screen.getByText(/Continue onboarding/i)).toBeInTheDocument();
	});
});
