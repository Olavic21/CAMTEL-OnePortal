import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useNotifications';
import { formatDateTime } from '@/shared/utils/format';
import type { AppNotification } from '@/shared/types';

const dotTone: Record<AppNotification['type'], string> = {
  info: 'bg-primary',
  success: 'bg-accent-500',
  warning: 'bg-amber-500',
};

// Centre de notifications internes (roadmap V2) : cloche avec compteur de
// non-lues, panneau deroulant des dernieres notifications, lien vers la
// liste complete.
export function NotificationBell() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = data?.results ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`${t('admin.sidebar.notifications')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
        className="relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <p className="text-sm font-semibold">{t('admin.notifications.title')}</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" /> {t('admin.notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">{t('admin.notifications.empty')}</p>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && markRead.mutate(n.id)}
                  className={clsx(
                    'flex w-full items-start gap-2.5 border-b border-neutral-50 px-4 py-3 text-left hover:bg-neutral-50',
                    !n.is_read && 'bg-primary-50/40',
                  )}
                >
                  <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', dotTone[n.type])} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-neutral-800 dark:text-neutral-100">{n.message}</span>
                    <span className="mt-0.5 block text-xs text-neutral-400 dark:text-neutral-500">{formatDateTime(n.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>

          <Link
            to="/admin/notifications"
            onClick={() => setIsOpen(false)}
            className="block border-t border-neutral-100 px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            {t('admin.notifications.seeAll')}
          </Link>
        </div>
      )}
    </div>
  );
}
