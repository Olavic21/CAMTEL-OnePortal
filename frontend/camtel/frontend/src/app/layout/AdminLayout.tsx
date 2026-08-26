import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from './AdminSidebar';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { ThemeToggle } from '@/shared/components/ThemeToggle';

// Bandeau démo (opt-in via VITE_DEMO_MODE="true"). Absent si le mode demo est off.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export function AdminLayout() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative">
            <AdminSidebar />
          </div>
        </div>
      )}

      <div className="flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label={t('common.a11y.openMenu')}
              className="text-neutral-700 dark:text-neutral-200 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 md:hidden">{t('admin.brand')}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        {DEMO_MODE && (
          <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
            {t('admin.demoBanner')}
          </div>
        )}
        <main id="main-content" className={clsx('p-4 sm:p-6 lg:p-8')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

