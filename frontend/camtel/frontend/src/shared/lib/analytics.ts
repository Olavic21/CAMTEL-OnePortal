import { httpClient } from '@/shared/lib/axios';

// Section 20 mission : collecte d'evenements analytiques (offer_view,
// offer_compare, subscription_started, subscription_submitted, search,
// faq_view, chatbot_question). Le backend expose POST /analytics/events/
// (AllowAny) depuis le debut, mais rien cote frontend ne l'appelait jamais —
// le dashboard admin (voir features/dashboard) affichait donc toujours des
// donnees vides en usage reel. Fire-and-forget : un echec de tracking ne
// doit jamais bloquer ou faire echouer l'action utilisateur en cours.
export type AnalyticsEventType =
  | 'offer_view'
  | 'offer_compare'
  | 'subscription_started'
  | 'subscription_submitted'
  | 'subscription_completed'
  | 'search'
  | 'faq_view'
  | 'chatbot_question';

export function trackEvent(eventType: AnalyticsEventType, payload: Record<string, unknown> = {}, productId?: number) {
  httpClient
    .post('/analytics/events/', { event_type: eventType, product_id: productId, payload })
    .catch(() => {
      // Silencieux par design : le tracking ne doit jamais degrader l'UX.
    });
}
