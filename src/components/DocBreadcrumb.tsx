import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getDocBreadcrumbs } from '../docs/loader';

export function DocBreadcrumb() {
	const location = useLocation();
	const breadcrumbs = getDocBreadcrumbs(location.pathname);

	if (breadcrumbs.length <= 1) {
		return null;
	}

	return (
		<nav className="flex items-center gap-2 text-sm mb-8">
			{breadcrumbs.map((crumb, index) => {
				const isLast = index === breadcrumbs.length - 1;
				const isRoot = index === 0;

				return (
					<div key={crumb.path} className="flex items-center gap-2">
						{isRoot ? (
							<Link
								to={crumb.path}
								className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
							>
								<Home size={16} />
								<span>{crumb.title}</span>
							</Link>
						) : isLast ? (
							<span className="text-muted-foreground">{crumb.title}</span>
						) : (
							<Link
								to={crumb.path}
								className="text-primary hover:text-primary/80 transition-colors"
							>
								{crumb.title}
							</Link>
						)}
						{!isLast && (
							<ChevronRight size={16} className="text-muted-foreground/40" />
						)}
					</div>
				);
			})}
		</nav>
	);
}
