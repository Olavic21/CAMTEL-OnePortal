import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, KeyRound, Bell, Globe, Database, ScrollText, ArrowRight, Users, Lock } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Table, type Column } from '@/shared/components/Table';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRoles } from '@/features/users/hooks/useUsers';
import { PERMISSIONS } from '@/features/auth/permissions';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'permissions'>('overview');
  const { data: rolesData } = useRoles();

  const sections = [
    { key: 'users', title: t('admin.administration.users'), description: t('admin.administration.usersDesc'), icon: Shield, permission: 'manage_users', to: '/admin/utilisateurs' },
    { key: 'roles', title: t('admin.administration.roles'), description: t('admin.administration.rolesDesc'), icon: KeyRound, permission: 'view_activity_log', to: '/admin/roles' },
    { key: 'notifications', title: t('admin.administration.notifications'), description: t('admin.administration.notificationsDesc'), icon: Bell, permission: null, to: '/admin/notifications' },
    { key: 'services', title: t('admin.administration.services'), description: t('admin.administration.servicesDesc'), icon: Globe, permission: 'edit_product_draft', to: '/admin/services' },
    { key: 'data', title: t('admin.administration.data'), description: t('admin.administration.dataDesc'), icon: Database, permission: 'edit_product_draft', to: '/admin/qualite' },
    { key: 'activityLog', title: t('admin.administration.activityLog'), description: t('admin.administration.activityLogDesc'), icon: ScrollText, permission: 'view_activity_log', to: '/admin/journal' },
  ];

  const accessibleSections = sections.filter((s) => !s.permission || can(s.permission as Permission));

  const permissionRows = Object.entries(PERMISSIONS).map(([perm, roles]) => ({
    id: perm,
    permission: perm,
    roles: (roles as string[]).join(', '),
  }));
  const permColumns: Column<(typeof permissionRows)[number]>[] = [
    { key: 'permission', header: 'Permission', render: (r) => <code className="text-xs font-mono">{r.permission}</code> },
    { key: 'roles', header: 'Rôles autorisés', render: (r) => <span className="text-xs">{r.roles}</span> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t('admin.administration.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.administration.subtitle')}</p>
      </div>

      {/* Onglets spec: [Utilisateurs][Rôles][Permissions] */}
      <div className="mb-6 flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        {[
          { id: 'overview' as const, label: 'Vue générale', icon: Shield },
          { id: 'roles' as const, label: 'Rôles', icon: KeyRound },
          { id: 'permissions' as const, label: 'Permissions', icon: Lock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'}`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2 pb-2">
          <Link to="/admin/utilisateurs" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 flex items-center gap-1"><Users className="h-4 w-4" /> Gérer les utilisateurs</Link>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
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
        </>
      )}

      {activeTab === 'roles' && (
        <div>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Rôles disponibles (backend source de vérité)</h2>
            <div className="space-y-2">
              {(rolesData?.roles ?? []).map((r) => (
                <div key={r.code} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                  <div>
                    <p className="font-medium">{r.label} <code className="ml-2 text-xs bg-neutral-100 px-1.5 py-0.5 rounded dark:bg-neutral-800">{r.internal}</code></p>
                    <p className="text-xs text-neutral-500">{r.can_access_backoffice ? 'Back-office ✓' : 'Back-office ✗'} · {r.count} comptes</p>
                  </div>
                  <Badge tone={r.is_privileged ? 'primary' : 'neutral'}>{r.is_privileged ? 'Privilégié' : 'Standard'}</Badge>
                </div>
              ))}
              {!rolesData?.roles?.length && <p className="text-sm text-neutral-500">Aucun rôle.</p>}
            </div>
            <p className="mt-3 text-xs text-neutral-400">Rôles définis dans `backend/apps/users/models.py::User.Role`. Le frontend récupère via `GET /api/v1/roles/`.</p>
          </Card>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Matrice des permissions</h2>
            <p className="mb-3 text-sm text-neutral-500">Chaque permission est vérifiée côté serveur (RBAC). Modifier un rôle change immédiatement les menus/endpoints accessibles.</p>
            <Table columns={permColumns} rows={permissionRows} emptyMessage="Aucune permission" />
            <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
              <p className="font-medium">Exemples :</p>
              <ul className="mt-1 list-disc pl-5 space-y-1">
                <li><b>SUPER_ADMIN</b> → toutes les permissions (utilisateurs, rôles, journal, catalogue, analytics).</li>
                <li><b>ADMIN</b> → catalogue, souscriptions, tickets, clients, analytics, mais pas `promote_to_admin` ni `view_activity_log`.</li>
                <li><b>PRODUCT_MANAGER</b> → `edit_product_draft`, `edit_promotion`, `upload_media`.</li>
                <li><b>EDITOR</b> → `edit_news`, `upload_media`.</li>
                <li><b>CUSTOMER</b> → portail uniquement.</li>
              </ul>
            </div>
          </Card>
        </div>
      )}

      {/* Info utilisateur courant (toujours visible) */}
      <Card className="mt-6 p-5">
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
    </div>
  );
}