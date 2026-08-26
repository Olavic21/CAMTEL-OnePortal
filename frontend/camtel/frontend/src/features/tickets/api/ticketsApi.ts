import { httpClient } from '@/shared/lib/axios';
import type { Paginated, SupportTicket, TicketMessage, TicketPriority, TicketStatus } from '@/shared/types';

export interface CreateTicketPayload {
  subject: string;
  category?: string;
  priority?: TicketPriority;
}

// Section 27 mission : tickets support. POST /tickets/ + GET /tickets/my-tickets/
// sont ouverts a tout utilisateur authentifie (IsAuthenticated) ; list/retrieve
// standard sont reserves AdminOnly (voir apps/core/views.py SupportTicketViewSet).
export const ticketsApi = {
  create: (payload: CreateTicketPayload) =>
    httpClient.post<SupportTicket>('/tickets/', payload).then((r) => r.data),
  myTickets: () => httpClient.get<SupportTicket[]>('/tickets/my-tickets/').then((r) => r.data),
  list: (params: { status?: TicketStatus } = {}) =>
    httpClient.get<Paginated<SupportTicket>>('/tickets/', { params }).then((r) => r.data),
  retrieve: (id: number) => httpClient.get<SupportTicket>(`/tickets/${id}/`).then((r) => r.data),
  reply: (id: number, message: string) =>
    httpClient.post<TicketMessage>(`/tickets/${id}/reply/`, { message }).then((r) => r.data),
  updateStatus: (id: number, status: TicketStatus) =>
    httpClient.patch<SupportTicket>(`/tickets/${id}/`, { status }).then((r) => r.data),
};
