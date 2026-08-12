import { type LucideIcon, Inbox } from 'lucide-react';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 px-6 py-16 text-center dark:border-neutral-700">
      <Icon className="h-10 w-10 text-neutral-300 dark:text-neutral-600" aria-hidden />
      <p className="font-medium text-neutral-800 dark:text-neutral-200">{title}</p>
      {description && <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
      {action}
    </div>
  );
}
