import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PhoneCall, UserPlus, Compass, Info } from 'lucide-react';
import { useProductDetail } from '../hooks/useProductDetail';
import { useCatalog } from '../hooks/useCatalog';
import { ProductCard } from '../components/ProductCard';
import { ProductFaqList } from '../components/ProductFaqList';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Skeleton } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { PriceDisplay } from '@/shared/components/PriceDisplay';
import { ServiceBadge } from '@/shared/components/ServiceBadge';
import { SegmentBadge } from '@/shared/components/SegmentBadge';
import { DataQualityBadge } from '@/shared/components/DataQualityBadge';
import { ProductSpecifications } from '@/shared/components/ProductSpecifications';
import { ProductImage } from '@/shared/components/ProductImage';
import { schemaForOffer } from '@/shared/config/specSchemas';
import { getServiceMeta } from '@/shared/config/services';
import { formatDate } from '@/shared/utils/format';
import type { Product, ProductV2 } from '@/shared/types';

type AnyProduct = Product | ProductV2;
const isV2 = (p: AnyProduct): p is ProductV2 => 'shortDescription' in p;

/** Vue normalisee d'un produit (independante du modele V1/V2). */
interface NormalizedProduct {
  id: string | number;
  name: string;
  slug: string;
  service?: Product['service'];
  segment?: Product['segment'];
  availability: 'AVAILABLE' | 'UNAVAILABLE' | 'ON_REQUEST';
  pricing: NonNullable<Product['pricing']>;
  specifications: Record<string, string | number | boolean>;
  benefits: string[];
  options: string[];
  terms: string[];
  eligibility: string[];
  source?: Product['source'];
  shortDescription: string;
  description: string;
  offerType?: string;
  faqs: NonNullable<Product['faqs']>;
  images?: Product['images'];
}

/** Normalise un produit des deux modeles vers un objet unique pour la page. */
function normalizeProduct(product: AnyProduct): NormalizedProduct {
  if (isV2(product)) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      service: product.service,
      segment: product.segment,
      availability: product.availability,
      pricing: product.pricing,
      specifications: product.specifications,
      benefits: product.benefits ?? [],
      options: product.options ?? [],
      terms: product.terms ?? [],
      eligibility: product.eligibility ?? [],
      source: product.source,
      shortDescription: product.shortDescription,
      description: product.description,
      offerType: product.service,
      faqs: [] as never[],
      images: undefined as Product['images'] | undefined,
    };
  }
  const p = product as Product;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    service: p.service,
    segment: p.segment,
    availability: p.price_on_request ? ('ON_REQUEST' as const) : ('AVAILABLE' as const),
    pricing: p.pricing ?? {
      type: p.pricing_type === 'QUOTE' ? ('ON_QUOTE' as const) : ('FIXED' as const),
      amount: p.price ?? undefined,
      currency: 'XAF' as const,
    },
    specifications: (p.specs as Record<string, string | number | boolean>) ?? {},
    benefits: [] as string[],
    options: [] as string[],
    terms: [] as string[],
    eligibility: [] as string[],
    source: p.source ?? (p.source_name
      ? {
          name: p.source_name,
          url: p.source_url ?? undefined,
          lastVerifiedAt: p.last_verified_at ?? '',
          quality: p.is_stale ? ('REQUIRES_VERIFICATION' as const) : ('MANUAL' as const),
        }
      : undefined),
    shortDescription: p.short_description,
    description: p.description,
    offerType: p.offer_type ?? p.service_type ?? '',
    faqs: p.faqs ?? [],
    images: p.images,
  };
}

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { product: rawProduct, isLoading, isError } = useProductDetail(slug);

  const product = rawProduct ? normalizeProduct(rawProduct) : null;
  const schema = product ? schemaForOffer(product.offerType, product.name) : [];
  const serviceMeta = product ? getServiceMeta(product.service) : undefined;
  const { data: catalogData } = useCatalog({});

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
            <Skeleton className="h-10 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (isError && !product) {
    return (
      <div className="container-app py-16">
        <ErrorState title={t('products.notFound')} description={t('products.notFoundHint')} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-app py-16">
        <EmptyState icon={Info} title={t('products.notFound')} />
      </div>
    );
  }

  const similar = (catalogData?.results ?? []).filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <div className="container-app py-10">
      <Breadcrumbs
        items={[
          { label: t('nav.home'), to: '/' },
          ...(serviceMeta ? [{ label: serviceMeta.label, to: serviceMeta.route }] : []),
          { label: t('nav.products'), to: '/produits' },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Media : image principale ou placeholder CAMTEL (jamais d'image cassee) */}
        <div className="order-2 lg:order-1">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
            <ProductImage
              src={product.images?.[0]?.image}
              alt={product.images?.[0]?.alt_text ?? product.name}
              service={product.service}
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((img, i) => (
                <div
                  key={img.id}
                  className="aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <ProductImage
                    src={img.image}
                    alt={img.alt_text ?? `${product.name} — ${i + 1}`}
                    service={product.service}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ServiceBadge service={product.service} />
            <SegmentBadge segment={product.segment} />
            <Badge
              tone={
                product.availability === 'AVAILABLE'
                  ? 'success'
                  : product.availability === 'ON_REQUEST'
                    ? 'warning'
                    : 'destructive'
              }
            >
              {product.availability === 'AVAILABLE'
                ? t('products.availabilityAvailable')
                : product.availability === 'ON_REQUEST'
                  ? t('products.availabilityOnRequest')
                  : t('products.availabilityUnavailable')}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">{product.name}</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">{product.shortDescription}</p>
          <div className="mt-4">
            <PriceDisplay pricing={product.pricing} variant="large" withSource source={product.source} />
          </div>

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
            <Link to="/trouver-une-solution">
              <Button size="lg" variant="tertiary">
                <Compass className="h-4 w-4" /> {t('nav.findSolution')}
              </Button>
            </Link>
          </div>

          {product.source && (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span>
                {t('products.source')} : <span className="font-medium">{product.source.name}</span>
              </span>
              <span>·</span>
              <span>
                {t('products.lastVerified')} : {formatDate(product.source.lastVerifiedAt)}
              </span>
              <DataQualityBadge quality={product.source.quality} />
            </p>
          )}
        </div>
      </div>

      {/* Description longue */}
      <section className="mt-12 max-w-3xl border-t border-neutral-200 pt-8 dark:border-neutral-800">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('products.description')}</h2>
        <p className="whitespace-pre-line text-neutral-600 dark:text-neutral-400">{product.description}</p>
      </section>

      {/* Specifications dynamiques (pilotees par schema) */}
      <section className="mt-10 max-w-3xl">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('products.specifications')}</h2>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <ProductSpecifications specifications={product.specifications} schema={schema} />
        </div>
      </section>

      {/* Avantages */}
      {product.benefits.length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('products.benefits')}</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {product.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-500" />
                {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Options */}
      {product.options.length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('products.options')}</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            {product.options.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Conditions */}
      {product.terms.length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('products.terms')}</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            {product.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Eligibilite */}
      {product.eligibility.length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('products.eligibility')}</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            {product.eligibility.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      {product.faqs.length > 0 && (
        <section className="mt-12 max-w-2xl">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('products.faq')}</h2>
          <ProductFaqList faqs={product.faqs} />
        </section>
      )}

      {/* Produits similaires */}
      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('products.similarProducts')}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p, i) => (
              <ProductCard key={String(p.id)} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 text-center">
        <Link to="/produits" className="text-sm font-medium text-primary hover:underline dark:text-primary-300">
          &larr; {t('common.backToCatalog')}
        </Link>
      </div>
    </div>
  );
}