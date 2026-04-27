import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ToastNotification';
import DemoPage from './DemoPage';

describe('DemoPage', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('posts the demo request to the backend route and shows the success state', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				status: 'success',
				submission_id: 'demo-123',
				message: 'Demo request received.',
			}),
		});
		vi.stubGlobal('fetch', fetchMock);

		render(
			<HelmetProvider>
				<ToastProvider>
					<MemoryRouter>
						<DemoPage />
					</MemoryRouter>
				</ToastProvider>
			</HelmetProvider>,
		);

		fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Isaac' } });
		fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Nsisong' } });
		fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: 'isaac@example.com' } });
		fireEvent.change(screen.getByLabelText(/^company/i), { target: { value: 'KoreShield' } });
		fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: 'Founder' } });
		fireEvent.change(screen.getByLabelText(/what are you building/i), {
			target: { value: 'We need runtime AI security for our production copilots.' },
		});
		fireEvent.change(screen.getByLabelText(/how did you hear about koreshield/i), {
			target: { value: 'LinkedIn' },
		});
		fireEvent.click(screen.getByRole('button', { name: /request a demo/i }));

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringMatching(/\/v1\/management\/demo-submission$/),
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		const [, requestInit] = fetchMock.mock.calls[0];
		expect(JSON.parse((requestInit as RequestInit).body as string)).toMatchObject({
			first_name: 'Isaac',
			last_name: 'Nsisong',
			work_email: 'isaac@example.com',
			company: 'KoreShield',
			job_title: 'Founder',
			source: 'LinkedIn',
		});

		await waitFor(() => {
			expect(screen.getByText(/request received/i)).toBeInTheDocument();
		});
	});

	it('shows an error toast when the backend submission fails', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({ detail: 'Backend unavailable' }),
		});
		vi.stubGlobal('fetch', fetchMock);

		render(
			<HelmetProvider>
				<ToastProvider>
					<MemoryRouter>
						<DemoPage />
					</MemoryRouter>
				</ToastProvider>
			</HelmetProvider>,
		);

		fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Isaac' } });
		fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Nsisong' } });
		fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: 'isaac@example.com' } });
		fireEvent.change(screen.getByLabelText(/^company/i), { target: { value: 'KoreShield' } });
		fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: 'Founder' } });
		fireEvent.change(screen.getByLabelText(/what are you building/i), {
			target: { value: 'We need runtime AI security for our production copilots.' },
		});
		fireEvent.click(screen.getByRole('button', { name: /request a demo/i }));

		await waitFor(() => {
			expect(screen.getByText(/backend unavailable/i)).toBeInTheDocument();
		});
	});
});
