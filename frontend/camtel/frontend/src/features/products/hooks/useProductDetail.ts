import { useQuery } from '@tanstack/react-query';
import type { Product, ProductV2 } from '@/shared/types';
import { fetchCatalogProduct, productsApi } from '../api/productsApi';

/**
 * Detail produit — SOURCE DE VERITE : le backend
 * (GET /api/v1/products/{slug}/ puis mapping ProductV2).
 * Fallback : contrat legacy brut si le mapping V2 echoue.
 */
export function useProductDetail(slug: string | undefined) {
  const v2 = useQuery({
    queryKey: ['products', 'detail-v2', slug],
    queryFn: () => fetchCatalogProduct(slug as string),
    enabled: !!slug,
    retry: false,
  });

  const legacy = useQuery({
    queryKey: ['products', 'detail-legacy', slug],
    queryFn: () => productsApi.detail(slug as string),
    enabled: !!slug && v2.isError,
    retry: false,
  });

  const product = (v2.data ?? legacy.data) as ProductV2 | Product | undefined;

  return {
    product,
    isLoading: v2.isLoading || (v2.isError && legacy.isLoading),
    isError: v2.isError && legacy.isError,
  };
}