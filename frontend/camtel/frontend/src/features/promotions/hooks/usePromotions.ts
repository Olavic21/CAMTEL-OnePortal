import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { promotionsApi, type PromotionPayload } from '../api/promotionsApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useActivePromotions() {
  return useQuery({ queryKey: queryKeys.promotions.active, queryFn: promotionsApi.active });
}

export function usePromotionsList(params: { page?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.promotions.list(params),
    queryFn: () => promotionsApi.list(params),
  });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PromotionPayload) => promotionsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.promotions.all }),
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => promotionsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.promotions.all }),
  });
}
