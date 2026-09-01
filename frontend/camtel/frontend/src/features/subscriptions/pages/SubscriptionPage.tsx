/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { CheckCircle2 } from 'lucide-react';
import { useProduct } from '@/features/products/hooks/useProducts';
import { subscriptionsApi } from '../api/subscriptionsApi';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { PriceDisplay } from '@/shared/components/PriceDisplay';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { trackEvent } from '@/shared/lib/analytics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PaymentCta } from '@/features/payments/components/PaymentCta';
import { ServiceBadge } from '@/shared/components/ServiceBadge';
import { Link } from 'react-router-dom';

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
  const { user } = useAuth();
  const schema = useMemo(() => buildSchema(t), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const trackedStart = useRef(false);

  // Section 20 mission : "subscription_started" des que le formulaire est
  // affiche pour une offre (une seule fois), "subscription_submitted" au
  // succes de l'envoi (voir onSubmit).
  useEffect(() => {
    if (product && !trackedStart.current) {
      trackedStart.current = true;
      trackEvent('subscription_started', { slug: product.slug }, product.id);
    }
  }, [product]);

  const submitRequest = useMutation({
    mutationFn: (values: FormValues) =>
      subscriptionsApi.create({ ...values, product_id: product?.id ?? 0 }),
  });

  async function onSubmit(values: FormValues) {
    await submitRequest.mutateAsync(values);
    trackEvent('subscription_submitted', { slug: product?.slug }, product?.id);
  }

  // Déduit le mode de souscription réel (source de vérité backend)
  const subMethod = (product as unknown as { subscription_method?: string })?.subscription_method ?? '';
  const ctaType = (product as unknown as { cta_type?: string })?.cta_type ?? 'subscribe';
  const isOnline = !subMethod || subMethod === 'ONLINE';
  const isAgency = subMethod === 'AGENCY' || ctaType === 'agency';
  const isQuote = subMethod === 'CONTACT' || subMethod === 'QUOTE' || ctaType === 'quote';

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

      {/* Récapitulatif produit — Phase 5 */}
      {product && (
        <Card className="mt-6 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">{product.short_description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.service && <ServiceBadge service={product.service as any} />}
                {product.segment && <Badge tone="neutral">{product.segment}</Badge>}
                {isAgency && <Badge tone="warning">Agence</Badge>}
                {isQuote && <Badge tone="warning">Sur devis</Badge>}
                {isOnline && <Badge tone="success">Paiement en ligne</Badge>}
              </div>
            </div>
            <PriceDisplay pricing={product.pricing as any ?? { type: 'FIXED', amount: product.price ?? undefined, currency: 'XAF' }} />
          </div>
          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            Mode : <span className="font-medium">{subMethod || 'ONLINE'}</span> · CTA : <span className="font-medium">{ctaType}</span>
          </div>
        </Card>
      )}

      {submitRequest.isSuccess ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-accent-200 bg-accent-50 px-6 py-16 text-center dark:bg-accent-900/20">
          <CheckCircle2 className="h-10 w-10 text-accent-600 dark:text-accent-400" />
          <p className="font-medium text-accent-800">{t('subscription.successTitle')}</p>
          <p className="text-sm text-accent-700 dark:text-accent-400">{t('subscription.successBody')}</p>
          {/* Phase 17: n'affiche Paiement que si ONLINE et prix réel */}
          {user && product?.price != null && (product as unknown as { cta_type?: string; subscription_method?: string }).cta_type !== 'quote' && (product as unknown as { subscription_method?: string }).subscription_method !== 'AGENCY' && (
            <PaymentCta productId={product.id} />
          )}
          {user && product && ((product as unknown as { cta_type?: string }).cta_type === 'quote' || (product as unknown as { subscription_method?: string }).subscription_method === 'CONTACT') && (
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">Cette offre est sur devis — un conseiller vous recontactera.</p>
          )}
          {user && product && (product as unknown as { cta_type?: string }).cta_type === 'agency' && (
            <p className="mt-4 text-sm"><a href="/a-propos#agences" className="font-medium text-primary hover:underline">Trouver une agence →</a></p>
          )}
        </div>
      ) : (
        <>
          {isAgency && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Cette offre nécessite un passage en agence. Vous pouvez soumettre cette demande (récapitulatif) puis vous rendre en agence, ou <Link to="/a-propos#agences" className="font-medium underline">trouver une agence</Link>.
            </div>
          )}
          {isQuote && (
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
              Cette offre est sur devis. Soumettez vos coordonnées, un conseiller vous recontactera avec une proposition.
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
            <Input label={t('subscription.fullName')} error={errors.full_name?.message} {...register('full_name')} />
            <Input label={t('subscription.email')} type="email" error={errors.email?.message} {...register('email')} />
            <Input label={t('subscription.phone')} error={errors.phone?.message} {...register('phone')} />
            <Input label={t('subscription.companyName')} {...register('company_name')} />
            {submitRequest.isError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {(submitRequest.error as any)?.response?.data?.detail ?? "Erreur lors de l’envoi. Vérifiez les champs."}
              </p>
            )}
            <Button type="submit" isLoading={isSubmitting} size="lg" className="mt-2 w-fit">
              {isOnline ? t('subscription.submit') : isAgency ? 'Envoyer la demande (agence)' : 'Demander un devis'}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
