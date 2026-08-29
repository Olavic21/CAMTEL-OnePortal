import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

// Navigation de l'espace client (/mon-compte). N'existait pas du tout avant
// — /mon-compte/abonnements et /mon-compte/dashboard etaient imbriquees sous
// /mon-compte dans le router mais le parent ne rendait aucun <Outlet/>, et
// aucun lien nulle part dans l'app ne pointait vers ces URLs : ces pages
// n'etaient jamais atteignables, meme en connaissant l'URL exacte. Corrige
// en meme temps que la structure de routes (voir app/router.tsx, routes
// desormais sœurs plutot qu'imbriquees).
const links = [
  { to: '/mon-compte', key: 'profile' },
  { to: '/mon-compte/abonnements', key: 'subscriptions' },
  { to: '/mon-compte/dashboard', key: 'dashboard' },
  { to: '/mon-compte/paiements', key: 'payments' },
  { to: '/mon-compte/tickets', key: 'tickets' },
  { to: '/mon-compte/notifications', key: 'notifications' },
];

export function ClientAccountNav() {
  const { t } = useTranslation();
  return (
    <nav className="mb-6 flex gap-1 border-b border-neutral-200 dark:border-neutral-800" aria-label={t('account.nav')}>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/mon-compte'}
          aria-label={t(`account.nav_${link.key}`)}
          className={({ isActive }) =>
            clsx(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
            )
          }
        >
          {t(`account.nav_${link.key}`)}
        </NavLink>
      ))}
    </nav>
  );
}
