import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCheck, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useNotifications';
import { EmptyState } from '@/shared/components/EmptyState';
import { Pagination } from '@/shared/components/Pagination';
import { formatDateTime } from '@/shared/utils/format';
import type { AppNotification } from '@/shared/types';

const dotTone: Record<AppNotification['type'], string> = {
  info: 'bg-primary',
  success: 'bg-accent-500',
  warning: 'bg-amber-500',
};

// Centre de notifications internes — vue complete, paginee (roadmap V2).
export default function AdminNotificationsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications({ page });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.results ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('admin.notifications.title')}</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <CheckCheck className="h-4 w-4" /> {t('admin.notifications.markAllRead')}
          </button>
        )}
      </div>

      {!isLoading && notifications.length === 0 ? (
        <EmptyState icon={Bell} title={t('admin.notifications.empty')} />
      ) : (
        <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:divide-neutral-800 dark:bg-neutral-900">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={clsx(
                'flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-neutral-50',
                !n.is_read && 'bg-primary-50/40',
              )}
            >
              <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', dotTone[n.type])} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-neutral-800 dark:text-neutral-100">{n.message}</span>
                <span className="mt-0.5 block text-xs text-neutral-400 dark:text-neutral-500">{formatDateTime(n.created_at)}</span>
              </span>
              {!n.is_read && <span className="shrink-0 text-xs font-medium text-primary">{t('admin.notifications.unread')}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
