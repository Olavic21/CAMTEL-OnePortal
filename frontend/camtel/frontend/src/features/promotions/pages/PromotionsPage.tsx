import { useTranslation } from 'react-i18next';
import { useActivePromotions } from '../hooks/usePromotions';
import { PromotionBanner } from '../components/PromotionBanner';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { Tag } from 'lucide-react';

export default function PromotionsPage() {
  const { t } = useTranslation();
  const { data: promotions, isLoading } = useActivePromotions();

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {t('promotions.title')}
      </h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">{t('promotions.subtitle')}</p>

      <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 min-w-[320px]" />)
          : promotions?.map((promo, i) => <PromotionBanner key={promo.id} promotion={promo} index={i} />)}
      </div>

      {!isLoading && !promotions?.length && <EmptyState icon={Tag} title={t('promotions.empty')} />}
    </div>
  );
}
