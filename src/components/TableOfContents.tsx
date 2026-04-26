import { useEffect, useState } from 'react';

export interface TableOfContentsItem {
	id: string;
	title: string;
	level: number;
}

export function TableOfContents({ content }: { content: string }) {
	const [headings, setHeadings] = useState<TableOfContentsItem[]>([]);
	const [activeId, setActiveId] = useState('');

	useEffect(() => {
		const headingLines = content
			.split('\n')
			.filter((line) => /^#{1,3}\s+/.test(line.trim()));

		const extracted: TableOfContentsItem[] = headingLines.map((line, idx) => {
			const level = line.match(/^#+/)?.[0].length ?? 2;
			const title = line.replace(/^#+\s+/, '').trim();
			const id = `heading-${idx}`;
			return { id, title, level };
		});

		setHeadings(extracted);

		// Set up intersection observer to track active section
		const handleScroll = () => {
			const headingElements = document.querySelectorAll('[data-heading-id]');
			let currentId = '';

			headingElements.forEach(el => {
				const rect = el.getBoundingClientRect();
				if (rect.top >= 0 && rect.top <= 200) {
					currentId = el.getAttribute('data-heading-id') ?? '';
				}
			});

			setActiveId(currentId);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [content]);

	if (headings.length === 0) {
		return null;
	}

	const handleClick = (id: string) => {
		const element = document.querySelector(`[data-heading-id="${id}"]`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	};

	return (
		<div className="hidden lg:block sticky top-20 h-fit">
			<div className="text-sm">
				<div className="font-semibold text-gray-900 dark:text-gray-100 mb-3">On this page</div>
				<nav className="space-y-2">
					{headings.map(heading => (
						<button
							key={heading.id}
							onClick={() => handleClick(heading.id)}
							className={`block w-full text-left px-2 py-1 rounded transition-colors ${
								heading.level === 1
									? 'font-medium'
									: heading.level === 2
										? ''
										: 'pl-4 text-xs'
							} ${
								activeId === heading.id
									? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
									: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
							}`}
						>
							{heading.title}
						</button>
					))}
				</nav>
			</div>
		</div>
	);
}
