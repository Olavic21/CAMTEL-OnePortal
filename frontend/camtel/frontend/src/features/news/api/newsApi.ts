import { httpClient } from '@/shared/lib/axios';
import type { News, Paginated } from '@/shared/types';

export interface NewsPayload {
  title: string;
  content: string;
  cover_image?: string;
  status?: 'draft' | 'published';
}

// Section 8.4 de la documentation API.
export const newsApi = {
  list: (params: { page?: number } = {}) =>
    httpClient.get<Paginated<News>>('/news/', { params }).then((r) => r.data),
  detail: (slug: string) => httpClient.get<News>(`/news/${slug}/`).then((r) => r.data),
  create: (payload: NewsPayload) => httpClient.post<News>('/news/', payload).then((r) => r.data),
  update: (id: number, payload: Partial<NewsPayload>) =>
    httpClient.patch<News>(`/news/${id}/`, payload).then((r) => r.data),
  remove: (id: number) => httpClient.delete(`/news/${id}/`),
};
