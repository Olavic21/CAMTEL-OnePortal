import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, type CreateTicketPayload } from '../api/ticketsApi';
import { queryKeys } from '@/shared/lib/queryClient';
import type { TicketStatus } from '@/shared/types';

export function useMyTickets() {
  return useQuery({ queryKey: queryKeys.tickets.mine, queryFn: ticketsApi.myTickets });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => ticketsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tickets.mine }),
  });
}

export function useTicketList(params: { status?: TicketStatus } = {}) {
  return useQuery({ queryKey: queryKeys.tickets.list(params), queryFn: () => ticketsApi.list(params) });
}

export function useTicket(id: number) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => ticketsApi.retrieve(id),
    enabled: Number.isFinite(id),
  });
}

export function useReplyTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) => ticketsApi.reply(id, message),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.tickets.detail(variables.id) });
      qc.invalidateQueries({ queryKey: queryKeys.tickets.mine });
      qc.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TicketStatus }) => ticketsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tickets.all }),
  });
}
