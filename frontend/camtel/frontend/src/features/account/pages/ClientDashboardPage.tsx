import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Info, Loader2 } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { Badge } from '@/shared/components/Badge';
import { httpClient } from '@/shared/lib/axios';
import { ClientAccountNav } from '../components/ClientAccountNav';

interface ClientDashboard {
  total: number;
  in_progress: number;
  completed: number;
  rejected: number;
}

export default function ClientDashboardPage() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', 'dashboard'],
    queryFn: async () => {
      const response = await httpClient.get<ClientDashboard>('/subscriptions/my-dashboard/');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container-app flex min-h-[300px] items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label={t('common.loading')} />
      </div>
    );
  }

  const dashboard = data || {
    total: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0,
  };

  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {t('account.dashboard')}
      </h1>
      <ClientAccountNav />

      <Card className="mt-6 p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div role="region" aria-label={t('dashboard.total')}>
            <Badge tone="primary">{t('dashboard.total')}:</Badge>
            <p data-testid="kpi-total" className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{dashboard.total}</p>
          </div>
          <div>
            <Badge tone="info">{t('dashboard.in_progress')}:</Badge>
            <p data-testid="kpi-in_progress" className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{dashboard.in_progress}</p>
          </div>
          <div>
            <Badge tone="success">{t('dashboard.completed')}:</Badge>
            <p data-testid="kpi-completed" className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{dashboard.completed}</p>
          </div>
          <div>
            <Badge tone="destructive">{t('dashboard.rejected')}:</Badge>
            <p data-testid="kpi-rejected" className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{dashboard.rejected}</p>
          </div>
        </div>

        {dashboard.total === 0 && (
          <EmptyState
            icon={Info}
            title={t('account.noRequests')}
            description={t('account.noDashboardHint')}
          />
        )}
      </Card>
    </div>
  );
}