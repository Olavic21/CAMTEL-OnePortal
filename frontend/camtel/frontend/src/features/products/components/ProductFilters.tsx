import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, Input } from '@/shared/components/Input';
import { SERVICES } from '@/shared/config/services';
import { SEGMENTS } from '@/shared/config/segments';

/**
 * Filtres de catalogue (cahier des charges section 8) : search + service +
 * segment + disponibilite. Service et Segment sont strictement INDEPENDANTS.
 * Phase 6 : filtres avancés technologie/prix/périodicité/marque/offre_type.
 */
export interface ProductFilterState {
  service: string;
  segment: string;
  availability: string;
  search: string;
  technology?: string;
  billing_period?: string;
  offer_type?: string;
  brand?: string;
  pricing_type?: string;
  min_price?: string;
  max_price?: string;
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
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

      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="mt-3 text-xs font-medium text-primary hover:underline dark:text-primary-300"
      >
        {showAdvanced ? '− Masquer filtres avancés' : '+ Filtres avancés'}
      </button>

      {showAdvanced && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Technologie" value={filters.technology ?? ''} onChange={(e) => onChange({ ...filters, technology: e.target.value })}>
            <option value="">Toutes</option>
            <option value="FTTH">FTTH</option><option value="FTTB">FTTB</option><option value="ADSL">ADSL</option><option value="LTE">LTE/4G</option><option value="5G">5G</option><option value="DEDICATED">Dedicated</option><option value="OTHER">Autre</option>
          </Select>
          <Select label="Périodicité" value={filters.billing_period ?? ''} onChange={(e) => onChange({ ...filters, billing_period: e.target.value })}>
            <option value="">Toutes</option><option value="MONTHLY">Mensuel</option><option value="YEARLY">Annuel</option><option value="ONE_TIME">Unique</option><option value="QUARTERLY">Trimestriel</option>
          </Select>
          <Select label="Type d'offre" value={filters.offer_type ?? ''} onChange={(e) => onChange({ ...filters, offer_type: e.target.value })}>
            <option value="">Tous</option><option value="INTERNET">Internet</option><option value="FIBER">Fibre</option><option value="MOBILE">Mobile</option><option value="CLOUD">Cloud</option><option value="HOSTING">Hosting</option><option value="VPN">VPN</option><option value="EQUIPMENT">Équipement</option>
          </Select>
          <Select label="Marque" value={filters.brand ?? ''} onChange={(e) => onChange({ ...filters, brand: e.target.value })}>
            <option value="">Toutes</option><option value="CAMTEL">CAMTEL</option><option value="BLUE">Blue</option><option value="FIBER_CONNECT">Fiber Connect</option><option value="HOSTING">Hosting</option><option value="CARRIER">Carrier</option>
          </Select>
          <Select label="Tarification" value={filters.pricing_type ?? ''} onChange={(e) => onChange({ ...filters, pricing_type: e.target.value })}>
            <option value="">Toutes</option><option value="FIXED">Prix fixe</option><option value="QUOTE">Sur devis</option><option value="FREE">Gratuit</option>
          </Select>
          <Input label="Prix min (FCFA)" type="number" value={filters.min_price ?? ''} onChange={(e) => onChange({ ...filters, min_price: e.target.value })} />
          <Input label="Prix max (FCFA)" type="number" value={filters.max_price ?? ''} onChange={(e) => onChange({ ...filters, max_price: e.target.value })} />
          <div className="flex items-end">
            <button onClick={() => onChange({ service: '', segment: '', availability: '', search: '' })} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700">Réinitialiser</button>
          </div>
        </div>
      )}
    </div>
  );
}
