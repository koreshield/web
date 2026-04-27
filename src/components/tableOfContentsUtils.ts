import type { ReactNode } from 'react';

export interface TableOfContentsItem {
	id: string;
	title: string;
	level: number;
}

export function slugifyHeading(title: string) {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

export function extractTableOfContents(content: string): TableOfContentsItem[] {
	return content
		.split('\n')
		.filter((line) => /^#{1,3}\s+/.test(line.trim()))
		.map((line) => {
			const level = line.match(/^#+/)?.[0].length ?? 2;
			const title = line.replace(/^#+\s+/, '').trim();
			return {
				id: slugifyHeading(title),
				title,
				level,
			};
		});
}

export function extractNodeText(children: ReactNode): string {
	if (typeof children === 'string' || typeof children === 'number') {
		return String(children);
	}
	if (Array.isArray(children)) {
		return children.map(extractNodeText).join('');
	}
	if (children && typeof children === 'object' && 'props' in children) {
		return extractNodeText((children as { props?: { children?: ReactNode } }).props?.children);
	}
	return '';
}
