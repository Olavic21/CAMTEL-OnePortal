import { httpClient } from '@/shared/lib/axios';
import type { Paginated, Product } from '@/shared/types';
import type { ServiceInfo, ServiceListResponse } from '@/shared/types/catalog';

export interface ProductListParams {
  category?: string;
  segment?: string;
  search?: string;
  page?: number;
  status?: string;
  service?: string;
  page_size?: number;
  ordering?: string;
}

export interface ProductPayload {
  name: string;
  category_id: number;
  short_description: string;
  description: string;
  price?: number | null;
  price_unit?: string | null;
  is_featured?: boolean;
}

// Endpoints alignes sur la section 8.3 de la documentation API.
export const productsApi = {
  list: (params: ProductListParams = {}) =>
    httpClient.get<Paginated<Product>>('/products/', { params }).then((r) => r.data),
  detail: (slug: string) => httpClient.get<Product>(`/products/${slug}/`).then((r) => r.data),
  create: (payload: ProductPayload, coverImage?: File | null) => {
    // En presence d'une image de couverture, on envoie en multipart/form-data.
    if (coverImage) {
      const formData = new FormData();
      formData.append('name', payload.name);
      formData.append('category_id', String(payload.category_id));
      formData.append('short_description', payload.short_description);
      formData.append('description', payload.description);
      if (payload.price !== undefined && payload.price !== null) {
        formData.append('price', String(payload.price));
      }
      if (payload.price_unit) formData.append('price_unit', payload.price_unit);
      formData.append('image', coverImage);
      return httpClient.post<Product>('/products/', formData).then((r) => r.data);
    }
    return httpClient.post<Product>('/products/', payload).then((r) => r.data);
  },
  update: (id: number, payload: Partial<ProductPayload>) =>
    httpClient.patch<Product>(`/products/${id}/`, payload).then((r) => r.data),
  publish: (id: number) => httpClient.post<Product>(`/products/${id}/publish/`).then((r) => r.data),
  remove: (id: number) => httpClient.delete(`/products/${id}/`),
  exportPdf: (id: number) =>
    httpClient.get(`/products/${id}/export-pdf/`, { responseType: 'blob' }).then((r) => r.data),
  compare: (ids: number[]) =>
    httpClient
      .get<Array<{
        id: number;
        name: string;
        slug: string;
        category: { id: number; name: string; slug: string };
        price: number;
        price_unit?: string;
        short_description: string;
        description: string;
        features: { stock: number; is_active: boolean; views_count: number };
        faqs: Array<{ id: number; question: string; answer: string }>;
      }>>('/products/compare/', { params: { ids: ids.join(',') } })
      .then((r) => r.data),
};

// =============================================================================
// TAXONOMIE V4 (cahier des charges #2/#5/#16) : les 4 services sont stockes en
// base cote backend (slugs stables : fixes / mobiles / transport / data-center)
// et exposes par GET /api/v1/services/. Le contrat DRF (ServiceSerializer :
// id, slug, code, name, description, status, display_order) est plus pauvre
// que le contrat editorial historique (tagline, hero, subServices, faqs) qui
// n'est PAS modelise en base : ces champs sont remplis par des fallbacks
// explicites (jamais inventes comme des donnees CAMTEL reelles) en attendant
// la modelisation editoriale. Les donnees commerciales (produits, prix,
// specificites) viennent TOUJOURS de l'API.
// =============================================================================

/** Contrat brut renvoye par le backend (ServiceSerializer). */
export interface ApiService {
  id: number;
  slug: 'fixes' | 'mobiles' | 'transport' | 'data-center';
  code: 'FIXED' | 'MOBILE' | 'TRANSPORT' | 'DATA_CENTER';
  name: string;
  name_en?: string;
  description?: string | null;
  description_en?: string | null;
  status: string;
  display_order: number;
}

/** Contenu editorial de fallback — informatif, jamais une donnee commerciale. */
export const SERVICE_FALLBACKS: Record<string, Partial<ServiceInfo>> = {
  fixes: {
    tagline: 'Téléphonie fixe et solutions professionnelles',
    description: 'Lignes fixes, PABX et téléphonie professionnelle CAMTEL.',
  },
  mobiles: {
    tagline: 'Offres mobiles et data',
    description: 'Forfaits mobiles, data et services associés CAMTEL.',
  },
  transport: {
    tagline: 'Transport de données',
    description: 'Liaisons, IP/MPLS, Ethernet et interconnexion CAMTEL.',
  },
  'data-center': {
    tagline: 'Data center, cloud et hébergement',
    description: 'Hébergement, VPS, stockage, sauvegarde et services managés CAMTEL.',
  },
};

/** Normalise un service API (contrat DRF) vers le contrat editorial frontend. */
export function mapServiceApiToInfo(api: ApiService): ServiceInfo {
  const fallback = SERVICE_FALLBACKS[api.slug] ?? {};
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    service: (api.code as ServiceInfo['service']) ?? 'FIXES',
    tagline: fallback.tagline ?? '',
    description: api.description || fallback.description || '',
    heroTitle: fallback.heroTitle ?? api.name,
    heroSubtitle: fallback.heroSubtitle ?? '',
    subServices: fallback.subServices ?? [],
    faqs: fallback.faqs ?? [],
    complementaryServices: fallback.complementaryServices ?? [],
    is_active: api.status === 'ACTIVE',
  };
}

/** Liste brute (contrat DRF) — utile pour les filtres produits par slug. */
export async function listRawServices(): Promise<ApiService[]> {
  try {
    const res = await httpClient.get<ServiceListResponse & { results: ApiService[] }>('/services/');
    return res.data.results ?? [];
  } catch {
    return [];
  }
}
