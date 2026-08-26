import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productImagesApi, type ProductImageUpdatePayload } from '../api/productImagesApi';
import { queryKeys } from '@/shared/lib/queryClient';

// Toutes les mutations invalident le detail produit (qui embarque `images[]`)
// pour que la galerie se resynchronise automatiquement apres chaque action.
export function useUploadProductImage(productId: number, productSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, altText }: { file: File; altText?: string }) =>
      productImagesApi.upload(productId, file, altText),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.detail(productSlug) }),
  });
}

export function useUpdateProductImage(productId: number, productSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, payload }: { imageId: number; payload: ProductImageUpdatePayload }) =>
      productImagesApi.update(productId, imageId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.detail(productSlug) }),
  });
}

export function useDeleteProductImage(productId: number, productSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: number) => productImagesApi.remove(productId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.detail(productSlug) }),
  });
}
