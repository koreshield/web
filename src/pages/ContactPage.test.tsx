import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ToastNotification';
import ContactPage from './ContactPage';

const { sendMock } = vi.hoisted(() => ({
	sendMock: vi.fn(),
}));

vi.mock('@emailjs/browser', () => ({
	default: {
		send: sendMock,
	},
}));

describe('ContactPage', () => {
	beforeEach(() => {
		sendMock.mockReset();
	});

	it('shows the updated hosted plan names in support flows', () => {
		render(
			<HelmetProvider>
				<ToastProvider>
					<MemoryRouter>
						<ContactPage />
					</MemoryRouter>
				</ToastProvider>
			</HelmetProvider>,
		);

		expect(screen.getByText(/preparing an enterprise rollout/i)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: /technical support/i }));
		expect(screen.getByRole('option', { name: 'Growth' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'Scale' })).toBeInTheDocument();
		expect(screen.getByText(/contract-backed priority support/i)).toBeInTheDocument();
	});

	it('submits the general enquiry form through EmailJS when config is present', async () => {
		sendMock.mockResolvedValue({ status: 200 });

		render(
			<HelmetProvider>
				<ToastProvider>
					<MemoryRouter>
						<ContactPage />
					</MemoryRouter>
				</ToastProvider>
			</HelmetProvider>,
		);

		fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Isaac' } });
		fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'isaac@example.com' } });
		fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Enterprise plan' } });
		fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Need pricing help' } });
		fireEvent.click(screen.getByRole('button', { name: /send message/i }));

		await waitFor(() => {
			expect(sendMock).toHaveBeenCalledTimes(1);
		});
	});
});
