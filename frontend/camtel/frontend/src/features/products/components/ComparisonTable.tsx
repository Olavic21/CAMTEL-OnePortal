import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { PriceDisplay } from '@/shared/components/PriceDisplay';
import { ServiceBadge } from '@/shared/components/ServiceBadge';
import { SegmentBadge } from '@/shared/components/SegmentBadge';
import { schemaForOffer, specValue } from '@/shared/config/specSchemas';
import type { ProductV2 } from '@/shared/types';

/**
 * ComparisonTable GENERIQUE (cahier des charges section 13).
 * Les colonnes ne sont JAMAIS codees en dur (pas de VPSColumn1/2/3) :
 * elles sont generees a partir du schema de specifications correspondant
 * aux produits compares (schemaForOffer). Deux VPS affichent RAM/CPU/
 * Stockage/Bande passante..., deux offres Blue affichent Data/SMS/Prix —
 * avec le MEME composant.
 *
 * Le comparateur est limite aux produits d'un MEME service : le premier
 * produit ajoute definit l'univers (ex: DATA_CENTER), les suivants doivent
 * appartenir au meme service (la page gere cette contrainte).
 */
export interface ComparisonTableProps {
  products: ProductV2[];
  onRemove?: (id: ProductV2['id']) => void;
}

export function ComparisonTable({ products, onRemove }: ComparisonTableProps) {
  const { t } = useTranslation();

  if (products.length === 0) return null;

  // Schema = celui du premier produit ; les cles absentes d'un autre produit
  // affichent simplement '-' (aucune valeur inventee).
  const schema = schemaForOffer(undefined, products[0].name);

  return (
    <div className="overflow-x-auto" role="region" aria-label={t('products.compare.tableLabel')} tabIndex={0}>
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{t('products.compare.caption')}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-44" />
            {products.map((p) => (
              <th
                key={String(p.id)}
                scope="col"
                className="border-b border-neutral-200 px-4 py-3 text-left align-top dark:border-neutral-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{p.name}</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <ServiceBadge service={p.service} />
                      <SegmentBadge segment={p.segment} />
                    </div>
                  </div>
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(p.id)}
                      aria-label={t('products.compare.remove', { name: p.name })}
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Prix : via PriceDisplay (regle 9 — jamais « 0 FCFA » si inconnu). */}
          <tr>
            <th scope="row" className="border-b border-neutral-100 px-4 py-3 text-left font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              {t('products.compare.price')}
            </th>
            {products.map((p) => (
              <td key={String(p.id)} className="border-b border-neutral-100 px-4 py-3 font-semibold text-primary dark:border-neutral-800">
                <PriceDisplay pricing={p.pricing} />
              </td>
            ))}
          </tr>

          {/* Disponibilite */}
          <tr>
            <th scope="row" className="border-b border-neutral-100 px-4 py-3 text-left font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              {t('catalog.filters.availability')}
            </th>
            {products.map((p) => (
              <td key={String(p.id)} className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                {t(`availability.${p.availability ?? 'AVAILABLE'}`)}
              </td>
            ))}
          </tr>

          {/* Specifications generees depuis le schema — coeur de la refonte. */}
          {schema.map((item) => (
            <tr key={item.key}>
              <th scope="row" className="border-b border-neutral-100 px-4 py-3 text-left font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                {item.label}
                {item.unit ? <span className="ml-1 text-xs font-normal">({item.unit})</span> : null}
              </th>
              {products.map((p) => {
                const value = specValue(p.specifications, item);
                return (
                  <td key={String(p.id)} className="border-b border-neutral-100 px-4 py-3 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                    {value === '' ? '—' : value}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Description courte */}
          <tr>
            <th scope="row" className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">
              {t('products.description')}
            </th>
            {products.map((p) => (
              <td key={String(p.id)} className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                {p.shortDescription || p.description}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}