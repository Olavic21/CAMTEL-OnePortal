import { httpClient } from '@/shared/lib/axios';
import type { ApiProduct } from '@/features/products/api/productsApi';

/**
 * Recommandations « Trouver ma solution » (cahier des charges section 14).
 * POST /api/v1/recommendations/ : IMPLEMENTE cote serveur (moteur de scoring
 * deterministe — apps/core/v2_services.py::recommend_products_by_criteria).
 * Le client n'envoie que des criteres ; le backend renvoie les offres reelles
 * au contrat ProductSerializer (ApiProduct) — regle #52 : aucune donnee
 * inventee. Le mapping V2 vers les composants UI se fait dans le hook.
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
      .post<{ results: ApiProduct[]; engine?: string }>('/recommendations/', criteria)
      .then((r) => r.data),
};