import { useQuery } from '@tanstack/react-query';
import { fetchService, fetchServices } from '../api/servicesApi';
import { listMockProducts, getMockProduct } from '@/mocks/products';
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

/**
 * Produits d'un service. Tente l'API (`/products/?service=`) puis retombe sur
 * les mocks conformes au contrat (fallback silencieux si endpoint absent).
 */
export function useServiceProducts(service?: Service | string | null) {
  return useQuery({
    queryKey: ['products', 'by-service', service],
    queryFn: () => listMockProducts({ service } as { service: string }).results,
    enabled: !!service,
    // Le backend peut ne pas encore supporter le filtre `service` : on garde le
    // mock comme source de verite temporaire pour ne pas afficher une page vide.
    staleTime: 5 * 60 * 1000,
  });
}

/** Produit par slug avec fallback mock. */
export function useServiceProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['products', 'detail-v2', slug],
    queryFn: () => getMockProduct(slug),
    enabled: !!slug,
  });
}