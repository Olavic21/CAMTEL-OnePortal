import { useTranslation } from 'react-i18next';
import { Package, FileText, Tag, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useDashboardSummary } from '../hooks/useDashboard';
import { SummaryCard } from '../components/SummaryCard';
import { Card } from '@/shared/components/Card';
import { Skeleton } from '@/shared/components/Skeleton';
import { formatDate } from '@/shared/utils/format';

// Statistiques de consultation (roadmap V2) — donnees illustratives en l'absence de backend connecte.
const viewsSample = [
  { name: 'Fixe', vues: 240 },
  { name: 'Mobile', vues: 456 },
  { name: 'Internet', vues: 389 },
  { name: 'Entreprise', vues: 210 },
];

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { data: summary, isLoading } = useDashboardSummary();

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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {t('admin.dashboard.topViewedProducts')}
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={viewsSample}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="vues" fill="#003DA5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
      </div>
    </div>
  );
}
