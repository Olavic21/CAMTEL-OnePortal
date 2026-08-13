import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { CheckCircle2 } from 'lucide-react';
import { useProduct } from '@/features/products/hooks/useProducts';
import { subscriptionsApi } from '../api/subscriptionsApi';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';

function buildSchema(t: TFunction) {
  return z.object({
    full_name: z.string().min(2, t('validation.nameRequired')),
    email: z.string().email(t('validation.invalidEmail')),
    phone: z.string().min(6, t('subscription.phoneRequired')),
    company_name: z.string().optional(),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

// Parcours de souscription en ligne (roadmap V3) - fondation de l'espace client (section 21).
export default function SubscriptionPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { data: product } = useProduct(slug);
  const schema = useMemo(() => buildSchema(t), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const submitRequest = useMutation({
    mutationFn: (values: FormValues) =>
      subscriptionsApi.create({ ...values, product_id: product?.id ?? 0 }),
  });

  async function onSubmit(values: FormValues) {
    await submitRequest.mutateAsync(values);
  }

  return (
    <div className="container-app max-w-xl py-10">
      <Breadcrumbs
        items={[
          { label: t('subscription.products'), to: '/produits' },
          ...(product ? [{ label: product.name, to: `/produits/${product.slug}` }] : []),
          { label: t('subscription.subscribeTo') },
        ]}
      />
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {t('subscription.subscribeTo')} {product ? t('subscription.subscribeToProduct', { name: product.name }) : ''}
      </h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">{t('subscription.intro')}</p>

      {submitRequest.isSuccess ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-accent-200 bg-accent-50 px-6 py-16 text-center dark:bg-accent-900/20">
          <CheckCircle2 className="h-10 w-10 text-accent-600 dark:text-accent-400" />
          <p className="font-medium text-accent-800">{t('subscription.successTitle')}</p>
          <p className="text-sm text-accent-700 dark:text-accent-400">{t('subscription.successBody')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4" noValidate>
          <Input label={t('subscription.fullName')} error={errors.full_name?.message} {...register('full_name')} />
          <Input label={t('subscription.email')} type="email" error={errors.email?.message} {...register('email')} />
          <Input label={t('subscription.phone')} error={errors.phone?.message} {...register('phone')} />
          <Input label={t('subscription.companyName')} {...register('company_name')} />
          <Button type="submit" isLoading={isSubmitting} size="lg" className="mt-2 w-fit">
            {t('subscription.submit')}
          </Button>
        </form>
      )}
    </div>
  );
}
