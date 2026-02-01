import { AlertTriangle, Info, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import clsx from 'clsx';

interface CalloutProps {
    type?: 'info' | 'warning' | 'error' | 'success' | 'tip';
    title?: string;
    children: React.ReactNode;
}

const styles = {
    info: {
        border: 'border-blue-900',
        bg: 'bg-blue-950/30',
        icon: Info,
        color: 'text-blue-400',
    },
    warning: {
        border: 'border-yellow-900',
        bg: 'bg-yellow-950/30',
        icon: AlertTriangle,
        color: 'text-yellow-400',
    },
    error: {
        border: 'border-red-900',
        bg: 'bg-red-950/30',
        icon: XCircle,
        color: 'text-red-400',
    },
    success: {
        border: 'border-green-900',
        bg: 'bg-green-950/30',
        icon: CheckCircle,
        color: 'text-green-400',
    },
    tip: {
        border: 'border-purple-900',
        bg: 'bg-purple-950/30',
        icon: Lightbulb,
        color: 'text-purple-400',
    },
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
    const style = styles[type];
    const Icon = style.icon;

    return (
        <div className={clsx('my-6 rounded-lg border p-4', style.border, style.bg)}>
            <div className="flex items-start gap-3">
                <Icon className={clsx('w-5 h-5 shrink-0 mt-0.5', style.color)} />
                <div className="flex-1 text-sm leading-relaxed">
                    {title && <div className={clsx('font-semibold mb-1', style.color)}>{title}</div>}
                    <div className="text-gray-300 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{children}</div>
                </div>
            </div>
        </div>
    );
}
