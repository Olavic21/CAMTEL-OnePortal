/** 
 * Mapping du statut commercial reel (contrat backend Product.status) vers
 * un affichage lisible en back office. Le legacy (draft/published/archived)
 * reste accepte pour compat, mais le contrat source est VALID / EXPIRED /
 * UPCOMING / REQUIRES_VERIFICATION.
 */
export interface ProductStatusMeta {
  label: string;
  tone: 'success' | 'neutral' | 'info' | 'warning' | 'draft';
}

export function productStatusMeta(status?: string | null): ProductStatusMeta | null {
  if (!status) return null;
  const s = status.toUpperCase();
  switch (s) {
    case 'VALID':
    case 'PUBLISHED':
      return { label: 'VALID / En ligne', tone: 'success' };
    case 'EXPIRED':
    case 'ARCHIVED':
      return { label: 'EXPIRED / Archivé', tone: 'neutral' };
    case 'UPCOMING':
      return { label: 'UPCOMING / À venir', tone: 'info' };
    case 'REQUIRES_VERIFICATION':
      return { label: 'À vérifier', tone: 'warning' };
    case 'DRAFT':
      return { label: 'DRAFT / Brouillon', tone: 'draft' };
    default:
      return { label: status, tone: 'neutral' };
  }
}

/** Valeurs reelles du selecteur de filtre statut (contrat backend). */
export const PRODUCT_STATUS_FILTERS = ['VALID', 'DRAFT', 'UPCOMING', 'REQUIRES_VERIFICATION', 'EXPIRED'] as const;