import { httpClient } from '@/shared/lib/axios';
import type { Paginated, Product } from '@/shared/types';
import type {
  DataQuality,
  PriceInfo,
  PriceType,
  ProductAvailability,
  ProductSource,
  ProductSpecifications,
  ProductV2,
  Segment,
  Service,
  ServiceInfo,
  ServiceListResponse,
} from '@/shared/types/catalog';

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

// =============================================================================
// CATALOGUE V2 — mapping contrat backend (ProductSerializer) -> contrat
// frontend (ProductV2). La source de verite est la base de donnees backend :
// plus aucun produit commercial n'est servis depuis les mocks (BUG-01).
// =============================================================================

/** Contrat brut renvoye par GET /products/ (ProductSerializer DRF). */
export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string | number | null;
  yearly_price?: string | number | null;
  price_on_request: boolean;
  price_unit?: string | null;
  currency: string;
  billing_period?: string;
  pricing_type?: string;
  offer_type?: string;
  service?: ApiService | null;
  segment?: string;
  segments?: Array<{ code: string }>;
  availability?: string;
  specs?: Record<string, unknown> | null;
  features?: unknown;
  benefits?: unknown;
  terms?: unknown;
  eligibility?: unknown;
  data_volume?: string | null;
  voice_volume?: string | null;
  sms_volume?: string | null;
  speed?: string | null;
  validity?: string | null;
  coverage?: string | null;
  technology?: string | null;
  sources?: Array<{
    source_name: string;
    source_url?: string;
    source_type?: string;
    verification_status?: string;
    last_verified_at?: string | null;
  }>;
  source_name?: string | null;
  source_url?: string | null;
  last_verified_at?: string | null;
  data_origin?: string | null;
  is_published?: boolean;
  is_active?: boolean;
}

function mapServiceCode(code: string | undefined, offerType: string | undefined): Service {
  if (code === 'FIXED') return 'FIXES';
  if (code === 'MOBILE') return 'MOBILES';
  if (code === 'TRANSPORT') return 'TRANSPORT';
  if (code === 'DATA_CENTER') return 'DATA_CENTER';
  // Repli deduit de l'offer_type (produit sans service rattache — ne devrait
  // plus arriver : validate_camtel_data impose un service a chaque produit).
  const byOffer: Partial<Record<string, Service>> = {
    MOBILE: 'MOBILES',
    HOSTING: 'DATA_CENTER',
    CLOUD: 'DATA_CENTER',
    VPN: 'DATA_CENTER',
  };
  return (offerType && byOffer[offerType]) || 'FIXES';
}

/**
 * Tarification : un prix NULL / sur demande -> ON_QUOTE SANS montant
 * (regle #21/#29 : jamais "0 FCFA" pour un prix inconnu).
 */
function mapPricing(api: ApiProduct): PriceInfo {
  if (api.price == null || api.price_on_request) {
    return { type: 'ON_QUOTE', currency: 'XAF' };
  }
  const amount = Number(api.price);
  const byPricingType: Record<string, PriceType> = {
    FIXED_PRICE: 'FIXED',
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY',
    INSTALLATION: 'SETUP',
    USAGE_BASED: 'USAGE',
    QUOTE: 'ON_QUOTE',
  };
  const byBilling: Record<string, PriceType> = {
    ONE_TIME: 'FIXED',
    MONTHLY: 'MONTHLY',
    QUARTERLY: 'QUARTERLY',
    YEARLY: 'YEARLY',
  };
  const type =
    (api.pricing_type && byPricingType[api.pricing_type]) ||
    (api.billing_period && byBilling[api.billing_period]) ||
    'FIXED';
  return { type, amount: Number.isFinite(amount) ? amount : undefined, currency: 'XAF' };
}

/** Specifications structurees : `specs` JSON + champs techniques derives. */
function mapSpecifications(api: ApiProduct): ProductSpecifications {
  const specs: ProductSpecifications = {};
  if (api.specs && typeof api.specs === 'object') {
    for (const [key, value] of Object.entries(api.specs)) {
      if (value !== null && value !== '') {
        specs[key] = value as string | number | boolean;
      }
    }
  }
  const derived: Array<[string, unknown]> = [
    ['data_volume', api.data_volume],
    ['voice_volume', api.voice_volume],
    ['sms_volume', api.sms_volume],
    ['speed', api.speed],
    ['validity', api.validity],
    ['coverage', api.coverage],
    ['technology', api.technology],
  ];
  for (const [key, value] of derived) {
    if (value !== null && value !== undefined && value !== '') specs[key] = value as string;
  }
  return specs;
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

function mapQuality(api: ApiProduct): DataQuality {
  const status = api.sources?.[0]?.verification_status;
  const origin = api.data_origin;
  if (status === 'OFFICIAL') return 'OFFICIAL';
  if (status === 'MANUAL') return 'MANUAL';
  if (status === 'DEMO' || status === 'MOCK' || origin === 'MOCK' || origin === 'DEMO') {
    return 'DEMO';
  }
  return 'REQUIRES_VERIFICATION';
}

/** ALL/REGION -> AVAILABLE ; ADDRESS_CHECK -> ON_REQUEST (verification requise). */
function mapAvailability(availability: string | undefined): ProductAvailability {
  if (availability === 'ADDRESS_CHECK') return 'ON_REQUEST';
  return 'AVAILABLE';
}

function mapSource(api: ApiProduct): ProductSource {
  const s = api.sources?.[0];
  return {
    name: s?.source_name || api.source_name || 'CAMTEL',
    url: s?.source_url || api.source_url || undefined,
    lastVerifiedAt: s?.last_verified_at || api.last_verified_at || '',
    quality: mapQuality(api),
  };
}

/** Mapper principal : reponse API -> ProductV2 (contrat des composants UI). */
export function mapApiProductToV2(api: ApiProduct): ProductV2 {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    service: mapServiceCode(api.service?.code, api.offer_type),
    segment: mapSegment(api),
    description: api.description || '',
    shortDescription: api.short_description || '',
    pricing: mapPricing(api),
    specifications: mapSpecifications(api),
    benefits: toStringList(api.benefits),
    terms: toStringList(api.terms),
    eligibility: toStringList(api.eligibility),
    features: toStringList(api.features),
    source: mapSource(api),
    availability: mapAvailability(api.availability),
  };
}

export interface CatalogApiQuery {
  service?: string;
  segment?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface PaginatedProductsV2 {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductV2[];
}

/** Requete catalogue paginee : GET /api/v1/products/?service=&segment=&search= */
export async function listCatalogProducts(
  query: CatalogApiQuery = {},
): Promise<PaginatedProductsV2> {
  const res = await httpClient.get<Paginated<ApiProduct>>('/products/', {
    params: {
      service: query.service || undefined,
      segment: query.segment || undefined,
      search: query.search || undefined,
      page: query.page,
      page_size: query.page_size,
      ordering: query.ordering,
    },
  });
  return {
    count: res.data.count,
    next: res.data.next,
    previous: res.data.previous,
    results: res.data.results.map(mapApiProductToV2),
  };
}

/** Detail produit (par slug) au contrat V2. */
export async function fetchCatalogProduct(slug: string): Promise<ProductV2> {
  const res = await httpClient.get<ApiProduct>(`/products/${slug}/`);
  return mapApiProductToV2(res.data);
}

function mapSegment(api: ApiProduct): Segment {
  const valid: Segment[] = ['PARTICULIER', 'PROFESSIONNEL', 'ENTREPRISE', 'ADMINISTRATION'];
  if (api.segment && (valid as string[]).includes(api.segment)) return api.segment as Segment;
  const first = api.segments?.[0]?.code;
  if (first && (valid as string[]).includes(first)) return first as Segment;
  return 'PARTICULIER';
}

