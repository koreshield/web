import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ToastNotification';
import { RAGSecurityPage } from './RAGSecurityPage';

const { readUploadedDocument } = vi.hoisted(() => ({
	readUploadedDocument: vi.fn(),
}));

vi.mock('../hooks/useAuthState', () => ({
	useAuthState: () => ({
		isAuthenticated: false,
		isHydrating: false,
		user: null,
	}),
}));

vi.mock('../lib/auth', () => ({
	authService: {
		isAuthenticated: () => false,
	},
}));

vi.mock('../lib/documentExtraction', () => ({
	readUploadedDocument,
	getDocumentReadErrorMessage: (_file: File, error: unknown) =>
		error instanceof Error ? error.message : 'Failed to read file',
}));

describe('RAGSecurityPage', () => {
	beforeEach(() => {
		readUploadedDocument.mockReset();
	});

	it('accepts PDF uploads and adds them to the document list', async () => {
		readUploadedDocument.mockResolvedValue('Quarterly customer support transcript');

		const { container } = render(
			<HelmetProvider>
				<ToastProvider>
					<MemoryRouter>
						<RAGSecurityPage />
					</MemoryRouter>
				</ToastProvider>
			</HelmetProvider>,
		);

		const input = container.querySelector('input[type="file"]');
		expect(input).not.toBeNull();

		const file = new File(['%PDF-1.4'], 'support-logs.pdf', { type: 'application/pdf' });
		fireEvent.change(input as HTMLInputElement, {
			target: { files: [file] },
		});

		await waitFor(() => {
			expect(readUploadedDocument).toHaveBeenCalledWith(file);
		});

		expect(await screen.findByText('support-logs.pdf')).toBeInTheDocument();
		expect(await screen.findByText(/added 1 document\(s\)/i)).toBeInTheDocument();
	});
});
