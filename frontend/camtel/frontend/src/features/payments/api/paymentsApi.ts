import { httpClient } from '@/shared/lib/axios';
import type { PaymentResult } from '@/shared/types';

// Section 29 mission : abstraction de paiement (jamais de vraies donnees
// bancaires stockees). MockPaymentProvider en dev/demo — reserve aux
// utilisateurs authentifies cote backend (IsAuthenticated).
export const paymentsApi = {
  initiate: (payload: { product_id?: number; amount?: string | number; currency?: string; metadata?: Record<string, unknown> }) =>
    httpClient.post<PaymentResult>('/payments/initiate/', payload).then((r) => r.data),
};
