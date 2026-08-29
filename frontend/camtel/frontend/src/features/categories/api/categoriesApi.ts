import { httpClient } from '@/shared/lib/axios';
import type { Category, CategorySegment, Paginated } from '@/shared/types';

export interface CategoryPayload {
  name: string;
  segment: CategorySegment;
  parent_id?: number | null;
  description?: string;
}

// Section 8.2 de la documentation API.
export const categoriesApi = {
  list: (params: { segment?: string; parent?: number } = {}) =>
    httpClient.get<Paginated<Category>>('/categories/', { params }).then((r) => r.data),
  detail: (slug: string) => httpClient.get<Category>(`/categories/${slug}/`).then((r) => r.data),
  create: (payload: CategoryPayload) =>
    httpClient.post<Category>('/categories/', payload).then((r) => r.data),
  update: (id: number, payload: Partial<CategoryPayload>) =>
    httpClient.patch<Category>(`/categories/${id}/`, payload).then((r) => r.data),
  remove: (id: number) => httpClient.delete(`/categories/${id}/`),
};
