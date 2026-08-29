import { httpClient } from '@/shared/lib/axios';
import type { ServiceInfo } from '@/shared/types';
import { getMockService, mockServices } from '@/mocks/services';

export const servicesApi = {
  list: () => httpClient.get<{ results: ServiceInfo[] }>('/services/').then((r) => r.data),
  detail: (slug: string) => httpClient.get<ServiceInfo>(`/services/${slug}/`).then((r) => r.data),
};

// Fallback mocks (contrat /services/) tant que le backend n'expose pas ces endpoints.
export async function fetchServices(): Promise<ServiceInfo[]> {
  try {
    const data = await servicesApi.list();
    return data.results?.length ? data.results : mockServices;
  } catch {
    return mockServices;
  }
}

export async function fetchService(slug: string | undefined): Promise<ServiceInfo | undefined> {
  if (!slug) return undefined;
  try {
    return await servicesApi.detail(slug);
  } catch {
    return getMockService(slug);
  }
}