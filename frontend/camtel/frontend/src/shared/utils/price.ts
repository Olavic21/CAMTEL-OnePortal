import type { PriceInfo } from '@/shared/types';

/**
 * Utilitaires de tarification (cahier des charges section 11).
 * Regle d'or : un prix INCONNU n'est jamais affiche "0 FCFA".
 * Un vrai prix a 0 (type != ON_QUOTE et amount === 0) reste affiche "0 FCFA".
 */

export type PricePeriod = 'monthly' | 'yearly' | 'one_time' | 'usage' | 'quote';

/** Normalise un PriceInfo vers une periode affichable. */
export function pricePeriod(type: PriceInfo['type']): PricePeriod {
  switch (type) {
    case 'MONTHLY':
      return 'monthly';
    case 'YEARLY':
      return 'yearly';
    case 'SETUP':
    case 'FIXED':
      return 'one_time';
    case 'USAGE':
      return 'usage';
    case 'ON_QUOTE':
    default:
      return 'quote';
  }
}

/** Montant formatte en FCFA (espace comme separateur de milliers). */
export function formatXaf(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

/**
 * Formate un PriceInfo en libelle humain.
 * - prix inconnu (ON_QUOTE ou amount absent) → 'Prix sur demande'
 * - monthly  → '12 000 FCFA/mois'
 * - yearly   → '144 000 FCFA/an'
 * - setup    → '15 000 FCFA (mise en service)'
 * - usage    → '5 000 FCFA (à l’usage)'
 * - fixed    → '5 000 FCFA'
 * Retourne null quand le prix est inconnu (pour les affichages conditionnels).
 */
export function formatPriceInfo(price?: PriceInfo | null): string | null {
  if (!price) return null;
  if (price.type === 'ON_QUOTE' || price.amount === undefined || price.amount === null) {
    return null;
  }
  const amount = formatXaf(price.amount);
  switch (pricePeriod(price.type)) {
    case 'monthly':
      return `${amount}/mois`;
    case 'yearly':
      return `${amount}/an`;
    case 'one_time':
      return amount;
    case 'usage':
      return `${amount} (à l’usage)`;
    default:
      return amount;
  }
}

/** Libelle d'une periode (utilise pour les en-tetes de comparateur, etc.). */
export function pricePeriodLabel(type: PriceInfo['type']): string {
  switch (pricePeriod(type)) {
    case 'monthly':
      return '/mois';
    case 'yearly':
      return '/an';
    case 'one_time':
      return '';
    case 'usage':
      return ' (à l’usage)';
    case 'quote':
    default:
      return '';
  }
}