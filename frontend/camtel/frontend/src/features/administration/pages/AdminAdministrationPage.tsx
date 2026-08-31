import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, KeyRound, Bell, Globe, Database, ScrollText, ArrowRight } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Permission } from '@/features/auth/permissions';

/**
 * Administration Back-Office (/admin/administration) — cahier des charges
 * section 20. Hub de navigation vers les pages d'administration RELLES.
 * Regle #59 : aucun bouton decoratif — chaque entree pointe vers une page
 * existante, protegee cote serveur, et n'apparait que si l'utilisateur a la
 * permission correspondante.
 */
export default function AdminAdministrationPage() {
  const { t } = useTranslation();
  const { user, can } = useAuth();

  const sections = [
    { key: 'users', title: t('admin.administration.users'), description: t('admin.administration.usersDesc'), icon: Shield, permission: 'manage_users', to: '/admin/utilisateurs' },
    { key: 'roles', title: t('admin.administration.roles'), description: t('admin.administration.rolesDesc'), icon: KeyRound, permission: 'view_activity_log', to: '/admin/roles' },
    { key: 'notifications', title: t('admin.administration.notifications'), description: t('admin.administration.notificationsDesc'), icon: Bell, permission: null, to: '/admin/notifications' },
    { key: 'services', title: t('admin.administration.services'), description: t('admin.administration.servicesDesc'), icon: Globe, permission: 'edit_product_draft', to: '/admin/services' },
    { key: 'data', title: t('admin.administration.data'), description: t('admin.administration.dataDesc'), icon: Database, permission: 'edit_product_draft', to: '/admin/qualite' },
    { key: 'activityLog', title: t('admin.administration.activityLog'), description: t('admin.administration.activityLogDesc'), icon: ScrollText, permission: 'view_activity_log', to: '/admin/journal' },
  ];

  const accessibleSections = sections.filter((s) => !s.permission || can(s.permission as Permission));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t('admin.administration.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.administration.subtitle')}</p>
      </div>

      {/* Info utilisateur courant */}
      <Card className="mb-6 p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">{t('admin.administration.currentUser')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.administration.username')}</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{user?.username ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.administration.role')}</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{user?.role ? t(`roles.${user.role}`) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.administration.email')}</p>
            <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.administration.lastLogin')}</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{user?.last_login ?? '—'}</p>
          </div>
        </div>
      </Card>

      {/* Sections accessibles selon permissions (liens reels) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accessibleSections.map(({ key, title, description, icon: Icon, to }) => (
          <Link
            key={key}
            to={to}
            className="group rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-primary/40 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary-50 p-2 dark:bg-primary-900/30">
                <Icon className="h-5 w-5 text-primary dark:text-primary-300" aria-hidden />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
                <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline dark:text-primary-300">
                  {t('admin.administration.manage')} <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {accessibleSections.length === 0 && (
        <p className="mt-6 text-center text-sm text-neutral-400 dark:text-neutral-500">{t('admin.administration.noAccess')}</p>
      )}
    </div>
  );
}