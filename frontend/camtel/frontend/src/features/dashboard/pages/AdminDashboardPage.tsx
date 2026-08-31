import { useTranslation } from 'react-i18next';
import { Package, FileText, Tag, MessageSquare, TrendingUp, Search, Users, ClipboardList, MessageCircle, CreditCard, Bell, UserCog } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useDashboardSummary, useAnalyticsSummary } from '../hooks/useDashboard';
import { SummaryCard } from '../components/SummaryCard';
import { DataQualityWidget } from '../components/DataQualityWidget';
import { Card } from '@/shared/components/Card';
import { Skeleton } from '@/shared/components/Skeleton';
import { formatDate } from '@/shared/utils/format';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: summary, isLoading } = useDashboardSummary();
  // Section 20 mission (Analytics) : vues des offres, top offres, taux de
  // conversion. Anciennement un graphique avec des donnees factices en dur
  // ("viewsSample") alors que ce endpoint existait et fonctionnait deja.
  const { data: analytics, isLoading: isAnalyticsLoading } = useAnalyticsSummary(30);

  // Dashboard adapte au role : un Super Admin / Admin voit la vue globale
  // (comptes, souscriptions, tickets, paiements) ; les roles redactionnels
  // (product_manager/editor) voient uniquement l'etat du catalogue.
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const topOffersData = (analytics?.top_offers ?? []).map((o) => ({
    name: o.product__name,
    vues: o.count,
  }));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('admin.dashboard.title')}</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard icon={Package} label={t('admin.dashboard.publishedProducts')} value={summary?.products_published ?? 0} />
          <SummaryCard icon={Package} label={t('admin.dashboard.draftProducts')} value={summary?.products_draft ?? 0} tone="accent" />
          <SummaryCard icon={Tag} label={t('admin.dashboard.activePromotions')} value={summary?.promotions_active ?? 0} />
          <SummaryCard icon={MessageSquare} label={t('admin.dashboard.newMessages')} value={summary?.contact_messages_new ?? 0} tone="accent" />
        </div>
      )}

      {/* Vue globale Super Admin / Admin — compteurs reels du backend */}
      {isAdmin && !isLoading && summary && (
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard icon={Users} label={t('admin.dashboard.totalUsers')} value={summary.users?.total ?? 0} />
          <SummaryCard icon={UserCog} label={t('admin.dashboard.backofficeUsers')} value={summary.users?.backoffice ?? 0} tone="accent" />
          <SummaryCard icon={ClipboardList} label={t('admin.dashboard.subscriptionsTotal')} value={summary.subscriptions?.total ?? 0} />
          <SummaryCard icon={MessageCircle} label={t('admin.dashboard.ticketsOpen')} value={summary.tickets?.open ?? 0} tone="accent" />
          <SummaryCard icon={CreditCard} label={t('admin.dashboard.paymentsPending')} value={summary.payments?.pending ?? 0} />
          <SummaryCard icon={Bell} label={t('admin.dashboard.notificationsUnreadGlobal')} value={summary.notifications_unread_global ?? 0} tone="accent" />
        </div>
      )}

      {!isAnalyticsLoading && analytics && (
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard icon={TrendingUp} label={t('admin.dashboard.conversionRate')} value={`${analytics.conversion_rate}%`} tone="accent" />
          <SummaryCard icon={Search} label={t('admin.dashboard.totalEvents')} value={analytics.total_events} />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {t('admin.dashboard.topViewedProducts')}
          </h2>
          {isAnalyticsLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : topOffersData.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">
              {t('admin.dashboard.noAnalyticsData')}
            </p>
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

          {!!analytics?.top_search_queries?.length && (
            <div className="mt-6 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <h3 className="mb-2 text-xs font-semibold uppercase text-neutral-500">
                {t('admin.dashboard.topSearchQueries')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {analytics.top_search_queries.map((q) => (
                  <span
                    key={q}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            <FileText className="h-4 w-4" /> {t('admin.dashboard.recentNews')}
          </h2>
          <ul className="space-y-3">
            {summary?.news_recent?.length ? (
              summary.news_recent.map((n) => (
                <li key={n.id} className="text-sm">
                  <p className="font-medium text-neutral-800 dark:text-neutral-100">{n.title}</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {n.published_at ? formatDate(n.published_at) : t('admin.products.draft')}
                  </p>
                </li>
              ))
            ) : (
              <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('admin.dashboard.noRecentNews')}</p>
            )}
          </ul>
        </Card>

        {/* Widget Qualite des donnees (cahier des charges section 19) */}
        <DataQualityWidget />
      </div>
    </div>
  );
}
