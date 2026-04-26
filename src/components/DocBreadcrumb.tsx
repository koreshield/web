import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function DocBreadcrumb() {
	const location = useLocation();

	// Extract section and doc from URL path
	const pathParts = location.pathname
		.replace(/^\/docs\/?/, '')
		.split('/')
		.filter(Boolean);

	if (pathParts.length === 0) {
		return null;
	}

	const section = pathParts[0];
	const doc = pathParts[1];

	// Format section name (converting kebab-case to Title Case)
	const formatName = (str: string) => {
		return str
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	return (
		<nav className="flex items-center gap-2 text-sm mb-8">
			<Link
				to="/docs"
				className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
			>
				<Home size={16} />
				<span>Docs</span>
			</Link>

			{section && (
				<>
					<ChevronRight size={16} className="text-gray-400 dark:text-gray-600" />
					<Link
						to={`/docs/${section}`}
						className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
					>
						{formatName(section)}
					</Link>
				</>
			)}

			{doc && (
				<>
					<ChevronRight size={16} className="text-gray-400 dark:text-gray-600" />
					<span className="text-gray-600 dark:text-gray-400">
						{formatName(doc)}
					</span>
				</>
			)}
		</nav>
	);
}
