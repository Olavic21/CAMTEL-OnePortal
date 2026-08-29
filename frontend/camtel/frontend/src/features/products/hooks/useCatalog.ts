import { useQuery } from '@tanstack/react-query';
import { listMockProducts } from '@/mocks/products';
import type { ProductV2 } from '@/shared/types';

export interface CatalogQuery {
  service?: string;
  segment?: string;
  search?: string;
  page?: number;
  ordering?: string;
  availability?: string;
}

export interface PaginatedProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductV2[];
}

interface PaginatedResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Catalogue public (service/segment/prix/disponibilite filtres independants).
 *
 * Source TEMPORAIRE : `listMockProducts` (mocks conformes au contrat API,
 * voir src/mocks/). Des que `GET /api/v1/products/` supporte les filtres
 * `service` et `segment`, remplacer le queryFn par `productsApi.list` :
 *
 *   const list = (q: CatalogQuery) =>
 *     httpClient.get<PaginatedResult<ProductV2>>('/products/', { params: q })
 *       .then((r) => r.data);
 */
async function catalogFetcher(query: CatalogQuery): Promise<PaginatedResult<ProductV2>> {
  const result = listMockProducts(query);
  return result as PaginatedResult<ProductV2>;
}

export function useCatalog(query: CatalogQuery = {}) {
  return useQuery({
    queryKey: ['catalog', query],
    queryFn: () => catalogFetcher(query),
  });
}