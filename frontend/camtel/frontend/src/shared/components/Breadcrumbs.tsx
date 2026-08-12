import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Fil d'ariane" className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {item.to ? (
              <Link to={item.to} className="hover:text-primary dark:hover:text-primary-300">
                {item.label}
              </Link>
            ) : (
              <span className="text-neutral-800 dark:text-neutral-200">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
