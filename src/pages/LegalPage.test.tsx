import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RouteErrorBoundary } from '../components/ErrorBoundary';
import LegalPage from './LegalPage';

function renderLegalRoute(path: string) {
	return render(
		<HelmetProvider>
			<MemoryRouter initialEntries={[path]}>
				<Routes>
					<Route
						path="*"
						element={
							<RouteErrorBoundary>
								<LegalPage />
							</RouteErrorBoundary>
						}
					/>
				</Routes>
			</MemoryRouter>
		</HelmetProvider>,
	);
}

describe('LegalPage', () => {
	it('renders canonical legal aliases', async () => {
		renderLegalRoute('/privacy');

		expect(await screen.findByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /the most important thing: zero-log architecture/i })).toBeInTheDocument();
	});

	it('renders the public sub-processor page', async () => {
		renderLegalRoute('/legal/sub-processors');

		expect(await screen.findByRole('heading', { name: /sub-processor list/i })).toBeInTheDocument();
		expect(screen.getByText(/infrastructure and delivery/i)).toBeInTheDocument();
		expect(screen.getByText(/detection and model-analysis providers/i)).toBeInTheDocument();
	});

	it('renders the public transfer policy page', async () => {
		renderLegalRoute('/legal/transfer-policy');

		expect(await screen.findByRole('heading', { name: /cross-border transfer policy/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /hosted service footprint/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /customer options/i })).toBeInTheDocument();
	});
});
