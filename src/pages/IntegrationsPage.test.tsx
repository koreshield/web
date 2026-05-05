import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import IntegrationsPage from './IntegrationsPage';

describe('IntegrationsPage', () => {
	it('points SDK entries at live repositories when docs pages do not exist', () => {
		render(
			<HelmetProvider>
				<IntegrationsPage />
			</HelmetProvider>,
		);

		expect(screen.getByRole('link', { name: /Python SDK/i })).toHaveAttribute(
			'href',
			'https://github.com/koreshield/python-sdk',
		);
		expect(screen.getByRole('link', { name: /JS\/TS SDK/i })).toHaveAttribute(
			'href',
			'https://github.com/koreshield/node-sdk',
		);
		expect(screen.getAllByText(/SDK repo live/i)).toHaveLength(2);
	});
});
