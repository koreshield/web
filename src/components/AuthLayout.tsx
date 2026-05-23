import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthLayout({
	eyebrow,
	headline,
	bullets,
	children,
}: {
	eyebrow: string;
	headline: string;
	bullets: string[];
	children: ReactNode;
}) {
	return (
		<div className="auth-shell min-h-screen flex">
			<div className="auth-side-panel relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] p-12 lg:flex lg:w-[42%]">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
				<div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-electric-green/[0.03] blur-3xl" />

				<div className="relative z-10 flex items-center gap-3">
					<img src="/logo/dark/SVG/Black.svg" alt="Koreshield" className="h-8 w-8 dark:hidden" />
					<img src="/logo/light/SVG/White.svg" alt="Koreshield" className="hidden h-8 w-8 dark:block" />
					<span className="text-xl font-bold tracking-tight text-foreground">Koreshield</span>
				</div>

				<div className="relative z-10 space-y-8">
					<div>
						<p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-electric-green">{eyebrow}</p>
						<p className="max-w-md text-4xl font-black leading-tight tracking-[-0.055em] text-foreground">{headline}</p>
					</div>

					<div className="space-y-3">
						{bullets.map((item) => (
							<div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-background/35 p-4">
								<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-electric-green" />
								<span className="text-sm font-medium text-muted-foreground">{item}</span>
							</div>
						))}
					</div>
				</div>

				<p className="relative z-10 text-xs text-muted-foreground/60">
					© {new Date().getFullYear()} Koreshield. All rights reserved.
				</p>
			</div>

			<div className="flex flex-1 items-center justify-center p-6 sm:p-12">
				<div className="auth-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
					<div className="mb-8 flex items-center gap-2 lg:hidden">
						<img src="/logo/dark/SVG/Black.svg" alt="Koreshield" className="h-7 w-7 dark:hidden" />
						<img src="/logo/light/SVG/White.svg" alt="Koreshield" className="hidden h-7 w-7 dark:block" />
						<span className="font-bold text-foreground">Koreshield</span>
					</div>
					{children}
				</div>
			</div>
		</div>
	);
}
