import {
	Activity,
	BarChart3,
	Bell,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	Crown,
	ExternalLink,
	FileText,
	Gauge,
	Key,
	LayoutDashboard,
	ListFilter,
	Lock,
	LogOut,
	Menu,
	ScanSearch,
	AudioLines,
	Shield,
	ShieldAlert,
	User,
	Users,
	Wifi,
	WifiOff,
	X,
	Map,
	AlertTriangle,
	CheckCircle2,
	PoundSterling,
	Settings as SettingsIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../lib/auth';
import { useAuthState } from '../hooks/useAuthState';
import { wsClient } from '../lib/websocket-client';
import { ThemeToggle } from './ThemeToggle';
import { api } from '../lib/api-client';
import {
	FEATURE_LABELS,
	PLAN_NAMES,
	featureForPath,
	minimumPlanForFeature,
	normalizePlanSlug,
	planAllowsFeature,
	type PlanFeature,
} from '../lib/entitlements';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NavItem {
	label: string;
	to: string;
	icon: React.ComponentType<{ className?: string }>;
	feature?: PlanFeature;
	adminOnly?: boolean;
	founderOnly?: boolean;
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
		],
	},
	{
		label: 'Security',
		items: [
			{ label: 'RAG Security', to: '/rag-security', icon: ScanSearch, feature: 'rag_security' },
			{ label: 'Voice Security', to: '/voice-security', icon: AudioLines, feature: 'voice_security' },
			{ label: 'Threats', to: '/threat-monitoring', icon: ShieldAlert, feature: 'threat_monitoring' },
			{ label: 'Threat Map', to: '/threat-map', icon: Map, feature: 'threat_monitoring' },
			{ label: 'Alerts', to: '/alerts', icon: Bell, feature: 'alerts' },
			{ label: 'Providers', to: '/provider-health', icon: Activity, feature: 'provider_health' },
			{ label: 'Audit Logs', to: '/audit-logs', icon: FileText, feature: 'audit_logs' },
		],
	},
	{
		label: 'Config',
		items: [
			{ label: 'API Keys', to: '/settings/api-keys', icon: Key, feature: 'api_keys' },
			{ label: 'Usage', to: '/usage', icon: Gauge, feature: 'usage' },
			{ label: 'Billing', to: '/billing', icon: PoundSterling, feature: 'billing' },
			{ label: 'Rules', to: '/rules', icon: ListFilter, feature: 'rules' },
			{ label: 'Policies', to: '/policies', icon: Shield, feature: 'policies' },
			{ label: 'Reports', to: '/reports', icon: FileText, feature: 'reports' },
			{ label: 'Teams', to: '/teams', icon: Users, feature: 'teams' },
			{ label: 'Settings', to: '/settings', icon: SettingsIcon, feature: 'settings' },
		],
	},
	{
		label: 'Admin',
		adminOnly: true,
		items: [
			{ label: 'Founder Portal', to: '/founder', icon: Crown, founderOnly: true },
			{ label: 'Analytics', to: '/advanced-analytics', icon: BarChart3, feature: 'advanced_analytics' },
			{ label: 'Compliance', to: '/compliance-reports', icon: ClipboardList, feature: 'compliance_reports' },
			{ label: 'RBAC', to: '/rbac', icon: Lock, feature: 'rbac' },
			{ label: 'Cost', to: '/cost-analytics', icon: PoundSterling, feature: 'cost_analytics' },
		],
	},
];

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 56;
const SIDEBAR_STORAGE_KEY = 'ks_sidebar_collapsed';

type BillingAccountPlan = {
	plan_slug?: string | null;
	plan_name?: string | null;
	metadata?: {
		features?: string[];
		feature_access?: Record<string, boolean>;
	};
};

// ─── Sidebar nav item ────────────────────────────────────────────────────────

function NavLink({
	item,
	collapsed,
	locked,
	onClick,
	onLockedClick,
}: {
	item: NavItem;
	collapsed: boolean;
	locked: boolean;
	onClick?: () => void;
	onLockedClick?: (item: NavItem) => void;
}) {
	const location = useLocation();
	const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
	const Icon = item.icon;

	return (
		<Link
			to={locked ? `/billing?feature=${encodeURIComponent(item.feature ?? item.label)}` : item.to}
			onClick={(event) => {
				if (locked) {
					event.preventDefault();
					onLockedClick?.(item);
					return;
				}
				onClick?.();
			}}
			title={collapsed ? item.label : locked ? `Upgrade to unlock ${item.label}` : undefined}
			className={[
				'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
				collapsed ? 'justify-center' : '',
				locked ? 'opacity-60' : '',
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

			{!collapsed && <span className="truncate">{item.label}</span>}
			{locked && !collapsed && <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground/70" />}

			{/* Tooltip on collapse */}
			{collapsed && (
				<span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded bg-card border border-white/[0.08] text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
					{locked ? `Upgrade to unlock ${item.label}` : item.label}
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
	isFounder,
	planSlug,
	onNavClick,
	onLockedNav,
}: {
	collapsed: boolean;
	onCollapse: () => void;
	isAdmin: boolean;
	isFounder: boolean;
	planSlug: string | null | undefined;
	onNavClick?: () => void;
	onLockedNav?: (item: NavItem) => void;
}) {
	const { theme } = useTheme();
	const logoSrc = theme === 'light' ? '/logo/dark/SVG/Black.svg' : '/logo/light/SVG/White.svg';

	return (
		<div className="flex flex-col h-full">
			{/* Logo */}
			<div className={['flex items-center h-16 shrink-0 border-b border-white/[0.06] px-3', collapsed ? 'justify-center' : 'gap-2.5 px-4'].join(' ')}>
				<Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
					<img src={logoSrc} alt="Koreshield" className="w-7 h-7 shrink-0" />
					{!collapsed && (
						<span className="text-base font-bold text-foreground truncate">Koreshield</span>
					)}
				</Link>
			</div>

			{/* Nav groups */}
			<nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5">
				{NAV_GROUPS.map(group => {
					if (group.adminOnly && !isAdmin) return null;

					const visibleItems = group.items.filter(item => {
						if (item.adminOnly && !isAdmin) return false;
						if (item.founderOnly && !isFounder) return false;
						return true;
					});
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
									<NavLink
										key={item.to}
										item={item}
										collapsed={collapsed}
										locked={!planAllowsFeature(planSlug, item.feature)}
										onClick={onNavClick}
										onLockedClick={onLockedNav}
									/>
								))}
							</div>
						</div>
					);
				})}
			</nav>

			<div className="shrink-0 border-t border-white/[0.06] p-2">
				<a
					href="https://koreshield.ai"
					target="_blank"
					rel="noreferrer noopener"
					title={collapsed ? 'Visit website' : undefined}
					className={[
						'group relative mb-1.5 flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-150',
						collapsed ? 'justify-center' : '',
					].join(' ')}
				>
					<ExternalLink className="w-4 h-4 shrink-0" />
					{!collapsed && <span>Visit website</span>}
					{collapsed && (
						<span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded bg-card border border-white/[0.08] text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
							Visit website
						</span>
					)}
				</a>
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
						<SettingsIcon className="w-4 h-4" />
						Settings
					</Link>
					<Link
						to="/billing"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
					>
						<PoundSterling className="w-4 h-4" />
						Billing
					</Link>

					<div className="border-t border-white/[0.06] mt-1 pt-1">
						<Link
							to="/"
							onClick={() => setOpen(false)}
							className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
						>
							<ExternalLink className="w-4 h-4" />
							Visit website
						</Link>
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

function UpgradeFeaturePrompt({
	item,
	planSlug,
	onClose,
}: {
	item: NavItem | null;
	planSlug: string | null | undefined;
	onClose: () => void;
}) {
	const feature = item?.feature;
	if (!item || !feature) return null;

	const requiredPlan = minimumPlanForFeature(feature);
	const requiredPlanName = PLAN_NAMES[requiredPlan];
	const currentPlanName = PLAN_NAMES[normalizePlanSlug(planSlug)];

	return (
		<div
			className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="upgrade-feature-title"
		>
			<button
				type="button"
				className="absolute inset-0 bg-black/70 backdrop-blur-md"
				aria-label="Close upgrade prompt"
				onClick={onClose}
			/>
			<div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl shadow-black/40">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.18),transparent_38%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.1),transparent_32%)]" />
				<div className="relative p-6 sm:p-8">
					<div className="flex items-start justify-between gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
							<Lock className="h-5 w-5" />
						</div>
						<button
							type="button"
							onClick={onClose}
							className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Close"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					<p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-primary">Upgrade needed</p>
					<h2 id="upgrade-feature-title" className="mt-3 text-3xl font-black tracking-[-0.045em] text-foreground sm:text-4xl">
						Unlock {item.label}
					</h2>
					<p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
						Your current {currentPlanName} plan keeps core protection active. {item.label} starts on {requiredPlanName} for teams that need deeper controls.
					</p>

					<div className="mt-6 grid gap-3 rounded-2xl border border-border bg-background/55 p-4 text-sm sm:grid-cols-3">
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current</p>
							<p className="mt-1 font-bold text-foreground">{currentPlanName}</p>
						</div>
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Needed</p>
							<p className="mt-1 font-bold text-primary">{requiredPlanName}</p>
						</div>
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Feature</p>
							<p className="mt-1 font-bold text-foreground">{FEATURE_LABELS[feature]}</p>
						</div>
					</div>

					<div className="mt-7 flex flex-col gap-3 sm:flex-row">
						<Link
							to={`/billing?feature=${encodeURIComponent(feature)}&plan=${requiredPlan}`}
							onClick={onClose}
							className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
						>
							View upgrade options
						</Link>
						<Link
							to="/pricing"
							onClick={onClose}
							className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
						>
							Compare plans
						</Link>
					</div>
				</div>
			</div>
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

function LockedFeaturePanel({
	feature,
	planSlug,
}: {
	feature: PlanFeature;
	planSlug: string | null | undefined;
}) {
	const requiredPlan = minimumPlanForFeature(feature);
	const requiredPlanName = PLAN_NAMES[requiredPlan];
	const currentPlanName = PLAN_NAMES[normalizePlanSlug(planSlug)];

	return (
		<div className="px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">
				<div className="border-b border-border bg-gradient-to-br from-primary/15 via-transparent to-transparent p-8 sm:p-10">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
						<Lock className="h-6 w-6" />
					</div>
					<p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-primary">Plan gate</p>
					<h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground sm:text-4xl">
						{FEATURE_LABELS[feature]} is not on {currentPlanName}.
					</h1>
					<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
						This feature starts on {requiredPlanName}. Your core protection still works; upgrade when you need this control in production.
					</p>
				</div>
				<div className="flex flex-col gap-3 p-6 sm:flex-row sm:p-8">
					<Link
						to={`/billing?feature=${encodeURIComponent(feature)}&plan=${requiredPlan}`}
						className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						View upgrade options
					</Link>
					<Link
						to="/dashboard"
						className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
					>
						Back to dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}

// ─── AppLayout ───────────────────────────────────────────────────────────────

export function AppLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated, user } = useAuthState();
	const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'superuser';
	const founderAccessQuery = useQuery({
		queryKey: ['founder-access'],
		queryFn: () => api.getFounderAccess() as Promise<{ allowed: boolean }>,
		enabled: Boolean(isAuthenticated && isAdmin),
		staleTime: 5 * 60 * 1000,
		retry: false,
		refetchOnWindowFocus: false,
	});
	const isFounder = Boolean(founderAccessQuery.data?.allowed);
	const billingQuery = useQuery({
		queryKey: ['billing-account-entitlements'],
		queryFn: () => api.getBillingAccount() as Promise<BillingAccountPlan>,
		enabled: Boolean(isAuthenticated),
		staleTime: 60 * 1000,
		retry: false,
		refetchOnWindowFocus: false,
	});
	const planSlug = billingQuery.data?.plan_slug ?? 'free';
	const currentFeature = featureForPath(location.pathname);
	const routeLocked = Boolean(billingQuery.isSuccess && currentFeature && !planAllowsFeature(planSlug, currentFeature));
	const [resendingVerification, setResendingVerification] = useState(false);
	const [verificationBannerState, setVerificationBannerState] = useState<'none' | 'sent' | 'verified'>('none');
	const [upgradePromptItem, setUpgradePromptItem] = useState<NavItem | null>(null);

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

	useEffect(() => {
		const showVerifiedNotice =
			typeof window !== 'undefined' &&
			(new URLSearchParams(window.location.search).get('emailVerified') === '1' ||
				sessionStorage.getItem('ks_email_verified_notice') === '1');

		if (user?.email_verified && showVerifiedNotice) {
			setVerificationBannerState('verified');
			sessionStorage.removeItem('ks_email_verified_notice');
			return;
		}

		if (!user?.email_verified) {
			setVerificationBannerState('none');
		}
	}, [user?.email_verified]);

	const handleLogout = async () => {
		wsClient.disconnect();
		await authService.logout();
		navigate('/');
	};

	const handleResendVerification = async () => {
		try {
			setResendingVerification(true);
			await api.resendVerificationEmail();
			setVerificationBannerState('sent');
		} finally {
			setResendingVerification(false);
		}
	};

	const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

	return (
		<div className="min-h-screen bg-background text-foreground flex font-sans">

			{/* ── Desktop sidebar ── */}
			<aside
				className="dashboard-sidebar hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-40 border-r transition-all duration-200 ease-in-out"
				style={{ width: sidebarWidth }}
			>
				<Sidebar
					collapsed={collapsed}
					onCollapse={toggleCollapse}
					isAdmin={isAdmin}
					isFounder={isFounder}
					planSlug={planSlug}
					onLockedNav={setUpgradePromptItem}
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
						className="dashboard-sidebar relative z-10 flex flex-col border-r h-full"
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
							isFounder={isFounder}
							planSlug={planSlug}
							onNavClick={() => setMobileOpen(false)}
							onLockedNav={(item) => {
								setMobileOpen(false);
								setUpgradePromptItem(item);
							}}
						/>
					</aside>
				</div>
			)}

			{/* ── Main area ── */}
			<div
				className="dashboard-shell relative flex flex-col flex-1 min-h-screen transition-all duration-200 ease-in-out"
				style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? sidebarWidth : 0 }}
			>
				<div className="dashboard-grid pointer-events-none absolute inset-0" />
				{/* Top bar */}
				<header className="sticky top-0 z-30 h-14 bg-background/70 backdrop-blur-xl border-b border-white/[0.06] flex items-center gap-3 px-4 shrink-0">
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
							alt="Koreshield"
							className="w-6 h-6 dark:block hidden"
						/>
						<img
							src="/logo/dark/SVG/Black.svg"
							alt="Koreshield"
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
				<main className="relative z-10 flex-1">
					{isAuthenticated && user && (
						<div className="px-4 sm:px-6 lg:px-8 pt-4">
							{!user.email_verified ? (
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg px-4 py-3 text-sm">
									<div className="flex items-start gap-3">
										<AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
										<div>
											<p className="font-medium">Verify your email to unlock the full account flow.</p>
											<p className="text-xs sm:text-sm opacity-90">
												We sent a verification link to <strong>{user.email}</strong>. Need a fresh one?
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => void handleResendVerification()}
										disabled={resendingVerification}
										className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 text-sm font-medium"
									>
										{resendingVerification ? 'Sending...' : verificationBannerState === 'sent' ? 'Sent' : 'Resend verification'}
									</button>
								</div>
							) : verificationBannerState === 'verified' ? (
								<div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg px-4 py-3 text-sm">
									<CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
									<div className="flex-1">
										<p className="font-medium">Email verified.</p>
										<p className="text-xs sm:text-sm opacity-90">
											Your account is confirmed and ready to use.
										</p>
									</div>
									<button
										type="button"
										onClick={() => setVerificationBannerState('none')}
										className="text-current/80 hover:text-current"
										aria-label="Dismiss verification banner"
									>
										<X className="w-4 h-4" />
									</button>
								</div>
							) : null}
						</div>
					)}
					{routeLocked && currentFeature ? (
						<LockedFeaturePanel feature={currentFeature} planSlug={planSlug} />
					) : (
						<Outlet />
					)}
				</main>
			</div>
			<UpgradeFeaturePrompt
				item={upgradePromptItem}
				planSlug={planSlug}
				onClose={() => setUpgradePromptItem(null)}
			/>
		</div>
	);
}
