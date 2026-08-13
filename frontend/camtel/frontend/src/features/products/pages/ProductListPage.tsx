import { Link, useSearchParams } from 'react-router-dom';
import { Scale, PackageSearch, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { ProductCard } from '../components/ProductCard';
import { ProductFilters, type ProductFilterState } from '../components/ProductFilters';
import { Pagination } from '@/shared/components/Pagination';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { useTranslation } from 'react-i18next';

type SortValue = '' | 'price' | '-price' | '-created_at' | 'name';

export default function ProductListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<SortValue>('');
  const filters: ProductFilterState = {
    category: searchParams.get('category') ?? '',
    segment: searchParams.get('segment') ?? '',
    search: searchParams.get('search') ?? '',
  };

  const { data: categoriesData } = useCategories();
  const { data, isLoading } = useProducts({
    category: filters.category || undefined,
    segment: filters.segment || undefined,
    search: filters.search || undefined,
    ordering: orderBy || undefined,
    page,
  });

  function updateFilters(next: ProductFilterState) {
    setPage(1);
    setOrderBy('');
    const params = new URLSearchParams();
    if (next.category) params.set('category', next.category);
    if (next.segment) params.set('segment', next.segment);
    if (next.search) params.set('search', next.search);
    setSearchParams(params);
  }

  const totalProducts = data?.count ?? 0;
  const pageSize = 12;
  const totalPages = Math.ceil(totalProducts / pageSize) || 1;

  return (
    <div className="container-app py-10">
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
        <ProductFilters
          categories={categoriesData?.results ?? []}
          filters={filters}
          onChange={updateFilters}
        />
      </div>

      {/* Barre d'outils du catalogue : nombre de résultats + tri */}
      {!isLoading && !!totalProducts && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-700 dark:text-neutral-200">{totalProducts}</span> résultat{totalProducts > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-neutral-400" />
            <select
              value={orderBy}
              onChange={(e) => { setOrderBy(e.target.value as SortValue); setPage(1); }}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900"
              aria-label="Trier par"
            >
              <option value="">Pertinence</option>
              <option value="price">Prix croissant</option>
              <option value="-price">Prix décroissant</option>
              <option value="-created_at">Plus récents</option>
              <option value="name">Ordre alphabétique</option>
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
      ) : !data?.results.length ? (
        <EmptyState
          icon={PackageSearch}
          title={t('products.noResults')}
          description={t('products.noResultsHint')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.results.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
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
