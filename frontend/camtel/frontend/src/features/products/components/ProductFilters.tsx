import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, Input } from '@/shared/components/Input';
import type { Category } from '@/shared/types';

export interface ProductFilterState {
  category: string;
  segment: string;
  search: string;
}

const SEARCH_DEBOUNCE_MS = 400;

export function ProductFilters({
  categories,
  filters,
  onChange,
}: {
  categories: Category[];
  filters: ProductFilterState;
  onChange: (filters: ProductFilterState) => void;
}) {
  const { t } = useTranslation();
  // La recherche est debouncee pour ne pas marteler le backend a chaque frappe.
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ ...filters, search: searchInput });
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput, filters, onChange]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-end">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-neutral-400" />
        <Input
          label={t('products.search')}
          placeholder={t('products.searchPlaceholder')}
          className="pl-9"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      <Select
        label={t('products.category')}
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
      >
        <option value="">{t('products.allCategories')}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select
        label={t('products.segment')}
        value={filters.segment}
        onChange={(e) => onChange({ ...filters, segment: e.target.value })}
      >
        <option value="">{t('products.allSegments')}</option>
        <option value="grand_public">{t('products.segmentPublic')}</option>
        <option value="entreprise">{t('products.segmentEnterprise')}</option>
      </Select>
    </div>
  );
}
