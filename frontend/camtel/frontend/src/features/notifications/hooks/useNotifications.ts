import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';

// Rafraichissement periodique (polling) pour simuler un flux quasi temps-reel
// sans necessiter de WebSocket cote backend.
export function useNotifications(params: { page?: number } = {}) {
  return useQuery({
    queryKey: ['notifications', 'list', params],
    queryFn: () => notificationsApi.list(params),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
