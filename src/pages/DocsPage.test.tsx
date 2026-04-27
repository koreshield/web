import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DocsPage from './DocsPage';

describe('DocsPage', () => {
	it('renders the copied documentation content at /docs', async () => {
		render(
			<MemoryRouter initialEntries={['/docs']}>
				<Routes>
					<Route path="/docs/*" element={<DocsPage />} />
				</Routes>
			</MemoryRouter>
		);

		expect(await screen.findByRole('heading', { name: /^documentation$/i })).toBeInTheDocument();
		expect(screen.getByText(/on this page/i)).toBeInTheDocument();
	});
});
