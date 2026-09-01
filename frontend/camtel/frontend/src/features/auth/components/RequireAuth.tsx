import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Permission } from '../permissions';
import type { UserRole } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { AppLoading } from '@/app/layout/AppLoading';

// Garde de route admin (section 10.1). Redirige vers /admin/login si non
// authentifie, ou affiche un message si le role/la permission est insuffisant.
// `roles` sert aux gardes generales (ex: reserve au Super Admin), `permission`
// sert aux gardes metier fines alignees sur la matrice section 9.2.
// `backoffice` bloque /admin pour tout utilisateur sans acces back-office
// (CUSTOMER/anon), en s'appuyant sur le flag reel renvoye par le backend
// (`can_access_backoffice` de /auth/me) — jamais sur un simple calcul local.
export function RequireAuth({
  roles,
  permission,
  backoffice,
}: {
  roles?: UserRole[];
  permission?: Permission;
  backoffice?: boolean;
}) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, hasRole, can, canAccessBackoffice } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AppLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const forbiddenByRoles = !!roles && !hasRole(...roles);
  const forbiddenByPermission = !!permission && !can(permission);
  const forbiddenByBackoffice = !!backoffice && !canAccessBackoffice;
  const isForbidden = forbiddenByRoles || forbiddenByPermission || forbiddenByBackoffice;

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
