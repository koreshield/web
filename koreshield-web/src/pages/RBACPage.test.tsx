import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ToastProvider } from '../components/ToastNotification';
import { RBACPage } from './RBACPage';

const {
	getUsers,
	getRoles,
	getPermissions,
	createUser,
	updateUser,
	deleteUser,
	createRole,
	updateRole,
	deleteRole,
} = vi.hoisted(() => ({
	getUsers: vi.fn(),
	getRoles: vi.fn(),
	getPermissions: vi.fn(),
	createUser: vi.fn(),
	updateUser: vi.fn(),
	deleteUser: vi.fn(),
	createRole: vi.fn(),
	updateRole: vi.fn(),
	deleteRole: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
	api: {
		getUsers,
		getRoles,
		getPermissions,
		createUser,
		updateUser,
		deleteUser,
		createRole,
		updateRole,
		deleteRole,
	},
}));

describe('RBACPage', () => {
	beforeEach(() => {
		getUsers.mockReset();
		getRoles.mockReset();
		getPermissions.mockReset();
		deleteRole.mockReset();
		updateRole.mockReset();
		getUsers.mockResolvedValue([]);
		getRoles.mockResolvedValue([
			{
				id: '999',
				name: 'Custom Role',
				description: 'Custom permissions',
				permissions: ['view:dashboard'],
				user_count: 0,
			},
		]);
		getPermissions.mockResolvedValue([
			{ id: '1', name: 'view:dashboard', description: 'View dashboard', category: 'Dashboard' },
		]);
	});

	it('allows deleting a custom role from the role cards', async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		vi.spyOn(window, 'confirm').mockReturnValue(true);
		deleteRole.mockResolvedValue(undefined);

		render(
			<QueryClientProvider client={queryClient}>
				<ToastProvider>
					<RBACPage />
				</ToastProvider>
			</QueryClientProvider>,
		);

		fireEvent.click(screen.getByRole('button', { name: /Roles/i }));

		await waitFor(() => {
			expect(screen.getByText('Custom Role')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /Delete role Custom Role/i }));

		await waitFor(() => {
			expect(deleteRole).toHaveBeenCalledWith('999');
		});
	});
});
