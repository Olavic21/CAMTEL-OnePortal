import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { ChatbotWidget } from '@/shared/components/ChatbotWidget';

export function PublicLayout() {
  // Identité visible à chaque chargement/rafraîchissement du portail public.
  useEffect(() => {
    document.title = 'CAMTEL-OnePortal | Plateforme Produits & Services';
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <ChatbotWidget />
    </div>
  );
}
