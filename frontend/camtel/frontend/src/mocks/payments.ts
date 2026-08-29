/**
 * MOCK paiements — cahier des charges section 35.
 * Le backend n'expose pas encore GET /api/v1/payments/. Les mocks respectent
 * STRICTEMENT le contrat attendu (meme forme que la future reponse API) pour
 * que le remplacement soit un simple changement de queryFn.
 * Donnees marquees DEMO : jamais presentees comme des vraies donnees
 * commerciales (cf. regle 8 / section 21).
 */

export interface Payment {
  id: string;
  reference: string;
  product_name: string;
  amount: number;
  currency: 'XAF';
  status: 'PAID' | 'PENDING' | 'FAILED';
  period: string;
  method: 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH';
  paid_at: string | null;
}

export interface PaymentSummary {
  total_paid: number;
  pending_count: number;
  next_due_date: string | null;
  billing_status: 'UP_TO_DATE' | 'PENDING' | 'OVERDUE';
}

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    reference: 'FAC-2026-000421',
    product_name: 'Fibre Home 20M',
    amount: 25000,
    currency: 'XAF',
    status: 'PAID',
    period: 'Août 2026',
    method: 'MOBILE_MONEY',
    paid_at: '2026-08-02T10:12:00Z',
  },
  {
    id: 'pay-002',
    reference: 'FAC-2026-000356',
    product_name: 'Fibre Home 20M',
    amount: 25000,
    currency: 'XAF',
    status: 'PAID',
    period: 'Juillet 2026',
    method: 'MOBILE_MONEY',
    paid_at: '2026-07-02T09:30:00Z',
  },
  {
    id: 'pay-003',
    reference: 'FAC-2026-000512',
    product_name: 'VPS M',
    amount: 18000,
    currency: 'XAF',
    status: 'PENDING',
    period: 'Septembre 2026',
    method: 'BANK_TRANSFER',
    paid_at: null,
  },
];

export const MOCK_PAYMENT_SUMMARY: PaymentSummary = {
  total_paid: 50000,
  pending_count: 1,
  next_due_date: '2026-09-05',
  billing_status: 'PENDING',
};

export function listMockPayments(): { results: Payment[]; summary: PaymentSummary; source: 'DEMO' } {
  return { results: MOCK_PAYMENTS, summary: MOCK_PAYMENT_SUMMARY, source: 'DEMO' };
}