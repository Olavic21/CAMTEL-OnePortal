import { useQuery } from '@tanstack/react-query';
import { getMockProduct } from '@/mocks/products';
import type { Product, ProductV2 } from '@/shared/types';
import { productsApi } from '../api/productsApi';

/**
 * Detail produit : priorite au nouveau contrat (mocks conformes) puis fallback
 * sur l'API Django existante. `isLoading` n'est vrai que si les deux sources
 * sont en attente — evite l'ecran vide pendant le chargement.
 */
export function useProductDetail(slug: string | undefined) {
  const mock = useQuery({
    queryKey: ['products', 'detail-v2', slug],
    queryFn: () => getMockProduct(slug),
    enabled: !!slug,
  });

  const api = useQuery({
    queryKey: ['products', 'detail-legacy', slug],
    queryFn: () => productsApi.detail(slug as string),
    enabled: !!slug,
    retry: false,
  });

  const product = (mock.data ?? api.data) as Product | ProductV2 | undefined;

  return {
    product,
    isLoading: mock.isLoading && api.isLoading,
    isError: (!mock.data && api.isError) || (!api.data && mock.isError),
  };
}