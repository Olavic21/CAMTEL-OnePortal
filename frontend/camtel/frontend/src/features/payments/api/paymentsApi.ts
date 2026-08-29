import { httpClient } from '@/shared/lib/axios';
import type { PaymentResult } from '@/shared/types';
import type { Payment, PaymentSummary } from '@/mocks/payments';
import { listMockPayments } from '@/mocks/payments';

// Section 29 mission : abstraction de paiement (jamais de vraies donnees
// bancaires stockees). MockPaymentProvider en dev/demo — reserve aux
// utilisateurs authentifies cote backend (IsAuthenticated).
export const paymentsApi = {
  initiate: (payload: { product_id?: number; amount?: string | number; currency?: string; metadata?: Record<string, unknown> }) =>
    httpClient.post<PaymentResult>('/payments/initiate/', payload).then((r) => r.data),

  /**
   * Historique des paiements client (espace client, cahier des charges 22).
   * Le backend n'expose PAS encore GET /payments/ (liste) : tant que
   * l'endpoint n'est pas disponible, fallback sur les mocks conformes au
   * contrat (marques DEMO, jamais presentes comme vraies donnees). Des que
   * l'API existe, supprimer le catch.
   */
  history: async (): Promise<{ results: Payment[]; summary: PaymentSummary; source: 'API' | 'DEMO' }> => {
    try {
      return await httpClient
        .get<{ results: Payment[]; summary: PaymentSummary }>('/payments/')
        .then((r) => ({ ...r.data, source: 'API' as const }));
    } catch {
      return listMockPayments();
    }
  },
};
