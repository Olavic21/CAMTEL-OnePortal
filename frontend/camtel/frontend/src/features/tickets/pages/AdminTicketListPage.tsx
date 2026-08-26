import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useTicketList } from '../hooks/useTickets';
import { Table, type Column } from '@/shared/components/Table';
import { Badge } from '@/shared/components/Badge';
import { Select } from '@/shared/components/Input';
import { formatDateTime } from '@/shared/utils/format';
import type { SupportTicket, TicketStatus } from '@/shared/types';

// Back-office (section 18/27 mission) : module "Tickets" — n'avait aucune
// interface avant, malgre un backend complet et teste.
const STATUS_TONES: Record<TicketStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  WAITING_CUSTOMER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

export default function AdminTicketListPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const { data, isLoading } = useTicketList({ status: (status || undefined) as TicketStatus | undefined });

  const columns: Column<SupportTicket>[] = [
    {
      key: 'subject',
      header: t('tickets.subject'),
      render: (ticket) => (
        <Link to={`/admin/tickets/${ticket.id}`} className="font-medium text-primary hover:underline">
          {ticket.subject}
        </Link>
      ),
    },
    { key: 'client_name', header: t('tickets.client'), render: (ticket) => ticket.client_name },
    { key: 'category', header: t('tickets.category'), render: (ticket) => ticket.category },
    {
      key: 'priority',
      header: t('tickets.priority'),
      render: (ticket) => t(`tickets.priorityLevel.${ticket.priority}`),
    },
    { key: 'created_at', header: t('admin.subscriptions.receivedAt'), render: (ticket) => formatDateTime(ticket.created_at) },
    {
      key: 'status',
      header: t('common.status'),
      render: (ticket) => <Badge tone={STATUS_TONES[ticket.status]}>{t(`tickets.status.${ticket.status}`)}</Badge>,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('tickets.title')}</h1>
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('common.status')}>
          <option value="">{t('admin.subscriptions.allStatuses')}</option>
          <option value="OPEN">{t('tickets.status.OPEN')}</option>
          <option value="IN_PROGRESS">{t('tickets.status.IN_PROGRESS')}</option>
          <option value="WAITING_CUSTOMER">{t('tickets.status.WAITING_CUSTOMER')}</option>
          <option value="RESOLVED">{t('tickets.status.RESOLVED')}</option>
          <option value="CLOSED">{t('tickets.status.CLOSED')}</option>
        </Select>
      </div>
      <Table
        columns={columns}
        rows={data?.results ?? []}
        emptyMessage={isLoading ? t('common.loading') : t('tickets.empty')}
      />
    </div>
  );
}
