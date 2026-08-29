import { httpClient } from '@/shared/lib/axios';
import type { ServiceInfo } from '@/shared/types';
import { getMockService, mockServices } from '@/mocks/services';
import { mapServiceApiToInfo, type ApiService } from '@/features/products/api/productsApi';

export const servicesApi = {
  /**
   * TAXONOMIE V4 (#16) : GET /api/v1/services/ — source de verite backend
   * (services stockes en base : fixes / mobiles / transport / data-center).
   * Le contrat DRF (ServiceSerializer) est normalise vers le contrat editorial
   * frontend via `mapServiceApiToInfo` (fallbacks explicites pour les champs
   * non modelises : tagline, subServices, faqs). Fallback mocks si API down.
   */
  list: async (): Promise<{ results: ServiceInfo[] }> => {
    try {
      const res = await httpClient.get<{ results: ApiService[] }>('/services/');
      if (res.data.results?.length) {
        return { results: res.data.results.map(mapServiceApiToInfo) };
      }
    } catch {
      // Mode degrade (API indisponible) -> mocks de presentation ci-dessous.
    }
    return { results: mockServices };
  },

  detail: async (slug: string): Promise<ServiceInfo> => {
    try {
      const res = await httpClient.get<ApiService>(`/services/${slug}/`);
      return mapServiceApiToInfo(res.data);
    } catch {
      // Mode degrade (API indisponible) -> mock de presentation ; si le slug
      // ne correspond a aucun service connu, on propage l'erreur (404-like).
      const mock = getMockService(slug);
      if (!mock) throw new Error(`Service inconnu : ${slug}`);
      return mock;
    }
  },
};

// Fallback mocks (contrat /services/) tant que le backend n'expose pas ces endpoints.
export async function fetchServices(): Promise<ServiceInfo[]> {
  const data = await servicesApi.list();
  return data.results?.length ? data.results : mockServices;
}

export async function fetchService(slug: string | undefined): Promise<ServiceInfo | undefined> {
  if (!slug) return undefined;
  try {
    return await servicesApi.detail(slug);
  } catch {
    return getMockService(slug);
  }
}