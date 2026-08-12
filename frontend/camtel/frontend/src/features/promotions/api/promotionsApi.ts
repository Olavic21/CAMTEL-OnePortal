import { httpClient } from '@/shared/lib/axios';
import type { Paginated, Promotion, DiscountType } from '@/shared/types';

export interface PromotionPayload {
  title: string;
  description: string;
  product_id?: number | null;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
}

// Section 8.5 de la documentation API.
export const promotionsApi = {
  active: () => httpClient.get<Promotion[]>('/promotions/active/').then((r) => r.data),
  list: (params: { page?: number } = {}) =>
    httpClient.get<Paginated<Promotion>>('/promotions/', { params }).then((r) => r.data),
  create: (payload: PromotionPayload) =>
    httpClient.post<Promotion>('/promotions/', payload).then((r) => r.data),
  update: (id: number, payload: Partial<PromotionPayload>) =>
    httpClient.patch<Promotion>(`/promotions/${id}/`, payload).then((r) => r.data),
  remove: (id: number) => httpClient.delete(`/promotions/${id}/`),
};
