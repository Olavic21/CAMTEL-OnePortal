import { CheckCircle2, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Etat de succes reutilisable (cahier des charges section 30). */
export function SuccessState({
  title,
  description,
  action,
  icon: Icon = CheckCircle2,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-accent-200 bg-accent-50 px-6 py-12 text-center dark:border-accent-900 dark:bg-accent-950"
    >
      <Icon className="h-10 w-10 text-accent-600 dark:text-accent-400" aria-hidden />
      <p className="font-semibold text-accent-900 dark:text-accent-200">{title}</p>
      {description && <p className="max-w-sm text-sm text-accent-700/80 dark:text-accent-300/80">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}