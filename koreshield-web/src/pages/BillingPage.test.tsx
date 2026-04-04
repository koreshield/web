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

	it('maps hosted billing slugs to the public Growth and Scale plan names', async () => {
		getBillingAccount.mockResolvedValue({
			id: 'acct_1',
			status: 'active',
			plan_slug: 'startup',
			subscription_status: 'active',
			current_period_end: null,
			billing_email: 'ops@koreshield.com',
			external_customer_id: 'cus_123',
			metadata: {
				recurring_interval: 'month',
				active_meter_count: 1,
				granted_benefits: [],
			},
		});

		render(
			<MemoryRouter initialEntries={['/billing']}>
				<Routes>
					<Route path="/billing" element={<BillingPage />} />
				</Routes>
			</MemoryRouter>,
		);

		await waitFor(() => {
			expect(screen.getByText(/^Growth$/i)).toBeInTheDocument();
		});

		expect(screen.getByText(/Hosted plans are sold as Growth and Scale/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /choose growth/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /choose scale/i })).toBeInTheDocument();
	});

	it('shows internal unlimited enterprise accounts as provisioned and disables upgrades', async () => {
		getBillingAccount.mockResolvedValue({
			id: 'acct_internal',
			status: 'active',
			plan_slug: 'enterprise',
			plan_name: 'Enterprise',
			subscription_status: 'active',
			current_period_end: null,
			billing_email: 'ei@koreshield.com',
			external_customer_id: 'team:internal',
			metadata: {
				internal_unlimited: true,
				protected_requests: 'unlimited',
				support: 'priority',
				active_meter_count: 0,
				granted_benefits: [],
			},
		});

		render(
			<MemoryRouter initialEntries={['/billing']}>
				<Routes>
					<Route path="/billing" element={<BillingPage />} />
				</Routes>
			</MemoryRouter>,
		);

		await waitFor(() => {
			expect(screen.getAllByText(/unlimited enterprise access/i).length).toBeGreaterThan(0);
		});

		expect(screen.getByText(/^Enterprise$/i)).toBeInTheDocument();
		expect(screen.getByText(/^unlimited$/i)).toBeInTheDocument();
		expect(screen.getAllByRole('button', { name: /included with internal enterprise access/i })).toHaveLength(2);
		screen.getAllByRole('button', { name: /included with internal enterprise access/i }).forEach((button) => {
			expect(button).toBeDisabled();
		});
	});
});
