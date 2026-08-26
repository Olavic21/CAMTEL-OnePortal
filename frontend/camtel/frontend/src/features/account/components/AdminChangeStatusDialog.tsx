import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/Button';
import { Input, Select, Textarea } from '@/shared/components/Input';
import { useChangeSubscriptionStatus } from '@/features/subscriptions/hooks/useSubscriptions';
import { useToast } from '@/shared/components/Toast';
import type { SubscriptionStatus } from '@/shared/types';

interface StatusOption {
  value: SubscriptionStatus;
  label: string;
}

// Back-office (section 14/18 mission) : formulaire de transition de statut
// d'une demande de souscription. Trace dans SubscriptionStatusHistory cote
// backend (deja teste) — ce composant existait mais n'etait branche a aucune
// route/page (composant orphelin) et referencait des cles de traduction
// jamais definies. Corrige : hooks React Query reels, cles i18n existantes,
// callback onSuccess au lieu d'une navigation forcee (reutilisable en modal
// ou en page).
export function AdminChangeStatusDialog({
  subscriptionId,
  initialStatus,
  onCancel,
  onSuccess,
}: {
  subscriptionId: number;
  initialStatus: SubscriptionStatus;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const { push } = useToast();
  const changeStatus = useChangeSubscriptionStatus();

  const form = useForm({
    defaultValues: { status: initialStatus, reason: '', comment: '' },
  });
  const selectedStatus = form.watch('status');

  const statusOptions: StatusOption[] = [
    { value: 'PENDING', label: t('admin.subscriptions.status.pending') },
    { value: 'UNDER_REVIEW', label: t('admin.subscriptions.status.underReview') },
    { value: 'ADDITIONAL_INFO_REQUIRED', label: t('admin.subscriptions.status.additionalInfoRequired') },
    { value: 'APPROVED', label: t('admin.subscriptions.status.approved') },
    { value: 'SCHEDULED', label: t('admin.subscriptions.status.scheduled') },
    { value: 'ACTIVATED', label: t('admin.subscriptions.status.activated') },
    { value: 'REJECTED', label: t('admin.subscriptions.status.rejected') },
    { value: 'CANCELLED', label: t('admin.subscriptions.status.cancelled') },
  ];

  const handleSubmit = form.handleSubmit((values) => {
    changeStatus.mutate(
      { id: subscriptionId, payload: values },
      {
        onSuccess: () => {
          push(t('admin.subscriptions.statusUpdated'));
          onSuccess?.();
        },
        onError: () => push(t('admin.subscriptions.statusUpdateError'), 'error'),
      },
    );
  });

  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {t('admin.subscriptions.changeStatus')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label={t('admin.subscriptions.selectNewStatus')} {...form.register('status')}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {selectedStatus === 'REJECTED' && (
          <Input
            type="text"
            label={t('admin.subscriptions.reason')}
            placeholder={t('admin.subscriptions.reason')}
            {...form.register('reason')}
          />
        )}

        <Textarea
          label={t('admin.subscriptions.comment')}
          placeholder={t('admin.subscriptions.comment')}
          rows={3}
          {...form.register('comment')}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" onClick={onCancel} variant="tertiary">
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" variant="primary" isLoading={changeStatus.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
