import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product, ProductV2 } from '@/shared/types';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { PriceDisplay } from '@/shared/components/PriceDisplay';
import { ServiceBadge } from '@/shared/components/ServiceBadge';
import { SegmentBadge } from '@/shared/components/SegmentBadge';
import { useTranslation } from 'react-i18next';

// Accepte aussi bien le modele historique (Product) que le nouveau contrat (ProductV2).
type AnyProduct = Product | ProductV2;

function isV2(product: AnyProduct): product is ProductV2 {
  return 'shortDescription' in product;
}

export function ProductCard({ product, index = 0 }: { product: AnyProduct; index?: number }) {
  const { t } = useTranslation();

  const name = product.name;
  const slug = product.slug;
  const service = product.service;
  const segment = product.segment;
  const source = product.source;
  const isFeatured = !isV2(product) && (product as Product).is_featured;

  const description = isV2(product)
    ? product.shortDescription
    : (product as Product).short_description;

  // Prix : priorite au nouveau contrat `pricing` ; sinon construction legacy.
  const pricing = product.pricing ?? {
    type: 'FIXED' as const,
    amount: (product as Product).price ?? undefined,
    currency: 'XAF' as const,
  };

  const primaryImage = !isV2(product)
    ? (product as Product).images?.find((img) => img.is_primary) ?? (product as Product).images?.[0]
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.04 }}
    >
      <Link to={`/produits/${slug}`}>
        <Card className="flex h-full flex-col overflow-hidden">
          <div className="aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800">
            {primaryImage ? (
              <img
                src={primaryImage.image}
                alt={primaryImage.alt_text ?? name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-300">CAMTEL</div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {isFeatured && <Badge tone="new">{t('products.badgeNew')}</Badge>}
              <ServiceBadge service={service} />
              <SegmentBadge segment={segment} />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{name}</h3>
            <p className="line-clamp-2 flex-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
            <div className="mt-1">
              <PriceDisplay pricing={pricing} source={source} />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
