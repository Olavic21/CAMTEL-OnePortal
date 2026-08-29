import type { LucideIcon } from 'lucide-react';
import { Phone, Smartphone, Truck, Server } from 'lucide-react';
import type { Service } from '@/shared/types';

/**
 * Metadonnees des 4 services CAMTEL (nouvelle architecture commerciale).
 * - `service` est l'enum du contrat API.
 * - `slug` / `route` alimentent la navigation et le routing (`/services/:slug`).
 * - `icon` sert au portail et au menu.
 * Service ≠ Segment : rien ici ne reference un segment.
 */
export interface ServiceMeta {
  service: Service;
  slug: string;
  label: string;
  tagline: string;
  description: string;
  route: string;
  icon: LucideIcon;
}

export const SERVICES: ServiceMeta[] = [
  {
    service: 'FIXES',
    slug: 'fixes',
    label: 'Fixes',
    tagline: 'Téléphonie et accès fixe',
    description:
      'Lignes fixes, voix et accès internet fixe pour les particuliers et les professionnels.',
    route: '/services/fixes',
    icon: Phone,
  },
  {
    service: 'MOBILES',
    slug: 'mobiles',
    label: 'Mobiles',
    tagline: 'Offres mobiles & data',
    description:
      "Forfaits mobiles, data et services associés du réseau CAMTEL / Blue.",
    route: '/services/mobiles',
    icon: Smartphone,
  },
  {
    service: 'TRANSPORT',
    slug: 'transport',
    label: 'Transport',
    tagline: 'Connectivité et transport',
    description:
      "Solutions wholesale, transport et connectivité backbone CAMTEL Carrier.",
    route: '/services/transport',
    icon: Truck,
  },
  {
    service: 'DATA_CENTER',
    slug: 'data-center',
    label: 'Data Center',
    tagline: 'Cloud, hébergement et datacenter',
    description:
      'VPS, cloud, colocation, hébergement et services managés du datacenter CAMTEL.',
    route: '/services/data-center',
    icon: Server,
  },
];

/** Index par valeur d'enum Service. */
export const SERVICE_BY_ENUM: Record<Service, ServiceMeta> = Object.fromEntries(
  SERVICES.map((s) => [s.service, s]),
) as Record<Service, ServiceMeta>;

/** Index par slug (route). */
export const SERVICE_BY_SLUG: Record<string, ServiceMeta> = Object.fromEntries(
  SERVICES.map((s) => [s.slug, s]),
);

export function getServiceMeta(service?: Service | null): ServiceMeta | undefined {
  if (!service) return undefined;
  return SERVICE_BY_ENUM[service];
}

export function getServiceBySlug(slug?: string): ServiceMeta | undefined {
  if (!slug) return undefined;
  return SERVICE_BY_SLUG[slug];
}

/** Routes publiques des 4 services. */
export const SERVICE_ROUTES = SERVICES.map((s) => s.route);

export function isServiceSlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(SERVICE_BY_SLUG, slug);
}