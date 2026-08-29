import { httpClient } from '@/shared/lib/axios';
import type { ProductV2 } from '@/shared/types';

/**
 * Recommandations « Trouver ma solution » (cahier des charges section 14).
 * Endpoint prevu : POST /api/v1/recommendations/.
 * Tant que le backend ne l'expose pas, le hook utilise un fallback local
 * (filtre du catalogue conforme au contrat) — voir useFindSolution.
 */
export interface RecommendationCriteria {
  service?: string;
  segment?: string;
  budget?: number | null;
  min_speed?: number | null;
  min_storage?: number | null;
  users?: number | null;
  location?: string;
}

export const recommendationsApi = {
  recommend: (criteria: RecommendationCriteria) =>
    httpClient
      .post<{ results: ProductV2[]; engine?: string }>('/recommendations/', criteria)
      .then((r) => r.data),
};