import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/hooks/useAuth';
import { RequireAuth } from '@/features/auth/components/RequireAuth';

import { PublicLayout } from './layout/PublicLayout';
import { AdminLayout } from './layout/AdminLayout';
import { RouteLoadingFallback } from './layout/RouteLoadingFallback';

// Code splitting (roadmap "optimiser le bundle") : chaque page est chargee a
// la demande via un chunk separe, au lieu d'un seul bundle initial monolithique.
// Seuls les layouts (structure toujours visible) restent en import direct.
const HomePage = lazy(() => import('./pages/HomePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const ProductListPage = lazy(() => import('@/features/products/pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/features/products/pages/ProductDetailPage'));
const ProductComparePage = lazy(() => import('@/features/products/pages/ProductComparePage'));
const AdminProductListPage = lazy(() => import('@/features/products/pages/AdminProductListPage'));
const AdminProductFormPage = lazy(() => import('@/features/products/pages/AdminProductFormPage'));
const AdminCataloguePage = lazy(() => import('@/features/catalogue/pages/AdminCataloguePage'));
const AdminServicesPage = lazy(() => import('@/features/services/pages/AdminServicesPage'));
const AdminOffersPage = lazy(() => import('@/features/offers/pages/AdminOffersPage'));
const AdminClientsPage = lazy(() => import('@/features/clients/pages/AdminClientsPage'));
const AdminAnalyticsPage = lazy(() => import('@/features/analytics/pages/AdminAnalyticsPage'));
const AdminSourcesPage = lazy(() => import('@/features/sources/pages/AdminSourcesPage'));
const AdminAdministrationPage = lazy(() => import('@/features/administration/pages/AdminAdministrationPage'));
const AdminRolesPage = lazy(() => import('@/features/administration/pages/AdminRolesPage'));
const EligibilityPage = lazy(() => import('@/features/eligibility/pages/EligibilityPage'));

const NewsListPage = lazy(() => import('@/features/news/pages/NewsListPage'));
const NewsDetailPage = lazy(() => import('@/features/news/pages/NewsDetailPage'));
const AdminNewsListPage = lazy(() => import('@/features/news/pages/AdminNewsListPage'));
const AdminNewsFormPage = lazy(() => import('@/features/news/pages/AdminNewsFormPage'));

const PromotionsPage = lazy(() => import('@/features/promotions/pages/PromotionsPage'));
const AdminPromotionListPage = lazy(() => import('@/features/promotions/pages/AdminPromotionListPage'));

const AdminCategoryListPage = lazy(() => import('@/features/categories/pages/AdminCategoryListPage'));
const AdminMediaLibraryPage = lazy(() => import('@/features/media/pages/AdminMediaLibraryPage'));
const AdminActivityLogPage = lazy(() => import('@/features/activity-log/pages/AdminActivityLogPage'));
const AdminDashboardPage = lazy(() => import('@/features/dashboard/pages/AdminDashboardPage'));
const AdminDataQualityPage = lazy(() => import('@/features/dashboard/pages/AdminDataQualityPage'));
const AdminContactInboxPage = lazy(() => import('@/features/contact/pages/AdminContactInboxPage'));

const ContactPage = lazy(() => import('@/features/contact/pages/ContactPage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const SubscriptionPage = lazy(() => import('@/features/subscriptions/pages/SubscriptionPage'));
const AdminUserListPage = lazy(() => import('@/features/users/pages/AdminUserListPage'));
const AdminNotificationsPage = lazy(() => import('@/features/notifications/pages/AdminNotificationsPage'));
const ClientAccountPage = lazy(() => import('@/features/account/pages/ClientAccountPage'));
const AdminSubscriptionListPage = lazy(() => import('@/features/subscriptions/pages/AdminSubscriptionListPage'));
const AdminSubscriptionDetailPage = lazy(() => import('@/features/subscriptions/pages/AdminSubscriptionDetailPage'));
const ClientTicketListPage = lazy(() => import('@/features/tickets/pages/ClientTicketListPage'));
const ClientTicketDetailPage = lazy(() => import('@/features/tickets/pages/ClientTicketDetailPage'));
const AdminTicketListPage = lazy(() => import('@/features/tickets/pages/AdminTicketListPage'));
const AdminTicketDetailPage = lazy(() => import('@/features/tickets/pages/AdminTicketDetailPage'));
const DocumentsPage = lazy(() => import('@/features/documents/pages/DocumentsPage'));
const AssistantPage = lazy(() => import('@/features/chat/pages/AssistantPage'));

// Arborescence de routage (section 4/5) : routes publiques + routes admin proteges par RBAC.

// Routes espace client (section 21.1)
const ClientSubscriptionsPage = lazy(() => import('@/features/account/pages/ClientSubscriptionsPage'));
const ClientDashboardPage = lazy(() => import('@/features/account/pages/ClientDashboardPage'));
const ClientPaymentsPage = lazy(() => import('@/features/payments/pages/ClientPaymentsPage'));
const ClientNotificationsPage = lazy(() => import('@/features/notifications/pages/ClientNotificationsPage'));

// Univers de services (cahier des charges section 4) : Fixes / Mobiles /
// Transport / Data Center. Un template commun ServicePage rend les quatre.
const ServicesPage = lazy(() => import('@/features/services/pages/ServicesPage'));
const ServicePage = lazy(() => import('@/features/services/pages/ServicePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AssistancePage = lazy(() => import('./pages/AssistancePage'));
const SearchPage = lazy(() => import('@/features/search/pages/SearchPage'));
const FindSolutionPage = lazy(() => import('@/features/find-solution/pages/FindSolutionPage'));
// L'API versionnee cote backend (/api/v1/) n'a pas d'impact ici. /admin/login et /inscription
// sont les seules routes exemptees de la garde RequireAuth.
//
// Regle metier (definie par le porteur du projet) : l'inscription publique cree
// toujours un compte "visitor". L'entree dans /admin exige donc au minimum le
// role editor/gestionnaire — un visitor authentifie reste bloque hors du
// back-office (voir RequireAuth roles={['editor']} plus bas), mais accede a
// son espace personnel via /mon-compte (RequireAuth sans roles = authentifie).
/**
 * Redirection de l'ancienne page « Entreprise » (qui etait traitee comme un
 * service) vers le catalogue filtre sur le segment ENTREPRISE. « Entreprise »
 * est desormais un segment client, pas un service (cahier des charges 2/4) —
 * l'alias preserve les anciens liens sans conserver une page autonome.
 */
function SegmentRedirect({ segment }: { segment: string }) {
  return <Navigate to={`/produits?segment=${segment}`} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/inscription" element={<RegisterPage />} />

            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />

              {/* Phase 1/2: nouvelle navigation — Services regroupe les 4 univers */}
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:serviceSlug" element={<ServicePage />} />
              <Route path="/a-propos" element={<AboutPage />} />
              <Route path="/assistance" element={<AssistancePage />} />

              {/* Recherche globale et assistant guide (sections 12 et 14) */}
              <Route path="/recherche" element={<SearchPage />} />
              <Route path="/verifier-eligibilite" element={<EligibilityPage />} />
                <Route path="/trouver-une-solution" element={<FindSolutionPage />} />

              {/* Catalogue et produits — /catalogue alias vers /produits (Phase 6) */}
              <Route path="/produits" element={<ProductListPage />} />
              <Route path="/catalogue" element={<ProductListPage />} />
              <Route path="/produits/comparateur" element={<ProductComparePage />} />
              <Route path="/produits/:slug" element={<ProductDetailPage />} />
              <Route path="/produits/:slug/souscrire" element={<SubscriptionPage />} />

              {/* Actualites / promotions / documents / assistant / contact (KEEP) */}
              <Route path="/actualites" element={<NewsListPage />} />
              <Route path="/actualites/:slug" element={<NewsDetailPage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Alias : /entreprise est desormais un SEGMENT, pas un service.
                  Redirection vers le filtre catalogue segment=ENTREPRISE pour
                  ne pas casser les anciens liens (regle 12 / section 4). */}
              <Route path="/entreprise" element={<SegmentRedirect segment="ENTREPRISE" />} />

              <Route element={<RequireAuth />}>
                <Route path="/mon-compte" element={<ClientAccountPage />} />
                <Route path="/mon-compte/abonnements" element={<ClientSubscriptionsPage />} />
                <Route path="/mon-compte/dashboard" element={<ClientDashboardPage />} />
                <Route path="/mon-compte/paiements" element={<ClientPaymentsPage />} />
                <Route path="/mon-compte/tickets" element={<ClientTicketListPage />} />
                <Route path="/mon-compte/tickets/:id" element={<ClientTicketDetailPage />} />
                <Route path="/mon-compte/notifications" element={<ClientNotificationsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route element={<RequireAuth backoffice />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboardPage />} />

                {/* Catalogue / produits / services / offres / sources / qualite :
                    gestion du catalogue (product_manager, admin, super_admin). */}
                <Route element={<RequireAuth permission="edit_product_draft" />}>
                  <Route path="/admin/catalogue" element={<AdminCataloguePage />} />
                  <Route path="/admin/services" element={<AdminServicesPage />} />
                  <Route path="/admin/offres" element={<AdminOffersPage />} />
                  <Route path="/admin/sources" element={<AdminSourcesPage />} />
                  <Route path="/admin/qualite" element={<AdminDataQualityPage />} />
                  <Route path="/admin/produits" element={<AdminProductListPage />} />
                  <Route path="/admin/produits/nouveau" element={<AdminProductFormPage />} />
                  <Route path="/admin/produits/:id/modifier" element={<AdminProductFormPage />} />
                </Route>

                {/* Souscriptions + tickets : administration (admin/super_admin). */}
                <Route element={<RequireAuth permission="manage_subscriptions" />}>
                  <Route path="/admin/souscriptions" element={<AdminSubscriptionListPage />} />
                  <Route path="/admin/souscriptions/:id" element={<AdminSubscriptionDetailPage />} />
                  <Route path="/admin/tickets" element={<AdminTicketListPage />} />
                  <Route path="/admin/tickets/:id" element={<AdminTicketDetailPage />} />
                </Route>

                {/* Clients + utilisateurs : gestion des comptes (admin/super_admin). */}
                <Route element={<RequireAuth permission="manage_users" />}>
                  <Route path="/admin/clients" element={<AdminClientsPage />} />
                  <Route path="/admin/utilisateurs" element={<AdminUserListPage />} />
                </Route>

                {/* Analytics : vue administrative (admin/super_admin). */}
                <Route element={<RequireAuth permission="view_analytics" />}>
                  <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                </Route>

                <Route element={<RequireAuth permission="manage_categories" />}>
                  <Route path="/admin/categories" element={<AdminCategoryListPage />} />
                </Route>

                <Route element={<RequireAuth permission="edit_news" />}>
                  <Route path="/admin/actualites" element={<AdminNewsListPage />} />
                  <Route path="/admin/actualites/nouveau" element={<AdminNewsFormPage />} />
                  <Route path="/admin/actualites/:id/modifier" element={<AdminNewsFormPage />} />
                </Route>

                <Route element={<RequireAuth permission="edit_promotion" />}>
                  <Route path="/admin/promotions" element={<AdminPromotionListPage />} />
                </Route>

                <Route element={<RequireAuth permission="upload_media" />}>
                  <Route path="/admin/mediatheque" element={<AdminMediaLibraryPage />} />
                </Route>

                <Route element={<RequireAuth permission="manage_contact" />}>
                  <Route path="/admin/messages" element={<AdminContactInboxPage />} />
                </Route>

                {/* Zone Super Admin : journal, administration, roles. */}
                <Route element={<RequireAuth permission="view_activity_log" />}>
                  <Route path="/admin/journal" element={<AdminActivityLogPage />} />
                  <Route path="/admin/administration" element={<AdminAdministrationPage />} />
                  <Route path="/admin/roles" element={<AdminRolesPage />} />
                </Route>

                {/* Notifications : toutes les staff (notifications owner-scopees). */}
                <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
