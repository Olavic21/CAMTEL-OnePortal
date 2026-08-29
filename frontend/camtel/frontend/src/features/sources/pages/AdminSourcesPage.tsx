import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { DataQualityBadge } from '@/shared/components/DataQualityBadge';
import { Skeleton } from '@/shared/components/Skeleton';
import { useProducts } from '@/features/products/hooks/useProducts';
import { formatDate } from '@/shared/utils/format';
import type { DataQuality } from '@/shared/types';

/**
 * Gestion des sources Back-Office (/admin/sources) — cahier des charges section 20.
 * Suivi de la qualite des donnees, sources des offres, dates de verification.
 */
const QUALITY_ORDER: DataQuality[] = ['OFFICIAL', 'MANUAL', 'DEMO', 'REQUIRES_VERIFICATION'];

export default function AdminSourcesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useProducts({ page_size: 100 });
  const products = data?.results ?? [];

  const qualityCounts = QUALITY_ORDER.reduce((acc, q) => {
    acc[q] = products.filter((p) => p.source?.quality === q).length;
    return acc;
  }, {} as Record<DataQuality, number>);

  const staleProducts = products.filter((p) => {
    if (!p.source?.lastVerifiedAt) return true;
    const lastVerified = new Date(p.source.lastVerifiedAt);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return lastVerified < sixMonthsAgo;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t('admin.sources.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.sources.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full" />))}
        </div>
      ) : (
        <>
          {/* Compteurs par qualite */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {QUALITY_ORDER.map((quality) => (
              <Card key={quality} className="p-4">
                <DataQualityBadge quality={quality} />
                <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{qualityCounts[quality]}</p>
              </Card>
            ))}
          </div>

          {/* Produits avec verification requise */}
          <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            <AlertTriangle className="h-4 w-4" /> {t('admin.sources.requiresVerification')}
          </h2>
          {staleProducts.filter((p) => p.source?.quality === 'REQUIRES_VERIFICATION').length === 0 ? (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('admin.sources.noneToVerify')}</p>
          ) : (
            <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
              {staleProducts.filter((p) => p.source?.quality === 'REQUIRES_VERIFICATION').map((p) => (
                <li key={String(p.id)} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{p.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <DataQualityBadge quality={p.source?.quality} />
                      {p.source?.name && (<span className="text-xs text-neutral-400">{p.source.name}</span>)}
                    </div>
                  </div>
                  {p.source?.lastVerifiedAt && (<span className="text-xs text-neutral-400">{formatDate(p.source.lastVerifiedAt)}</span>)}
                </li>
              ))}
            </ul>
          )}

          {/* Produits perimes */}
          <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            <ShieldCheck className="h-4 w-4" /> {t('admin.sources.staleData')}
          </h2>
          {staleProducts.length === 0 ? (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('admin.sources.noneStale')}</p>
          ) : (
            <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
              {staleProducts.slice(0, 10).map((p) => (
                <li key={String(p.id)} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{p.name}</p>
                    <p className="text-xs text-neutral-400">{t('admin.sources.lastVerified')}: {p.source?.lastVerifiedAt ? formatDate(p.source.lastVerifiedAt) : '—'}</p>
                  </div>
                  <DataQualityBadge quality={p.source?.quality} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}