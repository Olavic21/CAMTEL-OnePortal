import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle, FileQuestion, CircleOff, Coins, ImageOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Skeleton } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { DataQualityBadge } from '@/shared/components/DataQualityBadge';
import { useDataQualityMetrics } from '../hooks/useDataQuality';

/**
 * Qualite des donnees (/admin/qualite) — cahier des charges section 19.
 * Les compteurs sont calcules par useDataQualityMetrics (hook partage avec
 * le widget du dashboard — aucune duplication de la logique de comptage).
 */

export default function AdminDataQualityPage() {
  const { t } = useTranslation();
  const { metrics, products, isLoading, isError, refetch } = useDataQualityMetrics();

  const cards = [
    { key: 'total', value: metrics.total, icon: ShieldCheck, tone: 'text-primary' },
    { key: 'verified', value: metrics.verified, icon: CheckCircle2, tone: 'text-emerald-600' },
    { key: 'expired', value: metrics.expired, icon: AlertTriangle, tone: 'text-amber-600' },
    { key: 'requiresVerification', value: metrics.requiresVerification, icon: FileQuestion, tone: 'text-orange-600' },
    { key: 'withoutSource', value: metrics.withoutSource, icon: CircleOff, tone: 'text-red-600' },
    { key: 'withoutPrice', value: metrics.withoutPrice, icon: Coins, tone: 'text-red-600' },
    { key: 'withoutImage', value: null, icon: ImageOff, tone: 'text-neutral-400' },
  ] as const;

  if (isError) {
    return (
      <div>
        <h1 className="mb-6 text-xl font-semibold">{t('admin.quality.title')}</h1>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{t('admin.quality.title')}</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.quality.subtitle')}</p>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" role="status" aria-live="polite">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map(({ key, value, icon: Icon, tone }) => (
              <Card key={key} className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${tone}`} aria-hidden />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t(`admin.quality.${key}`)}</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value ?? 'N/A'}</p>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">{t('admin.quality.imageNote')}</p>

          {/* Section 21 : une donnee REQUIRES_VERIFICATION doit etre clairement identifiable. */}
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {t('admin.quality.toVerifyList')}
          </h2>
          {metrics.requiresVerification === 0 ? (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('admin.quality.noneToVerify')}</p>
          ) : (
            <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
              {products
                .filter((p) => p.source?.quality === 'REQUIRES_VERIFICATION')
                .map((p) => (
                  <li key={String(p.id)} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{p.name}</p>
                      <div className="mt-1">
                        <DataQualityBadge quality={p.source.quality} />
                      </div>
                    </div>
                    <Link
                      to="/admin/produits"
                      className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline dark:text-primary-300"
                    >
                      {t('admin.quality.review')} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}