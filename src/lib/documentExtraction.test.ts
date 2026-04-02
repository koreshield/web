import { describe, expect, it, vi, beforeEach } from 'vitest';

const { getDocument, extractRawText } = vi.hoisted(() => ({
	getDocument: vi.fn(),
	extractRawText: vi.fn(),
}));

vi.mock('pdfjs-dist', () => ({
	getDocument,
}));

vi.mock('mammoth/mammoth.browser', () => ({
	extractRawText,
}));

import { DocumentReadError, getDocumentReadErrorMessage, readUploadedDocument } from './documentExtraction';

describe('documentExtraction', () => {
	beforeEach(() => {
		getDocument.mockReset();
		extractRawText.mockReset();
	});

	it('extracts text from PDFs with a browser-safe loading configuration', async () => {
		const destroy = vi.fn().mockResolvedValue(undefined);
		getDocument.mockReturnValue({
			promise: Promise.resolve({
				numPages: 1,
				getPage: vi.fn().mockResolvedValue({
					getTextContent: vi.fn().mockResolvedValue({
						items: [{ str: 'Hello' }, { str: 'world' }],
					}),
				}),
			}),
			destroy,
		});

		const file = new File([new Uint8Array([1, 2, 3])], 'sample.pdf', { type: 'application/pdf' });

		await expect(readUploadedDocument(file)).resolves.toBe('Hello world');
		expect(getDocument).toHaveBeenCalledWith(
			expect.objectContaining({
				disableWorker: true,
				useSystemFonts: true,
				isEvalSupported: false,
				data: expect.any(Uint8Array),
			}),
		);
		expect(destroy).toHaveBeenCalled();
	});

	it('reads plain text uploads directly', async () => {
		const file = new File(['safe content'], 'notes.txt', { type: 'text/plain' });
		await expect(readUploadedDocument(file)).resolves.toBe('safe content');
	});

	it('prefers explicit document extraction errors when available', () => {
		const file = new File([''], 'contract.pdf', { type: 'application/pdf' });
		const error = new DocumentReadError('We could not parse this PDF.', file.name);
		expect(getDocumentReadErrorMessage(file, error)).toBe('We could not parse this PDF.');
	});
});
