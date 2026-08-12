import { clsx } from 'clsx';

type BadgeTone = 'promo' | 'new' | 'success' | 'warning' | 'neutral' | 'draft';

const toneClasses: Record<BadgeTone, string> = {
  promo: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  new: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  success: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  neutral: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
  draft: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
