import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react';
import type { ProductSpecificationSchema, ProductSpecifications as Specs } from '@/shared/types';
import { specValue } from '@/shared/config/specSchemas';
import { EmptyState } from './EmptyState';

/**
 * Tableau de specifications PRODUIT — PILOTE PAR SCHEMA (cahier des charges 10).
 * Les lignes sont generes depuis `schema` (une liste de {key,label,type,unit}) et
 * les valeurs lues dans `specifications`. Le meme composant affiche aussi bien
 * les specs d'un VPS (RAM/CPU/Stockage/...), d'une offre Blue (Data/SMS/...),
 * que de toute autre famille : AUCUNE colonne n'est codee en dur.
 */
export function ProductSpecifications({
  specifications,
  schema,
  compact = false,
  className,
}: {
  specifications?: Specs | null;
  schema: ProductSpecificationSchema;
  compact?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  if (!specifications || Object.keys(specifications).length === 0 || schema.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          icon={SlidersHorizontal}
          title={t('products.specsEmpty')}
          description={t('products.specsEmptyHint')}
        />
      </div>
    );
  }

  return (
    <dl className={className}>
      {schema.map((item) => {
        const value = specValue(specifications, item);
        return (
          <div
            key={item.key}
            className={`flex items-center justify-between gap-4 border-b border-neutral-100 last:border-0 dark:border-neutral-800 ${
              compact ? 'py-2 text-sm' : 'py-3 text-sm'
            }`}
          >
            <dt className="text-neutral-500 dark:text-neutral-400">
              {item.label}
              {item.unit ? <span className="ml-1 text-xs text-neutral-400">({item.unit})</span> : null}
            </dt>
            <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">
              {value || '—'}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}