import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/features/products/api/productsApi';

// Recherche avancee avec autocomplete (roadmap V2), debounce simple sur la saisie.
export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data } = useQuery({
    queryKey: ['products', 'autocomplete', debounced],
    queryFn: () => productsApi.list({ search: debounced }),
    enabled: debounced.length > 1,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          placeholder="Rechercher un produit..."
          className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-neutral-800"
          aria-label="Rechercher un produit"
        />
      </div>
      {isOpen && !!data?.results.length && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {data.results.slice(0, 6).map((p) => (
            <li key={p.id}>
              <button
                onClick={() => {
                  navigate(`/produits/${p.slug}`);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
