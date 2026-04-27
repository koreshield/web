import { useEffect, useMemo, useState } from 'react';
import { extractTableOfContents } from './tableOfContentsUtils';

export function TableOfContents({ content }: { content: string }) {
	const [activeId, setActiveId] = useState('');
	const headings = useMemo(() => extractTableOfContents(content), [content]);

	useEffect(() => {
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
		handleScroll();
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
		<div className="hidden lg:block sticky top-24 h-fit w-56 flex-shrink-0">
			<div className="text-sm">
				<div className="font-semibold text-foreground mb-3">On this page</div>
				<nav className="space-y-1">
					{headings.map(heading => (
						<button
							key={heading.id}
							onClick={() => handleClick(heading.id)}
							className={`block w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
								heading.level === 1
									? 'font-medium'
									: heading.level === 2
										? ''
										: 'pl-4 text-xs'
							} ${
								activeId === heading.id
									? 'text-primary bg-primary/10'
									: 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
