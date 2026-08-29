// Types alignés sur le modele de donnees Django/DRF (section 7 de la documentation)
// =============================================================================
// Contrat centralise (cahier des charges v1.0) : Service, Segment, PriceType,
// Availability, DataQuality, ProductV2, schemas de specifications, ...
// https://github.com/<org>/camtel-oneportal  → docs/AUDIT_FRONTEND.md
// =============================================================================
export * from './catalog';
import type {
  PriceInfo,
  ProductAvailability,
  ProductSource,
  ProductSpecifications,
  Segment,
  Service,
} from './catalog';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'product_manager'
  | 'editor'
  | 'customer'
  // Legacy : un compte VIEWER encore stocke en DB sort en 'viewer' (le backend
  // n'emait plus jamais 'visitor' — cahier des charges #18). Traite comme un
  // simple client : jamais de back-office.
  | 'viewer';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  /**
   * Fourni par le backend (/auth/me, UserSerializer) pour le switch
   * PORTAL <-> BACKOFFICE (cahier des charges #20/#21). Le backend reste
   * l'autorite reelle : ce champ ne sert qu'a l'UX (masquer/afficher).
   */
  can_access_backoffice?: boolean;
  is_active: boolean;
  date_joined: string;
  last_login?: string | null;
}

/**
 * Segment d'une CATEGORIE de catalogue (taxonomie historique backend).
 * NB : ne pas confondre avec le nouveau type `Segment` (profil client :
 * PARTICULIER/PROFESSIONNEL/ENTREPRISE/ADMINISTRATION) issu de ./catalog.
 */
export type CategorySegment = 'grand_public' | 'entreprise';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  segment: CategorySegment;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface ProductImage {
  id: number;
  product_id: number;
  image: string;
  alt_text?: string | null;
  is_primary: boolean;
  order: number;
}

export interface ProductFAQ {
  id: number;
  product_id: number;
  question: string;
  answer: string;
  order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  category?: Category;
  short_description: string;
  description: string;
  price: number | null;
  yearly_price?: number | null;
  price_unit?: string | null;
  /** Vrai quand l'affichage doit montrer "Prix sur demande" (regle #29). */
  price_on_request?: boolean;
  is_featured: boolean;
  status: ProductStatus;
  view_count?: number;
  images?: ProductImage[];
  faqs?: ProductFAQ[];
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  // --- Catalogue commercial officiel (tracabilite + CTA #28/#30) ---
  brand?: 'CAMTEL' | 'BLUE' | 'FIBER_CONNECT' | 'HOSTING' | 'CARRIER';
  subcategory?: string;
  service_type?: 'OFFER' | 'SERVICE' | 'PRODUCT';
  pricing_type?: 'FIXED' | 'QUOTE' | 'FREE';
  data_volume?: string;
  voice_volume?: string;
  sms_volume?: string;
  speed?: string;
  validity?: string;
  coverage?: string;
  subscription_method?: 'ONLINE' | 'AGENCY' | 'USSD' | 'MOBILE_APP' | 'CONTACT' | '';
  specs?: Record<string, string>;
  source_url?: string;
  source_name?: string;
  last_verified_at?: string | null;
  is_stale?: boolean;
  cta_type?: 'subscribe' | 'agency' | 'quote' | 'eligibility';

  // ==========================================================================
  // Nouveau contrat (cahier des charges v1.0) — champs optionnels pour rester
  // compatible avec l'API existante et les donnees mocks.
  // Service et Segment sont INDEPENDANTS (jamais de hierarchie parent/enfant).
  // ==========================================================================
  service?: Service;
  segment?: Segment;
  /** Tarification normalisee (type + montant XAF). `undefined` => prix inconnu. */
  pricing?: PriceInfo;
  /** Specifications pilotees par schema. */
  specifications?: ProductSpecifications;
  benefits?: string[];
  options?: string[];
  terms?: string[];
  eligibility?: string[];
  source?: ProductSource;
  availability?: ProductAvailability;
  product_type?: 'SERVICE_OFFER' | 'PHYSICAL_PRODUCT' | string;
  offer_type?: string;
  billing_period?: 'MONTHLY' | 'YEARLY' | 'ONE_TIME' | string;
  technology?: string;
  install_fee?: number | null;
  activation_fee?: number | null;
  contract_duration?: string;
  /** Priorite grace a laquelle la V2 remplace proprement la V1 quand disponible. */
  version?: 1 | 2;
}

export type ContentStatus = 'draft' | 'published';

export interface News {
  id: number;
  title: string;
  slug: string;
  content: string;
  cover_image?: string | null;
  status: ContentStatus;
  published_at?: string | null;
  author_id?: number;
  created_at: string;
  updated_at: string;
}

export type DiscountType = 'percentage' | 'fixed_amount';

export interface Promotion {
  id: number;
  title: string;
  description: string;
  product_id?: number | null;
  product?: Product;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by_id?: number;
  created_at: string;
}

export type MediaFileType = 'image' | 'document';

export interface MediaFile {
  id: number;
  file: string;
  file_type: MediaFileType;
  uploaded_by?: number | null;
  uploaded_at: string;
}

export type ContactMessageStatus = 'new' | 'read' | 'archived';

export interface ContactMessage {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
}

export type ActivityAction = 'create' | 'update' | 'delete' | 'login';

export interface ActivityLog {
  id: number;
  user_id: number;
  user?: Pick<User, 'id' | 'username'>;
  action: ActivityAction;
  target_model: string;
  target_id: number;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

// Statuts de workflow — alignes sur SubscriptionRequest.Status cote backend
// (apps/subscriptions/models.py).
export type SubscriptionStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'ACTIVATED'
  | 'REJECTED'
  | 'CANCELLED';

export interface SubscriptionStatusHistoryEntry {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string | null;
  reason: string;
  comment: string;
  created_at: string;
}

// Tickets support (V2, section 27 mission). Alignes sur SupportTicket/TicketMessage
// cote backend (apps/core/models.py + serializers.py).
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TicketMessage {
  id: number;
  ticket: number;
  author: number | null;
  author_name: string | null;
  message: string;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  client: number;
  client_name: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_agent: number | null;
  assigned_agent_name: string | null;
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRequest {
  id: number;
  request_number: string;
  user: number | null;
  product: number;
  product_name: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  message?: string;
  status: SubscriptionStatus;
  status_history: SubscriptionStatusHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [field: string]: unknown;
}

export interface DashboardSummary {
  products_published: number;
  products_draft: number;
  news_recent: News[];
  promotions_active: number;
  contact_messages_new: number;
}

// Resume analytique admin (section 20 mission : "vues des offres, top
// offres, top categories, taux de conversion"). Correspond exactement a la
// forme renvoyee par GET /analytics/summary/ (voir apps/core/analytics.py
// cote backend — les noms de champs product__id/product__name/etc. viennent
// directement d'un .values().annotate() Django, conserves tels quels ici).
export interface AnalyticsTopOffer {
  product__id: number;
  product__name: string;
  count: number;
}

export interface AnalyticsTopCategory {
  product__category__name: string | null;
  count: number;
}

// Eligibilite (V2, section 28 mission). Reponse de POST /eligibility/check/
// (voir apps/core/v2_services.py EligibilityResult.as_dict()).
// Documents (V2, section 24 mission). Reponse de GET /documents/. NB : le
// backend expose un catalogue STATIQUE (settings.DOCUMENT_STORE), pas de
// CRUD — aucune gestion admin possible tant que ce n'est pas remplace par
// une vraie GED (V3, voir commentaire dans config/settings/base.py).
export interface DocumentEntry {
  id: string;
  kind: string;
  title: string;
  summary: string;
  url: string;
  tags: string[];
  product_id: number | null;
}

// Recommandations (V2, section 35 mission). Reponse de GET /recommendations/.
export interface ProductRecommendation {
  id: number;
  name: string;
  slug: string;
  price: string;
  currency: string;
  offer_type: string;
  segment: string;
  score: number;
  reasons: string[];
}

export interface EligibilityResult {
  eligible: boolean;
  status: string;
  reasons: string[];
  score: number;
  product_id: number;
  address: string;
  provider: string;
}

// Paiement (V2, section 29 mission — abstraction mock, jamais de vraies
// donnees bancaires). Reponse de POST /payments/initiate/.
export interface PaymentResult {
  provider: string;
  transaction_id: string;
  reference: string;
  status: string;
  amount: string;
  currency: string;
  payment_url: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsSummary {
  period_days: number;
  total_events: number;
  counts: Record<string, number>;
  top_offers: AnalyticsTopOffer[];
  top_categories: AnalyticsTopCategory[];
  top_search_queries: string[];
  conversion_rate: number;
}

export type NotificationType = 'info' | 'success' | 'warning';

// Centre de notifications internes (roadmap V2). Endpoint pressenti /notifications/.
export interface AppNotification {
  id: number;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string | null;
  created_at: string;
}
