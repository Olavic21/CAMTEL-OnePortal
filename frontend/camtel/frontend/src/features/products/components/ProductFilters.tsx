import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, Input } from '@/shared/components/Input';
import { SERVICES } from '@/shared/config/services';
import { SEGMENTS } from '@/shared/config/segments';

/**
 * Filtres de catalogue (cahier des charges section 8) : search + service +
 * segment + disponibilite. Service et Segment sont strictement INDEPENDANTS :
 * les deux selects peuvent etre combines librement (ex: DATA_CENTER+ENTREPRISE).
 */
export interface ProductFilterState {
  service: string;
  segment: string;
  availability: string;
  search: string;
}

const SEARCH_DEBOUNCE_MS = 400;

export function ProductFilters({
  filters,
  onChange,
}: {
  filters: ProductFilterState;
  onChange: (filters: ProductFilterState) => void;
}) {
  const { t } = useTranslation();
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
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 lg:flex-row lg:items-end">
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

      {/* Filtre SERVICE — independant du segment */}
      <Select
        label={t('products.service')}
        value={filters.service}
        onChange={(e) => onChange({ ...filters, service: e.target.value })}
      >
        <option value="">{t('products.allServices')}</option>
        {SERVICES.map((s) => (
          <option key={s.service} value={s.service}>
            {s.label}
          </option>
        ))}
      </Select>

      {/* Filtre SEGMENT — independant du service */}
      <Select
        label={t('products.segment')}
        value={filters.segment}
        onChange={(e) => onChange({ ...filters, segment: e.target.value })}
      >
        <option value="">{t('products.allSegments')}</option>
        {SEGMENTS.map((s) => (
          <option key={s.segment} value={s.segment}>
            {s.label}
          </option>
        ))}
      </Select>

      {/* Disponibilite */}
      <Select
        label={t('products.availability')}
        value={filters.availability}
        onChange={(e) => onChange({ ...filters, availability: e.target.value })}
      >
        <option value="">{t('products.allAvailabilities')}</option>
        <option value="AVAILABLE">{t('products.availabilityAvailable')}</option>
        <option value="ON_REQUEST">{t('products.availabilityOnRequest')}</option>
        <option value="UNAVAILABLE">{t('products.availabilityUnavailable')}</option>
      </Select>
    </div>
  );
}
