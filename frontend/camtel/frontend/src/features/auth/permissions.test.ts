import { describe, it, expect } from 'vitest';
import { PERMISSIONS, getAssignableRoles, canManageAccount } from './permissions';

// Tests du module critique "permissions" (section 19.5 : couverture >= 80%
// visee sur les modules auth/permissions/produits). Verifie la matrice
// section 9.2 ainsi que la regle de promotion en cascade definie par le
// porteur du projet (Admin ne peut jamais attribuer/gerer Admin ou Super Admin).
describe('PERMISSIONS matrix', () => {
  it('reserves manage_users to admin and super_admin only', () => {
    expect(PERMISSIONS.manage_users).toEqual(['super_admin', 'admin']);
  });

  it('reserves promote_to_admin exclusively to super_admin', () => {
    expect(PERMISSIONS.promote_to_admin).toEqual(['super_admin']);
  });

  it('allows product_manager to edit product drafts but not publish or delete', () => {
    expect(PERMISSIONS.edit_product_draft).toContain('product_manager');
    expect(PERMISSIONS.publish_product).not.toContain('product_manager');
    expect(PERMISSIONS.delete_product).not.toContain('product_manager');
  });

  it('allows editor to edit news but not delete it', () => {
    expect(PERMISSIONS.edit_news).toContain('editor');
    expect(PERMISSIONS.delete_news).not.toContain('editor');
  });

  it('never grants customer any back-office permission (cahier des charges #18)', () => {
    for (const roles of Object.values(PERMISSIONS)) {
      expect(roles).not.toContain('customer');
      expect(roles).not.toContain('visitor'); // role legacy supprime
    }
  });

  it('reserves manage_subscriptions to admin and super_admin only, matching backend AdminOnly', () => {
    // Aligne sur apps/core/permissions.py: ADMIN_ROLES = {SUPER_ADMIN, ADMIN}
    // (permission serveur reelle pour list/retrieve/change-status des souscriptions).
    expect(PERMISSIONS.manage_subscriptions).toEqual(['super_admin', 'admin']);
  });
});

describe('getAssignableRoles', () => {
  it('lets super_admin assign any role including admin', () => {
    const roles = getAssignableRoles('super_admin');
    expect(roles).toContain('admin');
    expect(roles).toContain('super_admin');
  });

  it('lets admin promote to editor/product_manager/customer only, never admin', () => {
    const roles = getAssignableRoles('admin');
    expect(roles).toEqual(expect.arrayContaining(['editor', 'product_manager', 'customer']));
    expect(roles).not.toContain('admin');
    expect(roles).not.toContain('super_admin');
  });

  it('lets no other role assign anything', () => {
    expect(getAssignableRoles('editor')).toEqual([]);
    expect(getAssignableRoles('product_manager')).toEqual([]);
    expect(getAssignableRoles('customer')).toEqual([]);
  });
});

describe('canManageAccount', () => {
  it('lets super_admin manage every account, including other admins', () => {
    expect(canManageAccount('super_admin', 'admin')).toBe(true);
    expect(canManageAccount('super_admin', 'super_admin')).toBe(true);
    expect(canManageAccount('super_admin', 'customer')).toBe(true);
  });

  it('prevents admin from managing another admin or a super_admin account', () => {
    expect(canManageAccount('admin', 'admin')).toBe(false);
    expect(canManageAccount('admin', 'super_admin')).toBe(false);
  });

  it('lets admin manage editor/product_manager/customer accounts', () => {
    expect(canManageAccount('admin', 'editor')).toBe(true);
    expect(canManageAccount('admin', 'product_manager')).toBe(true);
    expect(canManageAccount('admin', 'customer')).toBe(true);
  });

  it('prevents non-admin roles from managing any account', () => {
    expect(canManageAccount('editor', 'customer')).toBe(false);
    expect(canManageAccount('product_manager', 'customer')).toBe(false);
  });
});
