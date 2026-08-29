import { Badge } from './Badge';
import { useTranslation } from 'react-i18next';
import type { DataQuality } from '@/shared/types';

const TONES: Record<DataQuality, 'success' | 'neutral' | 'warning' | 'destructive'> = {
  OFFICIAL: 'success',
  MANUAL: 'neutral',
  DEMO: 'warning',
  REQUIRES_VERIFICATION: 'destructive',
};

const LABELS: Record<DataQuality, string> = {
  OFFICIAL: 'Officiel',
  MANUAL: 'Saisie manuelle',
  DEMO: 'Démo',
  REQUIRES_VERIFICATION: 'À vérifier',
};

/**
 * Badge de qualite des donnees (cahier des charges section 21).
 * Une donnee REQUIRES_VERIFICATION est clairement identifiable ;
 * une donnee DEMO n'est jamais presentee comme une vraie donnee commerciale.
 */
export function DataQualityBadge({ quality, showLabel = true }: { quality?: DataQuality | null; showLabel?: boolean }) {
  const { t } = useTranslation();
  if (!quality) return null;
  return (
    <Badge tone={TONES[quality]}>
      {showLabel ? t(`dataQuality.${quality}`, LABELS[quality]) : LABELS[quality]}
    </Badge>
  );
}