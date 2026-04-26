import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildDocsNavigation } from '../docs/loader';

interface SearchResult {
	title: string;
	path: string;
	description?: string;
}

export function DocSearch() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResult[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const navigate = useNavigate();

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			return;
		}

		const navigation = buildDocsNavigation();
		const searchResults: SearchResult[] = [];

		navigation.forEach(section => {
			// Search in section title
			if (section.title.toLowerCase().includes(query.toLowerCase())) {
				searchResults.push({
					title: section.title,
					path: section.path,
					description: section.description,
				});
			}

			// Search in children
			section.children?.forEach(child => {
				if (child.title.toLowerCase().includes(query.toLowerCase())) {
					searchResults.push({
						title: child.title,
						path: child.path,
					});
				}
			});
		});

		setResults(searchResults.slice(0, 8));
		setSelectedIndex(0);
	}, [query]);

	const handleNavigate = (path: string) => {
		navigate(path);
		setOpen(false);
		setQuery('');
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				setOpen(true);
			} else if (e.key === 'Escape') {
				setOpen(false);
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex(prev => (prev + 1) % results.length);
			} else if (e.key === 'ArrowUp') {
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
	}, [results, selectedIndex]);

	return (
		<>
			{/* Search trigger button */}
			<button
				onClick={() => setOpen(true)}
				className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
			>
				<Search size={16} />
				<span>Search docs...</span>
				<span className="ml-auto text-xs text-gray-500 dark:text-gray-500">⌘K</span>
			</button>

			{/* Mobile search button */}
			<button
				onClick={() => setOpen(true)}
				className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
			>
				<Search size={20} className="text-gray-600 dark:text-gray-400" />
			</button>

			{/* Search modal */}
			{open && (
				<div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-start justify-center pt-20">
					<div className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
						{/* Search input */}
						<div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
							<Search size={18} className="text-gray-400" />
							<input
								autoFocus
								type="text"
								placeholder="Search documentation..."
								value={query}
								onChange={e => setQuery(e.target.value)}
								className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
							/>
							<button
								onClick={() => setOpen(false)}
								className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
							>
								<X size={18} className="text-gray-600 dark:text-gray-400" />
							</button>
						</div>

						{/* Results */}
						<div className="max-h-96 overflow-y-auto">
							{results.length > 0 ? (
								<div className="divide-y divide-gray-200 dark:divide-gray-800">
									{results.map((result, idx) => (
										<button
											key={result.path}
											onClick={() => handleNavigate(result.path)}
											className={`w-full text-left px-4 py-3 transition-colors ${
												idx === selectedIndex
													? 'bg-emerald-50 dark:bg-emerald-950/30'
													: 'hover:bg-gray-50 dark:hover:bg-gray-800'
											}`}
										>
											<div className="font-medium text-gray-900 dark:text-gray-100">
												{result.title}
											</div>
											{result.description && (
												<div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
													{result.description}
												</div>
											)}
										</button>
									))}
								</div>
							) : query ? (
								<div className="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
									No results found for "{query}"
								</div>
							) : (
								<div className="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
									Type to search documentation
								</div>
							)}
						</div>

						{/* Footer hint */}
						{results.length > 0 && (
							<div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-500 flex gap-4">
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
