import { getDocument } from 'pdfjs-dist';
import * as mammoth from 'mammoth/mammoth.browser';

export class DocumentReadError extends Error {
	fileName: string;

	constructor(message: string, fileName: string) {
		super(message);
		this.name = 'DocumentReadError';
		this.fileName = fileName;
	}
}

const extractPdfText = async (file: File): Promise<string> => {
	const data = new Uint8Array(await file.arrayBuffer());
	const loadingTask = getDocument({
		data,
		disableWorker: true,
		useSystemFonts: true,
		isEvalSupported: false,
	});

	try {
		const pdf = await loadingTask.promise;
		const pageTexts: string[] = [];

		for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
			const page = await pdf.getPage(pageIndex);
			const content = await page.getTextContent();
			const pageText = content.items
				.map((item: { str?: string }) => (typeof item.str === 'string' ? item.str : ''))
				.filter(Boolean)
				.join(' ');

			if (pageText.trim()) {
				pageTexts.push(pageText.trim());
			}
		}

		return pageTexts.join('\n').trim();
	} catch (error) {
		throw new DocumentReadError(
			`We couldn't extract text from ${file.name}. Try a text-based PDF or export it as TXT/DOCX.`,
			file.name,
		);
	} finally {
		await loadingTask.destroy();
	}
};

const extractDocxText = async (file: File): Promise<string> => {
	try {
		const data = await file.arrayBuffer();
		const result = await mammoth.extractRawText({ arrayBuffer: data });
		return (result.value || '').trim();
	} catch {
		throw new DocumentReadError(
			`We couldn't extract text from ${file.name}. Try re-exporting it as DOCX or plain text.`,
			file.name,
		);
	}
};

export const getDocumentReadErrorMessage = (file: File, error: unknown): string => {
	if (error instanceof DocumentReadError) {
		return error.message;
	}

	const lowerName = file.name.toLowerCase();
	if (lowerName.endsWith('.pdf')) {
		return `Failed to read PDF: ${file.name}`;
	}
	if (lowerName.endsWith('.docx')) {
		return `Failed to read DOCX: ${file.name}`;
	}
	return `Failed to read file: ${file.name}`;
};

export const readUploadedDocument = async (file: File): Promise<string> => {
	const lowerName = file.name.toLowerCase();
	const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
	const isDocx =
		file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
		lowerName.endsWith('.docx');

	if (isPdf) {
		return extractPdfText(file);
	}

	if (isDocx) {
		return extractDocxText(file);
	}

	try {
		return (await file.text()).trim();
	} catch {
		throw new DocumentReadError(`Failed to read file: ${file.name}`, file.name);
	}
};
