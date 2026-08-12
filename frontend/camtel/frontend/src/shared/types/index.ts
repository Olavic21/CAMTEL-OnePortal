// Types alignés sur le modele de donnees Django/DRF (section 7 de la documentation)

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'product_manager'
  | 'editor'
  | 'visitor';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  last_login?: string | null;
}

export type Segment = 'grand_public' | 'entreprise';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  segment: Segment;
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
  price_unit?: string | null;
  is_featured: boolean;
  status: ProductStatus;
  view_count?: number;
  images?: ProductImage[];
  faqs?: ProductFAQ[];
  created_by_id?: number;
  created_at: string;
  updated_at: string;
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
  uploaded_by_id?: number;
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
