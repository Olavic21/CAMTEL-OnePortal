import { useMemo, useState } from 'react';
import { Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/shared/components/Input';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { trackEvent } from '@/shared/lib/analytics';
import { useCatalog } from '../hooks/useCatalog';
import { ComparisonTable } from '../components/ComparisonTable';
import type { ProductV2 } from '@/shared/types';

const MAX_COMPARE = 3;

/**
 * Comparateur d'offres — REFACTORISE (cahier des charges section 13).
 * - Source : catalogue ProductV2 (API /products/ des que dispo, mocks
 *   conformes en attendant) — remplace l'ancien endpoint /products/compare/.
 * - Les colonnes sont generees par ComparisonTable a partir du SCHEMA de
 *   specifications : aucune colonne rigide.
 * - Comparaison limitee aux produits d'un MEME service (le premier produit
 *   ajoute definit l'univers) et a MAX_COMPARE produits.
 */
export default function ProductComparePage() {
  const { t } = useTranslation();
  const { data, isLoading } = useCatalog({});
  const [selected, setSelected] = useState<ProductV2[]>([]);

  const products = useMemo(() => data?.results ?? [], [data]);

  // Un seul univers a la fois : produits du meme service que le 1er selectionne.
  const selectable = useMemo(
    () =>
      products.filter(
        (p) =>
          !selected.some((s) => String(s.id) === String(p.id)) &&
          (selected.length === 0 || selected[0].service === p.service),
      ),
    [products, selected],
  );

  function addProduct(id: string) {
    const product = products.find((p) => String(p.id) === id);
    if (!product || selected.length >= MAX_COMPARE) return;
    const next = [...selected, product];
    setSelected(next);
    // Section 20 mission : evenement "offer_compare" des 2 offres en comparaison.
    if (next.length >= 2) {
      trackEvent('offer_compare', { product_ids: next.map((p) => p.id) });
    }
  }

  function removeProduct(id: ProductV2['id']) {
    setSelected((prev) => prev.filter((p) => String(p.id) !== String(id)));
  }

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-100">
        {t('products.compare.title')}
      </h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">{t('products.compare.subtitle')}</p>

      <div className="mt-6 max-w-xs">
        <label htmlFor="compare-select" className="sr-only">
          {t('products.compare.addProduct')}
        </label>
        <Select
          id="compare-select"
          value=""
          onChange={(e) => addProduct(e.target.value)}
          aria-label={t('products.compare.addProduct')}
          disabled={selected.length >= MAX_COMPARE}
        >
          <option value="">
            {selected.length >= MAX_COMPARE
              ? t('products.compare.maxReached')
              : t('products.compare.addProductPlaceholder')}
          </option>
          {selectable.map((p) => (
            <option key={String(p.id)} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </Select>
        {selected.length > 0 && (
          <p className="mt-2 text-xs text-neutral-400">
            {t('products.compare.sameServiceHint')}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-3" role="status" aria-live="polite">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : selected.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Scale} title={t('products.compare.empty')} description={t('products.compare.emptyHint')} />
        </div>
      ) : (
        <div className="mt-8">
          <ComparisonTable products={selected} onRemove={removeProduct} />
        </div>
      )}
    </div>
  );
}
