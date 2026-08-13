import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useExportProductPdf } from '../hooks/useExportProductPdf';
import { ProductGallery } from '../components/ProductGallery';
import { ProductFaqList } from '../components/ProductFaqList';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Skeleton } from '@/shared/components/Skeleton';
import { formatPrice } from '@/shared/utils/format';
import { FileDown, PhoneCall, UserPlus } from 'lucide-react';

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug);
  const { exportPdf, isExporting, error: pdfError } = useExportProductPdf();

  if (isLoading) {
    return (
      <div className="container-app py-10">
        <Skeleton className="h-6 w-64" />
        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-app py-20 text-center text-neutral-500 dark:text-neutral-400">
        {t('products.notFound')}
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <Breadcrumbs
        items={[
          { label: t('nav.products'), to: '/produits' },
          ...(product.category ? [{ label: product.category.name }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images ?? []} productName={product.name} />

        <div>
          <div className="mb-2 flex items-center gap-2">
            {product.is_featured && <Badge tone="new">Nouveau</Badge>}
            {product.category && <Badge tone="neutral">{product.category.name}</Badge>}
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">{product.name}</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">{product.short_description}</p>
          <p className="mt-4 text-2xl font-bold text-primary dark:text-primary-300">
            {formatPrice(product.price, product.price_unit)}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/produits/${product.slug}/souscrire`}>
              <Button size="lg">
                <UserPlus className="h-4 w-4" /> {t('products.subscribeCta')}
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="tertiary">
                <PhoneCall className="h-4 w-4" /> {t('products.contactCta')}
              </Button>
            </Link>
            <Button
              variant="tertiary"
              size="lg"
              isLoading={isExporting}
              onClick={() => exportPdf(product.id, product.slug)}
            >
              <FileDown className="h-4 w-4" /> {t('products.downloadPdf')}
            </Button>
          </div>
          {pdfError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{pdfError}</p>}

          <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <h2 className="mb-2 text-lg font-semibold dark:text-neutral-100">{t('products.description')}</h2>
            <p className="whitespace-pre-line text-neutral-600 dark:text-neutral-400">{product.description}</p>
          </div>
        </div>
      </div>

      {!!product.faqs?.length && (
        <div className="mt-12 max-w-2xl">
          <h2 className="mb-4 text-lg font-semibold dark:text-neutral-100">{t('products.faq')}</h2>
          <ProductFaqList faqs={product.faqs} />
        </div>
      )}

      {product.category && <SimilarProducts categorySlug={product.category.slug} currentId={product.id} />}

      <div className="mt-12 text-center">
        <Link to="/produits" className="text-sm font-medium text-primary hover:underline dark:text-primary-300">
          &larr; {t('common.backToCatalog')}
        </Link>
      </div>
    </div>
  );
}

function SimilarProducts({ categorySlug, currentId }: { categorySlug: string; currentId: number }) {
  const { t } = useTranslation();
  const { data, isLoading } = useProducts({ category: categorySlug });
  const similar = (data?.results ?? []).filter((p) => p.id !== currentId).slice(0, 4);
  if (!isLoading && !similar.length) return null;
  return (
    <div className="mt-14">
      <h2 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('products.similarProducts')}</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {similar.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
