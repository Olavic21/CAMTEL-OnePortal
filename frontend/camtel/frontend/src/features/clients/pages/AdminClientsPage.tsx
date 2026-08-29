import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { useUsers } from '@/features/users/hooks/useUsers';
import { Table, type Column } from '@/shared/components/Table';
import { Badge } from '@/shared/components/Badge';
import { Select } from '@/shared/components/Input';
import { Pagination } from '@/shared/components/Pagination';
import { EmptyState } from '@/shared/components/EmptyState';
import { Skeleton } from '@/shared/components/Skeleton';
import { formatDate } from '@/shared/utils/format';
import type { User } from '@/shared/types';

/**
 * Gestion des clients Back-Office (/admin/clients) — cahier des charges section 20.
 * Liste des utilisateurs/clients avec filtrage par rôle.
 */
export default function AdminClientsPage() {
  const { t } = useTranslation();
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers();

  const filteredResults = data?.results?.filter((u) => !role || u.role === role) ?? [];
  const pageSize = 12;
  const totalPages = Math.ceil(filteredResults.length / pageSize);
  const paginatedResults = filteredResults.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<User>[] = [
    { key: 'name', header: t('admin.clients.name'), render: (u) => <span className="font-medium">{u.username}</span> },
    { key: 'email', header: t('auth.email'), render: (u) => u.email },
    { key: 'role', header: t('admin.clients.role'), render: (u) => <Badge tone={u.role === 'admin' ? 'primary' : u.role === 'editor' ? 'info' : 'neutral'}>{t(`roles.${u.role}`)}</Badge> },
    { key: 'date_joined', header: t('admin.clients.joinedAt'), render: (u) => formatDate(u.date_joined) },
    { key: 'is_active', header: t('common.status'), render: (u) => <Badge tone={u.is_active ? 'success' : 'neutral'}>{u.is_active ? t('common.active') : t('common.inactive')}</Badge> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t('admin.clients.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.clients.subtitle')}</p>
      </div>
      <div className="mb-4 max-w-xs">
        <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label={t('admin.clients.roleFilter')}>
          <option value="">{t('admin.clients.allRoles')}</option>
          <option value="customer">{t('roles.customer')}</option>
          <option value="editor">{t('roles.editor')}</option>
          <option value="admin">{t('roles.admin')}</option>
        </Select>
      </div>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : filteredResults.length === 0 ? (
        <EmptyState icon={Users} title={t('admin.clients.empty')} description={t('admin.clients.emptyHint')} />
      ) : (
        <><Table columns={columns} rows={paginatedResults} emptyMessage={t('admin.clients.empty')} /><div className="mt-6"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div></>
      )}
    </div>
  );
}