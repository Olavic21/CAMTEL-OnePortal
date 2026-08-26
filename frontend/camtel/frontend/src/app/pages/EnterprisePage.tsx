import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/features/products/hooks/useProducts';
import { ProductCard } from '@/features/products/components/ProductCard';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';

// Distinction visuelle Grand Public / Entreprise des le MVP (benchmark Verizon, section 2).
export default function EnterprisePage() {
  const { t } = useTranslation();
  const { data, isLoading } = useProducts({ segment: 'entreprise' });

  return (
    <div>
      <section className="border-b border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800 dark:bg-black">
        <div className="container-app py-16">
          <p className="mb-2 text-sm font-semibold text-accent-400">{t('enterprise.badge')}</p>
          <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">{t('enterprise.title')}</h1>
          <p className="mt-4 max-w-xl text-neutral-300">{t('enterprise.subtitle')}</p>
        </div>
      </section>

      <section className="container-app py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
        ) : !data?.results.length ? (
          <EmptyState icon={Building2} title={t('enterprise.empty')} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.results.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>

      <section className="container-app pb-16 text-center">
        <Link to="/contact" className="text-sm font-medium text-primary hover:underline dark:text-primary-300">
          {t('enterprise.talkToAdvisor')} &rarr;
        </Link>
      </section>
    </div>
  );
}
