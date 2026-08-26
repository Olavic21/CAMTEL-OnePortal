import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSubscriptionRequests } from '../hooks/useSubscriptions';
import { Table, type Column } from '@/shared/components/Table';
import { Badge } from '@/shared/components/Badge';
import { Select } from '@/shared/components/Input';
import { formatDateTime } from '@/shared/utils/format';
import type { SubscriptionRequest, SubscriptionStatus } from '@/shared/types';

// Back-office (section 18 mission : module "Subscriptions" du panneau admin).
// Ce module n'avait aucune interface avant — le backend (liste, changement de
// statut, historique) etait fonctionnel et teste, mais un admin n'avait
// aucun moyen d'y acceder depuis l'app.
const STATUS_TONES: Record<SubscriptionStatus, 'warning' | 'info' | 'success' | 'destructive' | 'neutral'> = {
  PENDING: 'warning',
  UNDER_REVIEW: 'info',
  ADDITIONAL_INFO_REQUIRED: 'warning',
  APPROVED: 'success',
  SCHEDULED: 'info',
  ACTIVATED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'neutral',
};

export default function AdminSubscriptionListPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const { data, isLoading } = useSubscriptionRequests({ status: status || undefined });

  const statusLabel = (value: SubscriptionStatus) => t(`admin.subscriptions.status.${statusKey(value)}`);

  const columns: Column<SubscriptionRequest>[] = [
    {
      key: 'request_number',
      header: t('admin.subscriptions.requestNumber'),
      render: (r) => (
        <Link to={`/admin/souscriptions/${r.id}`} className="font-medium text-primary hover:underline">
          {r.request_number}
        </Link>
      ),
    },
    { key: 'full_name', header: t('admin.subscriptions.client'), render: (r) => r.full_name },
    { key: 'product_name', header: t('admin.subscriptions.product'), render: (r) => r.product_name },
    { key: 'created_at', header: t('admin.subscriptions.receivedAt'), render: (r) => formatDateTime(r.created_at) },
    {
      key: 'status',
      header: t('common.status'),
      render: (r) => <Badge tone={STATUS_TONES[r.status]}>{statusLabel(r.status)}</Badge>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (r) => (
        <Link to={`/admin/souscriptions/${r.id}`} className="text-xs font-medium text-primary hover:underline">
          {t('admin.subscriptions.process')}
        </Link>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('admin.subscriptions.title')}</h1>
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('common.status')}>
          <option value="">{t('admin.subscriptions.allStatuses')}</option>
          <option value="PENDING">{t('admin.subscriptions.status.pending')}</option>
          <option value="UNDER_REVIEW">{t('admin.subscriptions.status.underReview')}</option>
          <option value="ADDITIONAL_INFO_REQUIRED">{t('admin.subscriptions.status.additionalInfoRequired')}</option>
          <option value="APPROVED">{t('admin.subscriptions.status.approved')}</option>
          <option value="SCHEDULED">{t('admin.subscriptions.status.scheduled')}</option>
          <option value="ACTIVATED">{t('admin.subscriptions.status.activated')}</option>
          <option value="REJECTED">{t('admin.subscriptions.status.rejected')}</option>
          <option value="CANCELLED">{t('admin.subscriptions.status.cancelled')}</option>
        </Select>
      </div>
      <Table
        columns={columns}
        rows={data?.results ?? []}
        emptyMessage={isLoading ? t('common.loading') : t('admin.subscriptions.empty')}
      />
    </div>
  );
}

function statusKey(value: SubscriptionStatus): string {
  const map: Record<SubscriptionStatus, string> = {
    PENDING: 'pending',
    UNDER_REVIEW: 'underReview',
    ADDITIONAL_INFO_REQUIRED: 'additionalInfoRequired',
    APPROVED: 'approved',
    SCHEDULED: 'scheduled',
    ACTIVATED: 'activated',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
  };
  return map[value];
}
