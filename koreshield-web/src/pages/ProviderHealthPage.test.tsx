import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProviderHealthPage from './ProviderHealthPage';

const { useProviderHealth } = vi.hoisted(() => ({
	useProviderHealth: vi.fn(),
}));

vi.mock('../hooks/useApi', () => ({
	useProviderHealth,
}));

vi.mock('../lib/websocket-client', () => ({
	wsClient: {
		connect: vi.fn(),
		isConnected: vi.fn(() => false),
		subscribe: vi.fn(),
		on: vi.fn(() => () => undefined),
	},
}));

describe('ProviderHealthPage', () => {
	it('shows an onboarding state when no providers are configured', () => {
		useProviderHealth.mockReturnValue({
			data: { providers: {} },
			isLoading: false,
		});

		render(<ProviderHealthPage />);

		expect(screen.getByText(/No providers configured yet/i)).toBeInTheDocument();
		expect(screen.getByText(/Finish onboarding with API keys, rules, and your first protected request first/i)).toBeInTheDocument();
	});
});
