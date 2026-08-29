import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Building2, Globe } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canAccessBackoffice } from '@/features/auth/permissions';

/**
 * Switch Portail / Back-Office (cahier des charges section 17).
 *
 * Regles respectees :
 * - Visible UNIQUEMENT si l'utilisateur connecte possede un role back-office
 *   (editor, product_manager, admin, super_admin). Jamais pour un CUSTOMER.
 * - Le changement se fait SANS deconnexion : l'AuthProvider, les tokens et
 *   les permissions sont conserves (simple navigation entre deux zones).
 * - Le frontend masque, mais ne protege pas : la verification reelle des
 *   permissions reste faite par l'API (RequireAuth ne sert qu'a l'UX).
 */
export function PortalBackofficeSwitch({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  const { t } = useTranslation();
  const { user, canAccessBackoffice: fromContext } = useAuth();
  const location = useLocation();

  // Back-office = role back-office (editor/product_manager/admin/super_admin).
  // Priorite au flag `can_access_backoffice` du backend (/auth/me) ; le calcul
  // local via les roles n'est qu'un fallback (mode demo). Un CUSTOMER ne voit
  // jamais ce switch, et le backend protege de toute facon chaque endpoint.
  const isAllowed = typeof fromContext === 'boolean' ? fromContext : canAccessBackoffice(user);
  if (!isAllowed) return null;

  const inBackOffice = location.pathname.startsWith('/admin');
  const target = inBackOffice ? '/' : '/admin';

  if (variant === 'compact') {
    return (
      <Link
        to={target}
        className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-50 dark:border-primary-300/40 dark:text-primary-300 dark:hover:bg-primary-900/30"
        aria-label={inBackOffice ? t('switch.toPortal') : t('switch.toBackOffice')}
      >
        {inBackOffice ? <Globe className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
        {inBackOffice ? t('switch.portal') : t('switch.backOffice')}
      </Link>
    );
  }

  return (
    <div
      className="inline-flex overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700"
      role="group"
      aria-label={t('switch.ariaLabel')}
    >
      <Link
        to="/"
        className={clsx(
          'px-3 py-1.5 text-xs font-semibold transition-colors',
          !inBackOffice
            ? 'bg-primary text-white'
            : 'bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800',
        )}
        aria-current={!inBackOffice ? 'page' : undefined}
      >
        {t('switch.portal')}
      </Link>
      <Link
        to="/admin"
        className={clsx(
          'px-3 py-1.5 text-xs font-semibold transition-colors',
          inBackOffice
            ? 'bg-primary text-white'
            : 'bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800',
        )}
        aria-current={inBackOffice ? 'page' : undefined}
      >
        {t('switch.backOffice')}
      </Link>
    </div>
  );
}