import { httpClient } from '@/shared/lib/axios';
import type { Paginated, SubscriptionRequest } from '@/shared/types';

export interface SubscriptionRequestPayload {
  product_id: number;
  full_name: string;
  email: string;
  phone: string;
  company_name?: string;
}

export interface ChangeStatusPayload {
  status: string;
  reason?: string;
  comment?: string;
}

export const subscriptionsApi = {
  create: (payload: SubscriptionRequestPayload) => httpClient.post('/subscriptions/', payload),
  // Back-office (section 18 mission) : liste/traitement des demandes,
  // reserve a AdminOnly cote backend (super_admin/admin).
  list: (params: { status?: string } = {}) =>
    httpClient.get<Paginated<SubscriptionRequest>>('/subscriptions/', { params }).then((r) => r.data),
  retrieve: (id: number) => httpClient.get<SubscriptionRequest>(`/subscriptions/${id}/`).then((r) => r.data),
  changeStatus: (id: number, payload: ChangeStatusPayload) =>
    httpClient.post<SubscriptionRequest>(`/subscriptions/${id}/change-status/`, payload).then((r) => r.data),
};
