import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useTranslation, type TFunction } from 'react-i18next';
import { useProduct, useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { Input, Textarea, Select } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { AdminProductImageManager } from '../components/AdminProductImageManager';
import { AdminProductFaqManager } from '../components/AdminProductFaqManager';

// Formulaire React Hook Form + Zod, aligne sur les champs du serialiseur DRF Produit (section 7.1).
// Le schema est construit via une fonction (et non une constante figee) afin
// que les messages de validation reagissent au changement de langue (i18n).
function buildSchema(t: TFunction) {
  return z.object({
    name: z.string().min(3, t('validation.minLength', { count: 3 })),
    category_id: z.coerce.number({ invalid_type_error: t('validation.categoryRequired') }).min(1, t('validation.categoryRequired')),
    short_description: z.string().min(10, t('validation.minLength', { count: 10 })).max(300),
    description: z.string().min(20, t('validation.minLength', { count: 20 })),
    price: z
      .union([z.coerce.number().nonnegative(), z.literal('')])
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
    price_unit: z.string().optional(),
    is_featured: z.boolean().optional(),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function AdminProductFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { push } = useToast();
  const { data: categoriesData } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const schema = useMemo(() => buildSchema(t), [t]);

  // En edition, on recupere le produit via son slug potentiel = id ici pour la demo ;
  // en pratique un endpoint /products/by-id/{id}/ ou la recherche par id serait utilise.
  const { data: existing } = useProduct(isEdit ? id : undefined);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        category_id: existing.category_id,
        short_description: existing.short_description,
        description: existing.description,
        price: existing.price ?? undefined,
        price_unit: existing.price_unit ?? '',
        is_featured: existing.is_featured,
      });
    }
  }, [existing, reset]);

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && existing) {
        await updateProduct.mutateAsync({ id: existing.id, payload: values });
        push(t('admin.products.form.updated_toast'));
      } else {
        await createProduct.mutateAsync(values);
        push(t('admin.products.form.created_toast'));
      }
      navigate('/admin/produits');
    } catch {
      push(t('admin.products.form.error_toast'), 'error');
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">
        {isEdit ? t('admin.products.form.editTitle') : t('admin.products.form.newTitle')}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label={t('admin.products.form.name')} error={errors.name?.message} {...register('name')} />

        <Select label={t('admin.products.form.category')} error={errors.category_id?.message} {...register('category_id')}>
          <option value="">{t('admin.products.form.selectCategory')}</option>
          {categoriesData?.results.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Textarea
          label={t('admin.products.form.shortDescription')}
          rows={2}
          error={errors.short_description?.message}
          {...register('short_description')}
        />
        <Textarea
          label={t('admin.products.form.fullDescription')}
          rows={6}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('admin.products.form.price')}
            type="number"
            step="0.01"
            error={errors.price?.message as string | undefined}
            {...register('price')}
          />
          <Input label={t('admin.products.form.priceUnit')} {...register('price_unit')} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('is_featured')} className="h-4 w-4 rounded border-neutral-300" />
          {t('admin.products.form.featured')}
        </label>

        <div className="mt-2 flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? t('admin.products.form.save') : t('admin.products.form.createDraft')}
          </Button>
          <Button type="button" variant="tertiary" onClick={() => navigate('/admin/produits')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>

      {isEdit && existing ? (
        <div className="mt-10 space-y-8 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <AdminProductImageManager
            productId={existing.id}
            productSlug={existing.slug}
            images={existing.images ?? []}
          />
          <AdminProductFaqManager
            productId={existing.id}
            productSlug={existing.slug}
            faqs={existing.faqs ?? []}
          />
        </div>
      ) : (
        <p className="mt-8 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 dark:bg-neutral-800">
          {t('admin.products.form.savedNeeded')}
        </p>
      )}
    </div>
  );
}
