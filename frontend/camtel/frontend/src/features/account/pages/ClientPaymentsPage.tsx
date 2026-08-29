import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Receipt } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { ClientAccountNav } from '../components/ClientAccountNav';
import { listMockPayments } from '@/mocks/payments';
import type { Payment } from '@/mocks/payments';

export default function ClientPaymentsPage() {
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['payments', 'client'],
    queryFn: () => Promise.resolve(listMockPayments()),
  });

  if (isLoading) {
    return (
      <div className="container-app flex min-h-[300px] items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label={t('common.loading')} />
      </div>
    );
  }

  const payments: Payment[] = data?.results ?? [];

  return (
    <div className="container-app max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {t('account.payments')}
      </h1>
      <ClientAccountNav />

      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('account.paymentHistory')}
        </h2>
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isError && payments.length === 0 && (
          <EmptyState icon={Receipt} title={t('account.noPayments')} description={t('account.noPaymentsHint')} />
        )}
        {!isError && payments.length > 0 && (
          <PaymentsTable payments={payments} />
        )}
      </div>
    </div>
  );
}

function PaymentsTable({ payments }: { payments: Payment[] }) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-semibold">{t('account.paymentReference')}</th>
              <th className="px-4 py-3 font-semibold">{t('account.paymentProduct')}</th>
              <th className="px-4 py-3 font-semibold">{t('account.paymentAmount')}</th>
              <th className="px-4 py-3 font-semibold">{t('account.paymentStatus')}</th>
              <th className="px-4 py-3 font-semibold">{t('account.paymentDate')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800 dark:bg-neutral-950">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                  {payment.reference}
                </td>
                <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{payment.product_name}</td>
                <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                  {new Intl.NumberFormat('fr-FR').format(payment.amount)} FCFA
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {t(`account.paymentStatus.${payment.status}`)}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {payment.paid_at ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}