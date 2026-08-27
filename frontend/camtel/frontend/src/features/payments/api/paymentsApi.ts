import { httpClient } from '@/shared/lib/axios';
import type { PaymentResult } from '@/shared/types';

// Section 29 mission : abstraction de paiement (jamais de vraies donnees
// bancaires stockees). MockPaymentProvider en dev/demo — reserve aux
// utilisateurs authentifies cote backend (IsAuthenticated).
//
// Phase 10 : le montant n'est JAMAIS envoye par le client — le backend le
// determine depuis le prix officiel du produit. Une cle d'idempotence
// garantit qu'un retry ne cree pas une seconde transaction.
export interface InitiatePaymentPayload {
  product_id: number;
  idempotency_key?: string;
}

export const paymentsApi = {
  initiate: (payload: InitiatePaymentPayload) =>
    httpClient.post<PaymentResult>('/payments/initiate/', payload).then((r) => r.data),
};

/** Genere une cle d'idempotence unique (fallback si crypto indisponible). */
export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
