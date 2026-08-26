import { httpClient } from '@/shared/lib/axios';
import type { DocumentEntry } from '@/shared/types';

// Section 24 mission : catalogue documentaire (CGV, guides). Backend expose
// une liste statique (settings.DOCUMENT_STORE) — lecture seule, pas de
// CRUD tant que ce n'est pas remplace par une vraie GED en V3.
export const documentsApi = {
  list: (params: { product_id?: number; kind?: string; q?: string } = {}) =>
    httpClient
      .get<{ count: number; results: DocumentEntry[] }>('/documents/', { params })
      .then((r) => r.data.results),
};
