import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ToastNotification';
import ContactPage from './ContactPage';

describe('ContactPage', () => {
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
});
