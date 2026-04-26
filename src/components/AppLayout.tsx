import {
	Activity,
	BarChart3,
	Bell,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	DollarSign,
	FileText,
	Key,
	LayoutDashboard,
	ListFilter,
	Lock,
	LogOut,
	Menu,
	Rocket,
	ScanSearch,
	Shield,
	ShieldAlert,
	User,
	Users,
	Wifi,
	WifiOff,
	X,
	Map,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../lib/auth';
import { useAuthState } from '../hooks/useAuthState';
import { wsClient } from '../lib/websocket-client';
import { ThemeToggle } from './ThemeToggle';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NavItem {
	label: string;
	to: string;
	icon: React.ComponentType<{ className?: string }>;
	adminOnly?: boolean;
}

interface NavGroup {
	label: string;
	items: NavItem[];
	adminOnly?: boolean;
}

// ─── Nav definition ──────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
	{
		label: 'Overview',
		items: [
			{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
			{ label: 'Getting Started', to: '/getting-started', icon: Rocket },
		],
	},
	{
		label: 'Security',
		items: [
			{ label: 'RAG Security', to: '/rag-security', icon: ScanSearch },
			{ label: 'Threats', to: '/threat-monitoring', icon: ShieldAlert },
			{ label: 'Threat Map', to: '/threat-map', icon: Map },
			{ label: 'Alerts', to: '/alerts', icon: Bell },
			{ label: 'Providers', to: '/provider-health', icon: Activity },
			{ label: 'Audit Logs', to: '/audit-logs', icon: FileText },
		],
	},
	{
		label: 'Config',
		items: [
			{ label: 'API Keys', to: '/api-key-management', icon: Key },
			{ label: 'Billing', to: '/billing', icon: DollarSign },
			{ label: 'Rules', to: '/rules', icon: ListFilter },
			{ label: 'Policies', to: '/policies', icon: Shield, adminOnly: true },
			{ label: 'Teams', to: '/teams', icon: Users },
			{ label: 'Settings', to: '/settings', icon: User },
		],
	},
	{
		label: 'Admin',
		adminOnly: true,
		items: [
			{ label: 'Analytics', to: '/advanced-analytics', icon: BarChart3 },
			{ label: 'Compliance', to: '/compliance-reports', icon: ClipboardList },
			{ label: 'RBAC', to: '/rbac', icon: Lock },
			{ label: 'Cost', to: '/cost-analytics', icon: DollarSign },
		],
	},
];

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 56;
const SIDEBAR_STORAGE_KEY = 'ks_sidebar_collapsed';

// ─── Sidebar nav item ────────────────────────────────────────────────────────

function NavLink({
	item,
	collapsed,
	onClick,
}: {
	item: NavItem;
	collapsed: boolean;
	onClick?: () => void;
}) {
	const location = useLocation();
	const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
	const Icon = item.icon;

	return (
		<Link
			to={item.to}
			onClick={onClick}
			title={collapsed ? item.label : undefined}
			className={[
				'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
				collapsed ? 'justify-center' : '',
				isActive
					? 'bg-primary/10 text-primary'
					: 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
			].join(' ')}
		>
			{/* Active bar */}
			{isActive && (
				<span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
			)}

			<Icon className={['w-4 h-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'].join(' ')} />

			{!collapsed && (
				<span className="truncate">{item.label}</span>
			)}

			{/* Tooltip on collapse */}
			{collapsed && (
				<span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded bg-card border border-white/[0.08] text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
					{item.label}
				</span>
			)}
		</Link>
	);
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({
	collapsed,
	onCollapse,
	isAdmin,
	onNavClick,
}: {
	collapsed: boolean;
	onCollapse: () => void;
	isAdmin: boolean;
	onNavClick?: () => void;
}) {
	const { theme } = useTheme();
	const logoSrc = theme === 'light' ? '/logo/dark/SVG/Black.svg' : '/logo/light/SVG/White.svg';

	return (
		<div className="flex flex-col h-full">
			{/* Logo */}
			<div className={['flex items-center h-16 shrink-0 border-b border-white/[0.06] px-3', collapsed ? 'justify-center' : 'gap-2.5 px-4'].join(' ')}>
				<Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
					<img src={logoSrc} alt="KoreShield" className="w-7 h-7 shrink-0" />
					{!collapsed && (
						<span className="text-base font-bold text-foreground truncate">KoreShield</span>
					)}
				</Link>
			</div>

			{/* Nav groups */}
			<nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5">
				{NAV_GROUPS.map(group => {
					if (group.adminOnly && !isAdmin) return null;

					const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
					if (visibleItems.length === 0) return null;

					return (
						<div key={group.label}>
							{!collapsed && (
								<p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
									{group.label}
								</p>
							)}
							{collapsed && (
								<div className="mb-1.5 flex justify-center">
									<div className="w-5 h-px bg-white/[0.08]" />
								</div>
							)}
							<div className="space-y-0.5">
								{visibleItems.map(item => (
									<NavLink key={item.to} item={item} collapsed={collapsed} onClick={onNavClick} />
								))}
							</div>
						</div>
					);
				})}
			</nav>

			{/* Collapse toggle */}
			<div className="shrink-0 border-t border-white/[0.06] p-2">
				<button
					type="button"
					onClick={onCollapse}
					title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					className={[
						'flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-150',
						collapsed ? 'justify-center' : '',
					].join(' ')}
				>
					{collapsed ? (
						<ChevronRight className="w-4 h-4 shrink-0" />
					) : (
						<>
							<ChevronLeft className="w-4 h-4 shrink-0" />
							<span>Collapse</span>
						</>
					)}
				</button>
			</div>
		</div>
	);
}

// ─── User menu ───────────────────────────────────────────────────────────────

function UserMenu({ onLogout }: { onLogout: () => void }) {
	const { user } = useAuthState();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		function handler(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	const initials = user?.name
		? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
		: user?.email?.[0]?.toUpperCase() ?? '?';

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen(v => !v)}
				className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-sm"
				aria-label="User menu"
			>
				<div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
					{initials}
				</div>
				<div className="hidden sm:block text-left min-w-0">
					<div className="text-xs font-medium text-foreground truncate max-w-[120px]">
						{user?.name || user?.email}
					</div>
					<div className="text-[10px] text-muted-foreground capitalize">{user?.role}</div>
				</div>
			</button>

			{open && (
				<div className="absolute right-0 top-full mt-2 w-52 bg-card border border-white/[0.08] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
					{/* User info */}
					<div className="px-3 py-2.5 border-b border-white/[0.06]">
						<div className="text-xs font-semibold text-foreground truncate">{user?.name}</div>
						<div className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</div>
					</div>

					{/* Menu items */}
					<Link
						to="/profile"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
					>
						<User className="w-4 h-4" />
						Profile
					</Link>
					<Link
						to="/settings"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
					>
						<Shield className="w-4 h-4" />
						Settings
					</Link>
					<Link
						to="/billing"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
					>
						<DollarSign className="w-4 h-4" />
						Billing
					</Link>

					<div className="border-t border-white/[0.06] mt-1 pt-1">
						<button
							type="button"
							onClick={() => { setOpen(false); onLogout(); }}
							className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
						>
							<LogOut className="w-4 h-4" />
							Logout
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

// ─── WS Status indicator ─────────────────────────────────────────────────────

function WsStatus() {
	const [connected, setConnected] = useState(wsClient.isConnected());

	useEffect(() => {
		const cleanupEstablished = wsClient.on('connection_established', () => setConnected(true));
		const cleanupError = wsClient.on('error', () => setConnected(false));

		// Poll status every 5s as fallback (ws client doesn't emit disconnect reliably)
		const interval = setInterval(() => setConnected(wsClient.isConnected()), 5000);

		return () => {
			cleanupEstablished();
			cleanupError();
			clearInterval(interval);
		};
	}, []);

	if (connected) {
		return (
			<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
				<Wifi className="w-3 h-3 text-emerald-500" />
				<span className="text-[11px] font-medium text-emerald-500 hidden sm:inline">Live</span>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
			<WifiOff className="w-3 h-3 text-muted-foreground" />
			<span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">Offline</span>
		</div>
	);
}

// ─── AppLayout ───────────────────────────────────────────────────────────────

export function AppLayout() {
	const navigate = useNavigate();
	const { isAuthenticated } = useAuthState();
	const user = authService.getCurrentUser();
	const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'superuser';

	// Sidebar collapse state (persisted)
	const [collapsed, setCollapsed] = useState(() => {
		try {
			return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
		} catch {
			return false;
		}
	});

	// Mobile drawer state
	const [mobileOpen, setMobileOpen] = useState(false);

	const toggleCollapse = () => {
		setCollapsed(v => {
			const next = !v;
			try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch { /* */ }
			return next;
		});
	};

	// Connect WS when authenticated
	useEffect(() => {
		if (!isAuthenticated) return;
		wsClient.connect();
		wsClient.subscribe(['threat_detected', 'provider_health_change', 'cost_threshold_alert', 'system_status_update']);
	}, [isAuthenticated]);

	useEffect(() => {
		if (!mobileOpen) {
			document.body.style.overflow = '';
			return;
		}

		document.body.style.overflow = 'hidden';

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setMobileOpen(false);
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('keydown', handleEscape);
		};
	}, [mobileOpen]);

	const handleLogout = async () => {
		wsClient.disconnect();
		await authService.logout();
		navigate('/');
	};

	const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

	return (
		<div className="min-h-screen bg-background text-foreground flex font-sans">

			{/* ── Desktop sidebar ── */}
			<aside
				className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-40 bg-card/60 border-r border-white/[0.06] transition-all duration-200 ease-in-out"
				style={{ width: sidebarWidth }}
			>
				<Sidebar
					collapsed={collapsed}
					onCollapse={toggleCollapse}
					isAdmin={isAdmin}
				/>
			</aside>

			{/* ── Mobile sidebar overlay ── */}
			{mobileOpen && (
				<div
					className="md:hidden fixed inset-0 z-50 flex"
					onClick={() => setMobileOpen(false)}
				>
					{/* Backdrop */}
					<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

					{/* Drawer */}
					<aside
						className="relative z-10 flex flex-col bg-card border-r border-white/[0.06] h-full"
						style={{ width: SIDEBAR_WIDTH }}
						onClick={e => e.stopPropagation()}
					>
						{/* Close button */}
						<button
							type="button"
							onClick={() => setMobileOpen(false)}
							className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
							aria-label="Close menu"
						>
							<X className="w-5 h-5" />
						</button>
						<Sidebar
							collapsed={false}
							onCollapse={() => setMobileOpen(false)}
							isAdmin={isAdmin}
							onNavClick={() => setMobileOpen(false)}
						/>
					</aside>
				</div>
			)}

			{/* ── Main area ── */}
			<div
				className="flex flex-col flex-1 min-h-screen transition-all duration-200 ease-in-out"
				style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? sidebarWidth : 0 }}
			>
				{/* Top bar */}
				<header className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center gap-3 px-4 shrink-0">
					{/* Mobile hamburger */}
					<button
						type="button"
						onClick={() => setMobileOpen(true)}
						className="md:hidden p-1.5 text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Open menu"
					>
						<Menu className="w-5 h-5" />
					</button>

					{/* Mobile logo (shown when sidebar is hidden) */}
					<Link to="/dashboard" className="md:hidden flex items-center gap-2 mr-2">
						<img
							src="/logo/light/SVG/White.svg"
							alt="KoreShield"
							className="w-6 h-6 dark:block hidden"
						/>
						<img
							src="/logo/dark/SVG/Black.svg"
							alt="KoreShield"
							className="w-6 h-6 dark:hidden"
						/>
					</Link>

					{/* Spacer */}
					<div className="flex-1" />

					{/* Right side controls */}
					<div className="flex items-center gap-2">
						<ThemeToggle className="px-2.5 py-1.5" />
						<WsStatus />
						<UserMenu onLogout={handleLogout} />
					</div>
				</header>

				{/* Page content */}
				<main className="flex-1">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
