import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Loader2 } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { Badge } from '@/shared/components/Badge';
import { ErrorState } from '@/shared/components/ErrorState';
import { paymentsApi } from '../api/paymentsApi';
import { ClientAccountNav } from '@/features/account/components/ClientAccountNav';
import { formatDate, formatPrice } from '@/shared/utils/format';

const STATUS_TONES: Record<string, 'success' | 'warning' | 'destructive'> = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'destructive',
};

export default function ClientPaymentsPage() {
  const { t } = useTranslation();

  // Historique des paiements. Tant que GET /payments/ n'existe pas cote
  // backend, l'api retombe sur les mocks marques DEMO (jamais presentes
  // comme de vraies donnees commerciales).
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['payments', 'mine'],
    queryFn: () => paymentsApi.history(),
  });

  if (isLoading) {
    return (
      <div className="container-app flex min-h-[300px] items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label={t('common.loading')} />
      </div>
    );
  }

  const payments = data?.results ?? [];
  const summary = data?.summary;

  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {t('account.payments')}
      </h1>
      <ClientAccountNav />

      {/* Resume facturation */}
      {summary && (
        <Card className="mt-6 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t('account.paymentsTotalPaid')}
              </p>
              <p className="mt-1 text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {formatPrice(summary.total_paid)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t('account.paymentsPending')}
              </p>
              <p className="mt-1 text-lg font-bold text-neutral-900 dark:text-neutral-100">{summary.pending_count}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t('account.paymentsBillingStatus')}
              </p>
              <Badge tone={summary.billing_status === 'UP_TO_DATE' ? 'success' : summary.billing_status === 'OVERDUE' ? 'destructive' : 'warning'} className="mt-1">
                {t(`account.billingStatus.${summary.billing_status}`)}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-6 p-6">
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isError && payments.length === 0 && (
          <EmptyState icon={CreditCard} title={t('account.paymentsEmpty')} description={t('account.paymentsEmptyHint')} />
        )}

        {payments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-md border border-neutral-200 dark:border-neutral-700">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="p-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t('account.paymentsReference')}
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t('account.product')}
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t('account.paymentsAmount')}
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t('account.status')}
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t('account.paymentsPaidAt')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">{p.reference}</td>
                    <td className="p-3 text-neutral-600 dark:text-neutral-400">{p.product_name}</td>
                    <td className="p-3 text-neutral-600 dark:text-neutral-400">
                      {formatPrice(p.amount)}
                      <span className="block text-xs text-neutral-400">{p.period}</span>
                    </td>
                    <td className="p-3">
                      <Badge tone={STATUS_TONES[p.status] ?? 'neutral'}>{t(`account.paymentStatus.${p.status}`)}</Badge>
                    </td>
                    <td className="p-3 text-sm text-neutral-500 dark:text-neutral-400">
                      {p.paid_at ? formatDate(p.paid_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}