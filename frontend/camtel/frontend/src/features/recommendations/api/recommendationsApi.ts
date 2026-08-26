import { httpClient } from '@/shared/lib/axios';
import type { ProductRecommendation } from '@/shared/types';

// Section 35 mission : recommandations explicables (score + raisons),
// deterministes, sans tracking externe — voir apps/core/v2_services.py
// recommend_products().
export const recommendationsApi = {
  forProduct: (slug: string, limit = 3) =>
    httpClient
      .get<{ count: number; results: ProductRecommendation[] }>('/recommendations/', { params: { product: slug, limit } })
      .then((r) => r.data.results),
};
