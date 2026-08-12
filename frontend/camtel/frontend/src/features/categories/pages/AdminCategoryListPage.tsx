import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation, type TFunction } from 'react-i18next';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories';
import { Table, type Column } from '@/shared/components/Table';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { Modal } from '@/shared/components/Modal';
import { Input, Select } from '@/shared/components/Input';
import { useToast } from '@/shared/components/Toast';
import type { Category } from '@/shared/types';

function buildSchema(t: TFunction) {
  return z.object({
    name: z.string().min(2, t('validation.minLength', { count: 2 })),
    segment: z.enum(['grand_public', 'entreprise']),
    description: z.string().optional(),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

// Gestion hierarchique des categories (section 10.4) : creation, edition, suppression.
export default function AdminCategoryListPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { push } = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function openEdit(category: Category) {
    setEditing(category);
    reset({ name: category.name, segment: category.segment, description: category.description ?? '' });
  }

  function openCreate() {
    setIsCreateOpen(true);
    reset({ name: '', segment: 'grand_public', description: '' });
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, payload: values });
        push(t('admin.categories.updated_toast'));
      } else {
        await createCategory.mutateAsync(values);
        push(t('admin.categories.created_toast'));
      }
      setEditing(null);
      setIsCreateOpen(false);
    } catch {
      push(t('admin.categories.error_toast'), 'error');
    }
  }

  const columns: Column<Category>[] = [
    { key: 'name', header: t('admin.categories.name'), render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'slug', header: t('admin.categories.slug'), render: (c) => <code className="text-xs text-neutral-500 dark:text-neutral-400">{c.slug}</code> },
    {
      key: 'segment',
      header: t('admin.categories.segment'),
      render: (c) => (
        <Badge tone={c.segment === 'entreprise' ? 'neutral' : 'success'}>
          {c.segment === 'entreprise' ? t('admin.categories.enterpriseSegment') : t('admin.categories.publicSegment')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (c) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(c)} className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label={t('common.edit')}>
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(t('admin.categories.deleteConfirm', { name: c.name }))) {
                deleteCategory.mutate(c.id, { onSuccess: () => push(t('admin.categories.deleted_toast')) });
              }
            }}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400"
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const formOpen = isCreateOpen || !!editing;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('admin.categories.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> {t('admin.categories.newCategory')}
        </Button>
      </div>

      <Table
        columns={columns}
        rows={data?.results ?? []}
        emptyMessage={isLoading ? t('common.loading') : t('admin.categories.empty')}
      />

      <Modal
        isOpen={formOpen}
        onClose={() => {
          setEditing(null);
          setIsCreateOpen(false);
        }}
        title={editing ? t('admin.categories.editTitle') : t('admin.categories.newTitle')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input label={t('admin.categories.name')} error={errors.name?.message} {...register('name')} />
          <Select label={t('admin.categories.segment')} error={errors.segment?.message} {...register('segment')}>
            <option value="grand_public">{t('admin.categories.publicSegment')}</option>
            <option value="entreprise">{t('admin.categories.enterpriseSegment')}</option>
          </Select>
          <Input label={t('admin.categories.description')} {...register('description')} />
          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            {t('common.save')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
