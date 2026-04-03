import {
	Activity,
	BarChart3,
	Bell,
	ClipboardList,
	DollarSign,
	FileText,
	Key,
	LayoutDashboard,
	ListFilter,
	Lock,
	Map,
	Menu,
	Rocket,
	ScanSearch,
	Shield,
	ShieldAlert,
	Users,
	X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { authService, type AuthUser } from '../lib/auth';
import { useAuthState } from '../hooks/useAuthState';
import { wsClient } from '../lib/websocket-client';

type NavItem = {
	label: string;
	path: string;
	icon: React.ReactNode;
	adminOnly?: boolean;
};

type NavGroup = {
	label: string;
	items: NavItem[];
	adminOnly?: boolean;
};

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 56;

function Sidebar({ isCollapsed, onToggle, onNavClick, isAdmin }: {
	isCollapsed: boolean;
	onToggle: () => void;
	onNavClick: () => void;
	isAdmin: boolean;
}) {
	const location = useLocation();

	const navGroups: NavGroup[] = [
		{
			label: 'Overview',
			items: [
				{ label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
				{ label: 'Getting Started', path: '/getting-started', icon: <Rocket className="w-5 h-5" /> },
			],
		},
		{
			label: 'Security',
			items: [
				{ label: 'RAG Security', path: '/rag-security', icon: <ScanSearch className="w-5 h-5" /> },
				{ label: 'Threats', path: '/threat-monitoring', icon: <ShieldAlert className="w-5 h-5" /> },
				{ label: 'Threat Map', path: '/threat-map', icon: <Map className="w-5 h-5" /> },
				{ label: 'Alerts', path: '/alerts', icon: <Bell className="w-5 h-5" /> },
				{ label: 'Providers', path: '/provider-health', icon: <Activity className="w-5 h-5" /> },
				{ label: 'Audit Logs', path: '/audit-logs', icon: <FileText className="w-5 h-5" /> },
			],
		},
		{
			label: 'Config',
			items: [
				{ label: 'API Keys', path: '/api-key-management', icon: <Key className="w-5 h-5" /> },
				{ label: 'Rules', path: '/rules', icon: <ListFilter className="w-5 h-5" /> },
				{ label: 'Policies', path: '/policies', icon: <Shield className="w-5 h-5" />, adminOnly: true },
				{ label: 'Teams', path: '/teams', icon: <Users className="w-5 h-5" /> },
			],
		},
		{
			label: 'Admin',
			adminOnly: true,
			items: [
				{ label: 'Analytics', path: '/advanced-analytics', icon: <BarChart3 className="w-5 h-5" /> },
				{ label: 'Compliance', path: '/compliance-reports', icon: <ClipboardList className="w-5 h-5" /> },
				{ label: 'RBAC', path: '/rbac', icon: <Lock className="w-5 h-5" /> },
				{ label: 'Cost', path: '/cost-analytics', icon: <DollarSign className="w-5 h-5" /> },
			],
		},
	];

	return (
		<aside
			className={`fixed left-0 top-14 bottom-0 hidden md:flex flex-col bg-background border-r border-white/[0.06] transition-all duration-300 ${
				isCollapsed ? 'w-14' : 'w-56'
			}`}
			style={{ width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
		>
			<nav className="flex-1 overflow-y-auto py-4 px-2">
				{navGroups.map((group) => {
					// Skip admin-only groups if user is not admin
					if (group.adminOnly && !isAdmin) return null;

					return (
						<div key={group.label} className="mb-6">
							{!isCollapsed && (
								<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-3">
									{group.label}
								</h3>
							)}
							<div className="space-y-1">
								{group.items.map((item) => {
									// Skip admin-only items if user is not admin
									if (item.adminOnly && !isAdmin) return null;

									const isActive = location.pathname === item.path;

									return (
										<Link
											key={item.path}
											to={item.path}
											onClick={onNavClick}
											title={isCollapsed ? item.label : undefined}
											className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
												isActive
													? 'bg-primary/10 text-primary border-l-2 border-primary'
													: 'text-muted-foreground hover:text-foreground hover:bg-muted'
											}`}
										>
											{item.icon}
											{!isCollapsed && <span>{item.label}</span>}
										</Link>
									);
								})}
							</div>
						</div>
					);
				})}
			</nav>

			{/* Collapse toggle at bottom */}
			<div className="border-t border-white/[0.06] p-2">
				<button
					onClick={onToggle}
					className="w-full flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors"
					title={isCollapsed ? 'Expand' : 'Collapse'}
				>
					{isCollapsed ? (
						<span className="text-xs">{'>'}</span>
					) : (
						<span className="text-xs">{'<'}</span>
					)}
				</button>
			</div>
		</aside>
	);
}

function MobileSidebar({ isOpen, onClose, isAdmin }: {
	isOpen: boolean;
	onClose: () => void;
	isAdmin: boolean;
}) {
	const location = useLocation();

	const navGroups: NavGroup[] = [
		{
			label: 'Overview',
			items: [
				{ label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
				{ label: 'Getting Started', path: '/getting-started', icon: <Rocket className="w-5 h-5" /> },
			],
		},
		{
			label: 'Security',
			items: [
				{ label: 'RAG Security', path: '/rag-security', icon: <ScanSearch className="w-5 h-5" /> },
				{ label: 'Threats', path: '/threat-monitoring', icon: <ShieldAlert className="w-5 h-5" /> },
				{ label: 'Threat Map', path: '/threat-map', icon: <Map className="w-5 h-5" /> },
				{ label: 'Alerts', path: '/alerts', icon: <Bell className="w-5 h-5" /> },
				{ label: 'Providers', path: '/provider-health', icon: <Activity className="w-5 h-5" /> },
				{ label: 'Audit Logs', path: '/audit-logs', icon: <FileText className="w-5 h-5" /> },
			],
		},
		{
			label: 'Config',
			items: [
				{ label: 'API Keys', path: '/api-key-management', icon: <Key className="w-5 h-5" /> },
				{ label: 'Rules', path: '/rules', icon: <ListFilter className="w-5 h-5" /> },
				{ label: 'Policies', path: '/policies', icon: <Shield className="w-5 h-5" />, adminOnly: true },
				{ label: 'Teams', path: '/teams', icon: <Users className="w-5 h-5" /> },
			],
		},
		{
			label: 'Admin',
			adminOnly: true,
			items: [
				{ label: 'Analytics', path: '/advanced-analytics', icon: <BarChart3 className="w-5 h-5" /> },
				{ label: 'Compliance', path: '/compliance-reports', icon: <ClipboardList className="w-5 h-5" /> },
				{ label: 'RBAC', path: '/rbac', icon: <Lock className="w-5 h-5" /> },
				{ label: 'Cost', path: '/cost-analytics', icon: <DollarSign className="w-5 h-5" /> },
			],
		},
	];

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 z-40 md:hidden"
				onClick={onClose}
			/>
			{/* Drawer */}
			<div className="fixed left-0 top-14 bottom-0 w-full bg-background border-r border-white/[0.06] z-40 md:hidden overflow-y-auto flex flex-col">
				<nav className="flex-1 overflow-y-auto py-4 px-4">
					{navGroups.map((group) => {
						if (group.adminOnly && !isAdmin) return null;

						return (
							<div key={group.label} className="mb-6">
								<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-3">
									{group.label}
								</h3>
								<div className="space-y-1">
									{group.items.map((item) => {
										if (item.adminOnly && !isAdmin) return null;

										const isActive = location.pathname === item.path;

										return (
											<Link
												key={item.path}
												to={item.path}
												onClick={onClose}
												className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
													isActive
														? 'bg-primary/10 text-primary border-l-2 border-primary'
														: 'text-muted-foreground hover:text-foreground hover:bg-muted'
												}`}
											>
												{item.icon}
												<span>{item.label}</span>
											</Link>
										);
									})}
								</div>
							</div>
						);
					})}
				</nav>
			</div>
		</>
	);
}

function WsStatus() {
	const [isConnected, setIsConnected] = useState(wsClient.isConnected());

	useEffect(() => {
		// Poll every 5 seconds
		const interval = setInterval(() => {
			setIsConnected(wsClient.isConnected());
		}, 5000);

		// Listen for connection_established event
		const cleanup = wsClient.on('connection_established', () => {
			setIsConnected(true);
		});

		return () => {
			clearInterval(interval);
			cleanup();
		};
	}, []);

	return (
		<div
			className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
				isConnected
					? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
					: 'bg-muted text-muted-foreground'
			}`}
		>
			<div
				className={`w-2 h-2 rounded-full ${
					isConnected ? 'bg-emerald-500' : 'bg-muted-foreground'
				}`}
			/>
			{isConnected ? 'Connected' : 'Offline'}
		</div>
	);
}

function UserDropdown({ user }: { user: AuthUser | null }) {
	const [isOpen, setIsOpen] = useState(false);
	const navigate = useNavigate();

	const handleLogout = () => {
		authService.logout();
		navigate('/');
	};

	const initials = user?.name
		? user.name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
		: '?';

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
				title={user?.name || user?.email || 'User'}
			>
				{initials}
			</button>

			{isOpen && (
				<>
					<div
						className="fixed inset-0"
						onClick={() => setIsOpen(false)}
					/>
					<div className="absolute right-0 mt-2 w-48 bg-card border border-white/[0.08] rounded-lg shadow-lg z-50 py-2">
						<Link
							to="/profile"
							className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
							onClick={() => setIsOpen(false)}
						>
							Profile
						</Link>
						<Link
							to="/billing"
							className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
							onClick={() => setIsOpen(false)}
						>
							Billing
						</Link>
						<div className="border-t border-white/[0.06] my-2" />
						<button
							onClick={() => {
								handleLogout();
								setIsOpen(false);
							}}
							className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium"
						>
							Logout
						</button>
					</div>
				</>
			)}
		</div>
	);
}

export function AppLayout() {
	const [isCollapsed, setIsCollapsed] = useState(() => {
		const stored = localStorage.getItem('ks_sidebar_collapsed');
		return stored ? JSON.parse(stored) : false;
	});
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [isMd, setIsMd] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);

	const { isAuthenticated, user } = useAuthState();
	const { theme } = useTheme();
	const logoSrc = theme === 'light' ? '/logo/SVG/Black.svg' : '/logo/SVG/White.svg';
	const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'superuser';

	const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

	// Handle responsive sidebar
	useEffect(() => {
		const handler = () => setIsMd(window.innerWidth >= 768);
		window.addEventListener('resize', handler);
		return () => window.removeEventListener('resize', handler);
	}, []);

	// Persist sidebar state
	useEffect(() => {
		localStorage.setItem('ks_sidebar_collapsed', JSON.stringify(isCollapsed));
	}, [isCollapsed]);

	// Connect WebSocket and subscribe when authenticated
	useEffect(() => {
		if (isAuthenticated) {
			wsClient.connect();
			wsClient.subscribe([
				'threat_detected',
				'provider_health_change',
				'cost_threshold_alert',
				'system_status_update',
			]);
		}

		return () => {
			// Disconnect on logout or unmount
			if (!isAuthenticated) {
				wsClient.disconnect();
			}
		};
	}, [isAuthenticated]);

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
			{/* Fixed Topbar */}
			<header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6">
				{/* Left: Mobile hamburger + Logo */}
				<div className="flex items-center gap-3">
					<button
						onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
						className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Toggle sidebar"
					>
						{isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
					</button>
					<Link to="/" className="flex items-center gap-2 tracking-tight">
						<img src={logoSrc} alt="KoreShield" className="w-6 h-6" />
						<span className="text-base font-bold text-foreground hidden sm:inline">KoreShield</span>
					</Link>
				</div>

				{/* Right: WS Status + User Dropdown */}
				<div className="flex items-center gap-4">
					<WsStatus />
					<UserDropdown user={user} />
				</div>
			</header>

			{/* Sidebar (desktop) */}
			<Sidebar
				isCollapsed={isCollapsed}
				onToggle={() => setIsCollapsed(!isCollapsed)}
				onNavClick={() => {
					// No-op on desktop
				}}
				isAdmin={isAdmin}
			/>

			{/* Mobile Sidebar (drawer) */}
			<MobileSidebar
				isOpen={isMobileSidebarOpen}
				onClose={() => setIsMobileSidebarOpen(false)}
				isAdmin={isAdmin}
			/>

			{/* Main Content */}
			<main
				className="flex-1 pt-14 transition-all duration-300"
				style={{ marginLeft: isMd ? sidebarWidth : 0 }}
			>
				<Outlet />
			</main>
		</div>
	);
}
