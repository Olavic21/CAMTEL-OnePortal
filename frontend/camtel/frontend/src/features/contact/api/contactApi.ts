import { httpClient } from '@/shared/lib/axios';
import type { ContactMessage, Paginated } from '@/shared/types';

export interface ContactPayload {
  full_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Section 8.7 de la documentation API. Le endpoint POST est soumis a throttling cote serveur.
export const contactApi = {
  send: (payload: ContactPayload) => httpClient.post('/contact/', payload),
  list: (params: { status?: string } = {}) =>
    httpClient.get<Paginated<ContactMessage>>('/contact/', { params }).then((r) => r.data),
  markRead: (id: number) => httpClient.post(`/contact/${id}/markread/`),
};
