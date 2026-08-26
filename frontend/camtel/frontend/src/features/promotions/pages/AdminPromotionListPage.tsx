import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { usePromotionsList, useCreatePromotion, useDeletePromotion } from '../hooks/usePromotions';
import { Table, type Column } from '@/shared/components/Table';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { Modal } from '@/shared/components/Modal';
import { Input, Select, Textarea } from '@/shared/components/Input';
import { useToast } from '@/shared/components/Toast';
import { formatDate } from '@/shared/utils/format';
import type { Promotion } from '@/shared/types';

function buildSchema(t: TFunction) {
  return z.object({
    title: z.string().min(3, t('validation.minLength', { count: 3 })),
    description: z.string().min(10, t('validation.minLength', { count: 10 })),
    discount_type: z.enum(['percentage', 'fixed_amount']),
    discount_value: z.coerce.number().positive(t('validation.positiveNumber')),
    start_date: z.string().min(1, t('validation.dateRequired')),
    end_date: z.string().min(1, t('validation.dateRequired')),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function AdminPromotionListPage() {
  const { t } = useTranslation();
  const { data, isLoading } = usePromotionsList();
  const createPromotion = useCreatePromotion();
  const deletePromotion = useDeletePromotion();
  const { push } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await createPromotion.mutateAsync(values);
      push(t('admin.promotions.created_toast'));
      setIsOpen(false);
      reset();
    } catch {
      push(t('admin.promotions.error_toast'), 'error');
    }
  }

  const columns: Column<Promotion>[] = [
    { key: 'title', header: t('admin.promotions.promotionTitle'), render: (p) => <span className="font-medium">{p.title}</span> },
    {
      key: 'discount',
      header: t('admin.promotions.discount'),
      render: (p) => (p.discount_type === 'percentage' ? `${p.discount_value}%` : `${p.discount_value} XAF`),
    },
    { key: 'period', header: t('admin.promotions.period'), render: (p) => `${formatDate(p.start_date)} - ${formatDate(p.end_date)}` },
    {
      key: 'status',
      header: t('common.status'),
      render: (p) => (
        <Badge tone={p.is_active ? 'success' : 'neutral'}>{p.is_active ? t('common.active') : t('common.inactive')}</Badge>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (p) => (
        <button
          onClick={() => {
            if (confirm(t('admin.promotions.deleteConfirm', { title: p.title }))) {
              deletePromotion.mutate(p.id, { onSuccess: () => push(t('admin.promotions.deleted_toast')) });
            }
          }}
          className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400"
          aria-label={t('common.delete')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('admin.promotions.title')}</h1>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4" /> {t('admin.promotions.newPromotion')}
        </Button>
      </div>

      <Table
        columns={columns}
        rows={data?.results ?? []}
        emptyMessage={isLoading ? t('common.loading') : t('admin.promotions.empty')}
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={t('admin.promotions.newPromotion')}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input label={t('admin.promotions.promotionTitle')} error={errors.title?.message} {...register('title')} />
          <Textarea label={t('admin.promotions.description')} rows={3} error={errors.description?.message} {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('admin.promotions.discountType')} error={errors.discount_type?.message} {...register('discount_type')}>
              <option value="percentage">{t('admin.promotions.percentage')}</option>
              <option value="fixed_amount">{t('admin.promotions.fixedAmount')}</option>
            </Select>
            <Input label={t('admin.promotions.value')} type="number" error={errors.discount_value?.message} {...register('discount_value')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('admin.promotions.startDate')} type="date" error={errors.start_date?.message} {...register('start_date')} />
            <Input label={t('admin.promotions.endDate')} type="date" error={errors.end_date?.message} {...register('end_date')} />
          </div>
          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            {t('admin.promotions.createPromotion')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
