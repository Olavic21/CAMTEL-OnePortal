import { httpClient } from '@/shared/lib/axios';
import type { ProductFAQ } from '@/shared/types';

export interface ProductFaqPayload {
  question: string;
  answer: string;
  order?: number;
}

// CRUD ProductFAQ lie aux produits (roadmap V2). Sous-ressource de /products/{id}/.
export const productFaqApi = {
  create: (productId: number, payload: ProductFaqPayload) =>
    httpClient.post<ProductFAQ>(`/products/${productId}/faqs/`, payload).then((r) => r.data),
  update: (productId: number, faqId: number, payload: Partial<ProductFaqPayload>) =>
    httpClient.patch<ProductFAQ>(`/products/${productId}/faqs/${faqId}/`, payload).then((r) => r.data),
  remove: (productId: number, faqId: number) =>
    httpClient.delete(`/products/${productId}/faqs/${faqId}/`),
};
