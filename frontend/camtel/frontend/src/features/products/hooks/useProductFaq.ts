import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productFaqApi, type ProductFaqPayload } from '../api/productFaqApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useCreateProductFaq(productId: number, productSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductFaqPayload) => productFaqApi.create(productId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.detail(productSlug) }),
  });
}

export function useUpdateProductFaq(productId: number, productSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ faqId, payload }: { faqId: number; payload: Partial<ProductFaqPayload> }) =>
      productFaqApi.update(productId, faqId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.detail(productSlug) }),
  });
}

export function useDeleteProductFaq(productId: number, productSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (faqId: number) => productFaqApi.remove(productId, faqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.detail(productSlug) }),
  });
}
