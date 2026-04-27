import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { buildDocsNavigation, type NavItem as DocsNavItem } from '../docs/loader';
import { DocSearch } from './DocSearch';

interface DocsLayoutProps {
	children: React.ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();
	const navigation = buildDocsNavigation();

	return (
		<>
			{/* Mobile docs toolbar — visible only on small screens, sticks below the site header */}
			<div className="sticky top-16 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-2 backdrop-blur-sm lg:hidden">
				<button
					onClick={() => setSidebarOpen(!sidebarOpen)}
					className="flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
				>
					{sidebarOpen ? <X size={18} /> : <Menu size={18} />}
					<span>Docs menu</span>
				</button>
				<DocSearch />
			</div>

			<div className="flex">
				{/* Sidebar */}
				<aside
					className={`${
						sidebarOpen ? 'block' : 'hidden'
					} lg:block fixed lg:sticky top-[6.75rem] lg:top-16 left-0 w-64 h-[calc(100vh-6.75rem)] lg:h-[calc(100vh-4rem)] border-r border-border bg-card/30 overflow-y-auto z-30`}
				>
					{/* Search — desktop only; mobile has it in the toolbar above */}
					<div className="hidden px-3 pt-4 pb-2 lg:block">
						<DocSearch />
					</div>

					<nav className="space-y-0.5 px-3 py-4">
						{navigation.map((item) => (
							<SidebarNavItem
								key={item.path}
								item={item}
								currentPath={location.pathname}
								onNavigate={() => setSidebarOpen(false)}
							/>
						))}
					</nav>
				</aside>

				{/* Overlay for mobile */}
				{sidebarOpen && (
					<div
						className="fixed inset-0 z-20 bg-black/50 lg:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
				)}

				{/* Main content */}
				<div className="flex-1 min-w-0">
					<div className="px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-7xl mx-auto">
						{children}
					</div>
				</div>
			</div>
		</>
	);
}

interface NavItemProps {
	item: DocsNavItem;
	currentPath: string;
	onNavigate: () => void;
}

function hasActiveDescendant(item: DocsNavItem, currentPath: string): boolean {
	if (item.path === currentPath) {
		return true;
	}
	return item.children?.some((child) => hasActiveDescendant(child, currentPath)) ?? false;
}

function SidebarNavItem({ item, currentPath, onNavigate }: NavItemProps) {
	const isActive = item.path === currentPath;
	const isBranchActive = hasActiveDescendant(item, currentPath);
	const [expanded, setExpanded] = useState(isBranchActive);

	const hasChildren = item.children && item.children.length > 0;

	return (
		<div key={item.path}>
			<div className="flex items-center gap-1">
				{hasChildren ? (
					<button
						onClick={() => setExpanded(!expanded)}
						className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
							isActive
								? 'bg-primary/10 text-primary border-l-2 border-primary'
								: 'text-foreground hover:text-foreground hover:bg-accent'
						}`}
					>
						<span className="flex-1 text-left">{item.title}</span>
						<ChevronDown
							size={16}
							className={`flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
						/>
					</button>
				) : (
					<Link
						to={item.path}
						onClick={onNavigate}
						className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
							isActive
								? 'bg-primary/10 text-primary border-l-2 border-primary'
								: 'text-foreground hover:text-foreground hover:bg-accent'
						}`}
					>
						{item.title}
					</Link>
				)}
			</div>

			{/* Children */}
			{hasChildren && expanded && item.children && (
				<div className="mt-1 space-y-0.5 border-l border-border pl-0 ml-0">
					{item.children.map((child) => (
						child.children && child.children.length > 0 ? (
							<SidebarNavItem
								key={child.path}
								item={child}
								currentPath={currentPath}
								onNavigate={onNavigate}
							/>
						) : (
							<Link
								key={child.path}
								to={child.path}
								onClick={onNavigate}
								className={`block px-3 py-2 rounded-lg text-sm transition-all ml-2 ${
									currentPath === child.path
										? 'bg-primary/10 text-primary font-medium'
										: 'text-muted-foreground hover:text-foreground hover:bg-accent'
								}`}
							>
								{child.title}
							</Link>
						)
					))}
				</div>
			)}
		</div>
	);
}
