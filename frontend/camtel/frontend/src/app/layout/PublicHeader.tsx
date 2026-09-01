import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { SearchAutocomplete } from '@/shared/components/SearchAutocomplete';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { Logo } from '@/shared/components/Logo';
import { PortalBackofficeSwitch } from '@/shared/components/PortalBackofficeSwitch';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Navigation principale (Phase 1 — 5 items CAMTEL-OnePortal)
// Header = Accueil / Services / Catalogue / À propos / Assistance
// FIXES/MOBILES/TRANSPORT/DATA CENTER sont désormais groupés sous /services
const mainNav = [
  { to: '/', key: 'home' as const, end: true as const },
  { to: '/services', key: 'services' as const, end: false as const },
  { to: '/produits', key: 'catalogue' as const, end: false as const },
  { to: '/a-propos', key: 'about' as const, end: false as const },
  { to: '/assistance', key: 'assistance' as const, end: false as const },
] as const;

function navLinkClass(isActive: boolean) {
  return clsx(
    'relative inline-flex items-center px-2 py-1 text-sm font-medium transition-colors',
    isActive
      ? 'text-primary dark:text-primary-300 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-primary dark:after:bg-primary-300'
      : 'text-neutral-600 hover:text-primary dark:text-neutral-300 dark:hover:text-primary-300',
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const canBackoffice = Boolean(user?.can_access_backoffice);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Logo variant="header" />

        {/* Navigation principale — 5 items CAMTEL */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label={t('common.a11y.mainNav')}>
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        {/* Tablette : version compacte */}
        <nav className="hidden items-center gap-1 md:flex lg:hidden" aria-label={t('common.a11y.mainNav')}>
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'px-1.5 py-1 text-xs font-medium transition-colors',
                  isActive ? 'text-primary dark:text-primary-300' : 'text-neutral-600 dark:text-neutral-300',
                )
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <SearchAutocomplete />
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
              {canBackoffice && <PortalBackofficeSwitch />}
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

        {/* Tablet actions compact */}
        <div className="hidden items-center gap-2 md:flex lg:hidden">
          <SearchAutocomplete />
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
            className="text-xs font-semibold text-neutral-500 dark:text-neutral-400"
          >
            {i18n.language.toUpperCase()}
          </button>
          <ThemeToggle />
          {isAuthenticated ? (
            <Link to="/mon-compte" className="text-neutral-600 dark:text-neutral-300">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link to="/admin/login" className="text-sm font-medium text-primary">
              {t('nav.login')}
            </Link>
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
            {mainNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'block rounded-lg px-2 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-primary-50 text-primary dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900',
                    )
                  }
                >
                  {t(`nav.${item.key}`)}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 flex items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <Search className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{t('search.title')}</span>
            </li>
            <li>
              <div className="py-2">
                <SearchAutocomplete />
              </div>
            </li>
            <li className="border-t border-neutral-100 pt-2 dark:border-neutral-800">
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
                className="flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                <Globe className="h-4 w-4" /> {i18n.language.toUpperCase()} — {t('nav.changeLanguage')}
              </button>
            </li>
            {isAuthenticated ? (
              <>
                {canBackoffice && (
                  <li>
                    <PortalBackofficeSwitch variant="full" />
                  </li>
                )}
                <li>
                  <Link
                    to="/mon-compte"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  >
                    <User className="mr-2 inline h-4 w-4" />
                    {user?.username} — {t('nav.myAccount')}
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
                    className="block rounded-lg bg-primary px-2 py-2 text-center text-sm font-medium text-white"
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
