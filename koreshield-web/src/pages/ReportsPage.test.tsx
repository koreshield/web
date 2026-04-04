import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/ToastNotification';
import { ReportsPage } from './ReportsPage';

const { getReports, getReportTemplates, createReport, generateReport, deleteReport, updateReport, downloadReport } = vi.hoisted(() => ({
	getReports: vi.fn(),
	getReportTemplates: vi.fn(),
	createReport: vi.fn(),
	generateReport: vi.fn(),
	deleteReport: vi.fn(),
	updateReport: vi.fn(),
	downloadReport: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
	api: {
		getReports,
		getReportTemplates,
		createReport,
		generateReport,
		deleteReport,
		updateReport,
		downloadReport,
	},
}));

describe('ReportsPage', () => {
	beforeEach(() => {
		getReports.mockReset();
		getReportTemplates.mockReset();
		createReport.mockReset();
		generateReport.mockReset();
		deleteReport.mockReset();
		updateReport.mockReset();
		downloadReport.mockReset();
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
				<ToastProvider>
					<MemoryRouter initialEntries={['/reports']}>
						<Routes>
							<Route path="/reports" element={<ReportsPage />} />
							<Route path="/getting-started" element={<div>Getting Started</div>} />
							<Route path="/dashboard" element={<div>Dashboard</div>} />
						</Routes>
					</MemoryRouter>
				</ToastProvider>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText(/Reports require an admin seat/i)).toBeInTheDocument();
		});
		expect(screen.getByRole('link', { name: /Continue onboarding/i })).toBeInTheDocument();
	});

	it('wires report download and edit actions when reports are available', async () => {
		getReports.mockResolvedValue([
			{
				id: 'report-1',
				name: 'Monthly Security Summary',
				description: 'Security highlights',
				template: 'Security Overview',
				schedule: 'manual',
				format: 'pdf',
				created_at: '2026-04-03T00:00:00Z',
				last_run: '2026-04-03T12:00:00Z',
				status: 'completed',
				filters: { date_range: '30d', providers: [], tenants: [], metrics: [] },
			},
		]);
		getReportTemplates.mockResolvedValue([
			{
				id: 'template-1',
				name: 'Security Overview',
				description: 'Overview',
				category: 'Security',
				available_metrics: ['Blocked threats'],
			},
		]);
		downloadReport.mockResolvedValue({
			blob: new Blob(['ok'], { type: 'application/pdf' }),
			filename: 'monthly-security-summary.pdf',
			contentType: 'application/pdf',
		});
		updateReport.mockResolvedValue({});

		const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
		const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		render(
			<QueryClientProvider client={queryClient}>
				<ToastProvider>
					<MemoryRouter initialEntries={['/reports']}>
						<Routes>
							<Route path="/reports" element={<ReportsPage />} />
						</Routes>
					</MemoryRouter>
				</ToastProvider>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText('Monthly Security Summary')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /Download Monthly Security Summary/i }));
		await waitFor(() => {
			expect(downloadReport).toHaveBeenCalledWith('report-1');
		});

		fireEvent.click(screen.getByRole('button', { name: /Edit Monthly Security Summary/i }));
		await waitFor(() => {
			expect(screen.getByText(/Edit Report/i)).toBeInTheDocument();
		});

		fireEvent.change(screen.getByPlaceholderText(/Monthly Security Summary/i), {
			target: { value: 'Updated Summary' },
		});
		fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));
		await waitFor(() => {
			expect(updateReport).toHaveBeenCalledWith('report-1', expect.objectContaining({ name: 'Updated Summary' }));
		});

		createObjectURLSpy.mockRestore();
		revokeObjectURLSpy.mockRestore();
		clickSpy.mockRestore();
	});
});
