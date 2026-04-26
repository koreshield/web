import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { buildDocsNavigation } from '../docs/loader';

interface NavItem {
	title: string;
	path: string;
	children?: NavItem[];
	description?: string;
}

interface DocsLayoutProps {
	children: React.ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();
	const navigation = buildDocsNavigation();

	return (
		<div className="min-h-screen bg-background">
			{/* Mobile menu button */}
			<div className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm lg:hidden">
				<div className="flex items-center justify-between px-4 py-3">
					<h1 className="text-lg font-semibold text-foreground">Documentation</h1>
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className="p-2 hover:bg-card rounded-md transition-colors"
					>
						{sidebarOpen ? <X size={20} /> : <Menu size={20} />}
					</button>
				</div>
			</div>

			<div className="flex">
				{/* Sidebar */}
				<aside
					className={`${
						sidebarOpen ? 'block' : 'hidden'
					} lg:block fixed lg:sticky top-14 lg:top-0 left-0 w-64 h-[calc(100vh-3.5rem)] lg:h-screen bg-card/50 border-r border-border/50 overflow-y-auto z-30`}
				>
					<nav className="space-y-1 px-3 py-4">
						{navigation.map((item) => (
							<NavItem key={item.path} item={item} isActive={location.pathname === item.path} onNavigate={() => setSidebarOpen(false)} />
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
				<main className="flex-1 min-h-screen">
					<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}

interface NavItemProps {
	item: NavItem;
	isActive: boolean;
	onNavigate: () => void;
}

function NavItem({ item, isActive, onNavigate }: NavItemProps) {
	const [expanded, setExpanded] = useState(isActive || item.children?.some(c => c.path === window.location.pathname));

	const hasChildren = item.children && item.children.length > 0;

	return (
		<div key={item.path}>
			<div className="flex items-center gap-2">
				{hasChildren ? (
					<button
						onClick={() => setExpanded(!expanded)}
						className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isActive
								? 'bg-primary/10 text-primary border border-primary/20'
								: 'text-foreground/70 hover:text-foreground hover:bg-card/80'
						}`}
					>
						<span className="flex-1 text-left">{item.title}</span>
						<ChevronDown
							size={16}
							className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
						/>
					</button>
				) : (
					<Link
						to={item.path}
						onClick={onNavigate}
						className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isActive
								? 'bg-primary/10 text-primary border border-primary/20'
								: 'text-foreground/70 hover:text-foreground hover:bg-card/80'
						}`}
					>
						{item.title}
					</Link>
				)}
			</div>

			{/* Children */}
			{hasChildren && expanded && item.children && (
				<div className="ml-4 mt-1 space-y-1 border-l border-border/30 pl-3">
					{item.children.map((child) => (
						<Link
							key={child.path}
							to={child.path}
							onClick={onNavigate}
							className={`block px-3 py-2 rounded text-sm transition-colors ${
								window.location.pathname === child.path
									? 'bg-primary/10 text-primary font-medium'
									: 'text-foreground/60 hover:text-foreground hover:bg-card/50'
							}`}
						>
							{child.title}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
