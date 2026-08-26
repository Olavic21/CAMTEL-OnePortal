import type { UserRole } from '@/shared/types';

// Matrice des permissions alignee sur la section 9.2 de la documentation
// (matrice des permissions), etendue avec la logique de gestion des comptes
// definie par le porteur du projet : inscription libre en Visiteur, puis
// promotion en cascade (Admin decide qui devient Editeur/Gestionnaire,
// Super Admin seul decide qui devient Admin).
export type Permission =
  | 'edit_product_draft'
  | 'publish_product'
  | 'delete_product'
  | 'manage_categories'
  | 'edit_promotion'
  | 'delete_promotion'
  | 'edit_news'
  | 'delete_news'
  | 'upload_media'
  | 'delete_media'
  | 'manage_contact'
  | 'manage_users'
  | 'promote_to_admin'
  | 'view_activity_log'
  | 'manage_subscriptions';

// NB: "manage_categories" et "delete_media" ne figurent pas litteralement
// dans la matrice d'origine (section 9.2) ; ils suivent par coherence la
// meme logique que les actions structurelles similaires (reservees a
// Super Admin / Admin).
export const PERMISSIONS: Record<Permission, UserRole[]> = {
  edit_product_draft: ['super_admin', 'admin', 'product_manager'],
  publish_product: ['super_admin', 'admin'],
  delete_product: ['super_admin', 'admin'],
  manage_categories: ['super_admin', 'admin'],
  edit_promotion: ['super_admin', 'admin', 'product_manager'],
  delete_promotion: ['super_admin', 'admin', 'product_manager'],
  edit_news: ['super_admin', 'admin', 'editor'],
  delete_news: ['super_admin', 'admin'],
  upload_media: ['super_admin', 'admin', 'product_manager', 'editor'],
  delete_media: ['super_admin', 'admin'],
  manage_contact: ['super_admin', 'admin'],
  // manage_users: consulter et gerer les comptes internes ; ouvert a Admin
  // et Super Admin desormais (avant : Super Admin seul).
  manage_users: ['super_admin', 'admin'],
  // promote_to_admin: seule action reservee exclusivement au Super Admin —
  // attribuer/retirer le role Admin ou Super Admin, et gerer les comptes
  // deja au niveau Admin/Super Admin.
  promote_to_admin: ['super_admin'],
  view_activity_log: ['super_admin'],
  // Aligne sur AdminOnly cote backend (apps/core/permissions.py: ADMIN_ROLES
  // = {SUPER_ADMIN, ADMIN}) pour list/retrieve/change-status des souscriptions.
  manage_subscriptions: ['super_admin', 'admin'],
};

// Roles qu'un role donne est autorise a attribuer a un autre compte.
// - Super Admin : peut attribuer n'importe quel role, y compris Admin.
// - Admin : peut promouvoir un Visiteur en Editeur/Gestionnaire, ou revenir
//   a Visiteur, mais ne peut jamais attribuer Admin ou Super Admin.
export function getAssignableRoles(actingRole: UserRole): UserRole[] {
  if (actingRole === 'super_admin') {
    return ['super_admin', 'admin', 'product_manager', 'editor', 'visitor'];
  }
  if (actingRole === 'admin') {
    return ['product_manager', 'editor', 'visitor'];
  }
  return [];
}

// Un compte deja Admin ou Super Admin ne peut etre gere (role modifie,
// desactive, supprime) que par un Super Admin — un Admin ne peut pas agir
// sur un autre Admin.
export function canManageAccount(actingRole: UserRole, targetRole: UserRole): boolean {
  if (actingRole === 'super_admin') return true;
  if (actingRole === 'admin') return targetRole !== 'admin' && targetRole !== 'super_admin';
  return false;
}
