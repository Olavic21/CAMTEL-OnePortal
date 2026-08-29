import type { Segment } from '@/shared/types';

/**
 * Metadonnees des segments clients (profils).
 * Segment ≠ Service : un produit a un service ET un segment independants.
 */
export interface SegmentMeta {
  segment: Segment;
  label: string;
  description: string;
}

export const SEGMENTS: SegmentMeta[] = [
  {
    segment: 'PARTICULIER',
    label: 'Particulier',
    description: 'Offres pour les particuliers et la maison.',
  },
  {
    segment: 'PROFESSIONNEL',
    label: 'Professionnel',
    description: 'Solutions pour les indépendants et les TPE/PME.',
  },
  {
    segment: 'ENTREPRISE',
    label: 'Entreprise',
    description: 'Connectivité et services dédiés aux grandes entreprises.',
  },
  {
    segment: 'ADMINISTRATION',
    label: 'Administration',
    description: 'Répondre aux besoins des administrations et services publics.',
  },
];

export const SEGMENT_BY_ENUM: Record<Segment, SegmentMeta> = Object.fromEntries(
  SEGMENTS.map((s) => [s.segment, s]),
) as Record<Segment, SegmentMeta>;

export function getSegmentMeta(segment?: Segment | null): SegmentMeta | undefined {
  if (!segment) return undefined;
  return SEGMENT_BY_ENUM[segment];
}