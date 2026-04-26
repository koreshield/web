import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RouteErrorBoundary } from '../components/ErrorBoundary';
import { ToastProvider } from '../components/ToastNotification';
import PricingPage from './PricingPage';

vi.mock('../lib/auth', () => ({
	authService: {
		isAuthenticated: vi.fn(() => false),
	},
}));

describe('PricingPage', () => {
	it('renders through the route error boundary without crashing', async () => {
		const user = userEvent.setup();

		render(
			<HelmetProvider>
				<ToastProvider>
					<MemoryRouter initialEntries={['/pricing']}>
						<Routes>
							<Route
								path="/pricing"
								element={
									<RouteErrorBoundary>
										<PricingPage />
									</RouteErrorBoundary>
								}
							/>
						</Routes>
					</MemoryRouter>
				</ToastProvider>
			</HelmetProvider>,
		);

		expect(await screen.findByRole('heading', { name: /the firewall every llm deployment is missing/i })).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: /toggle annual pricing/i }));
		expect(screen.getByText('£950')).toBeInTheDocument();
		expect(screen.getByText(/100,000 protected requests\/month/i)).toBeInTheDocument();
		expect(screen.getByText(/what is a protected request/i)).toBeInTheDocument();
		expect(screen.getAllByRole('link', { name: /get a scoped quote/i }).length).toBeGreaterThan(0);
	});
});
