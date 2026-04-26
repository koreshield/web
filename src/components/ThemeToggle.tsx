import { MonitorCog, Moon, SunMedium } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type ThemeToggleProps = {
	className?: string;
	showLabel?: boolean;
};

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
	const { theme, toggleTheme } = useTheme();
	const isLight = theme === 'light';

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className={[
				'inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground hover:bg-card',
				className,
			].join(' ')}
			aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
			title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
		>
			<span className="relative flex h-5 w-5 items-center justify-center">
				<SunMedium
					className={[
						'absolute h-4 w-4 transition-all duration-200',
						isLight ? 'scale-100 rotate-0 text-amber-500' : 'scale-0 -rotate-45 opacity-0',
					].join(' ')}
				/>
				<Moon
					className={[
						'absolute h-4 w-4 transition-all duration-200',
						isLight ? 'scale-0 rotate-45 opacity-0' : 'scale-100 rotate-0 text-sky-400',
					].join(' ')}
				/>
			</span>
			{showLabel ? (
				<span className="inline-flex items-center gap-1.5">
					<MonitorCog className="h-3.5 w-3.5 opacity-60" />
					{isLight ? 'Light mode' : 'Dark mode'}
				</span>
			) : null}
		</button>
	);
}
