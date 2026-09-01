import { Link, useSearchParams } from 'react-router-dom';
import { Scale, PackageSearch, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import { useCatalog } from '../hooks/useCatalog';
import { ProductCard } from '../components/ProductCard';
import { ProductFilters, type ProductFilterState } from '../components/ProductFilters';
import { Pagination } from '@/shared/components/Pagination';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { useTranslation } from 'react-i18next';

type SortValue = '' | 'price' | '-price' | 'name' | '-name' | '-created_at' | 'availability';

export default function ProductListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<SortValue>('');
  const filters: ProductFilterState = {
    service: searchParams.get('service') ?? '',
    segment: searchParams.get('segment') ?? '',
    availability: searchParams.get('availability') ?? '',
    search: searchParams.get('search') ?? '',
    technology: searchParams.get('technology') ?? '',
    billing_period: searchParams.get('billing_period') ?? '',
    offer_type: searchParams.get('offer_type') ?? '',
    brand: searchParams.get('brand') ?? '',
    pricing_type: searchParams.get('pricing_type') ?? '',
    min_price: searchParams.get('min_price') ?? '',
    max_price: searchParams.get('max_price') ?? '',
  };

  const apiOrdering = orderBy === 'availability' ? undefined : orderBy || undefined;
  const { data, isLoading } = useCatalog({
    service: filters.service || undefined,
    segment: filters.segment || undefined,
    search: filters.search || undefined,
    technology: filters.technology || undefined,
    billing_period: filters.billing_period || undefined,
    offer_type: filters.offer_type || undefined,
    brand: filters.brand || undefined,
    pricing_type: filters.pricing_type || undefined,
    availability: filters.availability || undefined,
    min_price: filters.min_price || undefined,
    max_price: filters.max_price || undefined,
    page,
    page_size: 12,
    ordering: apiOrdering,
  });

  const results = orderBy === 'availability' ? sortProducts(data?.results ?? [], orderBy) : data?.results ?? [];

  function updateFilters(next: ProductFilterState) {
    setPage(1);
    setOrderBy('');
    const params = new URLSearchParams();
    if (next.service) params.set('service', next.service);
    if (next.segment) params.set('segment', next.segment);
    if (next.availability) params.set('availability', next.availability);
    if (next.search) params.set('search', next.search);
    if (next.technology) params.set('technology', next.technology);
    if (next.billing_period) params.set('billing_period', next.billing_period);
    if (next.offer_type) params.set('offer_type', next.offer_type);
    if (next.brand) params.set('brand', next.brand);
    if (next.pricing_type) params.set('pricing_type', next.pricing_type);
    if (next.min_price) params.set('min_price', next.min_price);
    if (next.max_price) params.set('max_price', next.max_price);
    setSearchParams(params);
  }

  const totalProducts = data?.count ?? 0;
  const pageSize = 12;
  const totalPages = Math.ceil(totalProducts / pageSize) || 1;

  return (
    <div className="container-app py-10">
      <Breadcrumbs
        items={[{ label: t('nav.home'), to: '/' }, { label: t('products.catalogTitle') }]}
      />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">{t('products.catalogTitle')}</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">{t('products.catalogSubtitle')}</p>
        </div>
        <Link
          to="/produits/comparateur"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline dark:text-primary-300"
        >
          <Scale className="h-4 w-4" /> {t('products.compareOffers')}
        </Link>
      </div>

      <div className="mb-6">
        <ProductFilters filters={filters} onChange={updateFilters} />
      </div>

      {/* Barre d'outils : nombre de resultats + tri */}
      {!isLoading && !!totalProducts && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-700 dark:text-neutral-200">{totalProducts}</span>{' '}
            {t('products.resultsCountSuffix', { count: totalProducts })}
          </p>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-neutral-400" />
            <select
              value={orderBy}
              onChange={(e) => { setOrderBy(e.target.value as SortValue); setPage(1); }}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900"
              aria-label={t('products.sortBy')}
            >
              <option value="">{t('products.sort.relevance')}</option>
              <option value="price">{t('products.sort.priceAsc')}</option>
              <option value="-price">{t('products.sort.priceDesc')}</option>
              <option value="name">{t('products.sort.alphabetical')}</option>
              <option value="availability">{t('products.sort.availability')}</option>
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={t('products.noResults')}
          description={t('products.noResultsHint')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((product, i) => (
              <ProductCard key={String(product.id)} product={product} index={i} />
            ))}
          </div>
          <div className="mt-10">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}

/** Tri local (les mocks n'ont pas de tri cote API). */
function sortProducts<T extends { name: string; pricing?: { amount?: number } | null; availability?: string }>(
  products: T[],
  orderBy: SortValue,
): T[] {
  if (!orderBy) return products;
  const sorted = [...products];
  if (orderBy === 'price') {
    return sorted.sort((a, b) => (a.pricing?.amount ?? Number.MAX_SAFE_INTEGER) - (b.pricing?.amount ?? Number.MAX_SAFE_INTEGER));
  }
  if (orderBy === '-price') {
    return sorted.sort((a, b) => (b.pricing?.amount ?? -1) - (a.pricing?.amount ?? -1));
  }
  if (orderBy === 'name') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
  if (orderBy === 'availability') {
    return sorted.sort((a, b) => (a.availability ?? '').localeCompare(b.availability ?? ''));
  }
  return sorted;
}
