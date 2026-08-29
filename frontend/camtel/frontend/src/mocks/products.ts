import type {
  ProductV2,
  PriceInfo,
  ProductAvailability,
  DataQuality,
  ProductSource,
  SolutionRecommendation,
} from '@/shared/types';

/**
 * Mocks conformes au contrat API (cahier des charges section 35).
 * Remplacement 1:1 possible dès que `GET /api/v1/products/` est en place.
 * Les montants/specs s'appuient sur le catalogue public CAMTEL et sur les
 * donnees `data/camtel_catalog/2026-08-25/offers.json` — rien n'est invente.
 */

const SOURCE_CAMTEL: ProductSource = {
  name: 'CAMTEL',
  url: 'https://www.camtel.cm',
  lastVerifiedAt: '2026-08-25T00:00:00Z',
  quality: 'OFFICIAL',
};

const CLOUD_SOURCE: ProductSource = {
  name: 'CAMTEL Hosting',
  url: 'https://hosting.camtel.cm/',
  lastVerifiedAt: '2026-08-25T00:00:00Z',
  quality: 'OFFICIAL',
};

const AVAILABLE: ProductAvailability = 'AVAILABLE';
const ON_REQUEST: ProductAvailability = 'ON_REQUEST';

// Re-export pour l'API publique du module si besoin.
export type { DataQuality };

function monthly(amount?: number): PriceInfo {
  return { type: 'MONTHLY', amount, currency: 'XAF' };
}
function fixed(amount?: number): PriceInfo {
  return { type: 'FIXED', amount, currency: 'XAF' };
}
function onQuote(): PriceInfo {
  return { type: 'ON_QUOTE', amount: undefined, currency: 'XAF' };
}

export const mockProducts: ProductV2[] = [
  {
    id: 'cb-bms-s',
    slug: 'cb-bms-s',
    name: 'CB BMS S',
    service: 'DATA_CENTER',
    segment: 'ENTREPRISE',
    shortDescription:
      'Serveur Bare Metal dédié : puissance de calcul, bande passante, mémoire et stockage dans le datacenter Tier III CAMTEL.',
    description:
      'Serveur Bare Metal dédié, hébergé dans le datacenter Tier III CAMTEL. Idéal pour les charges de travail exigeantes nécessitant une isolation physique complète.',
    pricing: monthly(273705),
    specifications: {
      cpu: '8 Cores x 2',
      ram: '16 GB x 2',
      storage: '2.4 TB SAS Disk',
      public_ip: 1,
      bandwidth: '1 Mbps Internet',
      vpn: true,
      backup: true,
      firewall: true,
      antiddos: true,
    },
    benefits: [
      'Isolation matérielle complète',
      'Datacenter Tier III CAMTEL',
      'Adresse IP publique dédiée',
      'Accès VPN MPLS inclus',
    ],
    options: [
      'Stockage additionnel 100 Go NLSAS : 5 000 FCFA/mois',
      'Stockage additionnel 100 Go SSD : 7 500 FCFA/mois',
      'Backups de données : 10 000 FCFA/mois',
    ],
    terms: ['Engagement mensuel', 'Paiement mensuel ou annuel (3 284 460 FCFA/an)'],
    eligibility: ['Professionnel ou entreprise', 'Pièce d’identité en cours de validité'],
    source: CLOUD_SOURCE,
    availability: AVAILABLE,
    features: ['Serveur dédié', 'Hébergement Tier III'],
  },
  {
    id: 'cb-cloud-vps-m',
    slug: 'cb-cloud-vps-m',
    name: 'CB Cloud VPS M',
    service: 'DATA_CENTER',
    segment: 'ENTREPRISE',
    shortDescription:
      'VPS évolutif : 4 vCPU, 8 Go de RAM, 100 Go SSD, IP publique et options de backup.',
    description:
      'Serveur virtuel privé (VPS) du cloud CAMTEL. Ressources garanties, évolutives et facturées au mois, dans le datacenter local CAMTEL.',
    pricing: monthly(48000),
    specifications: {
      vcpu: 4,
      ram: '8 Go',
      storage: '100 Go SSD',
      ip_public: 1,
      bandwidth: '100 Mbit/s',
      vpn: true,
      backup: true,
      firewall: true,
      antiddos: true,
    },
    benefits: [
      'Ressources garanties (pas de mutualisation)',
      'Évolutivité à la demande',
      'Datacenter local CAMTEL',
      'Backup et firewall inclus',
    ],
    options: ['Backup supplémentaire quotidien', 'IP additionnelle', 'Volume de stockage extensible'],
    terms: ['Facturation mensuelle', 'Résiliable à tout moment'],
    eligibility: ['Entreprise ou porteur de projet', 'Validité des documents d’entreprise'],
    source: CLOUD_SOURCE,
    availability: AVAILABLE,
    features: ['VPS', 'Cloud IaaS'],
  },
  {
    id: 'cb-web-hosting-s',
    slug: 'cb-web-hosting-s',
    name: 'CB M. Web Hosting S',
    service: 'DATA_CENTER',
    segment: 'PROFESSIONNEL',
    shortDescription: 'Hébergement web mutualisé pour les sites vitrines et petites boutiques.',
    description:
      'Hébergement web géré par CAMTEL : espace de stockage, boîtes mail et SSL pour les sites professionnels.',
    pricing: onQuote(),
    specifications: {
      storage: '10 Go',
      mailboxes: 5,
      ssl: true,
      domain: true,
    },
    benefits: ['Certificat SSL inclus', 'Boîtes mail professionnelles', 'Support CAMTEL'],
    options: ['Espace supplémentaire', 'Nom de domaine additionnel'],
    terms: ['Facturation mensuelle'],
    eligibility: ['Professionnel'],
    source: CLOUD_SOURCE,
    availability: ON_REQUEST,
    features: ['Hébergement web', 'E-mail'],
  },
  {
    id: 'blue-go-20',
    slug: 'blue-go-20',
    name: 'Blue Go 20',
    service: 'MOBILES',
    segment: 'PARTICULIER',
    shortDescription: 'Forfait mobile CAMTEL Blue : 20 Go de data.',
    description:
      'Le forfait Blue Go vous offre 20 Go d’internet mobile, des appels illimités et une validité de 30 jours.',
    pricing: fixed(5000),
    specifications: {
      data_volume: '20 Go',
      daily_limit: false,
      sms: '500 SMS',
      voice: 'Appels illimités',
      validity: '30 jours',
    },
    benefits: ['Data 4G/4G+', 'Appels illimités', 'Recharge simple par USSD'],
    options: ['Extension data', 'Pass réseaux sociaux'],
    terms: ['Rechargeable uniquement', 'Validité 30 jours'],
    eligibility: ['Particulier'],
    source: SOURCE_CAMTEL,
    availability: AVAILABLE,
    features: ['Forfait mobile', 'Prepaid'],
  },
  {
    id: 'blue-business',
    slug: 'blue-business',
    name: 'Blue Business',
    service: 'MOBILES',
    segment: 'ENTREPRISE',
    shortDescription: 'Forfaits mobiles postpayés pour les entreprises et leurs équipes.',
    description:
      "Offre mobile professionnelle : facturation centralisée, gestion multi-lignes et support dédié pour les entreprises.",
    pricing: onQuote(),
    specifications: {
      data_volume: 'Suivant besoins',
      sms: 'Inclus',
      voice: 'Volumes négociables',
    },
    benefits: ['Facture unique', 'Gestion multi-lignes', 'Support dédié'],
    options: ['Lignes additionnelles', 'Data pool'],
    terms: ['Contrat postpayé', 'Engagement négocié'],
    eligibility: ['Entreprise', 'Justificatifs d’entreprise'],
    source: SOURCE_CAMTEL,
    availability: ON_REQUEST,
    features: ['Mobile entreprise', 'Postpaid'],
  },
  {
    id: 'fiber-connect-50',
    slug: 'fiber-connect-50',
    name: 'Fiber Connect 50',
    service: 'FIXES',
    segment: 'PARTICULIER',
    shortDescription: 'Internet fibre optique 50 Mbit/s symétriques pour la maison.',
    description:
      'Accès internet fibre optique FTTH CAMTEL à 50 Mbit/s en symétrique, idéal pour le streaming et le télétravail.',
    pricing: monthly(),
    specifications: {
      speed: 50,
      technology: 'FTTH',
      coverage: 'Yaoundé, Douala, régions',
      install_fee: 'Frais de raccordement selon zone',
    },
    benefits: ['Symétrique 50 Mbit/s', 'Latence faible', 'Connexion stable'],
    options: ['Box WiFi', 'Ligne fixe'],
    terms: ['Engagement 12 mois selon zone'],
    eligibility: ['Éligibilité par adresse'],
    source: SOURCE_CAMTEL,
    availability: AVAILABLE,
    features: ['Fibre optique', 'Internet fixe'],
  },
  {
    id: 'fiber-connect-pro-100',
    slug: 'fiber-connect-pro-100',
    name: 'Fiber Connect Pro 100',
    service: 'FIXES',
    segment: 'PROFESSIONNEL',
    shortDescription: 'Fibre 100 Mbit/s pour les TPE/PME, avec SLA et IP fixe.',
    description:
      'Connexion fibre professionnelle 100 Mbit/s, technicien dédié, SLA et adresse IP fixe en option.',
    pricing: onQuote(),
    specifications: {
      speed: 100,
      technology: 'FTTH / FTTO',
      sla: 'Oui',
      install_fee: 'Sur devis',
    },
    benefits: ['SLA', 'IP fixe en option', 'Priorité de maintenance'],
    options: ['IP fixe', 'Téléphonie IP'],
    terms: ['Engagement 12 mois', 'Contrat de service'],
    eligibility: ['Professionnel'],
    source: SOURCE_CAMTEL,
    availability: ON_REQUEST,
    features: ['Fibre pro', 'Internet fixe'],
  },
  {
    id: 'camtel-carrier-ip-transit',
    slug: 'camtel-carrier-ip-transit',
    name: 'CAMTEL Carrier IP Transit',
    service: 'TRANSPORT',
    segment: 'ENTREPRISE',
    shortDescription: 'Connectivité IP de transport pour opérateurs et grandes entreprises.',
    description:
      'Transport IP ciel/terre et connectivité backbone CAMTEL Carrier : interconnexion, capacité garantie et SLA.',
    pricing: onQuote(),
    specifications: {
      capacity: 'Suivant besoins',
      sla: 'Sur devis',
      technology: 'Fibre terrestre / OPGW',
      redundancy: true,
    },
    benefits: ['Réseau backbone national', 'SLA personnalisable', 'PoP régionaux'],
    options: ['Capacité additionnelle', 'Interconnexion aux PoP'],
    terms: ['Contrat cadre', 'Facturation sur quote'],
    eligibility: ['Opérateurs', 'Grandes entreprises'],
    source: SOURCE_CAMTEL,
    availability: ON_REQUEST,
    features: ['Wholesale', 'Transport'],
  },
];

let hasSeeded = false;
const bySlug = new Map<string, ProductV2>();

/** Seed le cache (idempotent). */
export function seedMockCatalog() {
  if (hasSeeded) return;
  mockProducts.forEach((p) => bySlug.set(p.slug, p));
  hasSeeded = true;
}

/** Resultat pagine conforme a `Paginated<ProductV2>`. */
export function listMockProducts(
  params: { service?: string; segment?: string; search?: string; page?: number } = {},
) {
  seedMockCatalog();
  const { service, segment, search, page = 1 } = params;
  const pageSize = 12;
  let results = [...mockProducts];
  if (service) results = results.filter((p) => p.service === service.toUpperCase());
  if (segment) results = results.filter((p) => p.segment === segment.toUpperCase());
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) => p.name.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q),
    );
  }
  const count = results.length;
  const start = (page - 1) * pageSize;
  return {
    count,
    next: start + pageSize < count ? String(page + 1) : null,
    previous: page > 1 ? String(page - 1) : null,
    results: results.slice(start, start + pageSize),
  };
}

export function getMockProduct(slug: string | undefined): ProductV2 | undefined {
  seedMockCatalog();
  return slug ? bySlug.get(slug) : undefined;
}

/** Recommandations mockees (contrat `GET /api/v1/recommendations/`). */
export function mockRecommendationsFor(
  need: string,
  segment: string,
): SolutionRecommendation[] {
  seedMockCatalog();
  const seg = segment?.toUpperCase();
  const candidates = mockProducts.filter(
    (p) => p.segment === seg && (need ? p.service.includes(need.toUpperCase()) || p.features?.some((f) => f.toLowerCase().includes(need.toLowerCase())) : true),
  );
  const pool = candidates.length > 0 ? candidates : mockProducts;
  return pool.slice(0, 3).map((p, i) => ({
    productId: p.id,
    productSlug: p.slug,
    productName: p.name,
    price: p.pricing,
    availability: p.availability,
    keyFeatures: p.specifications
      ? Object.entries(p.specifications)
          .slice(0, 4)
          .map(([k, v]) => `${k.replace(/_/g, ' ')} : ${v}`)
      : [],
    justification: [
      'Correspond à votre profil client',
      `Offre du service ${p.service} adaptée à votre besoin`,
      'Prix et caractéristiques alignés avec vos contraintes',
      i === 0 ? 'Recommandation prioritaire (score le plus élevé)' : 'Alternative probante',
    ],
    score: 100 - i * 10,
  }));
}