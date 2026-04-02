import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GettingStartedPage from './GettingStartedPage';

describe('GettingStartedPage', () => {
	it('explains the real client onboarding path and runtime endpoints', () => {
		render(
			<MemoryRouter>
				<GettingStartedPage />
			</MemoryRouter>,
		);

		expect(screen.getByText('How clients actually use KoreShield')).toBeInTheDocument();
		expect(screen.getByText(/\/v1\/chat\/completions/)).toBeInTheDocument();
		expect(screen.getByText('Create a server credential')).toBeInTheDocument();
		expect(screen.getByText('Minimal integration example')).toBeInTheDocument();
	});
});
