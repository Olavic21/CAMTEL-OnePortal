import { httpClient } from '@/shared/lib/axios';
import type { AppNotification, Paginated } from '@/shared/types';

// Centre de notifications internes (roadmap V2). Endpoints pressentis /notifications/.
export const notificationsApi = {
  list: (params: { page?: number } = {}) =>
    httpClient.get<Paginated<AppNotification>>('/notifications/', { params }).then((r) => r.data),
  markRead: (id: number) => httpClient.post(`/notifications/${id}/mark-read/`),
  markAllRead: () => httpClient.post('/notifications/mark-all-read/'),
};
