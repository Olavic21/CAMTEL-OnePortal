import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    page + 2,
  );

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Page precedente"
        className="rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={clsx(
            'h-9 w-9 rounded-lg text-sm font-medium',
            p === page ? 'bg-primary text-white' : 'hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Page suivante"
        className="rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
