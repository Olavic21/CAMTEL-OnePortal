import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon } from 'lucide-react';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { Input, Select } from '@/shared/components/Input';
import { EmptyState } from '@/shared/components/EmptyState';
import { Skeleton } from '@/shared/components/Skeleton';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { ServiceBadge } from '@/shared/components/ServiceBadge';
import { SegmentBadge } from '@/shared/components/SegmentBadge';
import { PriceDisplay } from '@/shared/components/PriceDisplay';
import { DataQualityBadge } from '@/shared/components/DataQualityBadge';
import { useCatalog } from '@/features/products/hooks/useCatalog';
import { SERVICES } from '@/shared/config/services';
import { SEGMENTS } from '@/shared/config/segments';
import { documentsApi } from '@/features/documents/api/documentsApi';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import type { ProductV2, DocumentEntry } from '@/shared/types';

/**
 * Recherche globale (/search) — cahier des charges section 12.
 * Resultats groupes : Services, Produits, Documentation.
 * Filtres INDEPENDANTS service / segment (jamais melanges).
 * Produits via le catalogue backend (/api/v1/products/?search=),
 * documentation via /documents/. Aucun catalogue parallele cote frontend.
 */

function matches(haystack: string | undefined | null, needle: string) {
  return (haystack ?? '').toLowerCase().includes(needle);
}

export default function SearchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const rawQuery = params.get('q') ?? '';
  const service = params.get('service') ?? '';
  const segment = params.get('segment') ?? '';
  const availability = params.get('availability') ?? '';

  const query = useDebouncedValue(rawQuery, 250);
  const needle = query.trim().toLowerCase();

  const { data: catalog, isLoading: loadingProducts } = useCatalog({
    search: query.trim() || undefined,
    service: service || undefined,
    segment: segment || undefined,
  });

  const allProducts = useMemo(() => catalog?.results ?? [], [catalog]);
  const products = useMemo(
    () =>
      allProducts.filter(
        (p: ProductV2) =>
          (!availability || (p.availability ?? 'AVAILABLE') === availability) &&
          (!needle ||
            matches(p.name, needle) ||
            matches(p.description, needle) ||
            matches(p.shortDescription, needle)),
      ),
    [allProducts, availability, needle],
  );

  // Services correspondants (les 4 univers sont statiques côté frontend).
  const services = useMemo(
    () =>
      SERVICES.filter((s) => !service || s.service === service).filter(
        (s) => !needle || matches(s.label, needle) || matches(s.description, needle),
      ),
    [service, needle],
  );

  // Documentation (endpoint /documents/ existant).
  const { data: docs, isLoading: loadingDocs } = useQuery<DocumentEntry[]>({
    queryKey: ['search-docs', needle],
    queryFn: () => documentsApi.list(needle ? { q: needle } : {}),
    enabled: needle.length >= 2,
  });

  const hasAnyResult = services.length > 0 || products.length > 0 || (docs?.length ?? 0) > 0;
  const isSearching = needle.length >= 2 || !!service || !!segment;
  const isLoadingAny = loadingProducts || (needle.length >= 2 && loadingDocs);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <div className="container-app py-10">
      <Breadcrumbs items={[{ label: t('nav.home'), to: '/' }, { label: t('search.title') }]} />
      <h1 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('search.title')}</h1>

      <div className="mt-4 max-w-2xl">
        <label htmlFor="search-input" className="sr-only">
          {t('search.placeholder')}
        </label>
        <Input
          id="search-input"
          type="search"
          value={rawQuery}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder={t('search.placeholder')}
          autoComplete="off"
        />
      </div>

      {/* Filtres independants : Service != Segment */}
      <div className="mt-4 flex flex-wrap items-center gap-3" role="group" aria-label={t('search.filters')}>
        <Select aria-label={t('catalog.filters.service')} value={service} onChange={(e) => setParam('service', e.target.value)} className="w-48">
          <option value="">{t('catalog.filters.allServices')}</option>
          {SERVICES.map((s) => (
            <option key={s.service} value={s.service}>{s.label}</option>
          ))}
        </Select>
        <Select aria-label={t('catalog.filters.segment')} value={segment} onChange={(e) => setParam('segment', e.target.value)} className="w-48">
          <option value="">{t('catalog.filters.allSegments')}</option>
          {SEGMENTS.map((s) => (
            <option key={s.segment} value={s.segment}>{s.label}</option>
          ))}
        </Select>
        <Select aria-label={t('catalog.filters.availability')} value={availability} onChange={(e) => setParam('availability', e.target.value)} className="w-48">
          <option value="">{t('catalog.filters.allAvailability')}</option>
          <option value="AVAILABLE">{t('availability.AVAILABLE')}</option>
          <option value="ON_REQUEST">{t('availability.ON_REQUEST')}</option>
          <option value="UNAVAILABLE">{t('availability.UNAVAILABLE')}</option>
        </Select>
      </div>

      {!isSearching ? (
        <div className="mt-12">
          <EmptyState icon={SearchIcon} title={t('search.startTyping')} description={t('search.startTypingHint')} />
        </div>
      ) : isLoadingAny ? (
        <div className="mt-8 space-y-3" role="status" aria-live="polite">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !hasAnyResult ? (
        <div className="mt-8">
          <EmptyState icon={SearchIcon} title={t('search.noResults')} description={t('search.noResultsHint')} />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {/* Services */}
          {services.length > 0 && (
            <section aria-labelledby="search-services">
              <h2 id="search-services" className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t('search.group.services')}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {services.map((s) => (
                  <Link key={s.service} to={s.route}>
                    <Card className="h-full p-4 transition-shadow hover:shadow-md">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary dark:bg-primary-900/30 dark:text-primary-300">
                        <s.icon className="h-5 w-5" aria-hidden />
                      </span>
                      <p className="mt-3 font-semibold text-neutral-900 dark:text-neutral-100">{s.label}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">{s.description}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Produits */}
          {products.length > 0 && (
            <section aria-labelledby="search-products">
              <h2 id="search-products" className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t('search.group.products')} ({products.length})
              </h2>
              <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
                {products.map((p) => (
                  <li key={String(p.id)}>
                    <Link
                      to={`/produits/${p.slug}`}
                      className="flex flex-col gap-2 p-4 transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-neutral-900"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{p.name}</span>
                          {p.service && <ServiceBadge service={p.service} />}
                          {p.segment && <SegmentBadge segment={p.segment} />}
                          {p.source && <DataQualityBadge quality={p.source.quality} />}
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {p.shortDescription || p.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <PriceDisplay pricing={p.pricing} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Documentation */}
          {(docs?.length ?? 0) > 0 && (
            <section aria-labelledby="search-docs">
              <h2 id="search-docs" className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t('search.group.documentation')}
              </h2>
              <ul className="space-y-2">
                {docs!.map((d) => (
                  <li key={d.id}>
                    <Card className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{d.title}</p>
                        <Badge tone="neutral">{d.kind}</Badge>
                      </div>
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline dark:text-primary-300">
                          {t('documents.open')}
                        </a>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>
      )}
    </div>
  );
}