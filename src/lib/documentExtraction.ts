export class DocumentReadError extends Error {
	fileName: string;

	constructor(message: string, fileName: string) {
		super(message);
		this.name = 'DocumentReadError';
		this.fileName = fileName;
	}
}

interface PdfTextItem {
	str?: string;
}

type PromiseWithResolversShape<T> = {
	promise: Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: unknown) => void;
};

type PromiseWithResolversConstructor = PromiseConstructor & {
	withResolvers?: <T>() => PromiseWithResolversShape<T>;
};

function ensurePromiseWithResolvers() {
	const PromiseWithResolvers = Promise as PromiseWithResolversConstructor;
	if (typeof PromiseWithResolvers.withResolvers === 'function') {
		return;
	}

	PromiseWithResolvers.withResolvers = function withResolvers<T>() {
		let resolve!: (value: T | PromiseLike<T>) => void;
		let reject!: (reason?: unknown) => void;
		const promise = new Promise<T>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return { promise, resolve, reject };
	};
}

const extractPdfText = async (file: File): Promise<string> => {
	ensurePromiseWithResolvers();
	try {
		const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
		const { getDocument, GlobalWorkerOptions } = pdfjs;

		// pdfjs-dist v4+ requires workerSrc to be set explicitly.
		// `disableWorker` is no longer a supported getDocument option.
		// We point to the co-bundled worker file so Vite copies it as an asset.
		if (!GlobalWorkerOptions.workerSrc) {
			GlobalWorkerOptions.workerSrc = new URL(
				'pdfjs-dist/legacy/build/pdf.worker.mjs',
				import.meta.url,
			).href;
		}

		const data = new Uint8Array(await file.arrayBuffer());
		const loadingTask = getDocument({
			data,
			useSystemFonts: true,
			isEvalSupported: false,
		} as Parameters<typeof getDocument>[0]);

		try {
			const pdf = await loadingTask.promise;
			const pageTexts: string[] = [];

			for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
				const page = await pdf.getPage(pageIndex);
				const content = await page.getTextContent();
				const pageText = (content.items as PdfTextItem[])
					.map((item) => (typeof item?.str === 'string' ? item.str : ''))
					.filter(Boolean)
					.join(' ');

				if (pageText.trim()) {
					pageTexts.push(pageText.trim());
				}
			}

			if (pageTexts.length === 0) {
				throw new DocumentReadError(
					`No text found in PDF: ${file.name}. This may be a scanned image or password-protected PDF. Try exporting as TXT or DOCX instead.`,
					file.name,
				);
			}

			return pageTexts.join('\n').trim();
		} catch (innerError) {
			if (innerError instanceof DocumentReadError) {
				throw innerError;
			}
			// Check for specific PDF errors
			const errorMessage = innerError instanceof Error ? innerError.message : String(innerError);
			if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
				throw new DocumentReadError(
					`Cannot read password-protected PDF: ${file.name}. Please provide an unprotected PDF or export as TXT/DOCX.`,
					file.name,
				);
			}
			throw new DocumentReadError(
				`Failed to extract text from PDF: ${file.name}. Try a text-based PDF or export as TXT/DOCX.`,
				file.name,
			);
		} finally {
			await loadingTask.destroy();
		}
	} catch (error) {
		if (error instanceof DocumentReadError) {
			throw error;
		}
		throw new DocumentReadError(
			`We couldn't extract text from ${file.name}. Try a text-based PDF or export it as TXT/DOCX.`,
			file.name,
		);
	}
};

const extractDocxText = async (file: File): Promise<string> => {
	try {
		const mammoth = await import('mammoth/mammoth.browser');
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
