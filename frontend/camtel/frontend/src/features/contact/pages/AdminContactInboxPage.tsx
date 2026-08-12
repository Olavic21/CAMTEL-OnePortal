import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MailOpen } from 'lucide-react';
import { useContactMessages, useMarkContactRead } from '../hooks/useContact';
import { Table, type Column } from '@/shared/components/Table';
import { Badge } from '@/shared/components/Badge';
import { Select } from '@/shared/components/Input';
import { formatDateTime } from '@/shared/utils/format';
import type { ContactMessage } from '@/shared/types';

export default function AdminContactInboxPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const { data, isLoading } = useContactMessages({ status: status || undefined });
  const markRead = useMarkContactRead();

  const statusLabel = {
    new: t('admin.contact.new'),
    read: t('admin.contact.read'),
    archived: t('admin.contact.archived'),
  } as const;

  const columns: Column<ContactMessage>[] = [
    {
      key: 'status',
      header: '',
      render: (m) => (m.status === 'new' ? <Mail className="h-4 w-4 text-primary" /> : <MailOpen className="h-4 w-4 text-neutral-300" />),
    },
    { key: 'full_name', header: t('admin.contact.from'), render: (m) => <span className="font-medium">{m.full_name}</span> },
    { key: 'subject', header: t('admin.contact.subject'), render: (m) => m.subject },
    { key: 'email', header: t('auth.email'), render: (m) => m.email },
    { key: 'created_at', header: t('admin.contact.receivedAt'), render: (m) => formatDateTime(m.created_at) },
    {
      key: 'status_label',
      header: t('common.status'),
      render: (m) => <Badge tone={m.status === 'new' ? 'warning' : 'neutral'}>{statusLabel[m.status]}</Badge>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (m) =>
        m.status === 'new' ? (
          <button onClick={() => markRead.mutate(m.id)} className="text-xs font-medium text-primary hover:underline">
            {t('admin.contact.markRead')}
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('admin.contact.title')}</h1>
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('common.status')}>
          <option value="">{t('admin.contact.allMessages')}</option>
          <option value="new">{t('admin.contact.new')}</option>
          <option value="read">{t('admin.contact.read')}</option>
          <option value="archived">{t('admin.contact.archived')}</option>
        </Select>
      </div>
      <Table
        columns={columns}
        rows={data?.results ?? []}
        emptyMessage={isLoading ? t('common.loading') : t('admin.contact.empty')}
      />
    </div>
  );
}
