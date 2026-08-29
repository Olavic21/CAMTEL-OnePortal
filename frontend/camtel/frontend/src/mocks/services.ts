import type { ServiceInfo } from '@/shared/types';

/**
 * Mocks conformes au contrat `GET /api/v1/services/` + `GET /api/v1/services/{slug}/`.
 * Remplacement 1:1 possible dès que le backend expose ces endpoints.
 */
export const mockServices: ServiceInfo[] = [
  {
    slug: 'fixes',
    name: 'Fixes',
    service: 'FIXES',
    tagline: 'Téléphonie et accès fixe',
    heroTitle: 'Fixes : la voix et la fibre pour tous',
    heroSubtitle:
      'Ligne fixe, téléphonie et internet fibre optique pour particuliers et professionnels.',
    description:
      "Les solutions fixes CAMTEL combinent la téléphonie vocale et l'accès internet fibre optique (FTTH).",
    subServices: [
      { slug: 'telephonie-fixe', name: 'Téléphonie fixe', description: 'Lignes vocales fixes résidentielles et professionnelles.' },
      { slug: 'fibre-optique', name: 'Fibre optique', description: 'Internet fibre FTTH/FTTO à très haut débit.' },
      { slug: 'wifi', name: 'WiFi', description: 'Accès sans fil résidentiel et hotspots.' },
    ],
    complementaryServices: ['MOBILES', 'DATA_CENTER'],
    faqs: [
      { question: 'Comment vérifier mon éligibilité à la fibre ?', answer: 'Utilisez le vérificateur d’éligibilité depuis la fiche du produit Fiber Connect.' },
      { question: 'Quels sont les délais de raccordement ?', answer: 'Le délai dépend de la zone ; il est confirmé lors de la demande de souscription.' },
    ],
  },
  {
    slug: 'mobiles',
    name: 'Mobiles',
    service: 'MOBILES',
    tagline: 'Offres mobiles & data',
    heroTitle: 'Mobiles : restez connecté avec Blue',
    heroSubtitle: 'Forfaits prépayés, postpayés et data pour tous les profils.',
    description:
      'Les offres mobiles CAMTEL (Blue) couvrent la voix, les SMS et la data 4G/4G+.',
    subServices: [
      { slug: 'forfaits', name: 'Forfaits mobiles', description: 'Recharges Blue Go et pass data.' },
      { slug: 'mobile-entreprise', name: 'Mobile entreprise', description: 'Forfaits postpayés multi-lignes.' },
      { slug: 'itinérance', name: 'Itinérance', description: 'Usage international de votre ligne.' },
    ],
    complementaryServices: ['FIXES', 'TRANSPORT'],
    faqs: [
      { question: 'Comment recharger mon forfait Blue ?', answer: 'Par USSD, sur l’application mobile ou en agence CAMTEL.' },
      { question: 'Le data est-il 4G ?', answer: 'Oui, le réseau Blue propose la 4G/4G+ dans les grandes villes.' },
    ],
  },
  {
    slug: 'transport',
    name: 'Transport',
    service: 'TRANSPORT',
    tagline: 'Connectivité et transport',
    heroTitle: 'Transport : le backbone CAMTEL',
    heroSubtitle: 'Capacité, interconnexion et services wholesale pour opérateurs et entreprises.',
    description:
      'CAMTEL Carrier propose le transport national et international de la voix et des données.',
    subServices: [
      { slug: 'ip-transit', name: 'IP Transit', description: 'Connectivité IP de transport et interconnexion.' },
      { slug: 'backbone', name: 'Backbone', description: 'Transport sur fibre terrestre et OPGW.' },
      { slug: 'wholesale', name: 'Wholesale', description: 'Services de gros pour les opérateurs.' },
    ],
    complementaryServices: ['DATA_CENTER'],
    faqs: [
      { question: 'À qui s’adressent les services Transport ?', answer: 'Aux opérateurs télécoms et aux grandes entreprises.' },
      { question: 'Le SLA est-il personnalisable ?', answer: 'Oui, le SLA se négocie dans le contrat cadre.' },
    ],
  },
  {
    slug: 'data-center',
    name: 'Data Center',
    service: 'DATA_CENTER',
    tagline: 'Cloud, hébergement & datacenter',
    heroTitle: 'Data Center : vos données au Cameroun',
    heroSubtitle: 'VPS, cloud, colocation et hébergement dans le datacenter Tier III CAMTEL.',
    description:
      'Le datacenter CAMTEL (Tier III) héberge cloud, VPS, bare metal, colocation et domaines.',
    subServices: [
      { slug: 'vps', name: 'VPS', description: 'Serveurs virtuels privés évolutifs.' },
      { slug: 'cloud', name: 'Cloud', description: 'Infrastructure cloud (IaaS) CAMTEL.' },
      { slug: 'colocation', name: 'Colocation', description: 'Hébergement de vos équipements.' },
      { slug: 'hebergement-web', name: 'Hébergement web', description: 'Sites web, e-mails et domaines.' },
    ],
    complementaryServices: ['TRANSPORT'],
    faqs: [
      { question: 'Où est situé le datacenter ?', answer: 'Le datacenter Tier III CAMTEL est situé au Cameroun.' },
      { question: 'Le VPS est-il évolutif ?', answer: 'Oui, les ressources (vCPU, RAM, stockage) évoluent à la demande.' },
    ],
  },
];

export function getMockService(slug: string | undefined): ServiceInfo | undefined {
  return mockServices.find((s) => s.slug === slug);
}