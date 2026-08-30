// =============================================================================
// Contrat API centralise (cahier des charges CAMTEL-OnePortal v1.0)
// Service et Segment sont DEUX notions independantes :
//   - Service  : ligne de metier CAMTEL (FIXES, MOBILES, TRANSPORT, DATA_CENTER)
//   - Segment  : profil client (PARTICULIER, PROFESSIONNEL, ENTREPRISE, ADMINISTRATION)
// Les autres types (PriceType, Availability, DataQuality) alimentent le rendu
// du catalogue et du back-office.
// =============================================================================

/** Les 4 services principaux CAMTEL (ex-nouvelle architecture commerciale). */
export type Service = 'FIXES' | 'MOBILES' | 'TRANSPORT' | 'DATA_CENTER';

/** Segments clients — independants des services. JAMAIS un enfant de Service. */
export type Segment =
  | 'PARTICULIER'
  | 'PROFESSIONNEL'
  | 'ENTREPRISE'
  | 'ADMINISTRATION';

/**
 * Type de tarification.
 * Un prix "inconnu" est modelise par `ON_QUOTE` ou absence d'`amount` — jamais
 * par un montant a 0 (regle : ne jamais afficher "0 FCFA" pour un prix inconnu).
 */
export type PriceType =
  | 'FIXED'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'
  | 'SETUP'
  | 'USAGE'
  | 'ON_QUOTE';

/** Disponibilite d'une offre pour le client final. */
export type ProductAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'ON_REQUEST';

/**
 * Qualite / provenance de la donnee (section 21 cahier des charges).
 * Une donnee REQUIRES_VERIFICATION doit etre clairement identifiable ;
 * une donnee DEMO ne doit jamais etre presentee comme commerciale en prod.
 */
export type DataQuality = 'OFFICIAL' | 'MANUAL' | 'DEMO' | 'REQUIRES_VERIFICATION';

/** Informations de prix normalisees (montant en XAF). */
export interface PriceInfo {
  type: PriceType;
  amount?: number;
  currency: 'XAF';
}

/** Source de la donnee (tracabilite : nom, url, date de verification). */
export interface ProductSource {
  name: string;
  url?: string;
  lastVerifiedAt: string;
  quality: DataQuality;
}

/** Spec dynamique piltee par schema : ex. `{ ram: "8 Go", cpu: "4", vcpu: "4" }`. */
export type ProductSpecifications = Record<string, string | number | boolean>;

/**
 * Definition d'une colonne/specification pour des produits d'un meme type
 * (VPS, Blue, Fibre...). PILOTEE PAR SCHEMA : le comparateur et la page produit
 * generent les lignes/colonnes a partir de ce schema, jamais en dur.
 */
export interface ProductSpecificationSchemaItem {
  /** Cle dans `Product.specifications`. */
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean';
  unit?: string;
}

/** Un schema de specifications pour une famille de produits. */
export type ProductSpecificationSchema = ProductSpecificationSchemaItem[];

/** Workflow de publication d'un produit (cahier des charges section 20). */
export type ProductLifecycleStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

/** Sous-service d'un service (ex. VPS, Colocation, Cloud pour DATA_CENTER). */
export interface SubService {
  slug: string;
  name: string;
  description: string;
}

/** Question/Reponse FAQ de service ou de produit. */
export interface FAQEntry {
  question: string;
  answer: string;
}

/** Service commercial CAMTEL (contrat `GET /api/v1/services/{slug}/`). */
export interface ServiceInfo {
  id?: number;
  slug: string;
  name: string;
  service: Service;
  tagline: string;
  description: string;
  heroTitle?: string;
  heroSubtitle?: string;
  subServices: SubService[];
  faqs: FAQEntry[];
  complementaryServices?: string[];
  is_active?: boolean;
  product_count?: number;
}

/** Reponse de `GET /api/v1/services/`. */
export interface ServiceListResponse {
  results: ServiceInfo[];
}

/**
 * Recommandation "Trouver ma solution" (contrat `GET /api/v1/recommendations/`).
 */
export interface SolutionRecommendation {
  productId: string | number;
  productSlug: string;
  productName: string;
  price?: PriceInfo;
  availability: ProductAvailability;
  keyFeatures: string[];
  justification: string[];
  score: number;
}

/** Produit au nouveau contrat (contrat product V2) — utilisé par les mocks et
 *  les nouveaux composants. L'interface `Product` historique (shared/types)
 *  est etendue pour rester compatible avec les deux modeles. */
export interface ProductV2 {
  id: string | number;
  slug: string;
  name: string;
  service: Service;
  segment: Segment;
  description: string;
  shortDescription: string;
  pricing: PriceInfo;
  specifications: ProductSpecifications;
  benefits: string[];
  options?: string[];
  terms?: string[];
  eligibility?: string[];
  source: ProductSource;
  availability: ProductAvailability;
  features?: string[];
}