import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation, type TFunction } from 'react-i18next';
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import {
  useCreateProductFaq,
  useUpdateProductFaq,
  useDeleteProductFaq,
} from '../hooks/useProductFaq';
import { Button } from '@/shared/components/Button';
import { Input, Textarea } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { useToast } from '@/shared/components/Toast';
import type { ProductFAQ } from '@/shared/types';

function buildSchema(t: TFunction) {
  return z.object({
    question: z.string().min(5, t('validation.minLength', { count: 5 })),
    answer: z.string().min(5, t('validation.minLength', { count: 5 })),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

// CRUD FAQ produit (roadmap V2). Visible uniquement en edition, comme la
// galerie d'images : le produit doit deja exister cote backend.
export function AdminProductFaqManager({
  productId,
  productSlug,
  faqs,
}: {
  productId: number;
  productSlug: string;
  faqs: ProductFAQ[];
}) {
  const { t } = useTranslation();
  const sorted = [...faqs].sort((a, b) => a.order - b.order);
  const createFaq = useCreateProductFaq(productId, productSlug);
  const updateFaq = useUpdateProductFaq(productId, productSlug);
  const deleteFaq = useDeleteProductFaq(productId, productSlug);
  const { push } = useToast();
  const [editing, setEditing] = useState<ProductFAQ | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function openCreate() {
    reset({ question: '', answer: '' });
    setIsCreateOpen(true);
  }

  function openEdit(faq: ProductFAQ) {
    reset({ question: faq.question, answer: faq.answer });
    setEditing(faq);
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await updateFaq.mutateAsync({ faqId: editing.id, payload: values });
        push(t('admin.products.faqManager.updated_toast'));
      } else {
        await createFaq.mutateAsync({ ...values, order: sorted.length });
        push(t('admin.products.faqManager.created_toast'));
      }
      setEditing(null);
      setIsCreateOpen(false);
    } catch {
      push(t('admin.products.faqManager.error_toast'), 'error');
    }
  }

  function move(faq: ProductFAQ, direction: -1 | 1) {
    const currentIndex = sorted.findIndex((f) => f.id === faq.id);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const target = sorted[targetIndex];
    updateFaq.mutate({ faqId: faq.id, payload: { order: target.order } });
    updateFaq.mutate({ faqId: target.id, payload: { order: faq.order } });
  }

  const formOpen = isCreateOpen || !!editing;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{t('admin.products.faqManager.title')}</p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          <Plus className="h-3.5 w-3.5" /> {t('admin.products.faqManager.add')}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
          {t('admin.products.faqManager.empty')}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:border-neutral-800 dark:divide-neutral-800">
          {sorted.map((faq, index) => (
            <li key={faq.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{faq.question}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">{faq.answer}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(faq, -1)}
                  disabled={index === 0}
                  aria-label="Monter"
                  className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-500 dark:hover:bg-neutral-800"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(faq, 1)}
                  disabled={index === sorted.length - 1}
                  aria-label="Descendre"
                  className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-500 dark:hover:bg-neutral-800"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(faq)}
                  aria-label={t('common.edit')}
                  className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t('admin.products.faqManager.deleteConfirm'))) {
                      deleteFaq.mutate(faq.id, { onSuccess: () => push(t('admin.products.faqManager.deleted_toast')) });
                    }
                  }}
                  aria-label={t('common.delete')}
                  className="rounded p-1.5 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => {
          setEditing(null);
          setIsCreateOpen(false);
        }}
        title={editing ? t('admin.products.faqManager.editTitle') : t('admin.products.faqManager.newTitle')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input label={t('admin.products.faqManager.question')} error={errors.question?.message} {...register('question')} />
          <Textarea label={t('admin.products.faqManager.answer')} rows={4} error={errors.answer?.message} {...register('answer')} />
          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            {t('common.save')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
