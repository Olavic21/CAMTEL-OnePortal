import { httpClient } from '@/shared/lib/axios';
import type { ProductImage } from '@/shared/types';

export interface ProductImageUpdatePayload {
  is_primary?: boolean;
  order?: number;
  alt_text?: string;
}

// Galerie multi-images par produit (roadmap V2). Sous-ressource de /products/{id}/.
export const productImagesApi = {
  upload: (productId: number, file: File, altText?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (altText) formData.append('alt_text', altText);
    return httpClient
      .post<ProductImage>(`/products/${productId}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  update: (productId: number, imageId: number, payload: ProductImageUpdatePayload) =>
    httpClient
      .patch<ProductImage>(`/products/${productId}/images/${imageId}/`, payload)
      .then((r) => r.data),
  remove: (productId: number, imageId: number) =>
    httpClient.delete(`/products/${productId}/images/${imageId}/`),
};
