import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SignupPage } from './SignupPage';

const { setSession } = vi.hoisted(() => ({
	setSession: vi.fn(),
}));

vi.mock('../lib/auth', () => ({
	authService: {
		setSession,
	},
}));

describe('SignupPage', () => {
	beforeEach(() => {
		setSession.mockReset();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					user: {
						id: 'user_123',
						email: 'jane@example.com',
						name: 'Jane',
						role: 'user',
					},
					token: 'jwt-token',
				}),
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('creates a session and redirects new users to getting started', async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={['/signup']}>
				<Routes>
					<Route path="/signup" element={<SignupPage />} />
					<Route path="/getting-started" element={<div>Onboarding destination</div>} />
				</Routes>
			</MemoryRouter>,
		);

		await user.type(screen.getByLabelText(/Full name/i), 'Jane Smith');
		await user.type(screen.getByLabelText(/Work email/i), 'jane@example.com');
		await user.type(screen.getByLabelText(/^Password$/i), 'supersecure123');
		await user.click(screen.getByRole('button', { name: /Create account/i }));

		await waitFor(() => {
			expect(setSession).toHaveBeenCalledWith(
				expect.objectContaining({ email: 'jane@example.com' }),
				'jwt-token',
			);
		});
		expect(screen.getByText('Onboarding destination')).toBeInTheDocument();
	});
});
