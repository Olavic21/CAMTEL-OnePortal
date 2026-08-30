import { useQuery } from '@tanstack/react-query';
import { listCatalogProducts, type PaginatedProductsV2 } from '../api/productsApi';

export interface CatalogQuery {
  service?: string;
  segment?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

/** Reponse catalogue paginee (contrat DRF + mapping ProductV2). */
export type PaginatedProducts = PaginatedProductsV2;

/**
 * Catalogue public — SOURCE DE VERITE : le backend
 * (GET /api/v1/products/ avec filtres service/segment/search).
 * Aucune donnee commerciale cote frontend (BUG-01 corrige, section 48).
 */
export function useCatalog(query: CatalogQuery = {}) {
  return useQuery({
    queryKey: ['catalog', query],
    queryFn: () => listCatalogProducts(query),
  });
}