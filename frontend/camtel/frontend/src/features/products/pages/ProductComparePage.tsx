import { useState } from 'react';
import { X, Scale } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useProductCompare } from '../hooks/useProductCompare';
import { Select } from '@/shared/components/Input';
import { formatPrice } from '@/shared/utils/format';
import { EmptyState } from '@/shared/components/EmptyState';
import { trackEvent } from '@/shared/lib/analytics';
import { useTranslation } from 'react-i18next';

// Comparateur d'offres via endpoint API /products/compare/
export default function ProductComparePage() {
  const { t } = useTranslation();
  const { data } = useProducts({ status: 'published' });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { data: compared, isLoading } = useProductCompare(selectedIds);

  const products = data?.results ?? [];
  const selected = compared ?? [];

  function addProduct(id: number) {
    if (id && !selectedIds.includes(id) && selectedIds.length < 3) {
      const nextIds = [...selectedIds, id];
      setSelectedIds(nextIds);
      // Section 20 mission : evenement "offer_compare" une fois qu'au moins
      // deux offres sont mises en comparaison (une seule offre selectionnee
      // n'est pas encore une comparaison).
      if (nextIds.length >= 2) {
        trackEvent('offer_compare', { product_ids: nextIds });
      }
    }
  }

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-100">
        {t('products.compare.title')}
      </h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        {t('products.compare.subtitle')}
      </p>

      <div className="mt-6 max-w-xs">
        <label htmlFor="compare-select" className="sr-only">
          {t('products.compare.addProduct')}
        </label>
        <Select
          id="compare-select"
          value=""
          onChange={(e) => addProduct(Number(e.target.value))}
          aria-label={t('products.compare.addProduct')}
        >
          <option value="">{t('products.compare.addProductPlaceholder')}</option>
          {products
            .filter((p) => !selectedIds.includes(p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </Select>
      </div>

      {selectedIds.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Scale} title={t('products.compare.empty')} />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto" role="region" aria-label={t('products.compare.tableLabel')}>
          {isLoading ? (
            <p className="text-sm text-neutral-500" role="status" aria-live="polite">
              {t('products.compare.loading')}
            </p>
          ) : (
            <table className="w-full min-w-[600px] border-separate border-spacing-0 text-sm">
              <caption className="sr-only">{t('products.compare.caption')}</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-40" />
                  {selected.map((p) => (
                    <th
                      key={p.id}
                      scope="col"
                      className="border-b border-neutral-200 px-4 py-3 text-left dark:border-neutral-800"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{p.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedIds(selectedIds.filter((id) => id !== p.id))}
                          aria-label={t('products.compare.remove', { name: p.name })}
                          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="border-b border-neutral-100 px-4 py-3 text-left font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    {t('products.category')}
                  </th>
                  {selected.map((p) => (
                    <td key={p.id} className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                      {p.category?.name ?? '-'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="border-b border-neutral-100 px-4 py-3 text-left font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    {t('products.compare.price')}
                  </th>
                  {selected.map((p) => (
                    <td key={p.id} className="border-b border-neutral-100 px-4 py-3 font-semibold text-primary dark:border-neutral-800">
                      {formatPrice(p.price, p.price_unit)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">
                    {t('products.description')}
                  </th>
                  {selected.map((p) => (
                    <td key={p.id} className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {p.short_description || p.description}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
