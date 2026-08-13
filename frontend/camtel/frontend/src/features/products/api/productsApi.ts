import { httpClient } from '@/shared/lib/axios';
import type { Paginated, Product } from '@/shared/types';

export interface ProductListParams {
  category?: string;
  segment?: string;
  search?: string;
  page?: number;
  status?: string;
}

export interface ProductPayload {
  name: string;
  category_id: number;
  short_description: string;
  description: string;
  price?: number | null;
  price_unit?: string | null;
  is_featured?: boolean;
}

// Endpoints alignes sur la section 8.3 de la documentation API.
export const productsApi = {
  list: (params: ProductListParams = {}) =>
    httpClient.get<Paginated<Product>>('/products/', { params }).then((r) => r.data),
  detail: (slug: string) => httpClient.get<Product>(`/products/${slug}/`).then((r) => r.data),
  create: (payload: ProductPayload) =>
    httpClient.post<Product>('/products/', payload).then((r) => r.data),
  update: (id: number, payload: Partial<ProductPayload>) =>
    httpClient.patch<Product>(`/products/${id}/`, payload).then((r) => r.data),
  publish: (id: number) => httpClient.post<Product>(`/products/${id}/publish/`).then((r) => r.data),
  remove: (id: number) => httpClient.delete(`/products/${id}/`),
  exportPdf: (id: number) =>
    httpClient.get(`/products/${id}/export-pdf/`, { responseType: 'blob' }).then((r) => r.data),
  compare: (ids: number[]) =>
    httpClient
      .get<Array<{
        id: number;
        name: string;
        slug: string;
        category: { id: number; name: string; slug: string };
        price: number;
        price_unit?: string;
        short_description: string;
        description: string;
        features: { stock: number; is_active: boolean; views_count: number };
        faqs: Array<{ id: number; question: string; answer: string }>;
      }>>('/products/compare/', { params: { ids: ids.join(',') } })
      .then((r) => r.data),
};
