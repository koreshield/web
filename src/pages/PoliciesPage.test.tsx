import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../components/ToastNotification';
import { PoliciesPage } from './PoliciesPage';

const { getPolicies, createPolicy, updatePolicy, deletePolicy } = vi.hoisted(() => ({
	getPolicies: vi.fn(),
	createPolicy: vi.fn(),
	updatePolicy: vi.fn(),
	deletePolicy: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
	api: {
		getPolicies,
		createPolicy,
		updatePolicy,
		deletePolicy,
	},
}));

vi.mock('../hooks/useAuthState', () => ({
	useAuthState: () => ({
		user: {
			role: 'owner',
		},
	}),
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
		updatePolicy.mockReset();
		deletePolicy.mockReset();
		getPolicies.mockResolvedValue([]);
		createPolicy.mockResolvedValue({
			status: 'created',
		});
		updatePolicy.mockResolvedValue({
			status: 'updated',
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

	it('edits an existing policy from the modal form', async () => {
		getPolicies.mockResolvedValue([
			{
				id: 'protect-prompt-leakage',
				name: 'Protect Prompt Leakage',
				description: 'Block prompt leakage attempts for protected traffic.',
				severity: 'high',
				roles: ['admin', 'moderator'],
				enabled: true,
			},
		]);

		renderPage();

		await screen.findByText(/Protect Prompt Leakage/i);
		fireEvent.click(screen.getByTitle(/Edit/i));

		fireEvent.change(screen.getByLabelText(/Description/i), {
			target: { value: 'Updated policy description for protected traffic.' },
		});

		fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

		await waitFor(() => {
			expect(updatePolicy).toHaveBeenCalledWith('protect-prompt-leakage', {
				id: 'protect-prompt-leakage',
				name: 'Protect Prompt Leakage',
				description: 'Updated policy description for protected traffic.',
				severity: 'high',
				roles: ['admin', 'moderator'],
			});
		});
	});
});
