import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Permission } from '../permissions';
import type { UserRole } from '@/shared/types';
import { useTranslation } from 'react-i18next';

// Garde de route admin (section 10.1). Redirige vers /admin/login si non
// authentifie, ou affiche un message si le role/la permission est insuffisant.
// `roles` sert aux gardes generales (ex: reserve au Super Admin), `permission`
// sert aux gardes metier fines alignees sur la matrice section 9.2.
export function RequireAuth({ roles, permission }: { roles?: UserRole[]; permission?: Permission }) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, hasRole, can } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-neutral-400">{t('common.loading')}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const isForbidden = (roles && !hasRole(...roles)) || (permission && !can(permission));

  if (isForbidden) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold text-neutral-800">{t('common.a11y.accessDenied')}</p>
        <p className="text-sm text-neutral-500">{t('common.a11y.accessDeniedHint')}</p>
      </div>
    );
  }

  return <Outlet />;
}
