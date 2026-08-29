import { useTranslation } from 'react-i18next';
import { TrendingUp, Eye, Search, MousePointer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/shared/components/Card';
import { Skeleton } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { useAnalyticsSummary } from '@/features/dashboard/hooks/useDashboard';

/**
 * Analytics Back-Office (/admin/analytics) — cahier des charges section 20.
 * Vues des offres, top offres, taux de conversion, recherches populaires.
 */
export default function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const { data: analytics, isLoading, isError, refetch } = useAnalyticsSummary(30);

  const topOffersData = (analytics?.top_offers ?? []).map((o) => ({
    name: o.product__name,
    vues: o.count,
  }));

  const columns = [
    { key: 'totalEvents', label: t('admin.analytics.totalEvents'), value: analytics?.total_events ?? 0, icon: MousePointer },
    { key: 'conversionRate', label: t('admin.analytics.conversionRate'), value: `${analytics?.conversion_rate ?? 0}%`, icon: TrendingUp },
    { key: 'topSearchQueries', label: t('admin.analytics.topSearchQueries'), value: analytics?.top_search_queries?.length ?? 0, icon: Search },
  ];

  if (isError) {
    return (
      <div>
        <h1 className="mb-6 text-xl font-semibold">{t('admin.analytics.title')}</h1>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t('admin.analytics.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.analytics.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full" />))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {columns.map(({ key, label, value, icon: Icon }) => (
              <Card key={key} className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
              </Card>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <Eye className="h-4 w-4" /> {t('admin.analytics.topViewedProducts')}
              </h2>
              {topOffersData.length === 0 ? (
                <p className="py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">{t('admin.analytics.noData')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topOffersData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="vues" fill="#003DA5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <Search className="h-4 w-4" /> {t('admin.analytics.topSearchQueries')}
              </h2>
              {analytics?.top_search_queries?.length ? (
                <div className="flex flex-wrap gap-2">
                  {analytics.top_search_queries.map((q) => (
                    <span key={q} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{q}</span>
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">{t('admin.analytics.noData')}</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}