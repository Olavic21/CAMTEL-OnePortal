import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTicket } from '../hooks/useTickets';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { TicketThread } from '../components/TicketThread';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Skeleton } from '@/shared/components/Skeleton';
import type { TicketStatus } from '@/shared/types';

const STATUS_TONES: Record<TicketStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  WAITING_CUSTOMER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

export default function ClientTicketDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: ticket, isLoading } = useTicket(Number(id));

  if (isLoading || !ticket) {
    return (
      <div className="container-app max-w-2xl space-y-4 py-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="container-app max-w-2xl py-10">
      <button onClick={() => navigate('/mon-compte/tickets')} className="text-sm text-primary hover:underline">
        &larr; {t('tickets.myTickets')}
      </button>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{ticket.subject}</h1>
        <Badge tone={STATUS_TONES[ticket.status]}>{t(`tickets.status.${ticket.status}`)}</Badge>
      </div>

      <Card className="mt-6 p-5">
        <TicketThread ticket={ticket} currentUsername={user?.username} />
      </Card>
    </div>
  );
}
