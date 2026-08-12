import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useTranslation, type TFunction } from 'react-i18next';
import { useNewsDetail, useCreateNews, useUpdateNews } from '../hooks/useNews';
import { Input, Textarea, Select } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';

function buildSchema(t: TFunction) {
  return z.object({
    title: z.string().min(3, t('validation.minLength', { count: 3 })),
    content: z.string().min(20, t('validation.minLength', { count: 20 })),
    status: z.enum(['draft', 'published']),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function AdminNewsFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { push } = useToast();
  const { data: existing } = useNewsDetail(isEdit ? id : undefined);
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { status: 'draft' } });

  useEffect(() => {
    if (existing) {
      reset({ title: existing.title, content: existing.content, status: existing.status });
    }
  }, [existing, reset]);

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && existing) {
        await updateNews.mutateAsync({ id: existing.id, payload: values });
        push(t('admin.news.updated_toast'));
      } else {
        await createNews.mutateAsync(values);
        push(t('admin.news.created_toast'));
      }
      navigate('/admin/actualites');
    } catch {
      push(t('admin.news.error_toast'), 'error');
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">{isEdit ? t('admin.news.editTitle') : t('admin.news.newTitle')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label={t('admin.news.articleTitle')} error={errors.title?.message} {...register('title')} />
        <Textarea label={t('admin.news.content')} rows={10} error={errors.content?.message} {...register('content')} />
        <Select label={t('admin.news.status')} error={errors.status?.message} {...register('status')}>
          <option value="draft">{t('admin.products.draft')}</option>
          <option value="published">{t('admin.products.published')}</option>
        </Select>
        <div className="mt-2 flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            {t('common.save')}
          </Button>
          <Button type="button" variant="tertiary" onClick={() => navigate('/admin/actualites')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
