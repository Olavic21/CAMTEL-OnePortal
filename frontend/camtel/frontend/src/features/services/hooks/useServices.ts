import { useQuery } from '@tanstack/react-query';
import { fetchService, fetchServices } from '../api/servicesApi';
import { fetchCatalogProduct, listCatalogProducts } from '@/features/products/api/productsApi';
import type { Service } from '@/shared/types';

export function useServices() {
  return useQuery({
    queryKey: ['services', 'list'],
    queryFn: fetchServices,
  });
}

export function useService(slug: string | undefined) {
  return useQuery({
    queryKey: ['services', 'detail', slug],
    queryFn: () => fetchService(slug),
    enabled: !!slug,
  });
}

/** Produits d'un service — SOURCE DE VERITE : le backend (filtre `service`). */
export function useServiceProducts(service?: Service | string | null) {
  return useQuery({
    queryKey: ['products', 'by-service', service],
    queryFn: () =>
      listCatalogProducts({ service: String(service), page_size: 24 }).then((r) => r.results),
    enabled: !!service,
    staleTime: 60 * 1000,
  });
}

/** Produit par slug — SOURCE DE VERITE : le backend. */
export function useServiceProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['products', 'detail-v2', slug],
    queryFn: () => fetchCatalogProduct(slug as string),
    enabled: !!slug,
  });
}