import { clsx } from 'clsx';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md',
        'dark:border-neutral-800 dark:bg-neutral-900',
        className,
      )}
    >
      {children}
    </div>
  );
}
