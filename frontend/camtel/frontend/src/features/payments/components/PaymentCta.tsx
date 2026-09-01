import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import { useInitiatePayment } from '../hooks/usePayments';
import { createIdempotencyKey } from '../api/paymentsApi';
import { Button } from '@/shared/components/Button';
import { httpClient } from '@/shared/lib/axios';

// Phase 14/16 : paiement Orange Money / MTN MoMo + flow complet
type Method = 'orange' | 'mtn' | '';
type Step = 'choose' | 'confirm' | 'pending' | 'success' | 'failed';

export function PaymentCta({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const [idempotencyKey] = useState(() => createIdempotencyKey());
  const [method, setMethod] = useState<Method>('');
  const [step, setStep] = useState<Step>('choose');
  const initiatePayment = useInitiatePayment();
  const [statusData, setStatusData] = useState<{ reference?: string; status?: string } | null>(null);

  const handleInitiate = () => {
    if (!method) return;
    setStep('pending');
    initiatePayment.mutate(
      { product_id: productId, idempotency_key: idempotencyKey, provider: method },
      {
        onSuccess: (data) => {
          setStatusData({ reference: data.reference, status: data.status });
          // Poll status — source de vérité backend uniquement (jamais de faux succès)
          let attempts = 0;
          const poll = async () => {
            attempts += 1;
            try {
              const res = await httpClient.get(`/payments/${data.reference}/status/`);
              const s = res.data.status as string;
              setStatusData(res.data);
              if (s === 'COMPLETED') setStep('success');
              else if (s === 'FAILED' || s === 'CANCELLED') setStep('failed');
              else if (attempts < 8) setTimeout(poll, 3000);
              // au-delà, reste en PENDING (simulation) — l'utilisateur consulte /mon-compte/paiements
            } catch {
              if (attempts < 3) setTimeout(poll, 3000);
            }
          };
          setTimeout(poll, 1500);
        },
        onError: () => setStep('failed'),
      },
    );
  };

  if (initiatePayment.isSuccess && step === 'success') {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Paiement confirmé</p>
          <p className="mt-1 text-xs opacity-90">Réf: {statusData?.reference} — {initiatePayment.data.amount} {initiatePayment.data.currency} via {method === 'orange' ? 'Orange Money' : 'MTN MoMo'}</p>
          <p className="mt-1 text-xs italic opacity-75">Source de vérité : backend — notification envoyée</p>
        </div>
      </div>
    );
  }
  if (step === 'failed') {
    return (
      <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
        <AlertCircle className="inline h-4 w-4 mr-1" /> Le paiement n’a pas pu être confirmé.
        <Button variant="tertiary" size="sm" className="mt-2" onClick={() => setStep('choose')}>Réessayer</Button>
      </div>
    );
  }
  if (step === 'pending') {
    const isMock = initiatePayment.data?.provider === 'mock';
    return (
      <div className="mt-4 flex flex-col items-center gap-3 rounded-lg bg-blue-50 p-6 text-center dark:bg-blue-900/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {isMock ? 'Paiement en cours (simulation)...' : 'Nous attendons la confirmation du paiement...'}
        </p>
        <p className="text-xs text-neutral-500">{method === 'orange' ? 'Orange Money' : 'MTN Mobile Money'} — Réf {initiatePayment.data?.reference ?? '...'}</p>
        {isMock && <p className="text-xs text-amber-700 dark:text-amber-300">Mode simulation — aucune transaction réelle. Suivi dans Mon compte → Paiements.</p>}
        <a href="/mon-compte/paiements" className="text-xs font-medium text-primary hover:underline">Voir mes paiements →</a>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
      <div className="mb-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">⚠️ {t('payment.mockDisclaimer')} — secrets jamais exposés au frontend.</div>
      <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">Choisir le moyen de paiement</p>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => setMethod('orange')}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${method === 'orange' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-orange-300'}`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-xs">OM</span>
          <span className="text-sm font-semibold">Orange Money</span>
        </button>
        <button
          onClick={() => setMethod('mtn')}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${method === 'mtn' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-yellow-400'}`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-neutral-900 font-bold text-xs">MoMo</span>
          <span className="text-sm font-semibold">MTN Mobile Money</span>
        </button>
      </div>
      <Button onClick={handleInitiate} disabled={!method} isLoading={initiatePayment.isPending} variant="secondary" className="gap-2 w-full justify-center">
        <Smartphone className="h-4 w-4" /> {t('payment.payNow')} {method ? `— ${method === 'orange' ? 'Orange Money' : 'MTN MoMo'}` : ''}
      </Button>
      {initiatePayment.isError && <p className="mt-2 text-xs text-red-600">{t('payment.error')}</p>}
    </div>
  );
}
