import { type ReactNode } from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

type CalloutType = 'info' | 'warning' | 'error' | 'success' | 'tip';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const calloutConfig = {
  info: {
    icon: Info,
    className: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    iconClassName: 'text-blue-600 dark:text-blue-400',
    titleClassName: 'text-blue-900 dark:text-blue-100',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    iconClassName: 'text-yellow-600 dark:text-yellow-400',
    titleClassName: 'text-yellow-900 dark:text-yellow-100',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    iconClassName: 'text-red-600 dark:text-red-400',
    titleClassName: 'text-red-900 dark:text-red-100',
  },
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    iconClassName: 'text-green-600 dark:text-green-400',
    titleClassName: 'text-green-900 dark:text-green-100',
  },
  tip: {
    icon: Lightbulb,
    className: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    iconClassName: 'text-purple-600 dark:text-purple-400',
    titleClassName: 'text-purple-900 dark:text-purple-100',
  },
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div className={`my-6 rounded-lg border p-4 ${config.className}`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconClassName}`} />
        <div className="flex-1">
          {title && (
            <div className={`font-semibold mb-2 ${config.titleClassName}`}>
              {title}
            </div>
          )}
          <div className="text-sm leading-relaxed [&>p]:my-2 [&>p]:first:mt-0 [&>p]:last:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
