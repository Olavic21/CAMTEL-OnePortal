import { httpClient } from '@/shared/lib/axios';
import type { PaymentResult } from '@/shared/types';

// Section 29 mission : abstraction de paiement (jamais de vraies donnees
// bancaires stockees). MockPaymentProvider en dev/demo — reserve aux
// utilisateurs authentifies cote backend (IsAuthenticated).
//
// Phase 10 : le montant n'est JAMAIS envoye par le client — le backend le
// determine depuis le prix officiel du produit. Une cle d'idempotence
// garantit qu'un retry ne cree pas une seconde transaction.

/** Paiement tel qu'expose par GET /api/v1/payments/ (apps.core.PaymentHistoryView). */
export interface Payment {
  id: string;
  reference: string;
  provider: string;
  /** provider === 'mock' => transaction de simulation, jamais presentee comme reelle. */
  simulation: boolean;
  product_name: string | null;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  paid_at: string | null;
  created_at: string | null;
  /** Mois REEL du paiement (date de creation cote serveur) — jamais simule. */
  period: string;
}

export interface PaymentSummary {
  total_paid: number;
  currency: string;
  pending_count: number;
  failed_count: number;
  completed_count: number;
  billing_status: 'UP_TO_DATE' | 'PENDING';
  /** Toujours null : aucune facturation recurrente n'est modelisee cote backend. */
  next_due_date: string | null;
}

export interface PaymentHistory {
  count: number;
  results: Payment[];
  summary: PaymentSummary;
}

interface RawPayment {
  id: number;
  reference: string;
  transaction_id: string | null;
  provider: string;
  product_name: string | null;
  amount: string;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  paid_at: string | null;
  created_at: string | null;
  simulation: boolean;
}

interface RawHistory {
  count: number;
  results: RawPayment[];
  summary: {
    total_paid: string;
    currency: string;
    pending_count: number;
    failed_count: number;
    completed_count: number;
    billing_status: 'UP_TO_DATE' | 'PENDING';
    next_due_date: string | null;
  };
}

function monthLabel(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
}

export const paymentsApi = {
  initiate: (payload: {
    product_id: number;
    idempotency_key?: string;
    provider?: string;
  }) => httpClient.post<PaymentResult>('/payments/initiate/', payload).then((r) => r.data),

  /**
   * Historique des paiements du client connecte (backend GET /api/v1/payments/,
   * isolation owner stricte). En cas d'erreur API, l'exception est propagee :
   * la page affiche un etat d'erreur — JAMAIS des factures fictives.
   */
  history: async (): Promise<PaymentHistory> => {
    const { data } = await httpClient.get<RawHistory>('/payments/');
    return {
      count: data.count,
      results: data.results.map((p) => ({
        id: String(p.id),
        reference: p.reference,
        provider: p.provider,
        simulation: p.simulation,
        product_name: p.product_name,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        paid_at: p.paid_at,
        created_at: p.created_at,
        period: monthLabel(p.created_at),
      })),
      summary: {
        total_paid: Number(data.summary.total_paid),
        currency: data.summary.currency,
        pending_count: data.summary.pending_count,
        failed_count: data.summary.failed_count,
        completed_count: data.summary.completed_count,
        billing_status: data.summary.billing_status,
        next_due_date: data.summary.next_due_date,
      },
    };
  },
};

/** Genere une cle d'idempotence unique (fallback si crypto indisponible). */
export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
