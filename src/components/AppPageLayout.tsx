import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

function joinClasses(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(' ');
}

const maxWidthClass = {
	'6xl': 'max-w-6xl',
	'7xl': 'max-w-7xl',
} as const;

export function AppPage({
	children,
	className,
	maxWidth = '7xl',
}: {
	children: ReactNode;
	className?: string;
	maxWidth?: keyof typeof maxWidthClass;
}) {
	return (
		<div className={joinClasses('mx-auto px-4 py-8 sm:px-6 lg:px-8', maxWidthClass[maxWidth], className)}>
			{children}
		</div>
	);
}

export function AppPageHeader({
	eyebrow,
	eyebrowIcon: EyebrowIcon,
	title,
	description,
	icon: Icon,
	actions,
	stats,
	tabs,
	activeTab,
	onTabChange,
	className,
}: {
	eyebrow?: string;
	eyebrowIcon?: LucideIcon;
	title: string;
	description?: string;
	icon?: LucideIcon;
	actions?: ReactNode;
	stats?: Array<{ label: string; value: ReactNode; tone?: string }>;
	tabs?: Array<{ id: string; label: string }>;
	activeTab?: string;
	onTabChange?: (id: string) => void;
	className?: string;
}) {
	return (
		<div className={joinClasses('dashboard-panel mb-8 overflow-hidden rounded-[2rem] p-6 md:p-8', className)}>
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div className="max-w-3xl">
					{eyebrow && (
						<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-electric-green/25 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-electric-green">
							{EyebrowIcon && <EyebrowIcon className="h-3.5 w-3.5" />}
							{eyebrow}
						</div>
					)}
					<div className="flex items-start gap-4">
						{Icon && (
							<div className="hidden rounded-2xl border border-border bg-background/60 p-3 sm:flex">
								<Icon className="h-6 w-6 text-primary" />
							</div>
						)}
						<div>
							<h1 className="text-3xl font-black tracking-[-0.055em] md:text-5xl">{title}</h1>
							{description && (
								<p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
									{description}
								</p>
							)}
						</div>
					</div>
				</div>
				{(actions || stats) && (
					<div className="flex flex-col gap-3 sm:items-end">
						{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
						{stats && stats.length > 0 && (
							<div className={joinClasses('grid gap-3', stats.length > 2 ? 'grid-cols-2' : 'grid-cols-1', 'min-w-[220px]')}>
								{stats.map((stat) => (
									<div key={stat.label} className="rounded-2xl border border-border bg-background/55 p-4">
										<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{stat.label}</p>
										<p className={joinClasses('mt-2 text-2xl font-black tracking-[-0.04em]', stat.tone)}>{stat.value}</p>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
			{tabs && tabs.length > 0 && onTabChange && (
				<div className="mt-6 flex flex-wrap gap-2 border-t border-border/70 pt-6">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => onTabChange(tab.id)}
							className={joinClasses(
								'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
								activeTab === tab.id
									? 'bg-primary/12 text-primary border border-primary/25'
									: 'text-muted-foreground hover:bg-background/70 hover:text-foreground border border-transparent',
							)}
						>
							{tab.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export function AppPageSection({
	eyebrow,
	title,
	description,
	actions,
	variant = 'panel',
	className,
	children,
}: {
	eyebrow?: string;
	title?: string;
	description?: string;
	actions?: ReactNode;
	variant?: 'panel' | 'card';
	className?: string;
	children: ReactNode;
}) {
	const surfaceClass = variant === 'panel' ? 'dashboard-panel rounded-[2rem]' : 'dashboard-card rounded-2xl';

	return (
		<section className={joinClasses(surfaceClass, 'mb-8 p-6', className)}>
			{(eyebrow || title || description || actions) && (
				<div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						{eyebrow && (
							<p className="text-xs font-bold uppercase tracking-[0.22em] text-electric-green">{eyebrow}</p>
						)}
						{title && <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{title}</h2>}
						{description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
					</div>
					{actions}
				</div>
			)}
			{children}
		</section>
	);
}

export function AppStatGrid({
	children,
	columns = 4,
	className,
}: {
	children: ReactNode;
	columns?: 2 | 3 | 4;
	className?: string;
}) {
	const columnClass = {
		2: 'grid-cols-2',
		3: 'grid-cols-1 sm:grid-cols-3',
		4: 'grid-cols-2 lg:grid-cols-4',
	}[columns];

	return (
		<div className={joinClasses('mb-8 grid gap-4', columnClass, className)}>
			{children}
		</div>
	);
}

export function AppStatCard({
	label,
	value,
	icon: Icon,
	tone = 'text-foreground',
	detail,
}: {
	label: string;
	value: ReactNode;
	icon?: LucideIcon;
	tone?: string;
	detail?: string;
}) {
	return (
		<div className="dashboard-card overflow-hidden rounded-2xl p-5">
			<div className="mb-5 flex items-center justify-between">
				<span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
				{Icon && (
					<div className="rounded-xl border border-border bg-background/60 p-2">
						<Icon className={joinClasses('h-4 w-4', tone)} />
					</div>
				)}
			</div>
			<div className={joinClasses('text-3xl font-black tracking-[-0.04em]', tone)}>{value}</div>
			{detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
		</div>
	);
}

export function AppCallout({
	children,
	variant = 'info',
	className,
}: {
	children: ReactNode;
	variant?: 'info' | 'warning' | 'success';
	className?: string;
}) {
	const variantClass = {
		info: 'border-border/80 bg-background/55 text-muted-foreground',
		warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
		success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
	}[variant];

	return (
		<div className={joinClasses('dashboard-card mb-6 rounded-2xl border p-4 text-sm', variantClass, className)}>
			{children}
		</div>
	);
}

export function AppEmptyState({
	icon: Icon,
	title,
	description,
	action,
}: {
	icon: LucideIcon;
	title: string;
	description?: string;
	action?: ReactNode;
}) {
	return (
		<div className="dashboard-card rounded-[2rem] px-6 py-14 text-center">
			<Icon className="mx-auto mb-4 h-10 w-10 text-electric-green opacity-70" />
			<h3 className="text-lg font-bold tracking-[-0.03em]">{title}</h3>
			{description && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
			{action && <div className="mt-6 flex justify-center">{action}</div>}
		</div>
	);
}

export function AppPageLoading({ label = 'Loading…' }: { label?: string }) {
	return (
		<div className="flex min-h-[40vh] items-center justify-center">
			<div className="text-center">
				<div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				<p className="text-sm text-muted-foreground">{label}</p>
			</div>
		</div>
	);
}

export function AppPageError({
	title = 'Something went wrong',
	message,
	onRetry,
}: {
	title?: string;
	message: string;
	onRetry?: () => void;
}) {
	return (
		<div className="flex min-h-[40vh] items-center justify-center">
			<div className="dashboard-card max-w-md rounded-[2rem] p-8 text-center">
				<AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-500" />
				<h2 className="text-xl font-black tracking-[-0.04em]">{title}</h2>
				<p className="mt-2 text-sm text-muted-foreground">{message}</p>
				{onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
					>
						Retry
					</button>
				)}
			</div>
		</div>
	);
}

export function AppPrimaryButton({
	children,
	className,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			{...props}
			className={joinClasses(
				'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60',
				className,
			)}
		>
			{children}
		</button>
	);
}

export function AppSecondaryButton({
	children,
	className,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			{...props}
			className={joinClasses(
				'inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-60',
				className,
			)}
		>
			{children}
		</button>
	);
}

export function AppSurface({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={joinClasses('dashboard-card rounded-2xl border border-border p-4 sm:p-6', className)}>
			{children}
		</div>
	);
}
