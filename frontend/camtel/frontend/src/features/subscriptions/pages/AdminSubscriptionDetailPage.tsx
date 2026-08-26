import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscriptionRequest } from '../hooks/useSubscriptions';
import { AdminChangeStatusDialog } from '@/features/account/components/AdminChangeStatusDialog';
import { Card } from '@/shared/components/Card';
import { Skeleton } from '@/shared/components/Skeleton';
import { Badge } from '@/shared/components/Badge';
import { formatDateTime } from '@/shared/utils/format';

export default function AdminSubscriptionDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subscriptionId = Number(id);
  const { data: subscription, isLoading } = useSubscriptionRequest(subscriptionId);

  if (isLoading || !subscription) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <button onClick={() => navigate('/admin/souscriptions')} className="text-sm text-primary hover:underline">
          &larr; {t('admin.subscriptions.title')}
        </button>
        <h1 className="mt-2 text-xl font-semibold">
          {subscription.request_number} — {subscription.product_name}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {t('admin.subscriptions.client')}
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">{t('admin.subscriptions.client')}</dt>
              <dd className="font-medium">{subscription.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">{t('auth.email')}</dt>
              <dd>{subscription.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">{t('admin.subscriptions.phone')}</dt>
              <dd>{subscription.phone}</dd>
            </div>
            {subscription.message && (
              <div className="pt-2">
                <dt className="text-neutral-500">{t('admin.subscriptions.message')}</dt>
                <dd className="mt-1">{subscription.message}</dd>
              </div>
            )}
          </dl>

          <h2 className="mb-2 mt-6 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {t('admin.subscriptions.history')}
          </h2>
          {subscription.status_history.length === 0 ? (
            <p className="text-sm text-neutral-400">{t('admin.subscriptions.noHistory')}</p>
          ) : (
            <ul className="space-y-2">
              {subscription.status_history.map((entry) => (
                <li key={entry.id} className="text-xs text-neutral-500">
                  <Badge tone="neutral">{entry.new_status}</Badge>{' '}
                  <span>{formatDateTime(entry.created_at)}</span>
                  {entry.comment && <p className="mt-1 text-neutral-600 dark:text-neutral-400">{entry.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <AdminChangeStatusDialog
            subscriptionId={subscription.id}
            initialStatus={subscription.status}
            onCancel={() => navigate('/admin/souscriptions')}
            onSuccess={() => navigate('/admin/souscriptions')}
          />
        </Card>
      </div>
    </div>
  );
}
