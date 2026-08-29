import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { useInitiatePayment } from '../hooks/usePayments';
import { createIdempotencyKey } from '../api/paymentsApi';
import { Button } from '@/shared/components/Button';

// Section 29 mission : paiement (abstraction mock, jamais de vraies donnees
// bancaires — voir apps/core/v2_services.py MockPaymentProvider). Reserve
// aux utilisateurs authentifies cote backend (le formulaire de souscription
// reste public, donc ce bloc ne s'affiche que si l'utilisateur est connecte
// — voir usage dans SubscriptionPage).
//
// Phase 10 : le montant est determine cote serveur ; on n'envoie QUE
// product_id + une cle d'idempotence stable pendant la session du composant.
export function PaymentCta({ productId }: { productId: number }) {
  const { t } = useTranslation();
  // La cle est generee UNE fois par montage : les retries utilisateur
  // reutilisent la meme cle -> pas de double transaction cote backend.
  const [idempotencyKey] = useState(() => createIdempotencyKey());
  const initiatePayment = useInitiatePayment();

  if (initiatePayment.isSuccess) {
    const result = initiatePayment.data;
    return (
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent-50 p-4 text-sm text-accent-800 dark:bg-accent-900/20 dark:text-accent-300">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">{t('payment.initiated')}</p>
          <p className="mt-1 text-xs opacity-90">
            {t('payment.reference')} : {result.reference} — {result.amount} {result.currency}
          </p>
          <p className="mt-1 text-xs italic opacity-75">{t('payment.mockNotice')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
      {/* P1-3: Show mock disclaimer for payment */}
      <div className="mb-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        ⚠️ {t('payment.mockDisclaimer', 'Simulation — aucune transaction réelle n\'est effectuée.')}
      </div>
      
      <Button
        onClick={() => initiatePayment.mutate({ product_id: productId, idempotency_key: idempotencyKey })}
        isLoading={initiatePayment.isPending}
        variant="secondary"
        className="gap-2"
      >
        <CreditCard className="h-4 w-4" /> {t('payment.payNow')}
      </Button>
      {initiatePayment.isError && <p className="mt-2 text-xs text-red-600">{t('payment.error')}</p>}
    </div>
  );
}
