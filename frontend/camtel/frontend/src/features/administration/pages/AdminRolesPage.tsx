import { useTranslation } from 'react-i18next';
import { KeyRound } from 'lucide-react';
import { Table, type Column } from '@/shared/components/Table';
import { Badge } from '@/shared/components/Badge';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { Card } from '@/shared/components/Card';
import { useRoles } from '../hooks/useRoles';
import type { RoleMeta } from '../api/rolesApi';

type RoleRow = RoleMeta & { id: string };

/**
 * Gestion des roles (section 34) — lecture seule, pilotee par l'API reelle
 * /api/v1/roles/ : role, label, acces back-office, comptage utilisateurs.
 * La modification des permissions d'un role n'est pas structurellement
 * prevue dans ce referentiel (matrice partagee code backend/frontend) :
 * aucun bouton fantome n'est affiche.
 */
export default function AdminRolesPage() {
  const { t } = useTranslation();
    const { data, isLoading, isError } = useRoles();

  const roles: RoleRow[] = (data?.roles ?? []).map((r) => ({ ...r, id: r.code }));

  const columns: Column<RoleRow>[] = [
    {
      key: 'role',
      header: t('admin.roles.role'),
      render: (r) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{t(`roles.${r.code}`)}</span>,
    },
    {
      key: 'code',
      header: t('admin.roles.code'),
      render: (r) => (
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {r.internal}
        </code>
      ),
    },
    {
      key: 'backoffice',
      header: t('admin.roles.backoffice'),
      render: (r) => (
        <Badge tone={r.can_access_backoffice ? 'success' : 'neutral'}>
          {r.can_access_backoffice ? t('common.yes') : t('common.no')}
        </Badge>
      ),
    },
    {
      key: 'privileged',
      header: t('admin.roles.privileged'),
      render: (r) => (
        <Badge tone={r.is_privileged ? 'primary' : 'neutral'}>
          {r.is_privileged ? t('common.yes') : t('common.no')}
        </Badge>
      ),
    },
    {
      key: 'count',
      header: t('admin.roles.count'),
      render: (r) => <span className="font-semibold text-neutral-900 dark:text-neutral-100">{r.count}</span>,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t('admin.roles.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.roles.subtitle')}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <Card className="p-8">
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">{t('common.error')}</p>
        </Card>
      ) : !data?.roles?.length ? (
        <EmptyState icon={KeyRound} title={t('admin.roles.empty')} description={t('admin.roles.emptyHint')} />
      ) : (
        <>
          <Table columns={columns} rows={roles} emptyMessage={t('admin.roles.empty')} />
          <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">{t('admin.roles.readonlyHint')}</p>
        </>
      )}
    </div>
  );
}