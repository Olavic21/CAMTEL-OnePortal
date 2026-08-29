import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { Button } from '@/shared/components/Button';
import { notificationsApi } from '../api/notificationsApi';
import { ClientAccountNav } from '@/features/account/components/ClientAccountNav';
import { formatDate } from '@/shared/utils/format';
import type { AppNotification } from '@/shared/types';

/**
 * Centre de notifications client (/mon-compte/notifications) — cahier des
 * charges section 26. Reutilise l'endpoint /notifications/ deja consomme par
 * le back-office (AdminNotificationsPage), avec marquage lu individuel et
 * global. La lecture des preferences de notification suivra le contrat API
 * lorsqu'il sera defini (section 26 : "si l'API le permet").
 */
export default function ClientNotificationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', 'client'],
    queryFn: () => notificationsApi.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: invalidate,
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <div className="container-app flex min-h-[300px] items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label={t('common.loading')} />
      </div>
    );
  }

  const notifications: AppNotification[] = data?.results ?? [];
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="container-app max-w-2xl py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
          {t('account.notifications')}
          {unread > 0 && (
            <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
              {unread}
            </span>
          )}
        </h1>
        {unread > 0 && (
          <Button variant="tertiary" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4" /> {t('notifications.markAllRead')}
          </Button>
        )}
      </div>
      <ClientAccountNav />

      <Card className="mt-6 p-6">
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isError && notifications.length === 0 && (
          <EmptyState icon={Bell} title={t('notifications.empty')} description={t('notifications.emptyHint')} />
        )}

        {!isError && notifications.length > 0 && (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {notifications.map((n) => (
              <li key={n.id} className={n.is_read ? 'py-4 opacity-70' : 'py-4'}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {n.message}
                      {!n.is_read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" aria-label={t('notifications.unread')} />}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <Button
                      variant="tertiary"
                      onClick={() => markRead.mutate(n.id)}
                      disabled={markRead.isPending}
                      aria-label={t('notifications.markRead')}
                    >
                      {t('notifications.markRead')}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}