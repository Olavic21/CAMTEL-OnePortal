import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  ClipboardList,
  Users,
  MessageCircle,
  TrendingUp,
  Bell,
  ShieldCheck,
  Newspaper,
  Image,
  Mail,
  ScrollText,
  Settings,
  Boxes,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Logo } from '@/shared/components/Logo';
import { PortalBackofficeSwitch } from '@/shared/components/PortalBackofficeSwitch';
import type { Permission } from '@/features/auth/permissions';

// Sidebar de navigation par module (section 11.4). Chaque entree n'apparait
// que si le role courant possede la permission metier correspondante
// (matrice section 9.2) — en complement du RBAC applique cote serveur ET des
// gardes de routes frontend. L'interface est donc adaptee au role : un
// Gestionnaire catalogue ne voit pas les utilisateurs, un Support ne voit
// pas la zone Super Admin, etc.
const navItems: { to: string; key: string; icon: typeof LayoutDashboard; end?: boolean; permission?: Permission }[] = [
  { to: '/admin', key: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/catalogue', key: 'catalogue', icon: Package, permission: 'edit_product_draft' },
  { to: '/admin/services', key: 'services', icon: FolderTree, permission: 'edit_product_draft' },
  { to: '/admin/offres', key: 'offers', icon: Tag, permission: 'edit_product_draft' },
  { to: '/admin/produits', key: 'products', icon: Boxes, permission: 'edit_product_draft' },
  { to: '/admin/sources', key: 'sources', icon: ShieldCheck, permission: 'edit_product_draft' },
  { to: '/admin/qualite', key: 'quality', icon: ShieldCheck, permission: 'edit_product_draft' },
  { to: '/admin/souscriptions', key: 'subscriptions', icon: ClipboardList, permission: 'manage_subscriptions' },
  { to: '/admin/tickets', key: 'tickets', icon: MessageCircle, permission: 'manage_subscriptions' },
  { to: '/admin/clients', key: 'clients', icon: Users, permission: 'manage_users' },
  { to: '/admin/utilisateurs', key: 'users', icon: Users, permission: 'manage_users' },
  { to: '/admin/analytics', key: 'analytics', icon: TrendingUp, permission: 'view_analytics' },
  { to: '/admin/actualites', key: 'news', icon: Newspaper, permission: 'edit_news' },
  { to: '/admin/promotions', key: 'promotions', icon: Tag, permission: 'edit_promotion' },
  { to: '/admin/categories', key: 'categories', icon: FolderTree, permission: 'manage_categories' },
  { to: '/admin/mediatheque', key: 'media', icon: Image, permission: 'upload_media' },
  { to: '/admin/messages', key: 'messages', icon: Mail, permission: 'manage_contact' },
  { to: '/admin/notifications', key: 'notifications', icon: Bell },
  { to: '/admin/journal', key: 'activityLog', icon: ScrollText, permission: 'view_activity_log' },
  { to: '/admin/roles', key: 'roles', icon: KeyRound, permission: 'view_activity_log' },
  { to: '/admin/administration', key: 'administration', icon: Settings, permission: 'view_activity_log' },
];

export function AdminSidebar() {
  const { t } = useTranslation();
  const { user, can, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex h-16 items-center gap-2.5 border-b border-neutral-200 px-5 dark:border-neutral-800">
        <Logo variant="icon" to="/admin" />
        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{t('admin.brand')}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label={t('common.a11y.mainNav')}>
        {navItems
          .filter((item) => !item.permission || can(item.permission))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {t(`admin.sidebar.${item.key}`)}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
        <PortalBackofficeSwitch variant="compact" className="mb-3 w-full justify-center" />
        <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{user?.username}</p>
        <p className="mb-3 text-xs text-neutral-400 dark:text-neutral-500">
          {user ? t(`roles.${user.role}`) : ''}
        </p>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <LogOut className="h-4 w-4" /> {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
