import { useTranslation } from 'react-i18next';
import { Settings, Shield, Database, Bell, Globe, Key } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Permission } from '@/features/auth/permissions';

/**
 * Administration Back-Office (/admin/administration) — cahier des charges section 20.
 * Paramètres système, gestions des permissions, configuration générale.
 */
export default function AdminAdministrationPage() {
  const { t } = useTranslation();
  const { user, can } = useAuth();

  const sections = [
    { key: 'users', title: t('admin.administration.users'), description: t('admin.administration.usersDesc'), icon: Shield, permission: 'manage_users' },
    { key: 'roles', title: t('admin.administration.roles'), description: t('admin.administration.rolesDesc'), icon: Key, permission: 'manage_users' },
    { key: 'notifications', title: t('admin.administration.notifications'), description: t('admin.administration.notificationsDesc'), icon: Bell, permission: 'manage_notifications' },
    { key: 'services', title: t('admin.administration.services'), description: t('admin.administration.servicesDesc'), icon: Globe, permission: 'manage_services' },
    { key: 'data', title: t('admin.administration.data'), description: t('admin.administration.dataDesc'), icon: Database, permission: 'manage_data' },
    { key: 'settings', title: t('admin.administration.settings'), description: t('admin.administration.settingsDesc'), icon: Settings, permission: 'manage_settings' },
  ];

  const accessibleSections = sections.filter((s) => can(s.permission as Permission));

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
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.administration.lastLogin')}</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{user?.last_login ?? '—'}</p>
          </div>
        </div>
      </Card>

      {/* Sections accessibles selon permissions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accessibleSections.map(({ key, title, description, icon: Icon }) => (
          <Card key={key} className="p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary-50 p-2 dark:bg-primary-900/30">
                <Icon className="h-5 w-5 text-primary dark:text-primary-300" aria-hidden />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
                <Button variant="tertiary" size="sm" className="mt-3">{t('admin.administration.manage')}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {accessibleSections.length === 0 && (
        <p className="mt-6 text-center text-sm text-neutral-400 dark:text-neutral-500">{t('admin.administration.noAccess')}</p>
      )}
    </div>
  );
}