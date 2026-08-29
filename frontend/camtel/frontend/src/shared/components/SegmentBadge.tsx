import { Badge } from './Badge';
import { getSegmentMeta } from '@/shared/config/segments';
import type { Segment } from '@/shared/types';

const SEGMENT_TONES: Record<Segment, 'neutral' | 'primary' | 'info' | 'success'> = {
  PARTICULIER: 'neutral',
  PROFESSIONNEL: 'info',
  ENTREPRISE: 'primary',
  ADMINISTRATION: 'success',
};

/**
 * Badge de segment client (Particulier, Professionnel, Entreprise, Administration).
 * NB : le segment est UNE notion distincte du service — jamais lie a un service.
 */
export function SegmentBadge({ segment, className }: { segment?: Segment | null; className?: string }) {
  if (!segment) return null;
  const meta = getSegmentMeta(segment);
  return (
    <Badge tone={SEGMENT_TONES[segment] ?? 'neutral'}>
      <span className={className}>{meta?.label ?? segment}</span>
    </Badge>
  );
}