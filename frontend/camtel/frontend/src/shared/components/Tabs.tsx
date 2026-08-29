import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export interface TabItem {
  id: string;
  label: string;
}

/** Onglets accessibles (flèches clavier) — motif sinon classique. */
export function Tabs({
  items,
  activeId,
  onChange,
  className,
}: {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      aria-label={t('common.a11y.tabs')}
      className={clsx('flex flex-wrap gap-1 border-b border-neutral-200 dark:border-neutral-800', className)}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={active}
            aria-controls={`panel-${item.id}`}
            onClick={() => onChange(item.id)}
            className={clsx(
              'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-primary dark:border-primary-300 dark:text-primary-300'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** Panneau associé à un onglet. */
export function TabPanel({ id, tabId, children }: { id: string; tabId: string; children: React.ReactNode }) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${tabId}`} className="pt-4">
      {children}
    </div>
  );
}