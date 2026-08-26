import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Info, Loader2 } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { Badge } from '@/shared/components/Badge';
import { httpClient } from '@/shared/lib/axios';
import { formatDate } from '@/shared/utils/format';
import { ClientAccountNav } from '../components/ClientAccountNav';
import type { SubscriptionRequest, SubscriptionStatus } from '@/shared/types';

const STATUS_TONES: Record<SubscriptionStatus, 'warning' | 'info' | 'success' | 'destructive' | 'neutral'> = {
  PENDING: 'warning',
  UNDER_REVIEW: 'info',
  ADDITIONAL_INFO_REQUIRED: 'warning',
  APPROVED: 'success',
  SCHEDULED: 'info',
  ACTIVATED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'neutral',
};

export default function ClientSubscriptionsPage() {
  const { t } = useTranslation();

  // NB: reutilise SubscriptionRequest (shared/types) — la version precedente
  // de cette page declarait un type local errone (product: { name } au lieu
  // de product_name: string), ce qui aurait toujours affiche "-" a la place
  // du nom du produit.
  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', 'mine'],
    queryFn: async () => {
      const response = await httpClient.get<SubscriptionRequest[]>('/subscriptions/my-subscriptions/');
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

  const subscriptions = data || [];

  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {t('account.subscriptionRequests')}
      </h1>
      <ClientAccountNav />

      <Card className="mt-6 p-6">
        {subscriptions.length === 0 && (
          <EmptyState
            icon={Info}
            title={t('account.noRequests')}
            description={t('account.noRequestsHint')}
          />
        )}

        {subscriptions.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full rounded-md border border-neutral-200 dark:border-neutral-700">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="p-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t('account.requestNumber')}
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t('account.product')}
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t('account.status')}
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t('account.createdAt')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {sub.request_number}
                    </td>
                    <td className="p-3 text-neutral-600 dark:text-neutral-400">{sub.product_name || '-'}</td>
                    <td className="p-3">
                      <Badge tone={STATUS_TONES[sub.status]}>
                        {t(`admin.subscriptions.status.${statusKey(sub.status)}`)}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-neutral-500 dark:text-neutral-400">
                      {formatDate(sub.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function statusKey(value: SubscriptionStatus): string {
  const map: Record<SubscriptionStatus, string> = {
    PENDING: 'pending',
    UNDER_REVIEW: 'underReview',
    ADDITIONAL_INFO_REQUIRED: 'additionalInfoRequired',
    APPROVED: 'approved',
    SCHEDULED: 'scheduled',
    ACTIVATED: 'activated',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
  };
  return map[value];
}
