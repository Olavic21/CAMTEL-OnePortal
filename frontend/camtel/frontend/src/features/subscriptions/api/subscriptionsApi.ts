import { httpClient } from '@/shared/lib/axios';

export interface SubscriptionRequestPayload {
  product_id: number;
  full_name: string;
  email: string;
  phone: string;
  company_name?: string;
}

// Poser les bases du module subscriptions (roadmap V3, endpoint pressenti /subscriptions/).
export const subscriptionsApi = {
  create: (payload: SubscriptionRequestPayload) => httpClient.post('/subscriptions/', payload),
};
