import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReplyTicket } from '../hooks/useTickets';
import { Textarea } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { formatDateTime } from '@/shared/utils/format';
import type { SupportTicket } from '@/shared/types';

// Fil de messages d'un ticket + formulaire de reponse — reutilise entre
// l'espace client et le back-office (meme endpoint POST /tickets/:id/reply/,
// autorise a IsAuthenticated tant que l'utilisateur est le client du ticket
// ou un membre du staff — voir apps/core/views.py SupportTicketViewSet.reply).
export function TicketThread({ ticket, currentUsername }: { ticket: SupportTicket; currentUsername?: string }) {
  const { t } = useTranslation();
  const { push } = useToast();
  const [message, setMessage] = useState('');
  const replyTicket = useReplyTicket();

  function handleReply() {
    if (!message.trim()) return;
    replyTicket.mutate(
      { id: ticket.id, message },
      {
        onSuccess: () => {
          setMessage('');
          push(t('tickets.replySent'));
        },
        onError: () => push(t('tickets.replyError'), 'error'),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {ticket.messages.length === 0 ? (
          <p className="text-sm text-neutral-400">{t('tickets.noMessages')}</p>
        ) : (
          ticket.messages.map((msg) => {
            const isMine = msg.author_name === currentUsername;
            return (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  isMine
                    ? 'ml-auto bg-primary-50 text-primary-900 dark:bg-primary-900/30 dark:text-primary-200'
                    : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                }`}
              >
                <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {msg.author_name || t('tickets.support')} · {formatDateTime(msg.created_at)}
                </p>
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('tickets.writeReply')}
          rows={2}
          className="flex-1"
        />
        <Button onClick={handleReply} variant="primary" isLoading={replyTicket.isPending}>
          {t('tickets.send')}
        </Button>
      </div>
    </div>
  );
}
