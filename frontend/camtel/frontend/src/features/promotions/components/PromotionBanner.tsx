import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Promotion } from '@/shared/types';
import { formatDate } from '@/shared/utils/format';

export function PromotionBanner({ promotion, index = 0 }: { promotion: Promotion; index?: number }) {
  const { t } = useTranslation();
  const discountLabel =
    promotion.discount_type === 'percentage'
      ? `-${promotion.discount_value}%`
      : `-${promotion.discount_value} XAF`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="relative min-w-[280px] shrink-0 snap-start overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-700 p-6 text-white sm:min-w-[360px]"
    >
      <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-bold">
        {discountLabel}
      </span>
      <h3 className="mt-3 text-lg font-semibold">{promotion.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-white/80">{promotion.description}</p>
      {promotion.end_date && (
        <p className="mt-4 text-xs text-white/60">
          {t('promotions.validUntil')} {formatDate(promotion.end_date)}
        </p>
      )}
    </motion.div>
  );
}
