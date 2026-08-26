import { useTranslation } from 'react-i18next';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { useInitiatePayment } from '../hooks/usePayments';
import { Button } from '@/shared/components/Button';
import { formatPrice } from '@/shared/utils/format';

// Section 29 mission : paiement (abstraction mock, jamais de vraies donnees
// bancaires — voir apps/core/v2_services.py MockPaymentProvider). Reserve
// aux utilisateurs authentifies cote backend (le formulaire de souscription
// reste public, donc ce bloc ne s'affiche que si l'utilisateur est connecte
// — voir usage dans SubscriptionPage).
export function PaymentCta({ productId, amount }: { productId: number; amount: number }) {
  const { t } = useTranslation();
  const initiatePayment = useInitiatePayment();

  if (initiatePayment.isSuccess) {
    const result = initiatePayment.data;
    return (
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent-50 p-4 text-sm text-accent-800 dark:bg-accent-900/20 dark:text-accent-300">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">{t('payment.initiated')}</p>
          <p className="mt-1 text-xs opacity-90">
            {t('payment.reference')} : {result.reference} — {formatPrice(Number(result.amount))}
          </p>
          <p className="mt-1 text-xs italic opacity-75">{t('payment.mockNotice')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
      <Button
        onClick={() => initiatePayment.mutate({ product_id: productId, amount, currency: 'XAF' })}
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
