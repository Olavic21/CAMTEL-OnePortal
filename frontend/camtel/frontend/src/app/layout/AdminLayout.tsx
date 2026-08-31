import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, LogOut, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from './AdminSidebar';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { PortalBackofficeSwitch } from '@/shared/components/PortalBackofficeSwitch';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Map chemin -> cle i18n admin.sidebar.*  (fil d'ariane)
const CRUMB_KEYS: Record<string, string> = {
  catalogue: 'catalogue',
  services: 'services',
  offres: 'offers',
  produits: 'products',
  souscriptions: 'subscriptions',
  clients: 'clients',
  tickets: 'tickets',
  analytics: 'analytics',
  actualites: 'news',
  promotions: 'promotions',
  categories: 'categories',
  mediatheque: 'media',
  messages: 'messages',
  notifications: 'notifications',
  sources: 'sources',
  qualite: 'quality',
  journal: 'activityLog',
  utilisateurs: 'users',
  roles: 'roles',
  administration: 'administration',
};

function useAdminBreadcrumbs(pathname: string): { to?: string; labelKey: string }[] {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: { to?: string; labelKey: string }[] = [{ to: '/admin', labelKey: 'dashboard' }];
  for (let i = 1; i < parts.length; i += 1) {
    const key = CRUMB_KEYS[parts[i]];
    if (key) {
      crumbs.push({ to: '/' + parts.slice(0, i + 1).join('/'), labelKey: key });
    }
  }
  return crumbs;
}

// Bandeau demo (opt-in via VITE_DEMO_MODE="true"). Absent si le mode demo est off.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const crumbs = useAdminBreadcrumbs(location.pathname);

  // Identité visible à chaque chargement/rafraîchissement en zone Back Office :
  // le navigateur affiche « CAMTEL-Back Office », distinct du portail public.
  useEffect(() => {
    document.title = t('admin.brand');
    return () => {
      document.title = 'CAMTEL-OnePortal | Plateforme Produits & Services';
    };
  }, [t]);

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
          <div className="relative h-full overflow-y-auto bg-white dark:bg-neutral-900">
            <AdminSidebar />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label={t('common.a11y.closeMenu')}
            className="absolute right-3 top-3 rounded-lg bg-white p-2 text-neutral-600 shadow dark:bg-neutral-800 dark:text-neutral-200"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label={t('common.a11y.openMenu')}
                className="text-neutral-700 dark:text-neutral-200 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {t('admin.brand')}
              </span>
            </div>

            {/* Actions du header : switch, notifications, theme, utilisateur */}
            <div className="flex items-center gap-2 sm:gap-3">
              <PortalBackofficeSwitch variant="compact" className="hidden sm:flex" />
              <ThemeToggle />
              <NotificationBell />
              <div className="hidden items-center gap-2 border-l border-neutral-200 pl-3 md:flex dark:border-neutral-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary dark:bg-primary-900/40 dark:text-primary-200">
                  {(user?.username ?? '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="max-w-[140px] truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {user?.username}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {user ? t(`roles.${user.role}`) : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                aria-label={t('nav.logout')}
                className="rounded-lg border border-neutral-200 p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-red-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Fil d'ariane */}
          <nav
            aria-label={t('common.a11y.breadcrumb')}
            className="flex items-center gap-1 overflow-x-auto border-t border-neutral-100 px-4 py-2 text-xs text-neutral-500 sm:px-6 dark:border-neutral-800 dark:text-neutral-400"
          >
            {crumbs.map((crumb, idx) => (
              <span key={crumb.labelKey + String(idx)} className="flex items-center gap-1 whitespace-nowrap">
                {idx > 0 && <ChevronRight className="h-3 w-3 text-neutral-300 dark:text-neutral-600" aria-hidden />}
                {crumb.to && idx < crumbs.length - 1 ? (
                  <NavLink to={crumb.to} className="hover:text-primary dark:hover:text-primary-300">
                    {t(`admin.sidebar.${crumb.labelKey}`)}
                  </NavLink>
                ) : (
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">
                    {t(`admin.sidebar.${crumb.labelKey}`)}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </header>
        {DEMO_MODE && (
          <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
            {t('admin.demoBanner')}
          </div>
        )}
        <main id="main-content" className={clsx('flex-1 p-4 sm:p-6 lg:p-8')}>
          <Outlet />
        </main>

        {/* Switch compact sur mobile (repete sous le contenu) */}
        <div className="border-t border-neutral-200 p-4 md:hidden dark:border-neutral-800">
          <PortalBackofficeSwitch variant="compact" className="w-full" />
        </div>
      </div>
    </div>
  );
}

