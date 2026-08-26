import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MessageCircle, Plus } from 'lucide-react';
import { useMyTickets, useCreateTicket } from '../hooks/useTickets';
import { ClientAccountNav } from '@/features/account/components/ClientAccountNav';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input, Select, Textarea } from '@/shared/components/Input';
import { Badge } from '@/shared/components/Badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import { formatDateTime } from '@/shared/utils/format';
import type { TicketStatus } from '@/shared/types';

const STATUS_TONES: Record<TicketStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  WAITING_CUSTOMER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

interface FormValues {
  subject: string;
  category: string;
  message: string;
}

// Section 27 mission : espace client pour ouvrir/consulter des tickets support.
export default function ClientTicketListPage() {
  const { t } = useTranslation();
  const { push } = useToast();
  const { data: tickets, isLoading } = useMyTickets();
  const createTicket = useCreateTicket();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const onSubmit = handleSubmit((values) => {
    createTicket.mutate(
      { subject: values.subject, category: values.category },
      {
        onSuccess: () => {
          push(t('tickets.created'));
          reset();
          setShowForm(false);
        },
        onError: () => push(t('tickets.createError'), 'error'),
      },
    );
  });

  return (
    <div className="container-app max-w-2xl py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
          {t('tickets.myTickets')}
        </h1>
        <Button onClick={() => setShowForm((v) => !v)} variant="primary" className="gap-1">
          <Plus className="h-4 w-4" /> {t('tickets.newTicket')}
        </Button>
      </div>
      <ClientAccountNav />

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input label={t('tickets.subject')} {...register('subject', { required: true })} />
            <Select label={t('tickets.category')} {...register('category')}>
              <option value="general">{t('tickets.categoryGeneral')}</option>
              <option value="billing">{t('tickets.categoryBilling')}</option>
              <option value="technical">{t('tickets.categoryTechnical')}</option>
            </Select>
            <Textarea label={t('tickets.message')} rows={4} {...register('message')} />
            <Button type="submit" variant="primary" isLoading={createTicket.isPending}>
              {t('common.save')}
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-5">
        {isLoading ? (
          <p className="text-sm text-neutral-400">{t('common.loading')}</p>
        ) : !tickets?.length ? (
          <EmptyState icon={MessageCircle} title={t('tickets.empty')} description={t('tickets.emptyHint')} />
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="py-3">
                <Link to={`/mon-compte/tickets/${ticket.id}`} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{ticket.subject}</p>
                    <p className="text-xs text-neutral-400">{formatDateTime(ticket.created_at)}</p>
                  </div>
                  <Badge tone={STATUS_TONES[ticket.status]}>{t(`tickets.status.${ticket.status}`)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
