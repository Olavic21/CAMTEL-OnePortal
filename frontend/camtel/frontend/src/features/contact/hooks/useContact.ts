import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contactApi, type ContactPayload } from '../api/contactApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useSendContactMessage() {
  return useMutation({ mutationFn: (payload: ContactPayload) => contactApi.send(payload) });
}

export function useContactMessages(params: { status?: string } = {}) {
  return useQuery({ queryKey: queryKeys.contact.list(params), queryFn: () => contactApi.list(params) });
}

export function useMarkContactRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contactApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contact.all }),
  });
}
