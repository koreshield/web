import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BillingPage from './BillingPage';

const { getBillingAccount } = vi.hoisted(() => ({
	getBillingAccount: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
	api: {
		getBillingAccount,
		createBillingCheckout: vi.fn(),
		createBillingPortal: vi.fn(),
		syncBillingAccount: vi.fn(),
	},
}));

describe('BillingPage', () => {
	beforeEach(() => {
		getBillingAccount.mockReset();
	});

	it('shows a clear hosted-billing warning when Polar is not configured', async () => {
		getBillingAccount.mockRejectedValue(new Error('POLAR_ACCESS_TOKEN is not configured'));

		render(
			<MemoryRouter initialEntries={['/billing']}>
				<Routes>
					<Route path="/billing" element={<BillingPage />} />
				</Routes>
			</MemoryRouter>,
		);

		await waitFor(() => {
			expect(screen.getByText(/Hosted billing is not fully configured in this environment yet/i)).toBeInTheDocument();
		});
	});
});
