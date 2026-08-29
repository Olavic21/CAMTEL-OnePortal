import { Link, useParams } from 'react-router-dom';
import { Compass, Layers, ArrowRight, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useService, useServiceProducts } from '../hooks/useServices';
import { getServiceBySlug, SERVICES } from '@/shared/config/services';
import { ProductCard } from '@/features/products/components/ProductCard';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/Button';

/**
 * Template commun des 4 pages services (/services/:slug).
 * Structure : Hero, presentation, sous-services, offres, services
 * complementaires, FAQ, CTA « Trouver ma solution ».
 * Les donnees proviennent de l'API (/services/{slug}/) avec fallback mock.
 */
export default function ServicePage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const meta = getServiceBySlug(slug ?? '');
  const { data: service, isLoading } = useService(slug);
  const { data: products = [], isLoading: loadingProducts } = useServiceProducts(
    service?.service ?? meta?.service ?? null,
  );

  if (!meta) {
    return (
      <div className="container-app py-16">
        <EmptyState icon={Layers} title={t('services.notFound')} />
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-primary hover:underline dark:text-primary-300">
            {t('footer.allCatalog')}
          </Link>
        </div>
      </div>
    );
  }

  const Icon = meta.icon;

  return (
    <div>
      {/* Hero service */}
      <section className="border-b border-neutral-200 bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white dark:border-neutral-800">
        <div className="container-app py-14 lg:py-20">
          <Breadcrumbs
            items={[
              { label: t('nav.home'), to: '/' },
              { label: t('nav.services'), to: '/services/fixes' },
              { label: meta.label },
            ]}
          />
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/70">{meta.label}</p>
          </div>
          <h1 className="mt-4 max-w-2xl text-3xl font-bold sm:text-4xl">
            {service?.heroTitle ?? service?.name ?? meta.label}
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            {service?.heroSubtitle ?? service?.description ?? meta.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/trouver-une-solution">
              <Button size="lg" variant="secondary">
                <Compass className="h-4 w-4" /> {t('nav.findSolution')}
              </Button>
            </Link>
            <Link to={`/produits?service=${meta.service}`}>
              <Button size="lg" variant="tertiary" className="border-white/40 text-white hover:bg-white/10">
                {t('services.viewOffers')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Presentation */}
      <section className="container-app py-12">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('services.about')}</h2>
        <p className="mt-2 max-w-3xl text-neutral-600 dark:text-neutral-400">
          {service?.description ?? meta.description}
        </p>
      </section>

      {/* Sous-services */}
      {(service?.subServices?.length ?? 0) > 0 && (
        <section className="bg-neutral-100 py-12 dark:bg-neutral-900">
          <div className="container-app">
            <h2 className="mb-6 text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {t('services.subServices')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {service!.subServices.map((sub) => (
                <div
                  key={sub.slug}
                  className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{sub.name}</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{sub.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offres du service */}
      <section className="container-app py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('services.offers')}</h2>
          <Link
            to={`/produits?service=${meta.service}`}
            className="text-sm font-medium text-primary hover:underline dark:text-primary-300"
          >
            {t('home.seeAll')}
          </Link>
        </div>
        {loadingProducts ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon={Layers} title={t('services.noOffers')} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((p, i) => (
              <ProductCard key={String(p.id)} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Services complementaires */}
      {(service?.complementaryServices?.length ?? 0) > 0 && (
        <section className="bg-neutral-100 py-12 dark:bg-neutral-900">
          <div className="container-app">
            <h2 className="mb-6 text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {t('services.complementary')}
            </h2>
            <div className="flex flex-wrap gap-3">
              {service?.complementaryServices?.map((code) => {
                const comp = SERVICES.find((s) => s.service === code);
                if (!comp) return null;
                return (
                  <Link
                    key={code}
                    to={comp.route}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:border-primary-300 hover:text-primary dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                  >
                    <comp.icon className="h-4 w-4" /> {comp.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="container-app py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {t('services.faq')}
          </h2>
          {(service?.faqs?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {service!.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 font-medium text-neutral-900 dark:text-neutral-100">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" /> {faq.question}
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{faq.answer}</p>
                </details>
              ))}
            </div>
          ) : (
            isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}