import { useMutation } from '@tanstack/react-query';
import { recommendationsApi, type RecommendationCriteria } from '../api/recommendationsApi';
import { mapApiProductToV2 } from '@/features/products/api/productsApi';
import { useCatalog } from '@/features/products/hooks/useCatalog';
import type { ProductV2 } from '@/shared/types';

export interface FindSolutionResult {
  products: ProductV2[];
  engine: 'API' | 'LOCAL';
}

function specNumber(p: ProductV2, key: string): number | null {
  const raw = p.specifications?.[key];
  if (raw === undefined) return null;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Scoring LOCAL — filet de securite UNIQUEMENT si l'endpoint backend est
 * indisponible (panne reseau). Le moteur de reference est serveur :
 * POST /api/v1/recommendations/ (recommend_products_by_criteria). Ce tri
 * local n'est jamais utilise quand l'API repond (y compris reponse vide :
 * le backend fait autorite sur « aucune offre ne correspond »).
 */
function localRecommend(criteria: RecommendationCriteria, catalog: ProductV2[]): ProductV2[] {
  let pool = catalog;
  if (criteria.service) pool = pool.filter((p) => p.service === criteria.service);
  if (criteria.segment) pool = pool.filter((p) => p.segment === criteria.segment);

  const score = (p: ProductV2): number => {
    let s = 0;
    const amount = p.pricing?.amount;
    if (criteria.budget != null && amount != null && amount <= criteria.budget) s += 3;
    if (criteria.min_speed != null) {
      const speed = specNumber(p, 'speed') ?? specNumber(p, 'bandwidth');
      if (speed != null && speed >= criteria.min_speed) s += 2;
    }
    if (criteria.min_storage != null) {
      const storage = specNumber(p, 'storage');
      if (storage != null && storage >= criteria.min_storage) s += 2;
    }
    if (criteria.users != null) {
      const bw = specNumber(p, 'bandwidth') ?? specNumber(p, 'speed');
      if (bw != null && bw >= criteria.users * 10) s += 1;
    }
    if (p.availability === 'AVAILABLE') s += 1;
    return s;
  };

  return [...pool].sort((a, b) => score(b) - score(a)).slice(0, 6);
}

export function useFindSolution() {
  // Catalogue reel (backend) source du filet de securite local.
  const { data: catalog, isLoading } = useCatalog({});

  const mutation = useMutation({
    mutationFn: async (criteria: RecommendationCriteria): Promise<FindSolutionResult> => {
      try {
        const api = await recommendationsApi.recommend(criteria);
        // Reponse = contrat ProductSerializer (offres publiees, scoring
        // serveur) -> mapping V2 pour les composants UI. Une reponse vide
        // est honnete : aucune offre publiee ne correspond aux criteres.
        return { products: (api.results ?? []).map(mapApiProductToV2), engine: 'API' };
      } catch {
        // Endpoint indisponible (backend hors ligne) : filet de securite UX,
        // explicitement affiche comme moteur LOCAL par la page.
        return { products: localRecommend(criteria, catalog?.results ?? []), engine: 'LOCAL' };
      }
    },
  });

  return { recommend: mutation.mutate, reset: mutation.reset, isLoading: mutation.isPending || isLoading, result: mutation.data, error: mutation.error };
}