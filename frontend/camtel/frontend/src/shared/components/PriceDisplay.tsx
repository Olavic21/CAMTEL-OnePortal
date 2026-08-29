import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import type { PriceInfo, ProductSource } from '@/shared/types';
import { formatPriceInfo } from '@/shared/utils/price';
import { formatDate } from '@/shared/utils/format';
import { DataQualityBadge } from './DataQualityBadge';

/**
 * Affichage de prix normalise (cahier des charges section 11).
 * - Un prix inconnu (ON_QUOTE / montant absent) s'affiche « Prix sur demande »
 *   ou « Nous contacter » (prop `ctaLabelLink`), jamais « 0 FCFA ».
 * - Un vrai montant à 0 FCFA reste affiché « 0 FCFA ».
 * - `withSource` affiche la traçabilité (Source + date de vérification) quand
 *   la donnée est fournie (regle chatbot/mission 27 : jamais de prix invente).
 */
export function PriceDisplay({
  pricing,
  variant = 'default',
  className,
  withSource,
  source,
}: {
  pricing?: PriceInfo | null;
  variant?: 'default' | 'large' | 'inline';
  className?: string;
  withSource?: boolean;
  source?: ProductSource | null;
}) {
  const { t } = useTranslation();
  const label = formatPriceInfo(pricing);

  const styles = {
    default: 'font-semibold text-primary dark:text-primary-300',
    large: 'text-2xl font-bold text-primary dark:text-primary-300',
    inline: 'font-medium text-neutral-900 dark:text-neutral-100',
  } as const;

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <p className={clsx(styles[variant], className)}>{label}</p>
      ) : (
        <p className={clsx('font-semibold text-neutral-500 dark:text-neutral-400', styles.default, className)}>
          {t('products.priceOnRequest')}
        </p>
      )}
      {withSource && source && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span>
            {t('products.source')} : <span className="font-medium">{source.name}</span>
          </span>
          <span>·</span>
          <span>
            {t('products.lastVerified')} : {formatDate(source.lastVerifiedAt)}
          </span>
          <DataQualityBadge quality={source.quality} />
        </p>
      )}
    </div>
  );
}