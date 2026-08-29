import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileQuestion, CircleOff, Coins, ImageOff, ArrowRight } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Skeleton } from '@/shared/components/Skeleton';
import { useDataQualityMetrics } from '../hooks/useDataQuality';

/**
 * Widget « Qualite des donnees » du dashboard (cahier des charges section 19).
 * Reutilise useDataQualityMetrics (meme source que la page /admin/qualite) et
 * renvoie vers cette page pour le detail. Aucun calcul duplique.
 */
export function DataQualityWidget() {
  const { t } = useTranslation();
  const { metrics, isLoading } = useDataQualityMetrics();

  const rows = [
    { key: 'total', value: metrics.total, icon: ShieldCheck, tone: 'text-primary' },
    { key: 'verified', value: metrics.verified, icon: CheckCircle2, tone: 'text-emerald-600' },
    { key: 'expired', value: metrics.expired, icon: AlertTriangle, tone: 'text-amber-600' },
    { key: 'requiresVerification', value: metrics.requiresVerification, icon: FileQuestion, tone: 'text-orange-600' },
    { key: 'withoutSource', value: metrics.withoutSource, icon: CircleOff, tone: 'text-red-600' },
    { key: 'withoutPrice', value: metrics.withoutPrice, icon: Coins, tone: 'text-red-600' },
    { key: 'withoutImage', value: metrics.withoutImage, icon: ImageOff, tone: 'text-neutral-400' },
  ] as const;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          <ShieldCheck className="h-4 w-4" aria-hidden /> {t('admin.quality.title')}
        </h2>
        <Link
          to="/admin/qualite"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline dark:text-primary-300"
        >
          {t('admin.quality.seeAll')} <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-2 border-b border-neutral-100 py-1.5 last:border-0 dark:border-neutral-800">
              <dt className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <r.icon className={`h-3.5 w-3.5 ${r.tone}`} aria-hidden />
                {t(`admin.quality.${r.key}`)}
              </dt>
              <dd className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                {r.value ?? 'N/A'}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}