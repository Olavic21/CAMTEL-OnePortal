import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '@/shared/types';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { formatPrice } from '@/shared/utils/format';
import { useTranslation } from 'react-i18next';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { t } = useTranslation();
  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.04 }}
    >
      <Link to={`/produits/${product.slug}`}>
        <Card className="flex h-full flex-col overflow-hidden">
          <div className="aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800">
            {primaryImage ? (
              <img
                src={primaryImage.image}
                alt={primaryImage.alt_text ?? product.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-300">
                CAMTEL
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
              {product.is_featured && <Badge tone="new">{t('products.badgeNew')}</Badge>}
              {product.category && <span className="text-xs text-neutral-400 dark:text-neutral-500">{product.category.name}</span>}
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</h3>
            <p className="line-clamp-2 flex-1 text-sm text-neutral-500 dark:text-neutral-400">{product.short_description}</p>
            <p className="mt-1 font-semibold text-primary">{formatPrice(product.price, product.price_unit)}</p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
