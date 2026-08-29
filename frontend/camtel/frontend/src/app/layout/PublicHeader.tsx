import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { SearchAutocomplete } from '@/shared/components/SearchAutocomplete';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { Logo } from '@/shared/components/Logo';
import { PortalBackofficeSwitch } from '@/shared/components/PortalBackofficeSwitch';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { SERVICES } from '@/shared/config/services';

// Nav secondaire (sections non-services). « Entreprise » a ete retire : c'est
// desormais un SEGMENT client, pas un service (cahier des charges 2/4) — les
// quatre services (Fixes/Mobiles/Transport/Data Center) sont affiches via
// SERVICES et pointent vers /services/:slug.
const links = [
  { to: '/produits', key: 'products' as const },
  { to: '/actualites', key: 'news' as const },
  { to: '/trouver-une-solution', key: 'findSolution' as const },
  { to: '/assistant', key: 'assistant' as const },
  { to: '/contact', key: 'contact' as const },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="container-app flex h-16 items-center justify-between">
        <Logo variant="header" />

        {/* Services (les 4 univers) — section 3 du cahier des charges */}
        <nav className="hidden items-center gap-5 lg:flex" aria-label={t('nav.services')}>
          {SERVICES.map((s) => (
            <NavLink
              key={s.service}
              to={s.route}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary dark:hover:text-primary-300',
                  isActive ? 'text-primary dark:text-primary-300' : 'text-neutral-600 dark:text-neutral-300',
                )
              }
            >
              <s.icon className="h-4 w-4" aria-hidden />
              {s.label}
            </NavLink>
          ))}
        </nav>

        {/* Nav secondaire (catalogue, actualites, ...) sur ecrans moyens */}
        <nav className="hidden items-center gap-5 md:flex lg:hidden" aria-label={t('common.a11y.mainNav')}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'text-sm font-medium transition-colors hover:text-primary dark:hover:text-primary-300',
                  isActive ? 'text-primary dark:text-primary-300' : 'text-neutral-600 dark:text-neutral-300',
                )
              }
            >
              {t(`nav.${link.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <SearchAutocomplete />
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-primary-300"
            aria-label={t('nav.changeLanguage')}
          >
            <Globe className="h-4 w-4" /> {i18n.language.toUpperCase()}
          </button>

          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <PortalBackofficeSwitch />
              <Link
                to="/mon-compte"
                className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-primary dark:text-neutral-300 dark:hover:text-primary-300"
              >
                <User className="h-4 w-4" /> {user?.username}
              </Link>
              <button
                onClick={logout}
                aria-label={t('nav.logout')}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/inscription"
                className="text-sm font-medium text-neutral-600 hover:text-primary dark:text-neutral-300 dark:hover:text-primary-300"
              >
                {t('nav.createAccount')}
              </Link>
              <Link
                to="/admin/login"
                className="rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-50 dark:border-primary-300/40 dark:text-primary-300 dark:hover:bg-primary-900/30"
              >
                {t('nav.login')}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('common.a11y.closeMenu') : t('common.a11y.openMenu')}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950 md:hidden"
          aria-label={t('common.a11y.mobileNav')}
        >
          <ul className="flex flex-col gap-1">
            {isAuthenticated ? (
              <>
                {/* Services accessibles depuis le menu mobile */}
                <li className="pt-2" aria-hidden>
                  <span className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {t('nav.services')}
                  </span>
                </li>
                {SERVICES.map((s) => (
                  <li key={s.service}>
                    <NavLink
                      to={s.route}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                    >
                      <s.icon className="h-4 w-4 text-primary dark:text-primary-300" aria-hidden />
                      {s.label}
                    </NavLink>
                  </li>
                ))}
                <li className="pt-2" aria-hidden>
                  <span className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {t('nav.secondary')}
                  </span>
                </li>
                {links.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                    >
                      {t(`nav.${link.key}`)}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <PortalBackofficeSwitch variant="full" />
                </li>
                <li>
                  <Link
                    to="/mon-compte"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  >
                    {user?.username}
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="block w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {t('nav.logout')}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/inscription"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  >
                    {t('nav.createAccount')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-2 text-sm font-medium text-primary hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30"
                  >
                    {t('nav.login')}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
