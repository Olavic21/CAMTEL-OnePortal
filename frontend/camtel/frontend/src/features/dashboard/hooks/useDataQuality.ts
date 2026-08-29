import { useMemo } from 'react';
import { useCatalog } from '@/features/products/hooks/useCatalog';
import type { ProductV2 } from '@/shared/types';

/**
 * Compteurs « Qualite des donnees » (cahier des charges section 19).
 * Logique extraite de AdminDataQualityPage pour etre reutilisee par le widget
 * du dashboard (evite la duplication, regle 2). Calculs de PRESENTATION sur
 * les champs du contrat ProductV2 — aucune logique metier backend.
 *
 * Limite signalee : le contrat ProductV2 ne porte pas encore de champ `image`,
 * le compteur « offres sans image » reste N/A tant que l'API ne l'expose pas.
 */

const VERIFICATION_TTL_DAYS = 90;

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86_400_000);
}

export interface DataQualityMetrics {
  total: number;
  verified: number;
  expired: number;
  requiresVerification: number;
  withoutSource: number;
  withoutPrice: number;
  withoutImage: number | null;
}

export function useDataQualityMetrics() {
  const { data, isLoading, isError, refetch } = useCatalog({});

  const metrics = useMemo<DataQualityMetrics>(() => {
    const products = (data?.results ?? []) as ProductV2[];
    let verified = 0;
    let expired = 0;
    let requiresVerification = 0;
    let withoutSource = 0;
    let withoutPrice = 0;
    for (const p of products) {
      const age = daysSince(p.source?.lastVerifiedAt);
      if (p.source?.quality === 'REQUIRES_VERIFICATION') requiresVerification += 1;
      if (!p.source?.name) withoutSource += 1;
      else if (age != null && age > VERIFICATION_TTL_DAYS) expired += 1;
      else if (p.source?.quality === 'OFFICIAL' || p.source?.quality === 'MANUAL') verified += 1;
      if (!p.pricing || p.pricing.type === 'ON_QUOTE' || p.pricing.amount == null) withoutPrice += 1;
    }
    return { total: products.length, verified, expired, requiresVerification, withoutSource, withoutPrice, withoutImage: null };
  }, [data]);

  return { metrics, products: (data?.results ?? []) as ProductV2[], isLoading, isError, refetch };
}