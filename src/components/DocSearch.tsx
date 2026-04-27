import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildDocsSearchIndex, type SearchItem } from '../docs/loader';

export function DocSearch() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const navigate = useNavigate();
	const searchIndex = useMemo<SearchItem[]>(() => buildDocsSearchIndex(), []);
	const results = useMemo(() => {
		if (!query.trim()) {
			return [];
		}

		const normalizedQuery = query.toLowerCase();
		return searchIndex
			.filter((item) => (
				item.title.toLowerCase().includes(normalizedQuery) ||
				item.description?.toLowerCase().includes(normalizedQuery) ||
				item.content.toLowerCase().includes(normalizedQuery) ||
				item.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
			))
			.slice(0, 8);
	}, [query, searchIndex]);

	const handleNavigate = useCallback((path: string) => {
		navigate(path);
		setOpen(false);
		setQuery('');
	}, [navigate]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				setOpen(true);
			} else if (e.key === 'Escape') {
				setOpen(false);
			} else if (e.key === 'ArrowDown' && results.length > 0) {
				e.preventDefault();
				setSelectedIndex(prev => (prev + 1) % results.length);
			} else if (e.key === 'ArrowUp' && results.length > 0) {
				e.preventDefault();
				setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				if (results[selectedIndex]) {
					handleNavigate(results[selectedIndex].path);
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleNavigate, results, selectedIndex]);

	return (
		<>
			{/* Search trigger button — desktop */}
			<button
				onClick={() => setOpen(true)}
				className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent transition-colors text-sm w-full"
			>
				<Search size={16} />
				<span>Search docs...</span>
				<span className="ml-auto text-xs text-muted-foreground/60">⌘K</span>
			</button>

			{/* Search trigger button — mobile icon */}
			<button
				onClick={() => setOpen(true)}
				className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
			>
				<Search size={20} />
			</button>

			{/* Search modal */}
			{open && (
				<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-20">
					<div className="w-full max-w-2xl mx-4 bg-card rounded-xl shadow-2xl shadow-black/30 border border-border overflow-hidden">
						{/* Search input */}
						<div className="flex items-center gap-3 px-4 py-3 border-b border-border">
							<Search size={18} className="text-muted-foreground" />
							<input
								autoFocus
								type="text"
								placeholder="Search documentation..."
								value={query}
								onChange={(e) => {
									setQuery(e.target.value);
									setSelectedIndex(0);
								}}
								className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
							/>
							<button
								onClick={() => setOpen(false)}
								className="p-1 rounded transition-colors hover:bg-accent"
							>
								<X size={18} className="text-muted-foreground" />
							</button>
						</div>

						{/* Results */}
						<div className="max-h-96 overflow-y-auto">
							{results.length > 0 ? (
								<div className="divide-y divide-border">
									{results.map((result, idx) => (
										<button
											key={result.path}
											onClick={() => handleNavigate(result.path)}
											className={`w-full text-left px-4 py-3 transition-colors ${
												idx === selectedIndex
													? 'bg-primary/10'
													: 'hover:bg-accent'
											}`}
										>
											<div className="font-medium text-foreground">
												{result.title}
											</div>
											{result.description && (
												<div className="text-sm text-muted-foreground mt-1">
													{result.description}
												</div>
											)}
										</button>
									))}
								</div>
							) : query ? (
								<div className="px-4 py-8 text-center text-muted-foreground">
									No results found for &ldquo;{query}&rdquo;
								</div>
							) : (
								<div className="px-4 py-8 text-center text-muted-foreground">
									Type to search documentation
								</div>
							)}
						</div>

						{/* Footer hint */}
						{results.length > 0 && (
							<div className="px-4 py-2 border-t border-border text-xs text-muted-foreground/60 flex gap-4">
								<span>↑↓ Navigate</span>
								<span>↵ Select</span>
								<span>ESC Close</span>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
