import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi, type ChangeStatusPayload, type SubscriptionRequestPayload } from '../api/subscriptionsApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useCreateSubscription() {
  return useMutation({ mutationFn: (payload: SubscriptionRequestPayload) => subscriptionsApi.create(payload) });
}

// Back-office (section 18 mission) : liste des demandes de souscription.
export function useSubscriptionRequests(params: { status?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.subscriptions.list(params),
    queryFn: () => subscriptionsApi.list(params),
  });
}

export function useSubscriptionRequest(id: number) {
  return useQuery({
    queryKey: queryKeys.subscriptions.detail(id),
    queryFn: () => subscriptionsApi.retrieve(id),
    enabled: Number.isFinite(id),
  });
}

export function useChangeSubscriptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ChangeStatusPayload }) =>
      subscriptionsApi.changeStatus(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.subscriptions.all }),
  });
}
