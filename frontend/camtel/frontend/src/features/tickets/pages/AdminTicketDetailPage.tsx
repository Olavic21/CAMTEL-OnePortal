import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTicket, useUpdateTicketStatus } from '../hooks/useTickets';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { TicketThread } from '../components/TicketThread';
import { Card } from '@/shared/components/Card';
import { Select } from '@/shared/components/Input';
import { Skeleton } from '@/shared/components/Skeleton';
import { useToast } from '@/shared/components/Toast';
import type { TicketStatus } from '@/shared/types';

const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'];

export default function AdminTicketDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const ticketId = Number(id);
  const { data: ticket, isLoading } = useTicket(ticketId);
  const updateStatus = useUpdateTicketStatus();

  if (isLoading || !ticket) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <button onClick={() => navigate('/admin/tickets')} className="text-sm text-primary hover:underline">
          &larr; {t('tickets.title')}
        </button>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {ticket.subject} — {ticket.client_name}
          </h1>
          <div className="w-56">
            <Select
              value={ticket.status}
              onChange={(e) =>
                updateStatus.mutate(
                  { id: ticketId, status: e.target.value as TicketStatus },
                  {
                    onSuccess: () => push(t('tickets.statusUpdated')),
                    onError: () => push(t('tickets.statusUpdateError'), 'error'),
                  },
                )
              }
              aria-label={t('common.status')}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`tickets.status.${s}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Card className="p-5">
        <TicketThread ticket={ticket} currentUsername={user?.username} />
      </Card>
    </div>
  );
}
