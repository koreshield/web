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
		<div className="min-h-screen bg-white dark:bg-gray-950">
			{/* Header */}
			<header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/80 backdrop-blur-sm">
				<div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
					{/* Logo/Title */}
					<Link
						to="/docs"
						className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
					>
						<span>Documentation</span>
					</Link>

					{/* Desktop Search */}
					<div className="flex-1 max-w-xs mx-8 hidden lg:block">
						<DocSearch />
					</div>

					{/* Right side */}
					<div className="flex items-center gap-2">
						{/* Mobile Search */}
						<div className="lg:hidden">
							<DocSearch />
						</div>

						{/* Mobile Menu Button */}
						<button
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
						>
							{sidebarOpen ? <X size={20} /> : <Menu size={20} />}
						</button>
					</div>
				</div>
			</header>

			<div className="flex">
				{/* Sidebar */}
				<aside
					className={`${
						sidebarOpen ? 'block' : 'hidden'
					} lg:block fixed lg:sticky top-20 lg:top-0 left-0 w-64 h-[calc(100vh-5rem)] lg:h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto z-30 transition-all`}
				>
					<nav className="space-y-0.5 px-3 py-6">
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
						className="fixed inset-0 bg-black/50 z-20 lg:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
				)}

				{/* Main content */}
				<main className="flex-1 min-h-[calc(100vh-5rem)]">
					<div className="px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-7xl mx-auto">
						{children}
					</div>
				</main>
			</div>
		</div>
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
								? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-l-2 border-emerald-600 dark:border-emerald-400'
								: 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
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
								? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-l-2 border-emerald-600 dark:border-emerald-400'
								: 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
						}`}
					>
						{item.title}
					</Link>
				)}
			</div>

			{/* Children */}
			{hasChildren && expanded && item.children && (
				<div className="ml-0 mt-1 space-y-0.5 border-l border-gray-300 dark:border-gray-700 pl-0">
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
									? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium'
									: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
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
