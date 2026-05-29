import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('../components/SEOMeta', () => ({
	SEOMeta: () => null,
}));

class MockIntersectionObserver implements IntersectionObserver {
	readonly root: Element | Document | null = null;
	readonly rootMargin = '0px';
	readonly thresholds: ReadonlyArray<number> = [0];

	disconnect(): void {}
	observe(): void {}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
	unobserve(): void {}
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
