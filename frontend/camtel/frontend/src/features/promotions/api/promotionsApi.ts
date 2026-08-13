import { httpClient } from '@/shared/lib/axios';
import type { Paginated, Promotion, DiscountType } from '@/shared/types';

/** Normalise la reponse DRF (discount_percent, ends_at...) vers le type frontend. */
function normalizePromotion(raw: Record<string, unknown>): Promotion {
  const discountType = (raw.discount_type as DiscountType | undefined) ?? 'percentage';
  const discountValue =
    (raw.discount_value as number | undefined) ??
    (raw.discount_percent as number | undefined) ??
    0;

  return {
    id: raw.id as number,
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    product_id: (raw.product_id as number | null | undefined) ?? null,
    discount_type: discountType,
    discount_value: discountValue,
    start_date: String(raw.start_date ?? raw.starts_at ?? ''),
    end_date: String(raw.end_date ?? raw.ends_at ?? ''),
    is_active: Boolean(raw.is_active ?? true),
    created_by_id: raw.created_by_id as number | undefined,
    created_at: String(raw.created_at ?? new Date().toISOString()),
  };
}

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
  active: () =>
    httpClient
      .get<Record<string, unknown>[]>('/promotions/active/')
      .then((r) => r.data.map(normalizePromotion)),
  list: (params: { page?: number } = {}) =>
    httpClient.get<Paginated<Record<string, unknown>>>('/promotions/', { params }).then((r) => ({
      ...r.data,
      results: r.data.results.map(normalizePromotion),
    })),
  create: (payload: PromotionPayload) =>
    httpClient.post<Promotion>('/promotions/', payload).then((r) => r.data),
  update: (id: number, payload: Partial<PromotionPayload>) =>
    httpClient.patch<Promotion>(`/promotions/${id}/`, payload).then((r) => r.data),
  remove: (id: number) => httpClient.delete(`/promotions/${id}/`),
};
