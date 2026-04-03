import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../components/ToastNotification';
import { PoliciesPage } from './PoliciesPage';

const { getPolicies, createPolicy, deletePolicy } = vi.hoisted(() => ({
	getPolicies: vi.fn(),
	createPolicy: vi.fn(),
	deletePolicy: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
	api: {
		getPolicies,
		createPolicy,
		deletePolicy,
	},
}));

function renderPage() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<PoliciesPage />
			</ToastProvider>
		</QueryClientProvider>,
	);
}

describe('PoliciesPage', () => {
	beforeEach(() => {
		getPolicies.mockReset();
		createPolicy.mockReset();
		deletePolicy.mockReset();
		getPolicies.mockResolvedValue([]);
		createPolicy.mockResolvedValue({
			status: 'created',
		});
	});

	it('creates a policy from the modal form', async () => {
		renderPage();

		await screen.findByText(/No Policies Configured/i);
		fireEvent.click(screen.getByRole('button', { name: /Create Your First Policy/i }));

		fireEvent.change(screen.getByLabelText(/Policy name/i), {
			target: { value: 'Protect Prompt Leakage' },
		});
		fireEvent.change(screen.getByLabelText(/Description/i), {
			target: { value: 'Block prompt leakage attempts for protected traffic.' },
		});
		fireEvent.change(screen.getByLabelText(/Severity/i), {
			target: { value: 'high' },
		});

		const submitButtons = screen.getAllByRole('button', { name: /create policy/i });
		fireEvent.click(submitButtons[submitButtons.length - 1]);

		await waitFor(() => {
			expect(createPolicy).toHaveBeenCalledWith({
				id: 'protect-prompt-leakage',
				name: 'Protect Prompt Leakage',
				description: 'Block prompt leakage attempts for protected traffic.',
				severity: 'high',
				roles: ['admin', 'moderator', 'user'],
			});
		});
	});
});
