import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/shared/lib/axios';
import { trackEvent } from '@/shared/lib/analytics';
import { useTranslation } from 'react-i18next';

interface SearchResult {
  type: 'product' | 'news' | 'promotion' | 'faq';
  id: number;
  title: string;
  slug: string;
}

const DESTINATION: Record<SearchResult['type'], (slug: string) => string> = {
  product: (slug) => `/produits/${slug}`,
  news: (slug) => `/actualites/${slug}`,
  promotion: () => `/promotions`,
  faq: (slug) => `/produits/${slug}`,
};

// Recherche globale (section 12 mission) : produits, actualites, promotions
// et FAQ — auparavant limitee aux seuls produits (voir SECURITY_AUDIT.md /
// ROADMAP.md pour le detail de la correction). Debounce simple sur la saisie.
export function SearchAutocomplete() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef<string>('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data } = useQuery({
    queryKey: ['search', 'autocomplete', debounced],
    queryFn: () =>
      httpClient.get<SearchResult[]>('/search/autocomplete/', { params: { q: debounced } }).then((r) => r.data),
    enabled: debounced.length > 1,
  });

  // Trace la recherche une seule fois par requete debouncee (pas a chaque
  // frappe) — voir apps/core/analytics.py, event "search" agrege les
  // requetes les plus frequentes pour le dashboard admin.
  useEffect(() => {
    if (debounced.length > 1 && trackedRef.current !== debounced) {
      trackedRef.current = debounced;
      trackEvent('search', { query: debounced });
    }
  }, [debounced]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const typeLabel = (type: SearchResult['type']) => t(`search.type.${type}`);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={t('products.searchPlaceholder')}
          className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-neutral-800"
          aria-label={t('products.search')}
        />
      </div>
      {isOpen && !!data?.length && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {data.slice(0, 8).map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <button
                onClick={() => {
                  navigate(DESTINATION[item.type](item.slug));
                  setIsOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <span className="truncate">{item.title}</span>
                <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase text-neutral-500 dark:bg-neutral-800">
                  {typeLabel(item.type)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
