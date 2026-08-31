import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { Table, type Column } from '@/shared/components/Table';
import { Badge } from '@/shared/components/Badge';
import { Select, Input } from '@/shared/components/Input';
import { Pagination } from '@/shared/components/Pagination';
import { formatDateTime } from '@/shared/utils/format';
import type { ActivityLog } from '@/shared/types';

const actionTone = {
  create: 'success',
  update: 'warning',
  delete: 'neutral',
  view: 'info',
  login: 'neutral',
} as const;

// Journal d'activite (roadmap V2, section 10.10) : table filtrable par utilisateur/modele/periode.
// Regles #21/#22 : aucune valeur "undefined"/"null" dans l'interface — chaque
// colonne possede un fallback propre aligne sur le sens reel de la donnee
// (API /activitylogs/ -> ActivityLogSerializer : user {id, username} | null,
// user_id | null, target_id | null, details).
export default function AdminActivityLogPage() {
  const { t } = useTranslation();
  const [targetModel, setTargetModel] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [page, setPage] = useState(1);

  const actionLabel = {
    create: t('admin.activityLog.create'),
    update: t('admin.activityLog.update'),
    delete: t('admin.activityLog.delete'),
    view: t('admin.activityLog.view'),
    login: t('admin.activityLog.login'),
  } as const;

  const { data, isLoading } = useActivityLogs({
    target_model: targetModel || undefined,
    date_from: dateFrom || undefined,
    page,
  });

  // Utilisateur : nom lisible ; "Systeme" pour les entrees sans acteur
  // (user supprime/SET_NULL) — jamais "#undefined".
  const userLabel = (log: ActivityLog): string =>
    log.user?.username ?? (log.user_id != null ? `#${log.user_id}` : t('admin.activityLog.systemUser'));

  // Ressource : "#<id>" uniquement si l'identifiant existe reellement.
  const targetLabel = (log: ActivityLog): string =>
    log.target_id != null ? `${log.target_model} #${log.target_id}` : log.target_model;

  const columns: Column<ActivityLog>[] = [
    { key: 'user', header: t('admin.activityLog.user'), render: (log) => userLabel(log) },
    {
      key: 'action',
      header: t('admin.activityLog.action'),
      render: (log) => (
        <Badge tone={actionTone[log.action] ?? 'neutral'}>
          {actionLabel[log.action] ?? log.action}
        </Badge>
      ),
    },
    { key: 'target', header: t('admin.activityLog.resource'), render: (log) => targetLabel(log) },
    {
      key: 'details',
      header: t('admin.activityLog.details'),
      render: (log) => (log.details?.trim() ? log.details : '—'),
    },
    { key: 'date', header: t('admin.activityLog.date'), render: (log) => formatDateTime(log.created_at) },
  ];

  const totalPages = data ? Math.ceil(data.count / 25) : 1;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('admin.activityLog.title')}</h1>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-xl">
        <Select value={targetModel} onChange={(e) => setTargetModel(e.target.value)} aria-label={t('admin.activityLog.resource')}>
          <option value="">{t('admin.activityLog.allResources')}</option>
          <option value="Product">{t('admin.products.title')}</option>
          <option value="Category">{t('admin.categories.title')}</option>
          <option value="News">{t('admin.news.title')}</option>
          <option value="Promotion">{t('admin.promotions.title')}</option>
          <option value="User">{t('admin.users.title')}</option>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label={t('admin.activityLog.date')} />
      </div>

      <Table
        columns={columns}
        rows={data?.results ?? []}
        emptyMessage={isLoading ? t('common.loading') : t('admin.activityLog.empty')}
      />

      <div className="mt-6">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
