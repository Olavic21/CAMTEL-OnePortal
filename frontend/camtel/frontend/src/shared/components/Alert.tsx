import { clsx } from 'clsx';
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import type { ReactNode } from 'react';

type AlertTone = 'info' | 'success' | 'warning' | 'error';

const CONFIG: Record<AlertTone, { icon: typeof Info; container: string; iconColor: string }> = {
  info: {
    icon: Info,
    container: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
    iconColor: 'text-sky-500 dark:text-sky-400',
  },
  success: {
    icon: CheckCircle2,
    container: 'border-accent-200 bg-accent-50 text-accent-900 dark:border-accent-900 dark:bg-accent-950 dark:text-accent-200',
    iconColor: 'text-accent-600 dark:text-accent-400',
  },
  warning: {
    icon: AlertTriangle,
    container:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  error: {
    icon: XCircle,
    container: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
    iconColor: 'text-red-500 dark:text-red-400',
  },
};

/** Alerte contextualisee (info/success/warning/error) avec action HTML. */
export function Alert({
  tone = 'info',
  title,
  children,
  action,
  onClose,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const { icon: Icon, container, iconColor } = CONFIG[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : tone === 'success' ? 'status' : undefined}
      aria-live={tone === 'error' || tone === 'success' ? 'polite' : undefined}
      className={clsx('flex gap-3 rounded-xl border p-4 text-sm', container, className)}
    >
      <Icon className={clsx('mt-0.5 h-5 w-5 shrink-0', iconColor)} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="self-start rounded p-1 opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}